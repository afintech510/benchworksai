# Phase 03: n8n Orchestration Workflows
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 02a + Phase 02b both complete  
**Implements:** F-001, F-002, F-004, F-005, F-007, F-017, F-019  
**Recommended:** `claude --max-turns 35`

---

## 1. Context

You are executing **Phase 03: n8n Orchestration Workflows** of the BenchworksAI Outbound Engine build.

**Your scope:** All n8n workflows and cron jobs that orchestrate the outbound engine. Campaign launch, lead enrichment, reply classification routing, deliverability monitoring, weekly reporting, internal prospecting, and system health monitoring. You are also wiring the Phase 02a webhook handlers to the Phase 02b AI functions — this phase is where they connect.

**You are NOT building:** MCP tools (Phase 04), dashboard (Phase 05), or test suite (Phase 06).

**Tech Stack:** n8n (self-hosted, Postgres-backed), FastAPI, Smartlead CLI, Apollo API, Claude API (via Phase 02b functions), Supabase, Redis, Resend, Slack webhooks  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Sections 3.2 (campaign launch), 3.4 (webhook routing), 5.1 (Smartlead), 5.2 (Apollo), 5.3 (Claude), 5.6 (Resend), 8.3 (Monitoring), 8.4 (Circuit Breaker).

### What Already Exists
- Phase 01: Database, auth, rate limiting, Smartlead CLI, structured logging
- Phase 02a: Webhook handlers (reply, bounce, booking, cancellation), suppression endpoints, CAN-SPAM validation, Smartlead sync function
- Phase 02b: AI functions (classify_reply, score_lead, generate_sequence, generate_report_narrative, generate_precall_brief), circuit breakers, Pydantic models

### What You're Building
The orchestration brain. n8n workflows that tie everything together: onboarding payloads trigger campaign creation → enrichment → scoring → import. Reply webhooks trigger classification → routing → notifications. Crons monitor health, generate reports, and run the internal prospecting engine. After this phase, the system runs autonomously.

---

## 2. Objective & Deliverables

### Objective
After this phase, the operator can submit a client onboarding payload and have a fully provisioned campaign running with enriched, scored leads. Replies are classified and routed automatically. Degraded mailboxes are detected and rotated. Weekly reports are generated and delivered. BenchworksAI's internal prospecting engine runs on schedule.

### Deliverables

1. **Campaign launch workflow** — Webhook trigger → staged provisioning (Smartlead campaign + mailboxes + sequence generation + enrichment) — Spec Section 3.2
2. **Lead enrichment workflow** — Raw leads → suppression check → Apollo enrichment → Claude scoring → qualified import to Smartlead — Spec Section 5.2, 5.3
3. **Reply classification + routing workflow** — FastAPI webhook stores reply → n8n processes: fetch thread → classify → route (interested/referral/question/unsubscribe/OOO/not_interested) — Spec Section 3.4
4. **Deliverability monitoring cron** — Every 6h: Smartlead CLI health → score GREEN/YELLOW/RED → rotate RED → warm pool guard → alert — Spec Section 5.1
5. **Weekly reporting cron** — Monday 8am ET: metrics aggregation → Claude narrative → Resend/Slack delivery — Spec Section 5.6
6. **Internal prospecting cron** — Weekly: Apollo search → enrich → score → import to vertical campaigns — Spec Section 5.2
7. **System health monitoring cron** — Every 15min: ping services → Slack alert on failure — Spec Section 8.3
8. **Cancellation re-engagement cron** — Check Redis for scheduled re-engagements → send one-off email — Spec Section 3.4
9. **FastAPI orchestration endpoints** — POST /v1/campaigns/launch, POST /v1/leads/import, POST /v1/reports/{client_id}/generate — Spec Section 3.2

---

## 3. Implementation Instructions

### Task 1: FastAPI Campaign Launch Endpoint
**Spec Reference:** Section 3.2 (POST /v1/campaigns/launch — Updated SYN-027)  
**Creates:** `backend/app/routes/campaigns.py`

This endpoint receives the onboarding payload and orchestrates staged provisioning. Each stage updates `campaigns.provision_stage`:

```
POST /v1/campaigns/launch
  → Create campaign record in Supabase (status='draft', provision_stage='provisioning')
  → Return 202 with campaign_id immediately
  → Trigger n8n campaign launch workflow via webhook (pass campaign_id)
```

The n8n workflow handles the async stages. The endpoint returns immediately so the operator isn't blocked.

Also create:
- `GET /v1/campaigns` — List campaigns with optional client_id filter
- `PATCH /v1/campaigns/{id}/status` — Pause/resume/complete (operator or agent)
- `PATCH /v1/campaigns/{id}/retry-provision` — Retry from failed provision_stage

