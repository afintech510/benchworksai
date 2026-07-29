# Phase 01: Schema, RLS & Auth Foundation
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 00 complete
**Implements:** Infrastructure foundation — all database objects, auth, validation, health check
**Recommended:** `claude --max-turns 50`

---

## 1. Context

You are executing **Phase 01: Schema, RLS & Auth Foundation** of the Larkin Tech build.

**Your scope is strictly this phase.** Do not implement UI components, service pages, demo features, or lead nurture logic. This phase creates the complete database schema, Row-Level Security policies, JWT session management, rate limiting module, prompt injection guard, admin authentication, Zod validation schemas, and the expanded health check.

**Tech Stack:** Next.js 14+ / TypeScript / Supabase (PostgreSQL 15) / Zod / jose (JWT)
**Working Directory:** `larkintech/` (created in Phase 00)
**Spec Files:**
- `larkintech-spec-v2.md` — Sections 2 (Database), 3.1 (API Conventions), 7 (Security), 8 (Error Handling)
- `larkintech-spec-v2-addendum.md` — Part 1 Section 1 (lead_scores), Part 1 Section 2 (drip tables)

**READ THE SPEC FILES FIRST.** They are the source of truth for all table definitions, column types, constraints, indexes, and RLS policies.

### What Already Exists (Phase 00 output)
- Next.js 14 project with TypeScript, Tailwind, App Router (`output: 'standalone'`)
- Full directory structure matching spec Section 4.1
- Docker Compose with blue-green deployment (app-blue, app-green, nginx-proxy)
- GitHub Actions CI/CD workflow
- `.env.example` with all required variables
- `lib/utils/env-validation.ts` — startup env validation
- `app/api/health/route.ts` — basic health check (to be expanded)
- Supabase CLI initialized (`supabase/config.toml`)
- Dependencies installed: `@supabase/supabase-js`, `jose`, `zod`, `pino`, `@react-pdf/renderer`, `react-hook-form`

### What You're Building
The complete data layer and security foundation. After this phase, all 19 database tables exist with enforced constraints and RLS, JWT sessions can be created and verified (with revocation), rate limiting works atomically, the prompt injection guard is functional, admin endpoints are secured, and the multi-dependency health check is operational.

---

## 2. Objective & Deliverables

### Objective
After this phase, the data model supports all 45+ features, JWT-based demo sessions work with revocation, rate limiting is atomic and race-condition-proof, admin endpoints are hardened, and RLS prevents any unauthorized data access via the anon key.

### Deliverables

1. **Supabase migration** — All 19 tables per spec Section 2.2 + addendum — `supabase/migrations/20260327000000_initial_schema.sql`
2. **RLS policies** — ENABLE on all tables, DENY ALL anon default, public read for demo_types/verticals — Spec Section 2.5
3. **PostgreSQL triggers** — `update_timestamp()`, `update_session_counts()` — Spec Section 2.2
4. **Seed data** — `supabase/seed.sql` — Spec Section 2.4 + addendum
5. **Supabase clients** — `lib/supabase/server.ts`, `lib/supabase/client.ts` — Spec Section 4.1
6. **Generated types** — `lib/supabase/types.ts`
7. **Zod schemas** — `lib/validation/schemas.ts` for all API inputs — Spec Section 7.4
8. **JWT session module** — `lib/demo-engine/session.ts` — Spec Section 7.1
9. **Atomic rate limiter** — `lib/demo-engine/rate-limiter.ts` — Spec Section 2.2
10. **Prompt injection guard** — `lib/ai/prompt-guard.ts` — Spec Section 7.4
11. **Admin auth middleware** — `lib/utils/admin-auth.ts` — Spec Section 7.2
12. **CSRF middleware** — `middleware.ts` — Spec Section 3.1
13. **Health check (expanded)** — `app/api/health/route.ts` — Spec Section 3.2
14. **Error helpers** — `lib/utils/errors.ts` — Spec Section 3.1, 8.1
15. **Pino logger** — `lib/utils/logger.ts` — Spec Section 8.2

---

## 3. Implementation Instructions

### Task 1: Supabase Migration — All 19 Tables
**Spec Reference:** Section 2.2 + addendum Part 1
**Creates:** `supabase/migrations/20260327000000_initial_schema.sql`

Create a single migration with ALL tables. Read spec Section 2.2 for exact column definitions. Tables in dependency order:

