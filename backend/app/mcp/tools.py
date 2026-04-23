"""MCP tool implementations — 13 tools (Spec Section 3.3).

Each tool reuses existing service layer from Phases 02-03.
All tool calls log to action_log with initiated_by='agent'.
"""
import structlog
from typing import Any

from app.db.supabase import get_supabase

logger = structlog.get_logger()


def _log_tool_call(tool_name: str, args: dict, client_id: str = None, lead_id: str = None):
    """Log MCP tool call to action_log."""
    db = get_supabase()
    db.table("action_log").insert({
        "client_id": client_id,
        "lead_id": lead_id,
        "action_type": "mcp_tool_call",
        "action_detail": {"tool": tool_name, "args": args},
        "initiated_by": "agent",
    }).execute()


# ============================================================
# Tool Registry
# ============================================================
TOOL_REGISTRY: dict[str, dict] = {
    "get_all_clients_summary": {
        "description": "Get summary of all active clients with campaign counts, lead counts, and recent positive replies",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    "get_client_detail": {
        "description": "Get detailed information about a specific client including campaigns and pipeline counts",
        "input_schema": {
            "type": "object",
            "properties": {"client_id": {"type": "string", "description": "Client UUID"}},
            "required": ["client_id"],
        },
    },
    "get_client_metrics": {
        "description": "Get performance metrics for a client over a time period",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "days": {"type": "integer", "default": 7},
            },
            "required": ["client_id"],
        },
    },
    "get_lead_pipeline": {
        "description": "Get leads filtered by client, stage, or minimum ICP score",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "stage": {"type": "string"},
                "min_score": {"type": "integer"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": [],
        },
    },
    "get_lead_journey": {
        "description": "Get the full journey timeline for a specific lead from action_log",
        "input_schema": {
            "type": "object",
            "properties": {"lead_id": {"type": "string"}},
            "required": ["lead_id"],
        },
    },
    "update_lead_stage": {
        "description": "Update a lead's pipeline stage",
        "input_schema": {
            "type": "object",
            "properties": {
                "lead_id": {"type": "string"},
                "stage": {"type": "string"},
            },
            "required": ["lead_id", "stage"],
        },
    },
    "check_suppression": {
        "description": "Check if an email is in the global suppression list",
        "input_schema": {
            "type": "object",
            "properties": {"email": {"type": "string"}},
            "required": ["email"],
        },
    },
    "add_suppression": {
        "description": "Add an email to the global suppression list",
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {"type": "string"},
                "reason": {"type": "string"},
            },
            "required": ["email", "reason"],
        },
    },
    "get_mailbox_health": {
        "description": "Get mailbox pool status including health scores and warm pool availability",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    "trigger_mailbox_rotation": {
        "description": "Rotate a degraded mailbox by assigning a replacement from the warm pool",
        "input_schema": {
            "type": "object",
            "properties": {
                "mailbox_id": {"type": "string"},
                "campaign_id": {"type": "string"},
            },
            "required": ["mailbox_id", "campaign_id"],
        },
    },
    "get_system_alerts": {
        "description": "Get recent system alerts from action_log",
        "input_schema": {
            "type": "object",
            "properties": {"limit": {"type": "integer", "default": 10}},
            "required": [],
        },
    },
    "get_action_log": {
        "description": "Query the action log with optional filters",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {"type": "string"},
                "action_type": {"type": "string"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": [],
        },
    },
    "generate_report": {
        "description": "Trigger report generation for a client",
        "input_schema": {
            "type": "object",
            "properties": {"client_id": {"type": "string"}},
            "required": ["client_id"],
        },
    },
}


# ============================================================
# Tool Handlers
# ============================================================
async def execute_tool(tool_name: str, args: dict) -> Any:
    """Dispatch tool execution to the appropriate handler."""
    handler = _HANDLERS.get(tool_name)
    if not handler:
        raise ValueError(f"No handler for tool: {tool_name}")

    _log_tool_call(tool_name, args, args.get("client_id"), args.get("lead_id"))
    return await handler(args)


async def _get_all_clients_summary(args: dict) -> list:
    db = get_supabase()
    result = db.table("client_summary_mv").select("*").execute()
    return result.data or []


async def _get_client_detail(args: dict) -> dict:
    db = get_supabase()
    client = db.table("clients").select("*").eq("id", args["client_id"]).maybe_single().execute()
    if not client.data:
        return {"error": "Client not found"}
    campaigns = db.table("campaigns").select("*").eq("client_id", args["client_id"]).execute()
    return {"client": client.data, "campaigns": campaigns.data or []}


async def _get_client_metrics(args: dict) -> dict:
    db = get_supabase()
    client_id = args["client_id"]
    leads = db.table("leads").select("stage").eq("client_id", client_id).execute()
    stage_counts = {}
    for l in (leads.data or []):
        s = l.get("stage", "unknown")
        stage_counts[s] = stage_counts.get(s, 0) + 1
    replies = db.table("reply_events").select("classification").eq("client_id", client_id).execute()
    cls_counts = {}
    for r in (replies.data or []):
        c = r.get("classification") or "unclassified"
        cls_counts[c] = cls_counts.get(c, 0) + 1
    return {"leads_by_stage": stage_counts, "replies_by_classification": cls_counts, "total_leads": sum(stage_counts.values())}


