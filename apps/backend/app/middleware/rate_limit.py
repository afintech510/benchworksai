import structlog
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


def _get_real_ip(request: Request) -> str:
    """Get real client IP from X-Forwarded-For (set by Caddy), falling back to remote address."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def _get_rate_limit_key(request: Request) -> str:
    """Key by JWT sub (operator) or service key identity, falling back to IP."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Keyed by token hash to limit per-user
        return f"jwt:{hash(auth_header)}"
    service_key = request.headers.get("X-Service-Key")
    if service_key:
        return "service:n8n"
    return _get_real_ip(request)


# Initialize limiter — Redis URL set at startup via app state
limiter = Limiter(
    key_func=_get_rate_limit_key,
    default_limits=["100/minute"],
    storage_uri=None,  # Set at app startup from settings
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    logger.warning("rate_limit_exceeded", path=request.url.path, key=_get_rate_limit_key(request))
    retry_after = getattr(exc, "retry_after", 60)
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded", "retry_after": retry_after},
        headers={"Retry-After": str(retry_after)},
    )
