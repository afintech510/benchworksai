"""Inbound lead handoff from the larkin/BenchworksAI marketing site.

When a demo lead crosses tier='on_fire' (score ≥70) or confirms a Cal.com
booking, the marketing site POSTs here so the lead enters the outbound
ops pipeline under the BenchworksAI internal client.

Auth: service-key (separate `LARKIN_SERVICE_KEY` for rotation independence;
falls back to n8n service key for simplicity).
"""
from datetime import datetime, timezone
from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.config import get_settings
from app.db.supabase import get_supabase
from app.dependencies.auth import UserContext

router = APIRouter(prefix="/v1/inbound", tags=["inbound"])
logger = structlog.get_logger()


class HandoffPayload(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    name: str | None = None  # larkin uses single `name` — split server-side if first/last not provided
    company: str | None = None
    domain: str | None = None
    title: str | None = None
    trigger: str = Field(..., description="tier_on_fire | booking_confirmed | manual")
    score: int | None = None
    tier: str | None = None
    vertical_interest: str | None = None
    source_demo: str | None = None
    marketing_context: dict[str, Any] | None = None
    larkin_lead_id: str | None = None


async def _require_larkin_key(request: Request) -> UserContext:
    settings = get_settings()
    key = request.headers.get("X-Service-Key")
    if not key:
        raise HTTPException(status_code=401, detail="Missing X-Service-Key")
    valid_keys = {settings.service_key_n8n, settings.larkin_service_key}
    valid_keys.discard("")
    valid_keys.discard("change-me")
    if key not in valid_keys:
        raise HTTPException(status_code=401, detail="Invalid service key")
    return UserContext(sub="larkin", email="service@larkin", role="service", jti="larkin-handoff")


def _split_name(full: str | None) -> tuple[str | None, str | None]:
    if not full:
        return None, None
    parts = full.strip().split(maxsplit=1)
    return parts[0], (parts[1] if len(parts) > 1 else None)


def _ensure_internal_campaign(db, client_id: str) -> str:
    """Find or create the 'Inbound (Larkin)' campaign for the BenchworksAI client."""
    existing = (
        db.table("campaigns")
        .select("id")
        .eq("client_id", client_id)
        .eq("name", "Inbound (Larkin)")
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]["id"]

    created = (
        db.table("campaigns")
        .insert({
            "client_id": client_id,
            "name": "Inbound (Larkin)",
            "status": "active",
            "vertical": "inbound",
            "offer": "ai_consultancy",
        })
        .execute()
    )
    return created.data[0]["id"]


@router.post("/handoff")
async def inbound_handoff(
    payload: HandoffPayload,
    request: Request,
    user: UserContext = Depends(_require_larkin_key),
):
    """Upsert a qualified inbound lead into the BenchworksAI pipeline.

    Idempotent on (email, inbound_campaign_id). Repeat calls update enrichment
    data and stage but never duplicate.
    """
    db = get_supabase()

    bw_client = (
        db.table("clients")
        .select("id")
        .eq("name", "BenchworksAI")
        .limit(1)
        .execute()
    )
    if not bw_client.data:
        raise HTTPException(status_code=500, detail="BenchworksAI internal client not seeded")
    client_id = bw_client.data[0]["id"]

    campaign_id = _ensure_internal_campaign(db, client_id)

    first_name = payload.first_name
    last_name = payload.last_name
    if not first_name and payload.name:
        first_name, last_name = _split_name(payload.name)

    domain = payload.domain or (payload.email.split("@", 1)[1] if "@" in payload.email else None)

    if payload.trigger == "booking_confirmed":
        stage = "call_booked"
    elif payload.trigger in ("booking_cancelled", "booking_rescheduled"):
        stage = "qualified"
    else:
        stage = "qualified"

    enrichment_data = {
        "larkin_lead_id": payload.larkin_lead_id,
        "vertical_interest": payload.vertical_interest,
        "source_demo": payload.source_demo,
        "marketing_context": payload.marketing_context,
        "handoff_trigger": payload.trigger,
        "handoff_tier": payload.tier,
        "handoff_at": datetime.now(timezone.utc).isoformat(),
    }

    existing = (
        db.table("leads")
        .select("id, stage")
        .eq("email", payload.email)
        .eq("campaign_id", campaign_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        existing_row = existing.data[0]
        booking_status = {
            "booking_confirmed": "booked",
            "booking_cancelled": "cancelled",
        }.get(payload.trigger)  # rescheduled = no change
        update = {
            "first_name": first_name or None,
            "last_name": last_name or None,
            "company": payload.company,
            "title": payload.title,
            "domain": domain,
            "enrichment_data": enrichment_data,
            "icp_score": payload.score,
            "source": "inbound_larkin",
            "stage": stage if _should_advance_stage(existing_row["stage"], stage) else existing_row["stage"],
            "booking_status": booking_status,
        }
        # Explicitly write booking_status even when None (cancellation should null it out)
        clean = {k: v for k, v in update.items() if v is not None or k == "booking_status"}
        db.table("leads").update(clean).eq("id", existing_row["id"]).execute()
        lead_id = existing_row["id"]
        created = False
    else:
        insert = {
            "client_id": client_id,
            "campaign_id": campaign_id,
            "email": payload.email,
            "first_name": first_name,
            "last_name": last_name,
            "company": payload.company,
            "title": payload.title,
            "domain": domain,
            "enrichment_data": enrichment_data,
            "icp_score": payload.score,
            "stage": stage,
            "source": "inbound_larkin",
            "booking_status": "booked" if payload.trigger == "booking_confirmed" else "cancelled" if payload.trigger == "booking_cancelled" else None,
        }
        result = db.table("leads").insert(insert).execute()
        lead_id = result.data[0]["id"]
        created = True

    db.table("action_log").insert({
        "client_id": client_id,
        "campaign_id": campaign_id,
        "lead_id": lead_id,
        "action_type": "inbound_handoff",
        "action_detail": {
            "trigger": payload.trigger,
            "tier": payload.tier,
            "score": payload.score,
            "created": created,
            "larkin_lead_id": payload.larkin_lead_id,
        },
        "initiated_by": "larkin",
        "request_id": getattr(request.state, "request_id", None),
    }).execute()

    logger.info(
        "inbound_handoff",
        email=payload.email,
        trigger=payload.trigger,
        created=created,
        lead_id=lead_id,
    )
    return {"lead_id": lead_id, "created": created, "stage": stage}


_STAGE_ORDER = ["new", "enriched", "qualified", "contacted", "replied", "interested", "call_booked"]


def _should_advance_stage(current: str | None, candidate: str) -> bool:
    """Only move stage forward in the pipeline. Never demote."""
    if not current:
        return True
    try:
        return _STAGE_ORDER.index(candidate) > _STAGE_ORDER.index(current)
    except ValueError:
        return False
