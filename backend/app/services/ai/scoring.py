"""ICP lead scoring via Claude tool_choice (Spec Section 5.3)."""
import structlog

from app.models.ai import ScoringResult, CriterionScore
from app.services.ai.client import get_anthropic_client, MODEL
from app.services.circuit_breaker import CircuitBreaker

logger = structlog.get_logger()

SCORING_TOOL = {
    "name": "score_lead",
    "description": "Score a lead against an ICP with per-criterion breakdown",
    "input_schema": {
        "type": "object",
        "properties": {
            "company_size": {
                "type": "object",
                "properties": {"score": {"type": "integer"}, "max": {"type": "integer"}, "detail": {"type": "string"}},
                "required": ["score", "max", "detail"],
            },
            "title_match": {
                "type": "object",
                "properties": {"score": {"type": "integer"}, "max": {"type": "integer"}, "detail": {"type": "string"}},
                "required": ["score", "max", "detail"],
            },
            "geography": {
                "type": "object",
                "properties": {"score": {"type": "integer"}, "max": {"type": "integer"}, "detail": {"type": "string"}},
                "required": ["score", "max", "detail"],
            },
            "ai_tools": {
                "type": "object",
                "properties": {"score": {"type": "integer"}, "max": {"type": "integer"}, "detail": {"type": "string"}},
                "required": ["score", "max", "detail"],
            },
            "digital_presence": {
                "type": "object",
                "properties": {"score": {"type": "integer"}, "max": {"type": "integer"}, "detail": {"type": "string"}},
                "required": ["score", "max", "detail"],
            },
            "reasoning": {"type": "string"},
        },
        "required": ["company_size", "title_match", "geography", "ai_tools", "digital_presence", "reasoning"],
    },
}

SCORING_PROMPT = """You are scoring a lead against an Ideal Customer Profile (ICP) for a B2B outbound campaign.

Score each criterion on a scale from 0 to its maximum points:
- company_size (max 20): How well does the company size match the ICP?
- title_match (max 25): How well does the person's title match target titles?
- geography (max 20): Is the company in the target geography?
- ai_tools (max 15): Does the company lack AI tools (indicating opportunity)?
- digital_presence (max 20): What is their digital maturity level?

ICP DEFINITION:
{icp_json}

LEAD DATA:
Name: {first_name} {last_name}
Title: {title}
Company: {company}
Industry: {industry}
Location: {location}
Company Size: {company_size}
Tech Stack: {tech_stack}
Domain: {domain}

Score this lead now."""


async def score_lead(
    lead_data: dict,
    client_icp: dict,
    circuit_breaker: CircuitBreaker,
    score_threshold: int = 70,
) -> ScoringResult:
    """Score a lead against client ICP using Claude tool_choice."""
    client = get_anthropic_client()
    import json

    enrichment = lead_data.get("enrichment_data") or {}

    prompt = SCORING_PROMPT.format(
        icp_json=json.dumps(client_icp, indent=2),
        first_name=lead_data.get("first_name", ""),
        last_name=lead_data.get("last_name", ""),
        title=lead_data.get("title", ""),
        company=lead_data.get("company", ""),
        industry=enrichment.get("industry", ""),
        location=enrichment.get("location", lead_data.get("domain", "")),
        company_size=enrichment.get("company_size", "unknown"),
        tech_stack=json.dumps(enrichment.get("tech_stack", [])),
        domain=lead_data.get("domain", ""),
    )

    response = await circuit_breaker.call_async(
        _call_claude_scoring, client, prompt,
    )

    tool_input = _extract_tool_input(response)

    criteria = ["company_size", "title_match", "geography", "ai_tools", "digital_presence"]
    breakdown = {}
    total = 0
    for c in criteria:
        data = tool_input[c]
        breakdown[c] = CriterionScore(score=data["score"], max=data["max"], detail=data["detail"])
        total += data["score"]

    return ScoringResult(
        score=total,
        qualified=total >= score_threshold,
        breakdown=breakdown,
        reasoning=tool_input["reasoning"],
        model_version=MODEL,
    )


async def _call_claude_scoring(client, prompt: str):
    return client.messages.create(
        model=MODEL,
        max_tokens=1024,
        tools=[SCORING_TOOL],
        tool_choice={"type": "tool", "name": "score_lead"},
        messages=[{"role": "user", "content": prompt}],
    )


def _extract_tool_input(response) -> dict:
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    raise ValueError("No tool_use block in Claude response")
