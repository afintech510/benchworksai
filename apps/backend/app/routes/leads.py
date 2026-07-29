"""Lead management endpoints (Spec Section 3.2)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import structlog

from app.dependencies.auth import require_operator, require_service_or_operator, UserContext
from app.db.supabase import get_supabase
from app.services.suppression import check_suppression

router = APIRouter(prefix="/v1/leads", tags=["leads"])
logger = structlog.get_logger()


class LeadImportItem(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: Optional[str] = None
    company: str = ""
    title: str = ""
    domain: str = ""


class LeadImportRequest(BaseModel):
    client_id: str
    campaign_id: str
    leads: list[LeadImportItem]
    source: str = "manual"
    source_batch_id: Optional[str] = None
    auto_enrich: bool = False


class LeadStageUpdate(BaseModel):
    stage: str


@router.post("/import", status_code=202)
async def import_leads(
    body: LeadImportRequest,
    user: UserContext = Depends(require_service_or_operator),
):
    """Import leads with suppression check and upsert (SYN-003)."""
    db = get_supabase()

    received = len(body.leads)
    suppressed = 0
    imported = 0

    for lead in body.leads:
        # Suppression check
        if lead.email and await check_suppression(lead.email, db):
            suppressed += 1
            continue

        record = {
            "client_id": body.client_id,
            "campaign_id": body.campaign_id,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "company": lead.company,
            "title": lead.title,
            "domain": lead.domain,
            "source": body.source,
            "source_batch_id": body.source_batch_id,
            "stage": "new",
        }
        if lead.email:
            record["email"] = lead.email.strip().lower()

        try:
            # Upsert on (email, campaign_id) for leads with email
            if lead.email:
                db.table("leads").upsert(
                    record,
                    on_conflict="email,campaign_id",
                ).execute()
            else:
                db.table("leads").insert(record).execute()
            imported += 1
        except Exception as e:
            logger.warning("lead_import_failed", error=str(e), email=lead.email)

    # Log
    db.table("action_log").insert({
        "client_id": body.client_id,
        "campaign_id": body.campaign_id,
        "action_type": "leads_imported",
        "action_detail": {
            "received": received,
            "imported": imported,
            "suppressed": suppressed,
            "source": body.source,
        },
        "initiated_by": user.email,
    }).execute()

    return {
        "batch_id": body.source_batch_id,
        "received": received,
        "imported": imported,
        "suppressed": suppressed,
    }


@router.get("")
async def list_leads(
    client_id: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: UserContext = Depends(require_operator),
):
    """List leads with filters."""
    db = get_supabase()
    query = db.table("leads").select(
        "id, email, first_name, last_name, company, title, stage, icp_score, booking_status, created_at",
    ).order("created_at", desc=True).range(offset, offset + limit - 1)

    if client_id:
        query = query.eq("client_id", client_id)
    if campaign_id:
        query = query.eq("campaign_id", campaign_id)
    if stage:
        query = query.eq("stage", stage)
    if min_score is not None:
        query = query.gte("icp_score", min_score)

    result = query.execute()
    return {"leads": result.data or []}


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    user: UserContext = Depends(require_operator),
):
    """Get full lead detail with journey timeline."""
    db = get_supabase()

    lead = db.table("leads").select("*").eq("id", lead_id).maybe_single().execute()
    if not lead.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Journey from action_log
    journey = db.table("action_log").select("*").eq("lead_id", lead_id).order("created_at").execute()

    # Reply history
    replies = db.table("reply_events").select("*").eq("lead_id", lead_id).order("processed_at", desc=True).execute()

    return {
        "lead": lead.data,
        "journey": journey.data or [],
        "replies": replies.data or [],
    }


@router.patch("/{lead_id}/stage")
async def update_lead_stage(
    lead_id: str,
    body: LeadStageUpdate,
    user: UserContext = Depends(require_operator),
):
    """Manual stage update."""
    db = get_supabase()

    lead = db.table("leads").select("id, stage, client_id, campaign_id").eq("id", lead_id).maybe_single().execute()
    if not lead.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    old_stage = lead.data["stage"]
    db.table("leads").update({"stage": body.stage}).eq("id", lead_id).execute()

    db.table("action_log").insert({
        "client_id": lead.data["client_id"],
        "lead_id": lead_id,
        "campaign_id": lead.data["campaign_id"],
        "action_type": "lead_stage_changed",
        "action_detail": {"old_stage": old_stage, "new_stage": body.stage},
        "initiated_by": user.email,
    }).execute()

    return {"lead_id": lead_id, "old_stage": old_stage, "new_stage": body.stage}
