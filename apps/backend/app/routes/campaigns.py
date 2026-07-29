"""Campaign endpoints (Spec Section 3.2 — SYN-027)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import structlog
import httpx

from app.dependencies.auth import require_operator, require_service_or_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/campaigns", tags=["campaigns"])
logger = structlog.get_logger()


class CampaignLaunchRequest(BaseModel):
    client_id: str
    name: str
    vertical: str
    offer: str
    geography: str
    sequence_steps: int = 4
    sequence_config: dict = {}


class CampaignStatusUpdate(BaseModel):
    status: str  # 'active', 'paused', 'completed'


@router.post("/launch", status_code=202)
async def launch_campaign(
    body: CampaignLaunchRequest,
    user: UserContext = Depends(require_operator),
):
    """Create campaign with staged provisioning (SYN-027). Returns 202 immediately."""
    db = get_supabase()

    # Verify client exists
    client = db.table("clients").select("id, name").eq("id", body.client_id).maybe_single().execute()
    if not client.data:
        raise HTTPException(status_code=404, detail="Client not found")

    # Create campaign record
    campaign = db.table("campaigns").insert({
        "client_id": body.client_id,
        "name": body.name,
        "status": "draft",
        "provision_stage": "provisioning",
        "vertical": body.vertical,
        "offer": body.offer,
        "geography": body.geography,
        "sequence_config": {**body.sequence_config, "steps": body.sequence_steps},
    }).execute()

    campaign_data = campaign.data[0]

    # Log action
    db.table("action_log").insert({
        "client_id": body.client_id,
        "campaign_id": campaign_data["id"],
        "action_type": "campaign_launched",
        "action_detail": {"name": body.name, "vertical": body.vertical},
        "initiated_by": user.email,
    }).execute()

    # Trigger n8n campaign launch workflow asynchronously
    try:
        from app.config import get_settings
        settings = get_settings()
        n8n_webhook = settings.__dict__.get("n8n_campaign_launch_webhook", "")
        if n8n_webhook:
            async with httpx.AsyncClient() as client:
                await client.post(n8n_webhook, json={"campaign_id": campaign_data["id"]}, timeout=5)
    except Exception as e:
        logger.warning("n8n_trigger_failed", error=str(e))

    return {
        "campaign_id": campaign_data["id"],
        "provision_stage": "provisioning",
        "status": "draft",
    }


@router.get("")
async def list_campaigns(
    client_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: UserContext = Depends(require_service_or_operator),
):
    """List campaigns with optional filters."""
    db = get_supabase()
    query = db.table("campaigns").select("*").order("created_at", desc=True)

    if client_id:
        query = query.eq("client_id", client_id)
    if status:
        query = query.eq("status", status)

    result = query.execute()
    return {"campaigns": result.data or []}


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    user: UserContext = Depends(require_service_or_operator),
):
    """Get campaign detail."""
    db = get_supabase()
    campaign = db.table("campaigns").select("*").eq("id", campaign_id).maybe_single().execute()
    if not campaign.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    leads_count = db.table("leads").select("id", count="exact").eq("campaign_id", campaign_id).execute()
    templates = db.table("sequence_templates").select("*").eq("campaign_id", campaign_id).order("step_number").execute()

    return {
        "campaign": campaign.data,
        "lead_count": leads_count.count or 0,
        "sequence_templates": templates.data or [],
    }


@router.patch("/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str,
    body: CampaignStatusUpdate,
    user: UserContext = Depends(require_operator),
):
    """Pause/resume/complete a campaign."""
    db = get_supabase()

    if body.status not in ("active", "paused", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")

    db.table("campaigns").update({"status": body.status}).eq("id", campaign_id).execute()

    db.table("action_log").insert({
        "campaign_id": campaign_id,
        "action_type": "campaign_status_changed",
        "action_detail": {"new_status": body.status},
        "initiated_by": user.email,
    }).execute()

    return {"campaign_id": campaign_id, "status": body.status}


@router.patch("/{campaign_id}/retry-provision")
async def retry_provision(
    campaign_id: str,
    user: UserContext = Depends(require_operator),
):
    """Retry provisioning from the failed stage."""
    db = get_supabase()
    campaign = db.table("campaigns").select("id, provision_stage").eq("id", campaign_id).maybe_single().execute()

    if not campaign.data or not campaign.data.get("provision_stage"):
        raise HTTPException(status_code=400, detail="Campaign is not in a failed provision state")

    # Re-trigger n8n workflow
    db.table("action_log").insert({
        "campaign_id": campaign_id,
        "action_type": "campaign_provision_retried",
        "action_detail": {"from_stage": campaign.data["provision_stage"]},
        "initiated_by": user.email,
    }).execute()

    return {"campaign_id": campaign_id, "retrying_from": campaign.data["provision_stage"]}
