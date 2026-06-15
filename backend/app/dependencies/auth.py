from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
import structlog

from app.config import get_settings, Settings
from app.db.supabase import get_supabase

logger = structlog.get_logger()


class UserContext:
    def __init__(self, sub: str, email: str, role: str, jti: str):
        self.sub = sub
        self.email = email
        self.role = role
        self.jti = jti


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth_header[7:]


async def require_auth(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> UserContext:
    """Verify JWT and session validity. Returns UserContext."""
    token = _extract_token(request)
    try:
        payload = jwt.decode(token, settings.nextauth_secret, algorithms=["HS256"])
    except JWTError as e:
        logger.warning("jwt_verification_failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid token")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=401, detail="Token missing jti claim")

    # Check session validity in Supabase
    db = get_supabase()
    result = db.table("sessions").select("is_valid, expires_at").eq("session_token", jti).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Session not found")
    if not result.data["is_valid"]:
        raise HTTPException(status_code=401, detail="Session invalidated")

    return UserContext(
        sub=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "operator"),
        jti=jti,
    )


async def require_operator(user: UserContext = Depends(require_auth)) -> UserContext:
    """Require operator role."""
    if user.role != "operator":
        raise HTTPException(status_code=403, detail="Operator role required")
    return user


async def require_service_or_operator(request: Request) -> UserContext:
    """Accept either a valid JWT (operator) or a valid service key (n8n)."""
    settings = get_settings()

    # Check for service key first
    service_key = request.headers.get("X-Service-Key")
    if service_key:
        if service_key != settings.service_key_n8n:
            raise HTTPException(status_code=401, detail="Invalid service key")

        # Enforce restricted endpoint scope for service key (SYN-009)
        path = request.url.path
        method = request.method
        allowed = _is_service_key_allowed(method, path)
        if not allowed:
            raise HTTPException(status_code=403, detail="Service key not authorized for this endpoint")

        return UserContext(sub="n8n", email="service@n8n", role="service", jti="service")

    # Fall back to JWT auth
    return await require_auth(request, settings)


def _is_service_key_allowed(method: str, path: str) -> bool:
    """Check if the service key is allowed for this method + path combination (SYN-009)."""
    allowed_patterns = [
        ("POST", "/v1/leads/import"),
        ("GET", "/v1/campaigns"),
        ("POST", "/v1/webhooks/"),  # all webhook endpoints
        ("GET", "/v1/reports/"),    # GET /v1/reports/*/metrics
        ("POST", "/v1/reports/"),   # POST /v1/reports/*/generate
        ("POST", "/v1/internal/"),  # n8n cron workflows (deliverability, health)
        ("GET", "/v1/internal/portfolio-status"),  # dashboard fleet-status (server-side read)
        ("GET", "/v1/health"),
    ]
    for allowed_method, allowed_path in allowed_patterns:
        if method == allowed_method and path.startswith(allowed_path):
            return True
    return False
