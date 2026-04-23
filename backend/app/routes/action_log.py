"""Action log endpoints (Spec Section 3.2, F-021)."""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import require_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/action-log", tags=["action-log"])


@router.get("")
async def list_action_log(
    client_id: Optional[str] = Query(None),
    lead_id: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    user: UserContext = Depends(require_operator),
):
    """List action log entries (append-only, no UPDATE/DELETE)."""
    db = get_supabase()
    query = db.table("action_log").select("*").order("created_at", desc=True).range(offset, offset + limit - 1)

    if client_id:
        query = query.eq("client_id", client_id)
    if lead_id:
        query = query.eq("lead_id", lead_id)
    if campaign_id:
        query = query.eq("campaign_id", campaign_id)
    if action_type:
        query = query.eq("action_type", action_type)

    result = query.execute()
    return {"entries": result.data or [], "count": len(result.data or [])}
