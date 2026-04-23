from fastapi import APIRouter, Depends
import structlog

from app.dependencies.auth import require_operator, UserContext
from app.db.supabase import get_supabase
from app.models.auth import LogoutResponse

router = APIRouter(prefix="/v1/auth", tags=["auth"])
logger = structlog.get_logger()


@router.post("/logout", response_model=LogoutResponse)
async def logout(user: UserContext = Depends(require_operator)):
    """Invalidate current session (F-015, SYN-001)."""
    db = get_supabase()

    # Invalidate session
    db.table("sessions").update({"is_valid": False}).eq("session_token", user.jti).execute()

    # Log to action_log
    db.table("action_log").insert({
        "action_type": "operator_command",
        "action_detail": {"command": "logout"},
        "initiated_by": user.email,
    }).execute()

    logger.info("session_invalidated", user=user.email, jti=user.jti)
    return LogoutResponse()
