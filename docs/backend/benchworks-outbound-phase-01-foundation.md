# Phase 01: Schema + Auth + Infrastructure Foundation
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 00 complete  
**Implements:** F-010, F-015, F-016, F-020, F-021, F-025  
**Recommended:** `claude --max-turns 30`

---

## 1. Context

You are executing **Phase 01: Schema + Auth + Infrastructure Foundation** of the BenchworksAI Outbound Engine build.

**Your scope is strictly this phase.** You are building the database schema, authentication system, core middleware, and infrastructure hardening. You are NOT implementing webhook handlers, AI pipelines, n8n workflows, MCP tools, or the dashboard — those are later phases.

**Tech Stack:** Next.js 14+, FastAPI, Supabase Cloud (PostgreSQL 15+ with RLS), Redis 7+, Caddy, Docker Compose  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Sections 2 (Database), 3.1 (API Conventions), 7 (Security), and 8.2 (Logging) FIRST.

### What Already Exists
Phase 00 created:
- Docker Compose with 6 services (Caddy, Next.js, FastAPI, n8n, Cal.com, Redis)
- FastAPI skeleton with health endpoint and structured logging
- Next.js skeleton with App Router
- Redis with auth + persistence
- Caddy with HTTPS + X-Request-ID
- .env.example with all variable placeholders
- Makefile

### What You're Building
The complete data foundation and security layer. After this phase: all database tables exist with RLS policies, the operator can log in via Google OAuth, every API request is authenticated and rate-limited, and the Smartlead CLI is verified working. This is the bedrock every subsequent phase builds on.

---

## 2. Objective & Deliverables

### Objective
After this phase, the operator can log in to the dashboard via Google, all database tables are deployed with row-level security enforcing client isolation, API endpoints are protected by JWT middleware, and infrastructure services (Smartlead CLI, Redis, Supabase) are verified operational.

### Deliverables

1. **Supabase migrations** — All 10 tables + sessions table + indexes + constraints + triggers — Spec Section 2.2
2. **RLS policies** — Client-scoped isolation on all multi-tenant tables, append-only on action_log — Spec Section 2.2
3. **Materialized view** — `client_summary_mv` with pg_cron refresh — Spec Section 2.2
4. **Seed data** — BenchworksAI internal client + system_config values — Spec Section 2.4
5. **updated_at triggers** — Auto-update function on all relevant tables — Spec Section 2.3
6. **NextAuth config** — Google OAuth, signed HS256 JWT (NOT JWE), 8hr maxAge, database sessions — Spec Section 7.1
7. **FastAPI JWT middleware** — Verify HS256 signature, check sessions table, extract role — Spec Section 7.1
8. **Service key middleware** — Restricted n8n role with scoped endpoint access — Spec Section 7.2
9. **Rate limiting** — slowapi on all FastAPI endpoints, Redis-backed, X-Forwarded-For trust — Spec Section 3.1
10. **POST /v1/auth/logout** — Session invalidation endpoint — Spec Section 3.2
11. **GET /v1/clients** — Read from client_summary_mv (stub endpoint for Phase 05 dashboard) — Spec Section 3.2
12. **Smartlead CLI verification** — Install @smartlead/cli, verify connectivity — Spec Section 5.1
13. **Structured logging** — request_id propagation on every FastAPI request — Spec Section 8.2

---

## 3. Implementation Instructions

### Task 1: Supabase Schema Migrations
**Spec Reference:** Section 2.1, 2.2, 2.3  
**Creates:** `supabase/migrations/` SQL files

Create migrations in execution order. Use Supabase CLI migration format.

**Migration 001 — Core Tables:**
Create tables in this order (respects FK dependencies):
1. `system_config`
2. `clients`
3. `campaigns` (FK → clients)
4. `mailbox_pool` (FK → clients)
5. `leads` (FK → clients, campaigns)
6. `reply_events` (FK → leads, clients, campaigns)
7. `sequence_templates` (FK → campaigns, clients)
8. `suppression_list` (FK → clients, campaigns — ON DELETE SET NULL for campaign)
9. `action_log` (FK → clients, leads, campaigns — all nullable)
10. `action_log_archive` (identical schema, no FKs — archive target)
11. `client_reports` (FK → clients)
12. `sessions`

**CRITICAL column details from spec v2:**
- `leads.email` is **NULLABLE** (SYN-006). Add partial unique index: `UNIQUE (email, campaign_id) WHERE email IS NOT NULL`
- `leads.booking_status` — text, nullable, values: null/'booked'/'cancelled'
- `leads.enrichment_attempts` — integer DEFAULT 0
- `leads.last_enrichment_attempt` — timestamptz, nullable
- `campaigns.provision_stage` — text, nullable
- `reply_events.campaign_id` — uuid FK → campaigns(id)
- `reply_events.idempotency_key` — text UNIQUE
- `reply_events.needs_review` — boolean DEFAULT false
- `action_log.request_id` — text, nullable
- All `client_id` FKs use `ON DELETE CASCADE`
- `suppression_list.source_campaign_id` uses `ON DELETE SET NULL`
- `client_reports.report_period_start` and `report_period_end` are `timestamptz` (not date)

