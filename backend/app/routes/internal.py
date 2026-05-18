"""Internal endpoints called by n8n cron workflows.

Replaces the n8n executeCommand pattern (blocked in n8n 2.x) with
HTTP calls to FastAPI, which owns all external integrations per
spec SYN-005. Service-key authenticated.

Smartlead access is via REST API (httpx), not CLI — the CLI is not
installed in the FastAPI container and the API surface is the
canonical source-of-truth for cron-driven jobs.
"""
import asyncio
from datetime import datetime, timezone

import httpx
import redis as redis_lib
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.config import get_settings
from app.db.supabase import get_supabase
from app.dependencies.auth import require_service_or_operator, UserContext
from app.services.ai.scoring import score_lead
from app.services.circuit_breaker import get_circuit_breaker

router = APIRouter(prefix="/v1/internal", tags=["internal"])
logger = structlog.get_logger()

SMARTLEAD_API_BASE = "https://server.smartlead.ai/api/v1"


@router.post("/deliverability-check")
async def deliverability_check(
    request: Request,
    user: UserContext = Depends(require_service_or_operator),
):
    """Fetch mailbox health from Smartlead REST API and persist to mailbox_pool.

    Replaces deliverability-monitor n8n executeCommand step.
    Returns count of mailboxes processed and any newly degraded.
    """
    settings = get_settings()
    if not settings.smartlead_api_key:
        raise HTTPException(status_code=503, detail="Smartlead API key not configured")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{SMARTLEAD_API_BASE}/email-accounts/",
                params={"api_key": settings.smartlead_api_key},
            )
            response.raise_for_status()
            accounts = response.json()
    except httpx.HTTPStatusError as e:
        logger.warning("smartlead_api_failed", status=e.response.status_code, body=e.response.text[:200])
        raise HTTPException(status_code=502, detail=f"Smartlead API error: {e.response.status_code}")
    except httpx.HTTPError as e:
        logger.error("smartlead_api_unreachable", error=str(e))
        raise HTTPException(status_code=502, detail="Smartlead API unreachable")

    if not isinstance(accounts, list):
        logger.warning("smartlead_unexpected_response_shape", got=type(accounts).__name__)
        accounts = []

    db = get_supabase()
    processed = 0
    degraded: list[str] = []

    for acct in accounts:
        smartlead_id = acct.get("id")
        if smartlead_id is None:
            continue

        warmup = acct.get("warmup_details") or {}
        bounce_rate = _safe_rate(warmup.get("bounce_rate"))
        spam_rate = _safe_rate(warmup.get("spam_rate"))
        reply_rate = _safe_rate(warmup.get("reply_rate"))
        health_score = warmup.get("warmup_reputation") or acct.get("health_score")

        update = {
            "health_score": health_score,
            "bounce_rate": bounce_rate,
            "spam_rate": spam_rate,
            "reply_rate": reply_rate,
            "last_health_check": datetime.now(timezone.utc).isoformat(),
        }
        new_status = _classify_health(health_score, bounce_rate, spam_rate)
        if new_status:
            update["status"] = new_status
            if new_status == "degraded":
                degraded.append(str(smartlead_id))

        db.table("mailbox_pool").update(update).eq("smartlead_account_id", str(smartlead_id)).execute()
        processed += 1

    db.table("action_log").insert({
        "action_type": "deliverability_check",
        "action_detail": {
            "processed": processed,
            "degraded_count": len(degraded),
            "degraded_smartlead_ids": degraded,
        },
        "initiated_by": user.email or "service",
        "request_id": getattr(request.state, "request_id", None),
    }).execute()

    logger.info("deliverability_check_complete", processed=processed, degraded=len(degraded))
    return {
        "processed": processed,
        "degraded_count": len(degraded),
        "degraded_smartlead_account_ids": degraded,
    }


