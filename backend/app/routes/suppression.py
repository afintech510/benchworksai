"""Suppression list endpoints (Spec Section 3.2)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import structlog

from app.dependencies.auth import require_operator, require_service_or_operator, UserContext
from app.db.supabase import get_supabase
from app.services.suppression import add_suppression as _add_suppression

router = APIRouter(prefix="/v1/suppression", tags=["suppression"])
logger = structlog.get_logger()


class SuppressionCreate(BaseModel):
    email: str
    reason: str
    source_client_id: Optional[str] = None
    source_campaign_id: Optional[str] = None


@router.get("")
async def list_suppression(
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: UserContext = Depends(require_operator),
):
    """List suppressed emails (paginated, searchable)."""
    db = get_supabase()
    query = db.table("suppression_list").select("*").order("created_at", desc=True).range(offset, offset + limit - 1)

    if search:
        query = query.ilike("email", f"%{search}%")

    result = query.execute()
    return {"suppression": result.data or [], "count": len(result.data or [])}


@router.post("")
async def create_suppression(
    body: SuppressionCreate,
    user: UserContext = Depends(require_service_or_operator),
):
    """Add email to suppression list."""
    db = get_supabase()
    record = await _add_suppression(
        body.email, body.reason, db, body.source_client_id, body.source_campaign_id,
    )

    # Log to action_log
    db.table("action_log").insert({
        "client_id": body.source_client_id,
        "action_type": "suppression_added",
        "action_detail": {"email": body.email.strip().lower(), "reason": body.reason},
        "initiated_by": user.email,
    }).execute()

    return {"suppression": record}


@router.delete("/{email}")
async def delete_suppression(
    email: str,
    user: UserContext = Depends(require_operator),  # Operator only, not service key
):
    """Remove email from suppression list."""
    db = get_supabase()
    normalized = email.strip().lower()

    result = db.table("suppression_list").delete().eq("email", normalized).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Email not found in suppression list")

    # Audit log (append-only)
    db.table("action_log").insert({
        "action_type": "suppression_removed",
        "action_detail": {"email": normalized},
        "initiated_by": user.email,
    }).execute()

    logger.info("suppression_removed", email=normalized, by=user.email)
    return {"removed": True, "email": normalized}
