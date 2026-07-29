"""Reply classification via Claude tool_choice (Spec Section 5.3, SYN-028)."""
import structlog

from app.models.ai import ClassificationResult
from app.services.ai.client import get_anthropic_client, MODEL
from app.services.circuit_breaker import CircuitBreaker

logger = structlog.get_logger()

CLASSIFICATION_TOOL = {
    "name": "classify_reply",
    "description": "Classify a cold email reply into one of 6 categories with confidence score",
    "input_schema": {
        "type": "object",
        "properties": {
            "classification": {
                "type": "string",
                "enum": ["interested", "not_interested", "ooo", "referral", "question", "unsubscribe"],
            },
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
            "key_intent": {"type": "string"},
            "extracted_referral": {
                "anyOf": [
                    {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "email": {"type": "string"},
                            "context": {"type": "string"},
                        },
                    },
                    {"type": "null"},
                ],
            },
            "suggested_action": {"type": "string"},
        },
        "required": ["classification", "confidence", "sentiment", "key_intent", "suggested_action"],
    },
}

CLASSIFICATION_PROMPT = """You are an expert at classifying cold email replies for B2B outbound campaigns.

Classify this reply into exactly one category:
- interested: The prospect wants to learn more, schedule a call, or continue the conversation
- not_interested: The prospect explicitly declines or says the offer isn't relevant
- ooo: An out-of-office auto-reply
- referral: The prospect redirects to someone else (extract their contact info)
- question: The prospect asks about pricing, timeline, or specifics without committing
- unsubscribe: The prospect explicitly asks to stop receiving emails

Rate your confidence from 0 to 1. Be conservative — if unsure between interested and question, lean toward question with lower confidence.

ORIGINAL EMAIL CONTEXT:
Subject: {subject}
Body: {body}

PROSPECT'S REPLY:
{reply_body}

Classify this reply now."""


async def classify_reply(
    reply_body: str,
    sequence_context: dict,
    circuit_breaker: CircuitBreaker,
    confidence_threshold: float = 0.85,
) -> ClassificationResult:
    """Classify a reply using Claude tool_choice for structured output."""
    client = get_anthropic_client()

    prompt = CLASSIFICATION_PROMPT.format(
        subject=sequence_context.get("subject", ""),
        body=sequence_context.get("body_step_1", ""),
        reply_body=reply_body,
    )

    response = await circuit_breaker.call_async(
        _call_claude_classification, client, prompt,
    )

    # Extract tool use result
    tool_input = _extract_tool_input(response)

    needs_review = (
        tool_input.get("confidence", 0) < confidence_threshold
        or tool_input.get("classification") == "question"
    )

    return ClassificationResult(
        classification=tool_input["classification"],
        confidence=tool_input["confidence"],
        sentiment=tool_input["sentiment"],
        key_intent=tool_input["key_intent"],
        extracted_referral=tool_input.get("extracted_referral"),
        suggested_action=tool_input["suggested_action"],
        needs_review=needs_review,
        model_version=MODEL,
    )


async def _call_claude_classification(client, prompt: str):
    return client.messages.create(
        model=MODEL,
        max_tokens=1024,
        tools=[CLASSIFICATION_TOOL],
        tool_choice={"type": "tool", "name": "classify_reply"},
        messages=[{"role": "user", "content": prompt}],
    )


def _extract_tool_input(response) -> dict:
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    raise ValueError("No tool_use block in Claude response")
