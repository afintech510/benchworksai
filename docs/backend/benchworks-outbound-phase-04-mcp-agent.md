# Phase 04: MCP Server + Agent Layer
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 03 complete  
**Implements:** F-006  
**Recommended:** `claude --max-turns 25`

---

## 1. Context

You are executing **Phase 04: MCP Server + Agent Layer** of the BenchworksAI Outbound Engine build.

**Your scope:** The custom FastAPI-based MCP server that exposes business logic tools to Claude, and the dual MCP integration that lets a Claude agent compose tools from both the Smartlead native MCP and your custom server. You are NOT building the dashboard (Phase 05) or test suite (Phase 06).

**Tech Stack:** FastAPI, MCP Python SDK, Supabase, Smartlead MCP (native)  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Section 3.3 (MCP Tool Definitions) FIRST.

### What Already Exists
- Phase 01: Database, auth, rate limiting, Supabase client
- Phase 02a: Webhook handlers, suppression endpoints
- Phase 02b: AI functions (classify, score, generate), circuit breakers
- Phase 03: All n8n workflows, FastAPI campaign/lead/report endpoints, all crons running

### What You're Building
The agent interface. 13 MCP tools that let a Claude agent query state, manage campaigns, inspect leads, rotate mailboxes, and generate reports — all via natural language. The agent composes these tools with Smartlead's native MCP for sending-layer operations. After this phase, the operator can type "show me all clients with reply rate below 2%" and get an accurate answer.

---

## 2. Objective & Deliverables

### Objective
After this phase, all 13 custom MCP tools return real data from Supabase and execute real operations. A Claude agent can compose Smartlead MCP tools (campaign CRUD, lead management) with custom MCP tools (state queries, scoring, reporting) to fulfill natural language operator commands.

### Deliverables

1. **MCP protocol handler** — FastAPI-based MCP server implementing the MCP specification — Spec Section 3.3
2. **13 MCP tools** — Full implementations replacing any stubs from Phase 01:
   - `get_all_clients_summary` → reads from client_summary_mv
   - `get_client_detail` → client + campaigns + pipeline counts
   - `get_client_metrics` → GET /v1/reports/{client_id}/metrics
   - `get_lead_pipeline` → leads filtered by client/stage/score
   - `get_lead_journey` → full journey from action_log
   - `update_lead_stage` → PATCH lead stage with logging
   - `check_suppression` → suppression lookup
   - `add_suppression` → POST suppression
   - `get_mailbox_health` → mailbox_pool status
   - `trigger_mailbox_rotation` → POST /v1/mailboxes/rotate
   - `get_system_alerts` → recent system_alert action_log entries
   - `get_action_log` → filtered action_log query
   - `generate_report` → trigger report generation
3. **Dual MCP integration test** — Verify Claude can call both Smartlead MCP and custom MCP in a single conversation
4. **Command pattern documentation** — Natural language → tool mapping for common operator commands

---

## 3. Implementation Instructions

### Task 1: MCP Protocol Implementation
**Spec Reference:** Section 3.3  
**Creates:** `backend/app/mcp/server.py`, `backend/app/mcp/tools.py`

Implement an MCP server using the Anthropic MCP Python SDK (`mcp` package). The server exposes tools via the standard MCP protocol.

Each tool is defined with:
- `name` — snake_case identifier
- `description` — what it does (Claude reads this to decide when to use it)
- `input_schema` — JSON Schema for parameters
- Handler function that queries Supabase and returns structured data

Register the MCP server as a FastAPI sub-application or mount it alongside the REST API.

### Task 2: Implement All 13 Tools
**Spec Reference:** Section 3.3 (complete tool definitions)  
**Creates:** Individual tool handlers in `backend/app/mcp/tools/`

For each tool, implement the handler by calling existing FastAPI service functions or Supabase queries directly. **Do not duplicate business logic** — reuse the service layer from Phases 02–03.

Key implementation notes per tool:

**get_all_clients_summary:** Query `client_summary_mv` (the materialized view from Phase 01). Return the same shape as GET /v1/clients.

**get_lead_journey:** Query `action_log WHERE lead_id = $1 ORDER BY created_at ASC`. Return the journey array matching spec Section 3.2 (GET /v1/leads/{id} response shape). This is the data the dashboard timeline component (Phase 05) will render.