Create ALL indexes listed in spec Section 2.2 for each table.

**Migration 002 — updated_at Trigger:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
```
Apply to: clients, campaigns, leads.

**Migration 003 — RLS Policies:**
Enable RLS on: clients, campaigns, leads, reply_events, mailbox_pool, sequence_templates, suppression_list, action_log, client_reports.

For client-scoped tables (clients, campaigns, leads, reply_events, mailbox_pool, sequence_templates, client_reports):
- Service role: full access (uses service key to bypass RLS)
- Operator role (authenticated): full SELECT, INSERT, UPDATE. No DELETE on clients (soft delete via status).

**CRITICAL — action_log RLS (F-021):**
- ALL roles including service: SELECT + INSERT only. **NO UPDATE, NO DELETE.**
- Only superadmin (direct DB, not through application) can modify.
- Test this explicitly.

For suppression_list: all roles can SELECT (cross-client by design). Service role: INSERT, DELETE.

**Migration 004 — Materialized View:**
Create `client_summary_mv` per spec Section 2.2. Set up pg_cron to refresh every 5 minutes: `SELECT cron.schedule('refresh_client_summary', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY client_summary_mv');`

Note: pg_cron must be enabled in Supabase project settings.

**Migration 005 — Seed Data:**
Insert BenchworksAI internal client and system_config values per spec Section 2.4. Do NOT include `icp_score_threshold_nurture` (removed in v2).

### Task 2: NextAuth Google OAuth
**Spec Reference:** Section 7.1  
**Creates:** `frontend/app/api/auth/[...nextauth]/route.ts`, NextAuth config

Configure NextAuth with:
- Google provider (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET from env)
- **JWT strategy with signed HS256** (NOT the default JWE encryption):
  ```typescript
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 8 * 60 * 60, // 8 hours
    encode: async ({ secret, token }) => {
      // Sign with HS256, NOT encrypt with JWE
      return jwt.sign(token, secret, { algorithm: 'HS256' });
    },
    decode: async ({ secret, token }) => {
      return jwt.verify(token, secret, { algorithms: ['HS256'] });
    }
  }
  ```
- Session callback: include `role: "operator"` and `jti: uuid` in JWT claims
- Sign-in callback: create/update session record in Supabase `sessions` table
- Cookie: HTTP-only, Secure, SameSite=Strict

### Task 3: FastAPI JWT Middleware
**Spec Reference:** Section 7.1, 7.2  
**Creates:** `backend/app/middleware/auth.py`, `backend/app/dependencies/auth.py`

JWT verification flow:
1. Extract token from `Authorization: Bearer {token}` header
2. Verify HS256 signature using `NEXTAUTH_SECRET`
3. Check `sessions` table: `is_valid = true AND expires_at > now()` for the JWT's `jti`
4. If invalid → 401
5. Extract `role` claim and return user context

Create dependency functions:
- `require_auth()` — any authenticated user
- `require_operator()` — role == "operator"
- `require_service_or_operator()` — either JWT with operator role OR valid service key

### Task 4: Service Key Auth (Restricted n8n Role)
**Spec Reference:** Section 7.2  
**Creates:** `backend/app/middleware/service_auth.py`

n8n calls FastAPI with `X-Service-Key: {SERVICE_KEY_N8N}` header.

**Restricted scope (SYN-009):** The service key can only access:
- POST /v1/leads/import
- GET /v1/campaigns
- POST /v1/webhooks/*
- GET /v1/reports/*/metrics
- POST /v1/reports/*/generate
- GET /v1/health

Reject with 403 on any other endpoint.

### Task 5: Rate Limiting
**Spec Reference:** Section 3.1, 8.4 (Redis failure mode)  
**Creates:** `backend/app/middleware/rate_limit.py`

Configure `slowapi`:
- 100 req/min per authenticated operator (keyed by JWT sub)
- 30 req/min per service key
- Read real client IP from `X-Forwarded-For` header (Caddy/BFF proxy sets this)
- **Redis failure mode:** If Redis unavailable, fail open (allow requests). Log warning.
- Return 429 with `Retry-After` header on limit exceed

### Task 6: Logout Endpoint
**Spec Reference:** Section 3.2, 7.1  
**Creates:** Add to FastAPI routes

`POST /v1/auth/logout`:
- Requires operator JWT
- Sets `sessions.is_valid = false` for current session's `jti`
- Returns 200 `{"status": "logged_out"}`
- Logs to action_log: `action_type = 'operator_command'`, `action_detail = {"command": "logout"}`

### Task 7: Client List Endpoint (Stub for Dashboard)
**Spec Reference:** Section 3.2  
**Creates:** Add to FastAPI routes

`GET /v1/clients`:
- Requires operator auth
- Reads from `client_summary_mv` materialized view
- Returns response matching spec Section 3.2 schema
- This endpoint is the first real API endpoint — establish patterns (error handling, response formatting, Supabase client usage) that all subsequent phases follow.

### Task 8: Smartlead CLI Verification
**Spec Reference:** Section 5.1  
**Creates:** Verification script or manual check

Install `@smartlead/cli` globally in the FastAPI container (or on host if preferred). Verify: `smartlead campaigns list --apiKey=$SMARTLEAD_API_KEY` returns data. Document the working command in the Makefile.

### Task 9: Structured Logging with Request ID
**Spec Reference:** Section 8.2  
**Creates:** Logging middleware update

Ensure every FastAPI request:
1. Extracts `X-Request-ID` from Caddy header
2. Includes `request_id` in all structlog context
3. Passes `request_id` to any Supabase writes (action_log entries)

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] All migrations apply cleanly: `supabase db push` (or equivalent) succeeds
- [ ] FastAPI starts without errors: `docker compose up fastapi` shows no traceback
- [ ] Next.js builds and starts: `docker compose up nextjs` serves pages

### Functional Checks
- [ ] **RLS isolation:** Insert test data for Client A and Client B. Query as Client A context → zero Client B rows. Repeat for: campaigns, leads, reply_events, action_log.
- [ ] **Append-only action_log:** `UPDATE action_log SET action_type = 'test'` returns permission denied. `DELETE FROM action_log` returns permission denied. `INSERT INTO action_log (...)` succeeds.
- [ ] **Google OAuth login:** Navigate to dashboard → redirect to Google → approve → redirect back with session → JWT in cookie
- [ ] **JWT verification:** Call `GET /v1/clients` with valid JWT → 200. Call without JWT → 401. Call with expired/invalid JWT → 401.
- [ ] **Session invalidation:** Call `POST /v1/auth/logout` → subsequent requests with same JWT → 401.
- [ ] **Service key auth:** Call `GET /v1/health` with n8n service key → 200. Call `PATCH /v1/campaigns/xxx/status` with service key → 403.
- [ ] **Rate limiting:** Send 101 requests in 1 minute → 101st returns 429. Verify `Retry-After` header present.
- [ ] **Smartlead CLI:** `smartlead campaigns list` returns data (or empty array if no campaigns).
- [ ] **client_summary_mv:** `GET /v1/clients` returns BenchworksAI internal client from seed data with correct aggregate fields.
- [ ] **Request ID:** Every FastAPI log entry includes `request_id` field matching X-Request-ID header.

---

## 5. Constraints

### Hard Constraints
- Database schema MUST match spec Section 2.2 exactly — column names, types, constraints, defaults.
- JWT MUST use HS256 signing, NOT JWE encryption. FastAPI must be able to verify with python-jose.
- action_log MUST be append-only — no UPDATE/DELETE via RLS for any application role.
- Service key for n8n MUST be restricted to the listed endpoints only.
- Do NOT implement webhook handlers, AI pipelines, n8n workflows, MCP tools, or dashboard pages.

### Soft Constraints
- Establish clean code patterns (Supabase client usage, dependency injection, error handling, response formatting) that later phases will follow.
- If the materialized view syntax needs adjustment for Supabase compatibility, adapt it but keep the same output schema.
- Mark any spec ambiguity with `// SPEC-AMBIGUITY:` comments.

---

## 6. Completion Protocol

Provide structured completion report:
- Files Created / Modified (tables)
- Acceptance Criteria Results (all PASS/FAIL with evidence)
- Spec Ambiguities encountered
- Decisions Made
- Warnings for Next Phase (especially: patterns established that later phases should follow)

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 30`
This phase has many deliverables. If you hit the turn limit, the human will `--continue`.

### Task Planning
1. Read spec Sections 2, 3.1, 7, 8.2
2. Survey existing code from Phase 00
3. Create all migrations (Task 1) — biggest task, do first
4. Implement auth (Tasks 2-4)
5. Add middleware (Tasks 5-6)
6. Build first API endpoint (Task 7) — establishes patterns
7. Verify infrastructure (Tasks 8-9)
8. Run all acceptance criteria

### Resumption Protocol
If this is a `--continue` run:
1. Check `supabase/migrations/` — which migrations exist?
2. Check `backend/app/middleware/` — which middleware is implemented?
3. Check if auth endpoints exist
4. Resume from first incomplete task