### Task 2: FastAPI Lead Import Endpoint
**Spec Reference:** Section 3.2 (POST /v1/leads/import)  
**Creates:** `backend/app/routes/leads.py`

Receives raw leads, checks suppression, stores in Supabase, triggers enrichment:
1. Validate input (Pydantic model per spec)
2. For each lead: check `suppression_list` via Phase 02a's check function
3. Insert non-suppressed leads with upsert (ON CONFLICT per SYN-003)
4. If `auto_enrich = true`: trigger n8n enrichment workflow via webhook
5. Return 202 with batch_id, counts (received, suppressed, queued)

Also create:
- `GET /v1/leads` — List with filters (client_id, campaign_id, stage, min_score)
- `GET /v1/leads/{id}` — Full detail with journey (action_log query)
- `PATCH /v1/leads/{id}/stage` — Manual stage update (operator)

### Task 3: n8n Campaign Launch Workflow
**Creates:** n8n workflow (exported as JSON, documented)

Trigger: Webhook from FastAPI (POST with campaign_id)

Stages (update `campaigns.provision_stage` after each):
1. **provisioning → mailboxes_assigned:** Call Smartlead CLI/MCP to create campaign. Assign mailboxes from `mailbox_pool` (status='ready'). Update pool status to 'active'.
2. **mailboxes_assigned → sequence_generated:** Call Phase 02b `generate_sequence()` via FastAPI internal endpoint. Run CAN-SPAM validation (Phase 02a). Store in `sequence_templates`. Push to Smartlead.
3. **sequence_generated → enrichment_started:** Trigger enrichment workflow (Task 5) for this campaign's leads.
4. **enrichment_started → null (complete):** Set `campaigns.status = 'active'`, clear provision_stage.

**On failure at any stage:**
- Log error to action_log with `action_type = 'system_alert'`
- Campaign stays at failed provision_stage
- Fire Slack alert: "Campaign {name} failed at stage {provision_stage}: {error}"
- Do NOT proceed to next stage

**n8n Bash nodes use `$SMARTLEAD_API_KEY` from container env (SYN-029).** Do NOT hardcode keys in n8n expressions.

### Task 4: Reply Classification + Routing Workflow
**Creates:** n8n workflow

Trigger: n8n internal trigger (polled from Supabase) OR FastAPI calls n8n webhook after reply_event is stored.

**Design choice:** Phase 02a's webhook handler stores the raw reply in `reply_events` with `classification = null`. This workflow picks up unclassified replies and processes them.

Flow:
1. Query Supabase: `reply_events WHERE classification IS NULL` (batch of up to 10)
2. For each reply:
   a. Fetch full thread from Smartlead (CLI: `smartlead inbox get --leadId {smartlead_lead_id}`)
   b. Call Phase 02b `classify_reply()` function via FastAPI internal endpoint
   c. Update `reply_events`: classification, confidence, sentiment, key_intent, extracted_referral, suggested_action, needs_review, model_version
   d. Route by classification:

**INTERESTED (confidence ≥ 0.85):**
- Pause sequence in Smartlead (CLI: `smartlead leads pause --leadId {id}`)
- Update lead stage → 'interested'
- Notify client via Slack webhook (from `clients.notification_target`) or Resend email
- Log: `reply_classified` + `reply_routed`

**INTERESTED (confidence < 0.85):**
- Set `needs_review = true` (already set by classify function)
- Notify operator via Slack #benchworks-review
- Do NOT pause sequence yet — wait for operator review
- Log: `reply_classified`

**NOT_INTERESTED:**
- Update lead stage → 'lost'
- Remove from Smartlead sequence
- Log: `reply_classified` + `reply_routed`

**UNSUBSCRIBE:**
- Call Phase 02a suppression endpoint (POST /v1/suppression)
- Call Phase 02a Smartlead sync function (remove from all campaigns)
- Update lead stage → 'unsubscribed'
- Log: `reply_classified` + `suppression_added`

**OOO:**
- Update action_log with OOO tag
- Keep lead in sequence (Smartlead handles re-send timing)
- Log: `reply_classified`

**REFERRAL:**
- Extract referral contact from `extracted_referral`
- Check suppression for referral email
- If not suppressed: POST /v1/leads/import with source='referral', campaign_id=originating
- Notify operator via Slack with referral context
- Log: `reply_classified` + `reply_routed`

**QUESTION:**
- Set `needs_review = true`
- Notify operator via Slack #benchworks-review with reply body + suggested_action
- Log: `reply_classified`

### Task 5: Lead Enrichment Workflow
**Spec Reference:** Section 5.2 (Apollo — Updated SYN-034)  
**Creates:** n8n workflow

Trigger: Webhook from campaign launch (Task 3) or manual trigger from lead import.