async def _get_lead_pipeline(args: dict) -> list:
    db = get_supabase()
    query = db.table("leads").select("id, email, first_name, last_name, company, stage, icp_score").order("created_at", desc=True).limit(args.get("limit", 20))
    if args.get("client_id"):
        query = query.eq("client_id", args["client_id"])
    if args.get("stage"):
        query = query.eq("stage", args["stage"])
    if args.get("min_score"):
        query = query.gte("icp_score", args["min_score"])
    result = query.execute()
    return result.data or []


async def _get_lead_journey(args: dict) -> list:
    db = get_supabase()
    result = db.table("action_log").select("*").eq("lead_id", args["lead_id"]).order("created_at").execute()
    return result.data or []


async def _update_lead_stage(args: dict) -> dict:
    db = get_supabase()
    lead = db.table("leads").select("id, stage, client_id, campaign_id").eq("id", args["lead_id"]).maybe_single().execute()
    if not lead.data:
        return {"error": "Lead not found"}
    old = lead.data["stage"]
    db.table("leads").update({"stage": args["stage"]}).eq("id", args["lead_id"]).execute()
    db.table("action_log").insert({
        "client_id": lead.data["client_id"], "lead_id": args["lead_id"], "campaign_id": lead.data["campaign_id"],
        "action_type": "lead_stage_changed", "action_detail": {"old_stage": old, "new_stage": args["stage"]}, "initiated_by": "agent",
    }).execute()
    return {"lead_id": args["lead_id"], "old_stage": old, "new_stage": args["stage"]}


async def _check_suppression(args: dict) -> dict:
    from app.services.suppression import check_suppression
    db = get_supabase()
    suppressed = await check_suppression(args["email"], db)
    return {"email": args["email"], "suppressed": suppressed}


async def _add_suppression(args: dict) -> dict:
    from app.services.suppression import add_suppression
    db = get_supabase()
    result = await add_suppression(args["email"], args["reason"], db)
    return {"added": True, "record": result}


async def _get_mailbox_health(args: dict) -> dict:
    db = get_supabase()
    result = db.table("mailbox_pool").select("*").execute()
    data = result.data or []
    return {
        "mailboxes": data,
        "total": len(data),
        "active": sum(1 for m in data if m["status"] == "active"),
        "ready": sum(1 for m in data if m["status"] == "ready"),
        "degraded": sum(1 for m in data if m["status"] == "degraded"),
    }


async def _trigger_mailbox_rotation(args: dict) -> dict:
    db = get_supabase()
    db.table("mailbox_pool").update({"status": "degraded"}).eq("id", args["mailbox_id"]).execute()
    warm = db.table("mailbox_pool").select("id").eq("status", "ready").limit(1).execute()
    if not warm.data:
        db.table("campaigns").update({"status": "paused"}).eq("id", args["campaign_id"]).execute()
        return {"error": "Warm pool depleted. Campaign paused.", "campaign_paused": True}
    replacement = warm.data[0]
    db.table("mailbox_pool").update({"status": "active", "assigned_campaign_id": args["campaign_id"]}).eq("id", replacement["id"]).execute()
    return {"rotated": True, "degraded": args["mailbox_id"], "replacement": replacement["id"]}


async def _get_system_alerts(args: dict) -> list:
    db = get_supabase()
    result = db.table("action_log").select("*").eq("action_type", "system_alert").order("created_at", desc=True).limit(args.get("limit", 10)).execute()
    return result.data or []


async def _get_action_log(args: dict) -> list:
    db = get_supabase()
    query = db.table("action_log").select("*").order("created_at", desc=True).limit(args.get("limit", 20))
    if args.get("client_id"):
        query = query.eq("client_id", args["client_id"])
    if args.get("action_type"):
        query = query.eq("action_type", args["action_type"])
    result = query.execute()
    return result.data or []


async def _generate_report(args: dict) -> dict:
    db = get_supabase()
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    report = db.table("client_reports").insert({
        "client_id": args["client_id"],
        "report_period_start": (now - timedelta(days=7)).isoformat(),
        "report_period_end": now.isoformat(),
    }).execute()
    return {"report_id": report.data[0]["id"] if report.data else None, "status": "generating"}


_HANDLERS = {
    "get_all_clients_summary": _get_all_clients_summary,
    "get_client_detail": _get_client_detail,
    "get_client_metrics": _get_client_metrics,
    "get_lead_pipeline": _get_lead_pipeline,
    "get_lead_journey": _get_lead_journey,
    "update_lead_stage": _update_lead_stage,
    "check_suppression": _check_suppression,
    "add_suppression": _add_suppression,
    "get_mailbox_health": _get_mailbox_health,
    "trigger_mailbox_rotation": _trigger_mailbox_rotation,
    "get_system_alerts": _get_system_alerts,
    "get_action_log": _get_action_log,
    "generate_report": _generate_report,
}
