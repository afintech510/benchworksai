"""Mailbox pool endpoints (Spec Section 3.2, F-004)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import structlog

from app.dependencies.auth import require_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/mailboxes", tags=["mailboxes"])
logger = structlog.get_logger()


class MailboxRotateRequest(BaseModel):
    mailbox_id: str
    campaign_id: str


@router.get("")
async def list_mailboxes(user: UserContext = Depends(require_operator)):
    """List all mailboxes with health status."""
    db = get_supabase()
    result = db.table("mailbox_pool").select("*").order("status").execute()

    # Summary stats
    data = result.data or []
    summary = {
        "total": len(data),
        "active": sum(1 for m in data if m["status"] == "active"),
        "warming": sum(1 for m in data if m["status"] == "warming"),
        "ready": sum(1 for m in data if m["status"] == "ready"),
        "degraded": sum(1 for m in data if m["status"] == "degraded"),
    }

    return {"mailboxes": data, "summary": summary}


@router.post("/rotate")
async def rotate_mailbox(
    body: MailboxRotateRequest,
    user: UserContext = Depends(require_operator),
):
    """Rotate a degraded mailbox — assign replacement from warm pool (SYN-004)."""
    db = get_supabase()

    # Mark degraded mailbox
    db.table("mailbox_pool").update({
        "status": "degraded",
    }).eq("id", body.mailbox_id).execute()

    # Find a ready replacement
    warm_pool = db.table("mailbox_pool").select("*").eq("status", "ready").limit(1).execute()

    if not warm_pool.data:
        # WARM POOL DEPLETED — pause campaign (SYN-004)
        db.table("campaigns").update({"status": "paused"}).eq("id", body.campaign_id).execute()

        db.table("action_log").insert({
            "campaign_id": body.campaign_id,
            "action_type": "system_alert",
            "action_detail": {
                "severity": "CRITICAL",
                "message": "Warm pool depleted. Campaign paused.",
                "degraded_mailbox_id": body.mailbox_id,
            },
            "initiated_by": "system",
        }).execute()

        logger.error("warm_pool_depleted", campaign_id=body.campaign_id)
        raise HTTPException(status_code=409, detail="Warm pool depleted. Campaign paused.")

    replacement = warm_pool.data[0]

    # Assign replacement
    degraded = db.table("mailbox_pool").select("assigned_client_id").eq("id", body.mailbox_id).maybe_single().execute()
    db.table("mailbox_pool").update({
        "status": "active",
        "assigned_client_id": degraded.data["assigned_client_id"] if degraded.data else None,
        "assigned_campaign_id": body.campaign_id,
    }).eq("id", replacement["id"]).execute()

    db.table("action_log").insert({
        "campaign_id": body.campaign_id,
        "action_type": "mailbox_rotated",
        "action_detail": {
            "degraded": body.mailbox_id,
            "replacement": replacement["id"],
        },
        "initiated_by": user.email,
    }).execute()

    return {
        "rotated": True,
        "degraded_mailbox": body.mailbox_id,
        "replacement_mailbox": replacement["id"],
    }