1. `site_config`, `demo_types`, `verticals` (no FKs)
2. `vertical_content` (FK → verticals)
3. `demo_leads` (standalone)
4. `inquiries` (FK → demo_leads)
5. `demo_sessions` (FK → demo_leads, demo_types, verticals)
6. `demo_interactions` (FK → demo_sessions)
7. `demo_cached_responses` (FK → demo_types, verticals)
8. `rate_limits` (standalone)
9. `lead_magnet_downloads` (FK → demo_leads)
10. `competitive_analyses` (FK → demo_sessions)
11. `api_usage_log` (standalone)
12. `vertical_disclaimer_acknowledgments` (FK → demo_leads, verticals)
13. `notification_outbox` (standalone)
14. `lead_scores` (FK → demo_leads, UNIQUE)
15. `drip_campaigns` (FK → verticals)
16. `drip_enrollments` (FK → demo_leads, drip_campaigns)
17. `drip_messages` (FK → drip_enrollments)

**CRITICAL notes from review cycle:**
- Every FK MUST have explicit ON DELETE action (CASCADE/SET NULL/RESTRICT)
- Every enum-like text column MUST have CHECK constraint (REV-010)
- demo_type/vertical columns MUST FK to lookup tables (REV-010)
- rate_limits UNIQUE on `(identifier, limit_type, demo_type, window_start)` (REV-002)
- rate_limits indexes MUST NOT use `now()` in WHERE clause (REV-006)
- demo_leads.subscribed DEFAULT false (REV-018)
- demo_leads includes jwt_version DEFAULT 1 and revoked_at (REV-012)
- inquiries includes demo_lead_id FK and marketing_context jsonb (REV-027/033)
- demo_interactions includes input_tokens, output_tokens (REV-005)
- lead_magnet_downloads includes download_token uuid UNIQUE (REV-034)

### Task 2: PostgreSQL Triggers
**Spec Reference:** Section 2.2
**Creates:** Trigger functions within migration

1. `update_timestamp()` — sets `updated_at = now()` on UPDATE. Apply to: inquiries, demo_cached_responses, site_config.
2. `update_session_counts()` — AFTER INSERT on demo_interactions, atomically increments session counts. See spec for exact SQL.

### Task 3: RLS Policies
**Spec Reference:** Section 2.5
**Creates:** RLS statements within migration

Enable RLS on ALL 19 tables. Only two anon-readable: demo_types (SELECT), verticals (SELECT). All other tables: no anon policies = implicit deny. All data access via service_role key in API routes.

**CAUTION (REV-001 — 13/13 reviewers):** Test anon access explicitly in acceptance criteria.

### Task 4: Seed Data
**Spec Reference:** Section 2.4 + addendum
**Creates:** `supabase/seed.sql`

Idempotent seeds using `INSERT ... ON CONFLICT DO UPDATE`:
- 7 demo_types, 4 verticals with config JSON
- site_config: availability_status, rate_limit_config (global_daily: 15), social_proof
- 4 drip_campaigns from addendum
- 35 minimal demo_cached_responses (general_smb × 7 demos × 5 interactions, placeholder content)

