"""Pre-call brief generation via Claude (Spec Section 5.3)."""
import json

import structlog

from app.services.ai.client import get_anthropic_client, MODEL
from app.services.circuit_breaker import CircuitBreaker

logger = structlog.get_logger()

BRIEF_PROMPT = """Generate a discovery call briefing for the following prospect.

PROSPECT:
Name: {name}
Company: {company}
Title: {title}
Industry: {industry}
Company Size: {company_size}
ICP Score: {icp_score}/100

ICP MATCH HIGHLIGHTS:
{icp_breakdown}

REPLY HISTORY:
{reply_history}

CLIENT CONTEXT:
Client: {client_name}
Offer: {offer}
Vertical: {vertical}

Write a structured briefing in markdown covering:
1. **Lead Summary** — name, company, title, company size (2-3 sentences)
2. **ICP Match** — which criteria scored highest and why this lead is a fit
3. **Conversation History** — summary of replies and sentiment
4. **Suggested Talking Points** — 3-4 specific topics based on their industry and responses
5. **Key Questions to Ask** — 3-4 discovery questions tailored to their situation"""


async def generate_precall_brief(
    lead: dict,
    icp_score: int,
    icp_breakdown: dict,
    reply_history: list,
    client_context: dict,
    circuit_breaker: CircuitBreaker,
) -> str:
    """Generate a structured pre-call briefing."""
    client = get_anthropic_client()

    enrichment = lead.get("enrichment_data") or {}

    prompt = BRIEF_PROMPT.format(
        name=f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip(),
        company=lead.get("company", "Unknown"),
        title=lead.get("title", "Unknown"),
        industry=enrichment.get("industry", "Unknown"),
        company_size=enrichment.get("company_size", "Unknown"),
        icp_score=icp_score,
        icp_breakdown=json.dumps(icp_breakdown, indent=2) if icp_breakdown else "No breakdown available",
        reply_history="\n".join(
            f"- [{r.get('classification', 'unclassified')}] {r.get('reply_body', '')[:200]}"
            for r in (reply_history or [])
        ) or "No replies yet",
        client_name=client_context.get("name", ""),
        offer=client_context.get("offer", ""),
        vertical=client_context.get("vertical", ""),
    )

    response = await circuit_breaker.call_async(_call_claude, client, prompt)

    for block in response.content:
        if hasattr(block, "text"):
            return block.text

    return ""


async def _call_claude(client, prompt: str):
    return client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
