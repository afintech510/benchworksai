"""Report endpoints (Spec Section 3.2, 5.6)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import structlog

from app.dependencies.auth import require_operator, require_service_or_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/reports", tags=["reports"])
logger = structlog.get_logger()


@router.get("/{client_id}/metrics")
async def get_client_metrics(
    client_id: str,
    days: int = Query(7),
    user: UserContext = Depends(require_service_or_operator),
):
    """Get aggregated metrics for a client over a time period."""
    db = get_supabase()

    # Verify client
    client = db.table("clients").select("id, name").eq("id", client_id).maybe_single().execute()
    if not client.data:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get leads by stage
    leads = db.table("leads").select("stage", count="exact").eq("client_id", client_id).execute()

    # Count by stage
    stage_counts = {}
    for lead in (leads.data or []):
        stage = lead.get("stage", "unknown")
        stage_counts[stage] = stage_counts.get(stage, 0) + 1

    # Get reply events
    replies = db.table("reply_events").select(
        "classification"
    ).eq("client_id", client_id).execute()

    classification_counts = {}
    for r in (replies.data or []):
        cls = r.get("classification") or "unclassified"
        classification_counts[cls] = classification_counts.get(cls, 0) + 1

    # Get campaigns
    campaigns = db.table("campaigns").select("id, status").eq("client_id", client_id).execute()

    return {
        "client_id": client_id,
        "client_name": client.data["name"],
        "period_days": days,
        "leads_by_stage": stage_counts,
        "total_leads": sum(stage_counts.values()),
        "replies_by_classification": classification_counts,
        "total_replies": sum(classification_counts.values()),
        "positive_replies": classification_counts.get("interested", 0),
        "meetings_booked": stage_counts.get("call_booked", 0),
        "active_campaigns": sum(1 for c in (campaigns.data or []) if c["status"] == "active"),
    }


@router.post("/{client_id}/generate", status_code=202)
async def generate_report(
    client_id: str,
    user: UserContext = Depends(require_service_or_operator),
):
    """Trigger on-demand report generation."""
    db = get_supabase()
    from datetime import datetime, timedelta, timezone

    client = db.table("clients").select("id, name").eq("id", client_id).maybe_single().execute()
    if not client.data:
        raise HTTPException(status_code=404, detail="Client not found")

    now = datetime.now(timezone.utc)
    period_start = (now - timedelta(days=7)).isoformat()
    period_end = now.isoformat()

    # Create report record
    report = db.table("client_reports").insert({
        "client_id": client_id,
        "report_period_start": period_start,
        "report_period_end": period_end,
    }).execute()

    db.table("action_log").insert({
        "client_id": client_id,
        "action_type": "report_generation_triggered",
        "action_detail": {"report_id": report.data[0]["id"] if report.data else None},
        "initiated_by": user.email,
    }).execute()

    return {
        "report_id": report.data[0]["id"] if report.data else None,
        "status": "generating",
    }


@router.get("")
async def list_reports(
    client_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    user: UserContext = Depends(require_operator),
):
    """List generated reports."""
    db = get_supabase()
    query = db.table("client_reports").select("*").order("created_at", desc=True).limit(limit)
    if client_id:
        query = query.eq("client_id", client_id)
    result = query.execute()
    return {"reports": result.data or []}
