import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from app.routes.auth import router as auth_router
from app.routes.clients import router as clients_router
from app.routes.webhooks import router as webhooks_router
from app.routes.suppression import router as suppression_router
from app.routes.campaigns import router as campaigns_router
from app.routes.leads import router as leads_router
from app.routes.reports import router as reports_router
from app.routes.action_log import router as action_log_router
from app.routes.reply_events import router as reply_events_router
from app.routes.mailboxes import router as mailboxes_router
from app.routes.agent import router as agent_router
from app.mcp.server import router as mcp_router

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if get_settings().debug else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Configure rate limiter Redis storage
    limiter._storage_uri = settings.redis_url
    logger.info("benchworks_api_starting", version="0.1.0")
    yield
    logger.info("benchworks_api_shutting_down")


app = FastAPI(
    title="BenchworksAI Outbound API",
    version="0.1.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Propagate X-Request-ID from Caddy through all log entries (SYN-022)."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    # Store on request state for use in action_log writes
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/v1/health")
async def health():
    return {
        "status": "healthy",
        "service": "benchworks-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Register routers
app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(webhooks_router)
app.include_router(suppression_router)
app.include_router(campaigns_router)
app.include_router(leads_router)
app.include_router(reports_router)
app.include_router(action_log_router)
app.include_router(reply_events_router)
app.include_router(mailboxes_router)
app.include_router(agent_router)
app.include_router(mcp_router)
