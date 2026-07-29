"""Agent command endpoint — NL input → Claude with MCP tools → response (Spec Section 4.2)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import structlog
import json

from app.dependencies.auth import require_operator, UserContext
from app.services.ai.client import get_anthropic_client, MODEL
from app.mcp.tools import TOOL_REGISTRY, execute_tool
from app.db.supabase import get_supabase

router = APIRouter(prefix="/v1/agent", tags=["agent"])
logger = structlog.get_logger()


class CommandRequest(BaseModel):
    message: str


class CommandResponse(BaseModel):
    response: str
    tools_called: list[str] = []


@router.post("/command")
async def agent_command(
    body: CommandRequest,
    user: UserContext = Depends(require_operator),
) -> CommandResponse:
    """Execute a natural language command via Claude agent with MCP tools."""
    client = get_anthropic_client()

    # Build tool definitions for Claude
    tools = [
        {
            "name": name,
            "description": meta["description"],
            "input_schema": meta["input_schema"],
        }
        for name, meta in TOOL_REGISTRY.items()
    ]

    messages = [{"role": "user", "content": body.message}]
    tools_called = []

    # Agent loop — single turn with tool use
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system="You are BenchworksAI's operations assistant. Use the available tools to answer operator questions about clients, campaigns, leads, mailbox health, and system status. Be concise and actionable.",
        tools=tools,
        messages=messages,
    )

    # Process tool calls if any
    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                tool_name = block.name
                tool_args = block.input
                tools_called.append(tool_name)

                try:
                    result = await execute_tool(tool_name, tool_args)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, default=str),
                    })
                except Exception as e:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": f"Error: {str(e)}",
                        "is_error": True,
                    })

        # Second call with tool results
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        final_response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system="You are BenchworksAI's operations assistant. Summarize the tool results clearly for the operator.",
            tools=tools,
            messages=messages,
        )

        response_text = ""
        for block in final_response.content:
            if hasattr(block, "text"):
                response_text += block.text
    else:
        response_text = ""
        for block in response.content:
            if hasattr(block, "text"):
                response_text += block.text

    # Log command
    db = get_supabase()
    db.table("action_log").insert({
        "action_type": "agent_command",
        "action_detail": {
            "message": body.message,
            "tools_called": tools_called,
        },
        "initiated_by": user.email,
    }).execute()

    return CommandResponse(response=response_text, tools_called=tools_called)
