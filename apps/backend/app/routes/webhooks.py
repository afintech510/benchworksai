"""Webhook handlers for Smartlead + Cal.com (Spec Section 3.4).

All external webhooks route directly to FastAPI (SYN-005).
"""
from fastapi import APIRouter, Request
import structlog

from app.config import get_settings
from app.db.supabase import get_supabase
from app.middleware.webhook_security import verify_webhook
from app.services.suppression import add_suppression

router = APIRouter(prefix="/v1/webhooks", tags=["webhooks"])
logger = structlog.get_logger()

# Pipeline stage ordering for "only advance, never revert" logic
STAGE_ORDER = [
    "new", "enriching", "enriched", "enrichment_failed",
    "qualified", "contacted", "replied", "interested",
    "call_booked", "call_completed", "proposal_sent", "won", "lost",
    "unsubscribed", "suppressed",
]


def _should_advance_stage(current: str | None, target: str) -> bool:
    """Only advance stage forward in pipeline. Never revert."""
    if not current:
        return True
    try:
        return STAGE_ORDER.index(target) > STAGE_ORDER.index(current)
    except ValueError:
        return True  # Unknown stage → allow


# ============================================================
# Smartlead Reply Webhook
# ============================================================
@router.post("/smartlead/reply")
async def smartlead_reply(request: Request):
    """Receive and store Smartlead reply. Classification deferred to Phase 02b."""
    settings = get_settings()
    payload = await verify_webhook(request, settings.smartlead_webhook_secret)

    if payload is None:
        return {"received": True, "status": "duplicate"}

    db = get_supabase()
    smartlead_lead_id = payload.get("lead_id") or payload.get("smartlead_lead_id")

    # Match to internal lead
    lead_result = db.table("leads").select("id, client_id, campaign_id, stage").eq(
        "smartlead_lead_id", str(smartlead_lead_id)
    ).maybe_single().execute()

    if not lead_result.data:
        logger.warning("webhook_unknown_lead", smartlead_lead_id=smartlead_lead_id)
        return {"received": True, "status": "unknown_lead"}

    lead = lead_result.data
    request_id = getattr(request.state, "request_id", None)

    # Build idempotency key
    received_at = payload.get("received_at", payload.get("timestamp", ""))
    idempotency_key = f"{smartlead_lead_id}:reply:{received_at}"

    # Write reply_event (classification = null, needs_review = true until classified)
    try:
        db.table("reply_events").insert({
            "lead_id": lead["id"],
            "client_id": lead["client_id"],
            "campaign_id": lead["campaign_id"],
            "reply_body": payload.get("reply_body") or payload.get("body", ""),
            "idempotency_key": idempotency_key,
            "needs_review": True,
        }).execute()
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            return {"received": True, "status": "duplicate"}
        raise

    # Advance stage to 'replied'
    if _should_advance_stage(lead.get("stage"), "replied"):
        db.table("leads").update({"stage": "replied"}).eq("id", lead["id"]).execute()

    # Log action
    db.table("action_log").insert({
        "client_id": lead["client_id"],
        "lead_id": lead["id"],
        "campaign_id": lead["campaign_id"],
        "action_type": "reply_received",
        "action_detail": {"smartlead_lead_id": smartlead_lead_id},
        "initiated_by": "webhook",
        "request_id": request_id,
    }).execute()

    return {"received": True}


# ============================================================
# Smartlead Bounce Webhook
# ============================================================
@router.post("/smartlead/bounce")
async def smartlead_bounce(request: Request):
    """Handle bounced email — add to suppression, update lead stage."""
    settings = get_settings()
    payload = await verify_webhook(request, settings.smartlead_webhook_secret)

    if payload is None:
        return {"received": True, "status": "duplicate"}

    db = get_supabase()
    bounced_email = (payload.get("email") or "").strip().lower()
    if not bounced_email:
        return {"received": True, "status": "no_email"}

    request_id = getattr(request.state, "request_id", None)

    # Find the lead
    lead_result = db.table("leads").select("id, client_id, campaign_id").eq(
        "email", bounced_email
    ).limit(1).execute()

    source_client_id = None
    source_campaign_id = None
    lead_id = None
    if lead_result.data:
        lead = lead_result.data[0]
        source_client_id = lead["client_id"]
        source_campaign_id = lead["campaign_id"]
        lead_id = lead["id"]
        db.table("leads").update({"stage": "suppressed"}).eq("id", lead["id"]).execute()

    # Add to suppression
    await add_suppression(bounced_email, "bounce", db, source_client_id, source_campaign_id)

    # Log
    db.table("action_log").insert({
        "client_id": source_client_id,
        "lead_id": lead_id,
        "action_type": "email_bounced",
        "action_detail": {"email": bounced_email},
        "initiated_by": "webhook",
        "request_id": request_id,
    }).execute()

    return {"received": True}