Flow:
1. Query Supabase: `leads WHERE stage = 'new' AND campaign_id = {id}` with `FOR UPDATE SKIP LOCKED` (SYN-034 — prevents concurrent cron overlap)
2. Set matched leads to `stage = 'enriching'` immediately (lock)
3. For each lead (batch of 50, 1s delay between calls per spec Section 5.2):
   a. Call Apollo People Enrichment API (email finding + firmographics)
   b. If Apollo returns email: update `leads.email`, `leads.enrichment_data`, `leads.enriched_at`
   c. If Apollo fails to find email: increment `enrichment_attempts`. If attempts ≥ 3: set `stage = 'enrichment_failed'`
   d. Set `stage = 'enriched'`
   e. Log: `action_type = 'lead_enriched'`
4. For enriched leads with email: call Phase 02b `score_lead()` via FastAPI
   - Store `icp_score`, `icp_breakdown`, `icp_reasoning`
   - If score ≥ 70: set `stage = 'qualified'`
   - If score < 70: set `stage = 'enriched'` (stays, not imported)
   - Log: `action_type = 'lead_scored'`
5. For qualified leads: push to Smartlead campaign via CLI/MCP
   - Store `smartlead_lead_id`
   - Set `stage = 'contacted'`
   - Log: `action_type = 'lead_imported'`

**Circuit breaker:** Apollo calls go through the `apollo_circuit` breaker. If circuit opens: abort batch, log alert, retry on next cron cycle.

**Enrichment backlog alert (SYN-014):** If count of leads at `stage = 'new'` exceeds 50: fire Slack alert.

### Task 6: Deliverability Monitoring Cron
**Spec Reference:** Section 5.1 (Warm Pool — SYN-004)  
**Creates:** n8n cron workflow (every 6 hours)

Flow:
1. Fetch mailbox health via Smartlead CLI: `smartlead mailbox health` (or equivalent analytics command)
2. For each mailbox, score:
   - GREEN: bounce < 3%, spam < 0.1%, reply > 2%
   - YELLOW: bounce 3–5% OR spam 0.1–0.3% OR reply < 1%
   - RED: bounce > 5% OR spam > 0.3% OR reply < 0.5%
3. Update `mailbox_pool` in Supabase: health_score, bounce_rate, spam_rate, reply_rate, last_health_check
4. For YELLOW: reduce daily_send_limit by 50%, log warning
5. For RED:
   a. Remove from active campaign (Smartlead CLI)
   b. Set `mailbox_pool.status = 'degraded'`
   c. Query warm pool: `mailbox_pool WHERE status = 'ready'` — pick one
   d. **WARM POOL DEPLETION GUARD (SYN-004):** If warm pool count = 0 after assignment:
      - Pause the affected campaign
      - Log `action_type = 'system_alert'` severity CRITICAL
      - Fire Slack alert: "CRITICAL: Warm pool depleted"
      - Do NOT attempt further sends
   e. If replacement available: assign to campaign, set status 'active', enable warm-up on degraded mailbox
   f. Log: `action_type = 'mailbox_rotated'`

### Task 7: Weekly Reporting Cron
**Spec Reference:** Section 5.6 (Resend)  
**Creates:** n8n cron workflow (Monday 8am ET → 12:00 UTC)

Flow:
1. For each active client:
   a. Fetch Smartlead analytics via CLI (campaign stats for past 7 days)
   b. Query Supabase: leads by stage, reply_events by classification, bookings
   c. Aggregate metrics per spec Section 3.2 (GET /v1/reports metrics response shape)
   d. Call Phase 02b `generate_report_narrative()` with metrics
   e. Store report in `client_reports` table
   f. Deliver:
      - If `clients.notification_channel = 'email'`: send via Resend (HTML email with metrics + narrative)
      - If `clients.notification_channel = 'slack'`: send via Slack webhook (formatted blocks)
   g. Update `client_reports.delivered_at`
   h. Log: `action_type = 'report_generated'` + `action_type = 'report_delivered'`

Also create FastAPI endpoint: `POST /v1/reports/{client_id}/generate` — triggers report generation on demand.

### Task 8: Internal Prospecting Cron (F-007)
**Creates:** n8n cron workflow (weekly, e.g., Sunday night)

Flow:
1. For each vertical (construction, legal, property_management):
   a. Call Apollo People Search API with BenchworksAI ICP criteria (from seed data):
      - Titles: Owner, Operator, Managing Partner, Office Manager
      - Industries: per vertical
      - Geography: Long Island → Northeast (expand over time)
      - Company size: 5–50
   b. Store raw results in `leads` table (client_id = BenchworksAI internal client, source = 'apollo_search')
   c. Run through enrichment workflow (Task 5) — same pipeline as DFY clients
   d. Qualified leads import to vertical-specific Smartlead campaigns