**update_lead_stage:** Validate stage transition is legal (can't go backward in pipeline except via explicit revert). Write to Supabase. Log `action_type = 'lead_stage_changed'` with `initiated_by = 'agent'`. Return success + new stage.

**trigger_mailbox_rotation:** Reuse the rotation logic from Phase 03's deliverability cron. Include warm pool depletion guard.

**generate_report:** Call Phase 03's report generation endpoint (POST /v1/reports/{client_id}/generate). Return report_id and delivery status.

**All tools must:**
- Log to action_log with `initiated_by = 'agent'`
- Include `request_id` in logs for traceability
- Handle errors gracefully — return error messages the agent can relay to the operator, don't crash

### Task 3: Dual MCP Integration
**Creates:** Integration test script or documentation

Verify that a Claude agent (via the Anthropic API with MCP server connections) can:
1. Call a Smartlead MCP tool (e.g., list campaigns)
2. Call a custom MCP tool (e.g., get_client_metrics)
3. Compose both in a single response (e.g., "pause client X's campaign" → Smartlead MCP `pause_campaign` + custom MCP `update_lead_stage` for affected leads)

Document the MCP server URL and connection configuration needed for Claude to use both servers.

### Task 4: Command Pattern Documentation
**Creates:** `docs/agent-commands.md`

Document the most common operator commands and which tools they map to:

| Operator Command | Tools Called | Expected Flow |
|-----------------|-------------|---------------|
| "Pause client X's campaign" | Smartlead MCP: pause_campaign → custom: get_client_detail (for campaign_id lookup) | Agent looks up client, finds active campaign, pauses via Smartlead |
| "Show me all clients" | custom: get_all_clients_summary | Direct query |
| "What's client X's reply rate?" | custom: get_client_metrics | Direct query with period |
| "Add 200 leads to client Y" | custom: get_client_detail → (determine campaign) → leads imported via POST /v1/leads/import | May trigger enrichment |
| "Show me the journey for lead Z" | custom: get_lead_journey | Returns timeline array |
| "Any system alerts?" | custom: get_system_alerts | Returns recent alerts |
| "Rotate the degraded mailbox" | custom: get_mailbox_health → custom: trigger_mailbox_rotation | Identify RED, swap |
| "Generate a report for client X" | custom: generate_report | Triggers async generation |

---

## 4. Acceptance Criteria

### Functional Checks
- [ ] **Each of 13 tools returns data:** Call each tool individually with valid params → structured response with correct data
- [ ] **Error handling:** Call tool with invalid client_id → error message (not crash)
- [ ] **Action logging:** Every tool call creates an action_log entry with `initiated_by = 'agent'`
- [ ] **get_all_clients_summary:** Returns BenchworksAI internal client with correct aggregate metrics
- [ ] **get_lead_journey:** Returns chronological event array for a lead with ≥3 action_log entries
- [ ] **update_lead_stage:** Changes stage, logs change, returns new stage
- [ ] **trigger_mailbox_rotation:** Rotates a mailbox or returns depletion warning
- [ ] **Dual MCP composition:** Claude agent can call Smartlead MCP + custom MCP tools in a single conversation
- [ ] **Command patterns:** At least 3 documented command patterns work correctly end-to-end

---

## 5. Constraints

### Hard Constraints
- Reuse existing service functions from Phases 02-03. Do NOT duplicate business logic in MCP tool handlers.
- Every tool call MUST log to action_log with `initiated_by = 'agent'`.
- The MCP server MUST be accessible at a URL Claude can connect to (document the URL in the completion report).
- Do NOT build dashboard components — Phase 05 will build the CommandBar that calls these tools.

### Soft Constraints
- Keep tool descriptions clear and concise — Claude uses them to decide which tool to call.
- Return data in shapes consistent with the REST API (same response models where possible).

---

## 6. Completion Protocol

Provide: Files Created, Acceptance Criteria (PASS/FAIL), MCP server connection URL, Decisions Made (especially: MCP SDK version, protocol details), Warnings for Phase 05 (how the CommandBar should connect to the agent).

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 25`

### Task Planning
1. Read spec Section 3.3 completely
2. Set up MCP protocol handler (Task 1)
3. Implement tools in dependency order: read-only tools first (get_*), then write tools (update_*, trigger_*)
4. Test each tool individually
5. Test dual MCP composition
6. Document command patterns

### Resumption Protocol
Check `backend/app/mcp/` for existing tool implementations. Resume from first incomplete tool.