def _safe_rate(value) -> float | None:
    """Coerce Smartlead rate values to float — they sometimes arrive as percent strings."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return f / 100 if f > 1 else f


def _classify_health(score, bounce_rate, spam_rate) -> str | None:
    """Map metrics → mailbox_pool.status. Returns None if no change."""
    bounce = bounce_rate or 0
    spam = spam_rate or 0
    s = score if score is not None else 100
    if bounce > 0.05 or spam > 0.02 or s < 50:
        return "degraded"
    if s >= 80:
        return "active"
    return None


@router.post("/health-check")
async def health_check(
    request: Request,
    user: UserContext = Depends(require_service_or_operator),
):
    """Aggregate internal service health: Redis + Supabase.

    Replaces health-monitor n8n executeCommand redis-cli step.
    n8n branches on response: status != "healthy" → Slack alert.
    """
    settings = get_settings()
    failed: list[str] = []

    try:
        r = redis_lib.from_url(settings.redis_url, socket_timeout=2)
        if not r.ping():
            failed.append("redis")
    except Exception as e:
        logger.warning("health_check_redis_failed", error=str(e))
        failed.append("redis")

    try:
        db = get_supabase()
        db.table("system_config").select("key").limit(1).execute()
    except Exception as e:
        logger.warning("health_check_supabase_failed", error=str(e))
        failed.append("supabase")

    status = "healthy" if not failed else "degraded"
    logger.info("health_check_complete", status=status, failed=failed)
    return {
        "status": status,
        "failed_services": failed,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/prospect-cycle")
async def prospect_cycle(
    request: Request,
    user: UserContext = Depends(require_service_or_operator),
    limit: int = Query(default=25, ge=1, le=100, description="Max leads to score this cycle"),
    score_threshold: int = Query(default=70, ge=0, le=100),
):
    """F-007 internal prospecting cycle.

    Scores unscored leads under the BenchworksAI internal client using Claude.
    Promotes leads scoring >= threshold to stage='qualified'.

    Designed to be invoked weekly by n8n. Bounded by `limit` for cost control.
    Returns per-lead results + summary counts.
    """
    db = get_supabase()

    bw = (
        db.table("clients")
        .select("id, icp")
        .eq("name", "BenchworksAI")
        .limit(1)
        .execute()
    )
    if not bw.data:
        raise HTTPException(status_code=500, detail="BenchworksAI internal client not seeded")
    client_row = bw.data[0]
    client_id = client_row["id"]
    icp = client_row.get("icp") or {}

    unscored = (
        db.table("leads")
        .select("id, first_name, last_name, title, company, domain, enrichment_data, stage")
        .eq("client_id", client_id)
        .is_("icp_score", "null")
        .in_("stage", ["new", "enriched"])
        .limit(limit)
        .execute()
    )
    leads = unscored.data or []

    cb = get_circuit_breaker("anthropic")
    scored = 0
    promoted = 0
    failed: list[dict] = []
    results: list[dict] = []

    for lead in leads:
        try:
            result = await score_lead(lead, icp, cb, score_threshold=score_threshold)
            update = {
                "icp_score": result.score,
                "icp_breakdown": {k: v.model_dump() for k, v in result.breakdown.items()},
                "icp_reasoning": result.reasoning,
            }
            if result.qualified:
                update["stage"] = "qualified"
                promoted += 1
            db.table("leads").update(update).eq("id", lead["id"]).execute()
            scored += 1
            results.append({
                "lead_id": lead["id"],
                "score": result.score,
                "qualified": result.qualified,
            })
        except Exception as e:
            logger.warning("prospect_cycle_score_failed", lead_id=lead["id"], error=str(e))
            failed.append({"lead_id": lead["id"], "error": str(e)[:200]})

    db.table("action_log").insert({
        "client_id": client_id,
        "action_type": "prospect_cycle",
        "action_detail": {
            "candidates": len(leads),
            "scored": scored,
            "promoted_to_qualified": promoted,
            "failed_count": len(failed),
            "limit": limit,
            "threshold": score_threshold,
        },
        "initiated_by": user.email or "service",
        "request_id": getattr(request.state, "request_id", None),
    }).execute()

    logger.info(
        "prospect_cycle_complete",
        candidates=len(leads),
        scored=scored,
        promoted=promoted,
        failed=len(failed),
    )
    return {
        "candidates": len(leads),
        "scored": scored,
        "promoted_to_qualified": promoted,
        "failed_count": len(failed),
        "results": results[:50],
        "failed": failed[:10],
    }


@router.post("/keep-warm")
async def keep_warm(user: UserContext = Depends(require_service_or_operator)):
    """Touch Supabase to prevent free-tier auto-pause. Cheap query, no side effects."""
    db = get_supabase()
    db.table("system_config").select("key").limit(1).execute()
    return {"warmed_at": datetime.now(timezone.utc).isoformat()}