# ============================================================
# Cal.com Booking Webhook (SYN-024)
# ============================================================
@router.post("/calcom/booking")
async def calcom_booking(request: Request):
    """Handle Cal.com booking — match lead, set booking_status, advance stage."""
    settings = get_settings()
    payload = await verify_webhook(
        request, settings.calcom_webhook_secret,
        signature_header="X-Cal-Signature-256",
    )

    if payload is None:
        return {"received": True, "status": "duplicate"}

    db = get_supabase()
    request_id = getattr(request.state, "request_id", None)

    # Extract booker email from Cal.com payload
    booker = payload.get("payload", {}).get("attendees", [{}])[0] if payload.get("payload") else {}
    booker_email = (booker.get("email") or payload.get("email", "")).strip().lower()

    if not booker_email:
        return {"received": True, "status": "no_email"}

    # Match lead: exact email → domain fallback → create unmapped
    lead_result = db.table("leads").select("id, client_id, campaign_id, stage").eq(
        "email", booker_email
    ).limit(1).execute()

    if not lead_result.data:
        # Domain fallback
        domain = booker_email.split("@")[-1] if "@" in booker_email else None
        if domain:
            lead_result = db.table("leads").select("id, client_id, campaign_id, stage").eq(
                "domain", domain
            ).limit(1).execute()

    if lead_result.data:
        lead = lead_result.data[0]
        updates = {"booking_status": "booked"}
        if _should_advance_stage(lead.get("stage"), "call_booked"):
            updates["stage"] = "call_booked"
        db.table("leads").update(updates).eq("id", lead["id"]).execute()

        db.table("action_log").insert({
            "client_id": lead["client_id"],
            "lead_id": lead["id"],
            "campaign_id": lead["campaign_id"],
            "action_type": "booking_created",
            "action_detail": {"booker_email": booker_email, "cal_event": payload.get("payload", {}).get("uid")},
            "initiated_by": "webhook",
            "request_id": request_id,
        }).execute()
    else:
        # Create unmapped lead for operator review
        # Pick the first active client for unmapped bookings (BenchworksAI internal)
        clients = db.table("clients").select("id").eq("status", "active").limit(1).execute()
        client_id = clients.data[0]["id"] if clients.data else None
        campaigns = db.table("campaigns").select("id").eq("client_id", client_id).limit(1).execute() if client_id else None
        campaign_id = campaigns.data[0]["id"] if campaigns and campaigns.data else None

        if client_id and campaign_id:
            new_lead = db.table("leads").insert({
                "client_id": client_id,
                "campaign_id": campaign_id,
                "email": booker_email,
                "source": "unmapped_booking",
                "booking_status": "booked",
                "stage": "call_booked",
            }).execute()

            db.table("action_log").insert({
                "client_id": client_id,
                "lead_id": new_lead.data[0]["id"] if new_lead.data else None,
                "action_type": "booking_created",
                "action_detail": {"booker_email": booker_email, "unmapped": True},
                "initiated_by": "webhook",
                "request_id": request_id,
            }).execute()

    return {"received": True}


# ============================================================
# Cal.com Cancellation Webhook (SYN-024)
# ============================================================
@router.post("/calcom/cancelled")
async def calcom_cancelled(request: Request):
    """Handle booking cancellation — update status, DO NOT revert stage."""
    settings = get_settings()
    payload = await verify_webhook(
        request, settings.calcom_webhook_secret,
        signature_header="X-Cal-Signature-256",
    )

    if payload is None:
        return {"received": True, "status": "duplicate"}

    db = get_supabase()
    request_id = getattr(request.state, "request_id", None)

    booker = payload.get("payload", {}).get("attendees", [{}])[0] if payload.get("payload") else {}
    booker_email = (booker.get("email") or payload.get("email", "")).strip().lower()

    if not booker_email:
        return {"received": True, "status": "no_email"}

    lead_result = db.table("leads").select("id, client_id, campaign_id").eq(
        "email", booker_email
    ).limit(1).execute()

    if lead_result.data:
        lead = lead_result.data[0]
        # Set booking_status but DO NOT revert pipeline stage
        db.table("leads").update({"booking_status": "cancelled"}).eq("id", lead["id"]).execute()

        # Schedule re-engagement via Redis (24h delay)
        try:
            import redis as redis_lib
            from app.config import get_settings as _gs
            r = redis_lib.from_url(_gs().redis_url)
            import json as _json
            r.set(
                f"reengagement:{lead['id']}",
                _json.dumps({"lead_id": lead["id"], "campaign_id": lead["campaign_id"]}),
                ex=86400,  # 24h TTL
            )
        except Exception as e:
            logger.warning("reengagement_schedule_failed", error=str(e))

        db.table("action_log").insert({
            "client_id": lead["client_id"],
            "lead_id": lead["id"],
            "action_type": "booking_cancelled",
            "action_detail": {"booker_email": booker_email},
            "initiated_by": "webhook",
            "request_id": request_id,
        }).execute()

    return {"received": True}