### Task 5: Supabase Clients
**Spec Reference:** Section 4.1
**Creates:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/types.ts`

server.ts uses SUPABASE_SERVICE_KEY. client.ts uses SUPABASE_ANON_KEY with WARNING comment: Storage operations ONLY.

### Task 6: Zod Schemas
**Spec Reference:** Section 7.4
**Creates:** `lib/validation/schemas.ts`

All API input schemas: inquirySchema, demoGateSchema, demoInteractSchema, demoSessionSchema, competitiveAnalysisSchema, magnetDownloadSchema, adminConfigSchema, adminLeadUpdateSchema, dripMessageActionSchema, bookingWebhookSchema.

### Task 7: JWT Session Module
**Spec Reference:** Section 7.1
**Creates:** `lib/demo-engine/session.ts`

Using `jose`: createDemoSession, verifyDemoSession (checks jwt_version + revoked_at against DB), setSessionCookie (httpOnly, Secure, SameSite=Lax), getSessionFromCookies.

**JWT payload:** `{ lead_id, jwt_version, iat, exp }` only. NO email (REV-004).

### Task 8: Atomic Rate Limiter
**Spec Reference:** Section 2.2, REV-002
**Creates:** `lib/demo-engine/rate-limiter.ts`

**CAUTION (REV-002 — 10/13 reviewers):** Must use atomic UPSERT. No read-then-write.

Implements: checkAndIncrementRateLimit (atomic SQL), checkGlobalDailyLimit, lazyCleanup. Rate config from site_config with 60s memory cache.

### Task 9: Prompt Injection Guard
**Spec Reference:** Section 7.4, REV-007
**Creates:** `lib/ai/prompt-guard.ts`

detectInjection (pattern matching), getHardenedSystemPrompt (security prefix), sanitizeForLogging (strip PII).

### Task 10: Admin Auth Middleware
**Spec Reference:** Section 7.2, REV-009
**Creates:** `lib/utils/admin-auth.ts`

timingSafeEqual comparison, IP allowlist check, 10/hr/IP rate limit (in-memory Map), requireAdmin HOF.

### Task 11: CSRF Middleware
**Spec Reference:** Section 3.1
**Creates:** `middleware.ts`

Origin header validation on POST/PATCH/DELETE. Skip for /api/webhooks/*.

### Task 12: Health Check (Expanded)
**Spec Reference:** Section 3.2
**Creates:** Updated `app/api/health/route.ts`

Standard + `?deep=true` with concurrent dependency checks (DB, storage, email, AI). Returns healthy/degraded/unhealthy.

### Task 13: Error Helpers
**Spec Reference:** Section 3.1, 8.1
**Creates:** `lib/utils/errors.ts`

Standardized apiError function + pre-defined ERRORS object matching spec error codes.

### Task 14: Logger
**Spec Reference:** Section 8.2
**Creates:** `lib/utils/logger.ts`

Pino structured JSON logger, PII-free. Convenience methods for common events.

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Migration applies cleanly
- [ ] Seed data loads without errors

### Schema (verify each)
- [ ] All 19 tables exist with correct columns, types, constraints
- [ ] FKs match ERD with correct ON DELETE actions
- [ ] CHECK constraints enforce enums
- [ ] demo_leads.subscribed defaults false
- [ ] demo_leads.jwt_version exists (default 1)
- [ ] rate_limits UNIQUE constraint on (identifier, limit_type, demo_type, window_start)
- [ ] rate_limits indexes contain no volatile functions
- [ ] Triggers fire: UPDATE inquiries → updated_at changes; INSERT demo_interactions → session counts increment

### RLS (CRITICAL)
- [ ] Anon key: SELECT demo_leads → 0 rows
- [ ] Anon key: SELECT inquiries → 0 rows
- [ ] Anon key: SELECT demo_types → 7 rows
- [ ] Anon key: SELECT verticals → 4 rows
- [ ] Anon key: INSERT INTO demo_leads → FAILS
- [ ] Service key: all operations succeed

### Auth
- [ ] JWT create → verify → succeeds
- [ ] JWT with wrong jwt_version → verification fails
- [ ] JWT for revoked lead → verification fails
- [ ] Expired JWT → verification fails

### Rate Limiter (CRITICAL)
- [ ] Under limit → allowed: true
- [ ] At limit → allowed: false
- [ ] **10 concurrent requests vs limit of 5 → count never exceeds 5**
- [ ] Global daily limit enforced
- [ ] Lazy cleanup removes expired rows

### Admin Auth
- [ ] Correct secret → passes
- [ ] Wrong secret → 403
- [ ] timingSafeEqual in code (verify)
- [ ] 11th failure from same IP in 1hr → 429

### Prompt Guard
- [ ] "ignore previous instructions" → blocked
- [ ] "What AI capabilities for construction?" → NOT blocked

### Health Check
- [ ] Standard → 200 with status
- [ ] Deep → dependency statuses returned

---

## 5. Constraints

### Hard Constraints
- Column names, types, constraints MUST match spec Section 2.2 exactly
- RLS MUST be enabled on ALL tables per Section 2.5
- Rate limiter MUST use atomic UPSERT (no read-then-write)
- JWT payload: lead_id + jwt_version only (NO email)
- Admin auth MUST use crypto.timingSafeEqual()
- Error format MUST match spec Section 3.1/8.1
- Do NOT implement API routes (except health), UI, or demo features

### Soft Constraints
- Follow Phase 00 patterns (env validation, directory structure)
- If type generation fails, create manual types with TODO comment
- Mark ambiguities with `// SPEC-AMBIGUITY`

---

## 6. Completion Protocol

Provide structured report: Files Created, Files Modified, Acceptance Criteria Results, Spec Ambiguities, Blocked Items, Decisions Made, Warnings for Next Phase.

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 50`
Plan for one possible `--continue`.

### Task Planning
1. Read spec Sections 2, 2.5, 7, 8 thoroughly
2. Read addendum Part 1 for nurture tables
3. Survey Phase 00 output
4. Execute tasks 1-14 sequentially

### Resumption Protocol (--continue)
1. Read this prompt for context
2. Check `PHASE-01-PROGRESS.md`
3. Check which files exist in `supabase/migrations/` and `lib/`
4. Resume at first incomplete task

### Progress Tracking
Update `PHASE-01-PROGRESS.md` after each task.
