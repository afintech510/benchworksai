"""Sequence copy generation via Claude tool_choice (Spec Section 5.3)."""
import json

import structlog

from app.models.ai import SequenceStep
from app.services.ai.client import get_anthropic_client, MODEL
from app.services.circuit_breaker import CircuitBreaker

logger = structlog.get_logger()

GENERATION_TOOL = {
    "name": "generate_sequence",
    "description": "Generate a multi-step cold email sequence",
    "input_schema": {
        "type": "object",
        "properties": {
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step_number": {"type": "integer"},
                        "subject": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["step_number", "subject", "body"],
                },
            },
        },
        "required": ["steps"],
    },
}

GENERATION_PROMPT = """You are a cold email copywriter for B2B outbound campaigns targeting SMB owners.

Write a {num_steps}-step cold email sequence for:
- Vertical: {vertical}
- Geography: {geography}
- Offer: {offer}
- ICP: {icp_summary}

Rules:
- Write in plain text (no HTML) for maximum deliverability
- Subject lines under 60 characters
- Include {{{{first_name}}}} and {{{{company_name}}}} merge tags where natural
- Each step should have a different angle — don't repeat the same pitch
- Include a clear CTA in each step
- Reference the specific vertical and geography naturally
- Keep emails under 150 words each
- Step 1: Introduction + value prop
- Step 2: Social proof or case study angle
- Step 3: Direct question about their pain point
- Step 4: Breakup email (last chance, low pressure)

Generate the sequence now."""


async def generate_sequence(
    client_icp: dict,
    offer: str,
    vertical: str,
    geography: str,
    num_steps: int = 4,
    circuit_breaker: CircuitBreaker = None,
) -> list[SequenceStep]:
    """Generate cold email sequence copy."""
    client = get_anthropic_client()

    icp_summary = json.dumps(client_icp, indent=2) if client_icp else "General SMB"

    prompt = GENERATION_PROMPT.format(
        num_steps=num_steps,
        vertical=vertical,
        geography=geography,
        offer=offer,
        icp_summary=icp_summary,
    )

    if circuit_breaker:
        response = await circuit_breaker.call_async(_call_claude_generation, client, prompt)
    else:
        response = await _call_claude_generation(client, prompt)

    tool_input = _extract_tool_input(response)

    return [
        SequenceStep(
            step_number=step["step_number"],
            subject=step["subject"],
            body=step["body"],
        )
        for step in tool_input["steps"]
    ]


async def _call_claude_generation(client, prompt: str):
    return client.messages.create(
        model=MODEL,
        max_tokens=4096,
        tools=[GENERATION_TOOL],
        tool_choice={"type": "tool", "name": "generate_sequence"},
        messages=[{"role": "user", "content": prompt}],
    )


def _extract_tool_input(response) -> dict:
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    raise ValueError("No tool_use block in Claude response")
