# Phase 02a: Webhook Handlers + Smartlead Integration
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 01 complete  
**Implements:** F-003 (webhook ingress), F-008, F-023, F-024  
**Recommended:** `claude --max-turns 20`  
**Parallel:** Can run simultaneously with Phase 02b (no shared dependencies beyond Phase 01)

---

## 1. Context

You are executing **Phase 02a: Webhook Handlers + Smartlead Integration** of the BenchworksAI Outbound Engine build.

**Your scope:** All inbound webhook handlers (Smartlead reply/bounce, Cal.com booking/cancellation), the shared webhook security middleware, suppression list management, and CAN-SPAM template validation. You are NOT implementing the Claude classification/scoring logic (Phase 02b), n8n workflows (Phase 03), MCP tools (Phase 04), or dashboard (Phase 05).

**Tech Stack:** FastAPI, Supabase, Redis, Smartlead MCP/CLI  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Section 3.4 (Webhook Handlers) FIRST. Then Sections 2.2 (suppression_list, reply_events), 5.1 (Smartlead), 5.4 (Cal.com).

### What Already Exists
- Phase 00: Docker Compose, project scaffolding, FastAPI skeleton, Redis with auth
- Phase 01: All database tables with RLS, auth middleware (JWT + service key), rate limiting, structured logging with request_id, Smartlead CLI verified, GET /v1/clients endpoint

### What You're Building
The system's inbound event processing layer. After this phase, Smartlead reply/bounce webhooks and Cal.com booking/cancellation webhooks are received, verified, deduplicated, and processed. The suppression list blocks re-contacting opted-out prospects. CAN-SPAM compliance is enforced on templates. Webhook handlers write to Supabase and trigger downstream actions — but the AI classification that processes replies is built separately in Phase 02b.

---

## 2. Objective & Deliverables

### Objective
After this phase, external webhooks from Smartlead and Cal.com are securely received, verified via HMAC signature, deduplicated, and processed into the correct database state. Unsubscribe events sync to both local suppression and Smartlead's campaign removal. Template compliance is enforced.

### Deliverables

1. **Shared webhook security middleware** — HMAC-SHA256 verification, timestamp validation (±5min), event_id dedup via Redis SETNX — Spec Section 3.4
2. **POST /v1/webhooks/smartlead/reply** — Receive reply, validate, match lead, write reply_event (classification deferred to Phase 02b) — Spec Section 3.4
3. **POST /v1/webhooks/smartlead/bounce** — Receive bounce, add to suppression, update lead stage — Spec Section 3.4
4. **POST /v1/webhooks/calcom/booking** — Match lead by email (with domain fallback), set booking_status, update stage, log — Spec Section 3.4
5. **POST /v1/webhooks/calcom/cancelled** — Set booking_status='cancelled' (no stage revert), schedule re-engagement — Spec Section 3.4
6. **GET/POST/DELETE /v1/suppression** — Suppression list CRUD — Spec Section 3.2
7. **Suppression check function** — Reusable function that checks suppression before any lead import — Spec Section 2.2
8. **CAN-SPAM template validation** — Validate + auto-append compliance footer — Spec Section 2.2 (sequence_templates)
9. **Unsubscribe → Smartlead sync** — Remove from all active Smartlead campaigns via CLI/MCP on unsubscribe — Spec Section 3.4

---

## 3. Implementation Instructions

### Task 1: Shared Webhook Security Middleware
**Spec Reference:** Section 3.4 (Shared Webhook Security)  
**Creates:** `backend/app/middleware/webhook_security.py`

Implement the `verify_webhook` dependency from spec Section 3.4:
1. Read raw request body
2. Extract signature from configurable header name (different for Smartlead vs Cal.com)
3. Extract timestamp header — reject if abs(now - timestamp) > 300 seconds
4. Compute HMAC-SHA256 of payload using secret from env var
5. `hmac.compare_digest` against provided signature — 401 on mismatch
6. Extract event_id from header — Redis SETNX with 3600s TTL for dedup. If key already exists, return None (already processed)
7. Parse and return JSON payload

The middleware must be reusable across all webhook endpoints with configurable secret env var and header names.

