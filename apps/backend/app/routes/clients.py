from typing import Optional

from fastapi import APIRouter, Depends, Query
import structlog

from app.dependencies.auth import require_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/clients", tags=["clients"])
logger = structlog.get_logger()


@router.get("")
async def list_clients(
    status: Optional[str] = Query(None),
    user: UserContext = Depends(require_operator),
):
    """List clients from client_summary_mv materialized view (SYN-012)."""
    db = get_supabase()

    query = db.table("client_summary_mv").select("*")
    if status:
        query = query.eq("status", status)

    result = query.execute()
    return {"clients": result.data or []}


@router.get("/{client_id}")
async def get_client(
    client_id: str,
    user: UserContext = Depends(require_operator),
):
    """Get client detail with campaigns and pipeline summary."""
    db = get_supabase()

    client = db.table("clients").select("*").eq("id", client_id).maybe_single().execute()
    if not client.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Client not found")

    campaigns = db.table("campaigns").select("*").eq("client_id", client_id).execute()

    return {
        "client": client.data,
        "campaigns": campaigns.data or [],
    }
