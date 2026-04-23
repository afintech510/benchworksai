"""Tier 1: Reply classification accuracy tests (Spec Section 9.2).

Requires ANTHROPIC_API_KEY to be set. Calls real Claude API.
Expected cost: ~$0.50-1.00 per run. Runtime: 2-3 minutes.
"""
import json
from pathlib import Path

import pytest

from app.services.ai.classification import classify_reply
from app.services.circuit_breaker import CircuitBreaker


def load_classification_fixtures():
    path = Path(__file__).parent.parent / "fixtures" / "classification_replies.json"
    with open(path) as f:
        return json.load(f)


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_reply_classification_accuracy():
    """Classification accuracy must be >= 90% on 50+ fixtures."""
    fixtures = load_classification_fixtures()
    assert len(fixtures) >= 50, f"Need 50+ fixtures, got {len(fixtures)}"

    # Use a no-op circuit breaker for testing
    cb = CircuitBreaker("claude_test", None)
    sequence_context = {"subject": "Quick question about your business", "body_step_1": "Hi, I help SMBs implement AI..."}

    correct = 0
    results = []

    for fixture in fixtures:
        try:
            result = await classify_reply(
                fixture["reply_body"],
                sequence_context,
                cb,
            )
            is_correct = result.classification == fixture["expected_classification"]
            if is_correct:
                correct += 1

            if fixture.get("expected_confidence_min") and is_correct:
                assert result.confidence >= fixture["expected_confidence_min"], (
                    f"Low confidence on {fixture['id']}: {result.confidence} < {fixture['expected_confidence_min']}"
                )

            results.append({
                "id": fixture["id"],
                "expected": fixture["expected_classification"],
                "actual": result.classification,
                "confidence": result.confidence,
                "correct": is_correct,
            })
        except Exception as e:
            results.append({"id": fixture["id"], "error": str(e), "correct": False})

    accuracy = correct / len(fixtures)
    print(f"\nClassification accuracy: {accuracy:.2%} ({correct}/{len(fixtures)})")

    # Print misclassifications
    misses = [r for r in results if not r.get("correct")]
    if misses:
        print(f"Misclassifications ({len(misses)}):")
        for m in misses:
            print(f"  {m['id']}: expected={m.get('expected')}, got={m.get('actual', 'ERROR')}")

    assert accuracy >= 0.90, f"Classification accuracy {accuracy:.2%} below 90% threshold"
