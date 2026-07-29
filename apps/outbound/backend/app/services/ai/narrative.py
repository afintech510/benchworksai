"""Report narrative generation via Claude (Spec Section 5.6)."""
import json

import structlog

from app.services.ai.client import get_anthropic_client, MODEL
from app.services.circuit_breaker import CircuitBreaker

logger = structlog.get_logger()

NARRATIVE_PROMPT = """You are writing a weekly outbound campaign performance summary for a client named {client_name}.

Period: {period}

Metrics:
{metrics_json}

Write a 3-5 sentence executive summary that:
1. Highlights the key metrics (emails sent, replies, positive replies, meetings booked)
2. Compares to prior period if data is available
3. Ends with one actionable recommendation

Write in a professional but conversational tone. No bullet points — flowing sentences only."""


async def generate_report_narrative(
    metrics: dict,
    client_name: str,
    period: str,
    circuit_breaker: CircuitBreaker,
) -> str:
    """Generate natural language report summary."""
    client = get_anthropic_client()

    prompt = NARRATIVE_PROMPT.format(
        client_name=client_name,
        period=period,
        metrics_json=json.dumps(metrics, indent=2),
    )

    response = await circuit_breaker.call_async(_call_claude, client, prompt)

    # Plain text response — extract from text block
    for block in response.content:
        if hasattr(block, "text"):
            return block.text

    return ""


async def _call_claude(client, prompt: str):
    return client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
