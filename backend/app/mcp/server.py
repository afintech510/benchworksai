"""Custom MCP Server — FastAPI-based (Spec Section 3.3).

Exposes 13 business logic tools to Claude agent.
Smartlead MCP handles sending-layer operations; this server handles
Supabase state, scoring, routing, reporting, and logging.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
import structlog

from app.mcp.tools import TOOL_REGISTRY, execute_tool

logger = structlog.get_logger()
router = APIRouter(prefix="/v1/mcp", tags=["mcp"])


class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = {}


class ToolCallResponse(BaseModel):
    tool_name: str
    result: Any
    error: str | None = None


class ToolListResponse(BaseModel):
    tools: list[dict]


@router.get("/tools")
async def list_tools() -> ToolListResponse:
    """List all available MCP tools with schemas."""
    tools = [
        {"name": name, "description": meta["description"], "input_schema": meta["input_schema"]}
        for name, meta in TOOL_REGISTRY.items()
    ]
    return ToolListResponse(tools=tools)


@router.post("/call")
async def call_tool(body: ToolCallRequest) -> ToolCallResponse:
    """Execute an MCP tool."""
    if body.tool_name not in TOOL_REGISTRY:
        return ToolCallResponse(tool_name=body.tool_name, result=None, error=f"Unknown tool: {body.tool_name}")

    try:
        result = await execute_tool(body.tool_name, body.arguments)
        return ToolCallResponse(tool_name=body.tool_name, result=result)
    except Exception as e:
        logger.error("mcp_tool_error", tool=body.tool_name, error=str(e))
        return ToolCallResponse(tool_name=body.tool_name, result=None, error=str(e))
