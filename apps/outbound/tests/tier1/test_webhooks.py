"""Tier 1: Webhook security tests (Spec Section 9.2)."""
import hashlib
import hmac
import json
import time

import pytest

from app.config import get_settings


def _make_webhook_headers(payload: dict, secret: str, event_id: str = "evt-001"):
    """Generate valid webhook headers."""
    body = json.dumps(payload).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": str(time.time()),
        "X-Event-ID": event_id,
    }


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_valid_signature(client):
    """Correct HMAC → 200."""
    settings = get_settings()
    payload = {"lead_id": "sl-001", "reply_body": "Yes I'm interested", "timestamp": time.time()}
    headers = _make_webhook_headers(payload, settings.smartlead_webhook_secret, "evt-valid-001")
    response = await client.post("/v1/webhooks/smartlead/reply", content=json.dumps(payload), headers=headers)
    assert response.status_code == 200


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_invalid_signature(client):
    """Wrong HMAC → 401."""
    payload = {"lead_id": "sl-001", "reply_body": "test"}
    headers = _make_webhook_headers(payload, "wrong-secret", "evt-bad-001")
    response = await client.post("/v1/webhooks/smartlead/reply", content=json.dumps(payload), headers=headers)
    assert response.status_code == 401


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_expired_timestamp(client):
    """Timestamp >5 min old → 401."""
    settings = get_settings()
    payload = {"lead_id": "sl-001", "reply_body": "test"}
    body = json.dumps(payload).encode()
    signature = hmac.new(settings.smartlead_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": str(time.time() - 600),  # 10 minutes ago
        "X-Event-ID": "evt-expired-001",
    }
    response = await client.post("/v1/webhooks/smartlead/reply", content=json.dumps(payload), headers=headers)
    assert response.status_code == 401


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_missing_signature(client):
    """No signature header → 401."""
    response = await client.post(
        "/v1/webhooks/smartlead/reply",
        content=json.dumps({"lead_id": "sl-001"}),
        headers={"Content-Type": "application/json", "X-Webhook-Timestamp": str(time.time())},
    )
    assert response.status_code == 401
