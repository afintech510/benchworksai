"""Suppression list service — reusable check function (Spec Section 2.2)."""
import structlog
from supabase import Client

logger = structlog.get_logger()


async def check_suppression(email: str, db: Client) -> bool:
    """Check if email is in the global suppression list. Returns True if suppressed."""
    normalized = email.strip().lower()
    result = db.table("suppression_list").select("id").eq("email", normalized).limit(1).execute()
    return bool(result.data)


async def add_suppression(
    email: str,
    reason: str,
    db: Client,
    source_client_id: str = None,
    source_campaign_id: str = None,
) -> dict:
    """Add email to global suppression list."""
    normalized = email.strip().lower()

    # Check if already suppressed
    existing = db.table("suppression_list").select("id").eq("email", normalized).limit(1).execute()
    if existing.data:
        return existing.data[0]

    record = {
        "email": normalized,
        "reason": reason,
    }
    if source_client_id:
        record["source_client_id"] = source_client_id
    if source_campaign_id:
        record["source_campaign_id"] = source_campaign_id

    result = db.table("suppression_list").insert(record).execute()
    logger.info("suppression_added", email=normalized, reason=reason)
    return result.data[0] if result.data else {}
