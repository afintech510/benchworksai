"""Reply events endpoints (Spec Section 3.2 — SYN-020)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies.auth import require_operator, UserContext
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/reply-events", tags=["reply-events"])


class ReplyReviewUpdate(BaseModel):
    needs_review: bool = False
    classification: Optional[str] = None


@router.get("")
async def list_reply_events(
    needs_review: Optional[bool] = Query(None),
    client_id: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    user: UserContext = Depends(require_operator),
):
    """List reply events with optional review queue filter."""
    db = get_supabase()
    query = db.table("reply_events").select(
        "*, leads(first_name, last_name, company, email)"
    ).order("processed_at", desc=True).range(offset, offset + limit - 1)

    if needs_review is not None:
        query = query.eq("needs_review", needs_review)
    if client_id:
        query = query.eq("client_id", client_id)
    if campaign_id:
        query = query.eq("campaign_id", campaign_id)

    result = query.execute()
    return {"reply_events": result.data or []}


@router.patch("/{reply_event_id}/review")
async def resolve_review(
    reply_event_id: str,
    body: ReplyReviewUpdate,
    user: UserContext = Depends(require_operator),
):
    """Resolve a review queue item."""
    db = get_supabase()

    updates = {"needs_review": body.needs_review}
    if body.classification:
        updates["classification"] = body.classification

    result = db.table("reply_events").update(updates).eq("id", reply_event_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Reply event not found")

    db.table("action_log").insert({
        "action_type": "reply_review_resolved",
        "action_detail": {
            "reply_event_id": reply_event_id,
            "classification": body.classification,
        },
        "initiated_by": user.email,
    }).execute()

    return {"reply_event_id": reply_event_id, "needs_review": body.needs_review}
