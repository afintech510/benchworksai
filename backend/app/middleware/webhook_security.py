"""Shared webhook security middleware (Spec Section 3.4).

HMAC-SHA256 signature verification, timestamp validation (±5min),
event_id dedup via Redis SETNX (60-min TTL).
"""
import hashlib
import hmac
import json
import time
from typing import Optional

import structlog
from fastapi import HTTPException, Request

logger = structlog.get_logger()


async def verify_webhook(
    request: Request,
    secret: str,
    signature_header: str = "X-Webhook-Signature",
    timestamp_header: str = "X-Webhook-Timestamp",
    event_id_header: str = "X-Event-ID",
) -> Optional[dict]:
    """Verify webhook signature, timestamp, and dedup. Returns parsed payload or None if duplicate."""
    payload = await request.body()

    # 1. Timestamp validation
    timestamp_str = request.headers.get(timestamp_header)
    if timestamp_str:
        try:
            ts = float(timestamp_str)
            if abs(time.time() - ts) > 300:
                logger.warning("webhook_timestamp_expired", drift=abs(time.time() - ts))
                raise HTTPException(status_code=401, detail="Webhook timestamp expired")
        except (ValueError, TypeError):
            raise HTTPException(status_code=401, detail="Invalid webhook timestamp")

    # 2. HMAC-SHA256 signature verification
    signature = request.headers.get(signature_header)
    if not signature:
        raise HTTPException(status_code=401, detail="Missing webhook signature")

    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        logger.warning("webhook_signature_mismatch")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # 3. Idempotency — Redis SETNX with 60-min TTL
    event_id = request.headers.get(event_id_header)
    if event_id:
        try:
            import redis as redis_lib
            from app.config import get_settings

            settings = get_settings()
            r = redis_lib.from_url(settings.redis_url)
            if not r.set(f"webhook:{event_id}", "1", nx=True, ex=3600):
                logger.info("webhook_duplicate_event", event_id=event_id)
                return None  # Already processed
        except Exception as e:
            # Redis failure → fail open (allow processing)
            logger.warning("webhook_dedup_redis_error", error=str(e))

    # 4. Parse payload AFTER verification
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