**Key implementation notes:**
- Use `request.body()` to get raw bytes for signature computation
- The JSON parse happens AFTER signature verification (don't trust unverified payload)
- Redis dedup uses the same authenticated Redis client from Phase 01

### Task 2: Smartlead Reply Webhook Handler
**Spec Reference:** Section 3.4 (Smartlead Reply Webhook)  
**Creates:** `backend/app/routes/webhooks.py` (or `webhook_smartlead.py`)

`POST /v1/webhooks/smartlead/reply`:
1. Call shared webhook verification with `SMARTLEAD_WEBHOOK_SECRET`
2. If dedup returns None → return 200 `{"received": true, "status": "duplicate"}`
3. Match `smartlead_lead_id` from payload → internal `lead_id` via Supabase query on `leads.smartlead_lead_id`
4. If no match → log warning + return 200 (don't fail on unknown leads)
5. Write to `reply_events` table:
   - `lead_id`, `client_id` (from lead), `campaign_id` (from lead)
   - `reply_body` from payload
   - `idempotency_key` = `{smartlead_lead_id}:{event_type}:{received_at}`
   - `classification` = null (Phase 02b fills this)
   - `confidence` = null
   - `needs_review` = true (until classified)
   - `processed_at` = now()
6. Update `leads.stage` to `'replied'` if current stage is earlier in pipeline
7. Write `action_log` entry: `action_type = 'reply_received'`
8. Return 200 `{"received": true}`

**Note:** The actual Claude classification is NOT called here — that's Phase 02b. This handler captures the raw reply. Phase 03's n8n workflow will orchestrate the full classify → route flow by calling the Phase 02b classification function after the reply is stored.

### Task 3: Smartlead Bounce Webhook Handler
**Spec Reference:** Section 3.4  
**Creates:** Add to webhooks routes

`POST /v1/webhooks/smartlead/bounce`:
1. Verify webhook (same middleware)
2. Extract bounced email from payload
3. Add to `suppression_list`: email (lowercased, trimmed), reason='bounce', source_client_id + source_campaign_id from matched lead
4. Update lead stage to 'suppressed'
5. Log `action_type = 'suppression_added'` + `action_type = 'email_bounced'`
6. Return 200

### Task 4: Cal.com Booking Webhook Handler
**Spec Reference:** Section 3.4 (Cal.com Booking — Updated SYN-024)  
**Creates:** Add to webhooks routes

`POST /v1/webhooks/calcom/booking`:
1. Verify webhook with `CALCOM_WEBHOOK_SECRET`
2. Extract booker email from Cal.com payload
3. Match to lead:
   - First: exact email match in `leads` table
   - Fallback: match by domain (extract domain from email, match against `leads.domain`)
   - If no match: create a new lead record with `source = 'unmapped_booking'`, flag in action_log for operator review
4. Set `leads.booking_status = 'booked'`
5. Update `leads.stage = 'call_booked'` ONLY IF current stage is earlier in pipeline (don't downgrade a lead that's already at proposal_sent)
6. Write action_log: `action_type = 'booking_created'` with Cal.com event details
7. Return 200

**Note:** Pre-call brief generation (Claude) and Slack notification are triggered by Phase 03 n8n workflow that watches for booking events, NOT directly by this handler.

### Task 5: Cal.com Cancellation Webhook Handler
**Spec Reference:** Section 3.4 (Updated SYN-024)  
**Creates:** Add to webhooks routes

`POST /v1/webhooks/calcom/cancelled`:
1. Verify webhook
2. Match lead by booker email
3. Set `leads.booking_status = 'cancelled'` — **DO NOT revert pipeline stage**
4. Schedule one-off re-engagement email: store a Redis key `reengagement:{lead_id}` with 24h TTL containing the lead_id and campaign context. Phase 03 n8n cron picks these up.
5. Write action_log: `action_type = 'booking_cancelled'`
6. Return 200

### Task 6: Suppression List Endpoints
**Spec Reference:** Section 3.2 (Suppression)  
**Creates:** `backend/app/routes/suppression.py`

Three endpoints:

`GET /v1/suppression` — List suppressed emails (paginated, searchable by email). Auth: operator JWT.

`POST /v1/suppression` — Add email to suppression. Request body: `{email, reason, source_client_id?, source_campaign_id?}`. Normalize email (lowercase, trim). Auth: operator JWT or service key.

`DELETE /v1/suppression/{email}` — Remove from suppression. **Operator JWT only** (not service key). Logs `action_type = 'suppression_removed'` to action_log for audit.

### Task 7: Suppression Check Function
**Spec Reference:** Section 2.2 (suppression_list — Critical Logic)  
**Creates:** `backend/app/services/suppression.py`

Reusable async function: `check_suppression(email: str) -> bool`
- Query `suppression_list` where `email = lower(trim(email))`
- Returns True if suppressed
- This function is called by every lead import path (Phase 03 enrichment pipeline, POST /v1/leads/import)
- Must be fast — uses the `idx_suppression_email` index

### Task 8: CAN-SPAM Template Validation
**Spec Reference:** Section 2.2 (sequence_templates)  
**Creates:** `backend/app/services/compliance.py`

Function: `validate_template(body: str, client_physical_address: str) -> tuple[bool, str, str|None]`
Returns: (is_valid, validated_body, compliance_footer_or_none)

Logic:
1. Check if body contains a physical address string (look for the client's `physical_address` from the clients table)
2. Check if body contains an unsubscribe mechanism (text like "reply STOP", "unsubscribe", or a URL pattern)
3. If either is missing: auto-append a compliance footer:
   ```
   ---
   {client_physical_address}
   Reply STOP to unsubscribe.
   ```
4. Set `compliance_validated = true` on the template record
5. Store the appended footer in `compliance_footer` column (separate from body for auditability)

This runs at template creation time (POST /v1/campaigns/launch calls it when generating sequences).

### Task 9: Unsubscribe → Smartlead Sync
**Spec Reference:** Section 3.4 (SYN-018)  
**Creates:** `backend/app/services/smartlead_sync.py`

When a reply is classified as `unsubscribe` (this happens in Phase 02b/03), the system must:
1. Add to local `suppression_list` (Task 6)
2. Call Smartlead CLI or MCP to remove the email from ALL active campaigns

Build the function now: `remove_from_smartlead(email: str)`:
- Use Smartlead CLI: `smartlead leads remove --email {email}` (verify exact CLI command)
- Or use Smartlead MCP tool if available
- If Smartlead call fails: log error, do NOT block suppression — local suppression is the priority
- Log `action_type = 'suppression_smartlead_sync'`

This function will be called by the classification routing logic in Phase 03.

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] FastAPI starts with all new routes registered (no import errors)
- [ ] All new Pydantic models validate correctly

### Functional Checks
- [ ] **Valid webhook:** POST /v1/webhooks/smartlead/reply with correct HMAC → 200, reply_event created in DB
- [ ] **Bad signature:** Same endpoint with wrong HMAC → 401
- [ ] **Duplicate event:** Same event_id sent twice → first returns 200 with processing, second returns 200 with "duplicate"
- [ ] **Expired timestamp:** Webhook with timestamp >5min old → 401
- [ ] **Bounce → suppression:** POST /v1/webhooks/smartlead/bounce → email added to suppression_list, lead stage = 'suppressed'
- [ ] **Booking:** POST /v1/webhooks/calcom/booking with matching email → booking_status = 'booked', stage = 'call_booked'
- [ ] **Booking (no match):** Booking with unknown email → new lead created with source = 'unmapped_booking'
- [ ] **Cancellation:** POST /v1/webhooks/calcom/cancelled → booking_status = 'cancelled', stage NOT reverted
- [ ] **Suppression block:** Call `check_suppression` for suppressed email → returns True
- [ ] **Suppression CRUD:** POST adds, GET lists, DELETE removes (operator only)
- [ ] **CAN-SPAM validation:** Template without address → auto-appended, compliance_validated = true
- [ ] **Template with compliance:** Template with address + opt-out → no modification, compliance_validated = true

---

## 5. Constraints

### Hard Constraints
- ALL webhook endpoints MUST use the shared HMAC verification middleware. No exceptions.
- Email normalization (lowercase + trim) MUST happen before any DB write or lookup.
- Cal.com cancellation MUST NOT revert pipeline stage (SYN-024 CRITICAL fix).
- Suppression list is global (cross-client). DELETE requires operator JWT only.
- Do NOT implement Claude classification — that's Phase 02b.
- Do NOT implement n8n workflows — that's Phase 03.

### Soft Constraints
- Follow the FastAPI patterns established in Phase 01 (dependency injection, error format, logging).
- Use Supabase client patterns from Phase 01.

---

## 6. Completion Protocol

Provide structured report: Files Created/Modified, Acceptance Criteria (all PASS/FAIL), Spec Ambiguities, Decisions Made, Warnings for Next Phase.

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 20`

### Task Planning
1. Read spec Sections 3.4, 2.2 (suppression, reply_events), 5.1, 5.4
2. Build shared webhook middleware first (Task 1) — everything depends on it
3. Implement webhook handlers (Tasks 2-5)
4. Build suppression endpoints and check function (Tasks 6-7)
5. Build compliance validation (Task 8)
6. Build Smartlead sync function (Task 9)
7. Run acceptance criteria

### Resumption Protocol
Check for existing webhook routes, suppression endpoints, middleware files. Resume from first incomplete task.