### Task 9: System Health Monitoring Cron
**Spec Reference:** Section 8.3  
**Creates:** n8n cron workflow (every 15 minutes)

Ping each service and fire Slack alert on failure:
- FastAPI: GET /v1/health → check response
- Supabase: SELECT 1 from system_config → verify connection
- Redis: PING via n8n Redis node
- Cal.com: HTTP GET to booking page
- Smartlead: CLI `smartlead status` or API ping

If any service fails 3 consecutive checks: fire Slack alert to #benchworks-alerts with service name and error.

Log `action_type = 'health_check'` on each run (with pass/fail per service in action_detail).

### Task 10: Cancellation Re-engagement Cron
**Creates:** n8n cron workflow (every hour)

Check Redis for `reengagement:*` keys (set by Phase 02a cancellation handler with 24h TTL):
- If key exists and is >24h old (TTL expired = ready): it won't be there. Instead, use a Supabase flag or Redis sorted set with scheduled time.
- Alternative approach: query `leads WHERE booking_status = 'cancelled' AND updated_at < now() - interval '24 hours' AND NOT EXISTS (action_log WHERE lead_id = leads.id AND action_type = 'email_sent' AND action_detail->>'trigger' = 'cancellation_recovery')` 
- For each: send one-off email via Smartlead CLI single send
- Log: `action_type = 'email_sent'` with `action_detail = {trigger: 'cancellation_recovery'}`

---

## 4. Acceptance Criteria

### Functional Checks
- [ ] **Campaign launch E2E:** Submit onboarding payload → campaign created in Smartlead → mailboxes assigned → sequence generated → leads enriched and imported. provision_stage progresses correctly.
- [ ] **Partial failure:** Kill Smartlead API mid-launch → campaign freezes at correct provision_stage → Slack alert fires → retry-provision resumes from failed stage
- [ ] **Enrichment locking:** Trigger two enrichment runs concurrently → no duplicate processing (FOR UPDATE SKIP LOCKED works)
- [ ] **Enrichment backlog:** Create 51 leads at stage='new' → Slack alert fires
- [ ] **Reply classification:** Store unclassified reply → workflow picks it up → classification written → routing executed correctly for at least: interested, unsubscribe, referral
- [ ] **Unsubscribe sync:** Unsubscribe reply → suppression_list entry + Smartlead removal
- [ ] **Referral creation:** Referral reply → new lead created with source='referral'
- [ ] **Deliverability RED:** Simulate RED mailbox data → removed from campaign → replacement assigned → or warm pool depleted → campaign paused + CRITICAL alert
- [ ] **Weekly report:** Trigger report generation → metrics accurate → narrative generated → delivered via configured channel
- [ ] **Health check:** Stop FastAPI → health cron detects within 15min → Slack alert fires
- [ ] **All Smartlead CLI commands use $SMARTLEAD_API_KEY from container env**

---

## 5. Constraints

### Hard Constraints
- n8n Bash nodes MUST use `$SMARTLEAD_API_KEY` from container environment. NEVER hardcode keys in n8n expressions or workflow JSON.
- Campaign launch MUST use staged provisioning with provision_stage tracking. Do NOT do everything in one synchronous call.
- Enrichment MUST use FOR UPDATE SKIP LOCKED or enriching stage to prevent concurrent overlap.
- Warm pool depletion MUST pause the campaign and fire CRITICAL alert. Do NOT attempt sends with 0 warm mailboxes.
- Do NOT build MCP tools, dashboard, or test suite.

### Soft Constraints
- Follow n8n best practices: error handling nodes on every workflow, retry on transient failures.
- Use n8n's built-in Supabase nodes where available; fall back to HTTP Request nodes with service key auth.
- Keep workflows modular — one workflow per concern, linked via webhooks where needed.

---

## 6. Completion Protocol

Provide: Files Created (FastAPI endpoints + n8n workflow descriptions), Acceptance Criteria (PASS/FAIL), n8n workflow export locations, Decisions Made, Warnings for Phase 04.

**n8n workflow documentation:** For each workflow, document: trigger type, node sequence, env vars used, error handling, and how to import into n8n.

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 35`
This is the largest phase. Multiple workflows + FastAPI endpoints.

### Task Planning
1. Read spec Sections 3.2, 3.4, 5.1, 5.2, 5.3, 5.6, 8.3, 8.4
2. Build FastAPI endpoints first (Tasks 1-2) — n8n workflows call these
3. Build n8n workflows in dependency order: enrichment (5) → launch (3) → classification routing (4)
4. Build crons: deliverability (6) → reporting (7) → prospecting (8) → health (9) → re-engagement (10)
5. Test E2E flows

### Resumption Protocol
Check: backend/app/routes/ for new endpoints. Check n8n UI for existing workflows. Resume from first incomplete deliverable.
