# Review Synthesis: Larkin Tech — Cycle 1

**Spec Version Reviewed:** v1
**Reviewers:** 13 reviews across 4 agents (GUARDIAN ×3, FOUNDATION ×4, ADVOCATE ×3, BRIDGE ×3) using Gemini 3 Flash, Gemini 3.1 Pro, Grok-4, Claude Sonnet 4.6
**Total Raw Findings:** 183 (166 original + 17 from late ADVOCATE review)
**Deduplicated Findings:** 46 (183 raw → 46 consolidated via cross-reviewer merge)
**Overlap Rate:** 137 findings merged into existing — extremely high consensus across reviewers
**Severity Breakdown:** Critical: 10, High: 18, Medium: 16, Low: 2

---

## How to Use This Document

For each finding below, mark your decision:
- **APPROVE** — Incorporate into spec v2
- **REJECT** — Do not incorporate (provide brief reasoning)
- **DEFER** — Add to backlog for post-launch

---

## CRITICAL Findings (Must resolve before build)

### REV-001 | Missing Supabase RLS Policies — Full PII Exposure via Anon Key
**Severity:** CRITICAL (consensus-escalated — originally HIGH in some reviews)
**Reviewers:** ALL 12/12 — GUARDIAN ×3, FOUNDATION ×4, ADVOCATE ×2, BRIDGE ×3
**Dimension:** Security
**Confidence:** MAXIMUM — universal agreement across every model and agent

**Issue:** Spec cites "built-in RLS" as a Supabase rationale and mentions "JS client for direct browser queries where appropriate," but zero RLS policies are defined in any table definition or migration. With RLS disabled (Supabase default), the anon key exposed in the browser client can read/write ALL tables — demo_leads emails, inquiry PII, internal notes, rate_limits, cached prompts. One Gemini review noted the custom JWT is also incompatible with Supabase's native RLS (which relies on `auth.uid()`).

**Recommendation:** Add Section 2.5 "Row-Level Security Policies" to spec. Enable RLS on ALL tables. Default policy: DENY ALL for anon role. Allow anon SELECT on demo_types, verticals only. ALL data operations go through Next.js API routes using the service role key. The browser Supabase client should never query data tables directly — restrict to Storage uploads only. Remove "direct browser queries" claim from Section 1.2.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-002 | Rate Limiter TOCTOU Race Condition — Concurrent Bypass
**Severity:** CRITICAL (consensus-escalated)
**Reviewers:** 10/12 — GUARDIAN ×3, FOUNDATION ×3, ADVOCATE ×1, BRIDGE ×3
**Dimension:** Security + Performance
**Confidence:** VERY HIGH

**Issue:** The interact endpoint flow (check rate limit → if under limit → call Claude → increment counter) is a textbook time-of-check/time-of-use race. Two concurrent requests both read count=4, both pass the limit check, both call Claude, both write count=5. No UNIQUE constraint on rate_limits table compounds this — duplicate active window rows can be created. Exploitable via `Promise.all()` in a browser console.

**Recommendation:** Replace read-check-increment with atomic SQL: `INSERT INTO rate_limits (...) VALUES (...) ON CONFLICT (identifier, limit_type, demo_type) DO UPDATE SET count = rate_limits.count + 1 WHERE rate_limits.count < $limit AND rate_limits.window_end > now() RETURNING count;` Add UNIQUE constraint on `(identifier, limit_type, demo_type, window_start)`. If no rows returned, limit exceeded — reject.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-003 | Internal API Routes Publicly Routable in Next.js
**Severity:** CRITICAL
**Reviewers:** 9/12 — GUARDIAN ×2, FOUNDATION ×1, BRIDGE ×3, others referenced
**Dimension:** Security
**Confidence:** VERY HIGH

**Issue:** `/api/ai/generate` and `/api/notify/lead` are labeled "internal only" but Next.js App Router makes every file under `/app/api/` a public HTTP endpoint. Any visitor can POST directly to `/api/ai/generate`, bypassing the email gate, cache layer, and all rate limiting — draining the Anthropic API budget in seconds. `/api/notify/lead` can be exploited to spam Adam's inbox.

**Recommendation:** Move AI generation and notification logic out of API routes into shared library modules (`lib/ai/generate.ts`, `lib/email/notify.ts`) imported directly by the demo engine route handlers. No HTTP hop, no exposure. Remove `/api/ai/generate/route.ts` and `/api/notify/lead/route.ts` from the component tree entirely. If separate routes are needed for testing, protect with `INTERNAL_API_SECRET` header validation.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-004 | Phantom inquiry_tags Table in ERD
**Severity:** CRITICAL
**Reviewers:** 5/12 — FOUNDATION ×3, GUARDIAN ×1, BRIDGE ×1
**Dimension:** Data
**Confidence:** HIGH

**Issue:** ERD declares `inquiries ||--o{ inquiry_tags : has` but inquiry_tags has zero table definition, columns, indexes, or migration entry. Initial migration will either omit the table (breaking ERD) or fail. Blocks Phase 1 deployment.

**Recommendation:** Remove inquiry_tags from the ERD. If tagging is needed, add `tags text[]` array column on inquiries. The ERD is a living document — no phantom entities.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-005 | API Cost Tracking Race Condition — Single-Row Contention
**Severity:** CRITICAL
**Reviewers:** 5/12 — BRIDGE ×2, FOUNDATION ×2, GUARDIAN ×1
**Dimension:** Performance + Data
**Confidence:** HIGH

**Issue:** Daily token usage tracked by writing to a single `site_config` JSON key (`daily_api_usage`). Every concurrent AI call does read-modify-write on one row, causing lock contention, lost updates, and corrupted cost data. The $10/day hard stop won't trigger reliably.

**Recommendation:** Replace with append-only `api_usage_log` table (`id, demo_type, model, input_tokens, output_tokens, estimated_cost_cents, created_at`). Each AI call inserts one row — no race condition. Daily spend = `SELECT SUM(estimated_cost_cents) WHERE created_at > date_trunc('day', now())`. Add `input_tokens` and `output_tokens` columns to `demo_interactions` as well (extracted from Claude API response).

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-006 | Invalid Partial Index on rate_limits — Migration Will Fail
**Severity:** CRITICAL
**Reviewers:** 3/12 — BRIDGE ×1, FOUNDATION ×2
**Dimension:** Data
**Confidence:** HIGH (factual — PostgreSQL does not allow `now()` in index definitions)

**Issue:** `idx_rate_limits_lookup ... WHERE window_end > now()` uses a volatile function. PostgreSQL rejects this. The migration SQL will fail to execute.

**Recommendation:** Remove the WHERE clause. Index the full tuple: `CREATE INDEX idx_rate_limits_lookup ON rate_limits (identifier, limit_type, demo_type, window_end);`. Handle `> now()` filtering in application queries. Add a second index on `window_end` alone for the cleanup DELETE.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-007 | Prompt Injection — User Inputs Passed to Claude Without Guardrails
**Severity:** CRITICAL (consensus-escalated from HIGH)
**Reviewers:** 6/12 — GUARDIAN ×2, BRIDGE ×2, ADVOCATE ×1, FOUNDATION ×1
**Dimension:** Security
**Confidence:** HIGH

**Issue:** Spec states user inputs are "passed to Claude API as-is (Claude handles arbitrary input safely)." This is incorrect. Prompt injection can exfiltrate proprietary system prompts (vertical configs = competitive moat), cause Claude to output harmful content attributed to Adam's site, or generate unexpected API costs.

**Recommendation:** Defense-in-depth: (1) Hardened system prompt prefix instructing Claude to never reveal instructions. (2) Input classifier detecting common injection patterns — deflect without invoking Claude. (3) Conservative `max_tokens` per demo type. (4) Store system prompts server-side only (never in client-accessible Supabase tables). (5) Log suspicious inputs for review.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-008 | No PDF Generation Library in Tech Stack — F-024/F-025 Unimplementable
**Severity:** CRITICAL (consensus-escalated from HIGH)
**Reviewers:** 7/12 — GUARDIAN ×2, FOUNDATION ×2, BRIDGE ×2, ADVOCATE ×1
**Dimension:** Integration
**Confidence:** VERY HIGH

**Issue:** F-024 competitive analysis returns `download_url (PDF)`. F-025 document drafter produces downloadable output. No PDF library exists in the tech stack. Puppeteer requires Chrome in Docker (heavy for 4GB VPS). The competitive analysis endpoint also has no async polling mechanism — `status: "generating"` is returned but no `GET` endpoint exists to retrieve the result.

**Recommendation:** (A) Add `@react-pdf/renderer` to Section 1.2 for document-style PDFs. (B) For competitive analysis: make it synchronous (Claude Sonnet can generate in 10-20s). Remove the `generating` status — always return `complete`. If async is needed later, add `GET /api/demos/competitive-analysis/:id` polling endpoint + `competitive_analyses` storage table. (C) Alternative: return shareable HTML link instead of PDF at launch, defer PDF to Phase 2.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

## HIGH Findings (Should resolve before build)

### REV-009 | Static Admin Secret — Brute-Forceable, No Rate Limiting
**Severity:** HIGH
**Reviewers:** 9/12
**Dimension:** Security

**Issue:** Single `ADMIN_SECRET` header with no rate limiting on admin endpoints, no IP restriction, no rotation, vulnerable to timing attacks via `===` comparison. Successful breach exposes all lead PII.

**Recommendation:** (1) Rate limit admin endpoints — max 10 failed attempts per IP per hour. (2) Use `crypto.timingSafeEqual()` for comparison. (3) Add Cloudflare IP allowlist for `/api/admin/*`. (4) Enforce 32+ char random secret. (5) Log all admin auth failures with IP.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-010 | Missing FK Constraints + Enum Enforcement on demo_type/vertical
**Severity:** HIGH
**Reviewers:** 8/12
**Dimension:** Data

**Issue:** demo_sessions, demo_cached_responses, demo_interactions, rate_limits all use `demo_type` and `vertical` as plain text with no FKs to demo_types/verticals tables. No CHECK constraints. Typos or invalid values silently persist, breaking cache lookups and analytics.

**Recommendation:** Add FK constraints: `demo_type text REFERENCES demo_types(id) ON DELETE RESTRICT` and `vertical text REFERENCES verticals(id) ON DELETE RESTRICT` on all referencing tables. Add CHECK constraints as fallback. Also add ON DELETE CASCADE/SET NULL actions to all existing FK relationships (demo_sessions → demo_leads, demo_interactions → demo_sessions, etc.).

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-011 | Manual Docker Deploy Causes Downtime
**Severity:** HIGH
**Reviewers:** 8/12
**Dimension:** Operations

**Issue:** `docker compose up --build -d` stops the existing container during build (2-5 minutes for Next.js). Site down during every deploy. Failed builds leave no running container.

**Recommendation:** Pre-build Docker image via GitHub Actions, push to GHCR, then pull the built image on VPS — container restart takes milliseconds instead of minutes. Add health check gate: if new container fails, keep old running. Simple blue-green script: start new container on port 3001 → health check → swap nginx upstream → stop old.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-012 | JWT Has No Revocation Mechanism — 24hr Unrevocable Window
**Severity:** HIGH
**Reviewers:** 7/12
**Dimension:** Security

**Issue:** No token blacklist, no session table, no revocation endpoint. Compromised or shared JWT has 24 hours of access. Adam cannot block a scraper mid-session. JWT_SECRET rotation invalidates ALL sessions.

**Recommendation:** Add `jwt_version integer DEFAULT 1` to `demo_leads`. Include in JWT payload. On verification, check `jwt_version` matches DB. Incrementing `jwt_version` for a lead instantly invalidates all their tokens. Add `PATCH /api/admin/leads/:id/revoke` to increment. Document JWT_SECRET rotation runbook.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-013 | No Backup / Disaster Recovery Strategy
**Severity:** HIGH
**Reviewers:** 6/12
**Dimension:** Operations

**Issue:** Supabase free tier has no PITR, no automated backups. 280 cached responses (50-100 hours of content generation) are unprotected. Free tier also pauses after 7 days of inactivity.

**Recommendation:** (1) Treat `/supabase/seed.sql` and `/data/cache-seeds/*.json` as canonical backup in git. (2) Add nightly `pg_dump` script on VPS to `/opt/backups/`. (3) Plan upgrade to Supabase Pro ($25/mo) before or shortly after launch. (4) Add seed completeness CI check.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-014 | Missing Competitive Analysis Storage Table
**Severity:** HIGH
**Reviewers:** 5/12
**Dimension:** Data

**Issue:** F-024 endpoint returns `analysis_id` and full report object, but no table exists to store it. Reports exist only in transient API responses and are lost on refresh.

**Recommendation:** Add `competitive_analyses` table: `id uuid PK, session_id uuid FK, business_name text, competitors jsonb, report_data jsonb, pdf_storage_path text, status text, created_at timestamptz, completed_at timestamptz`. Update traceability matrix.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-015 | SendGrid Free Tier Issues + No Retry Queue
**Severity:** HIGH
**Reviewers:** 5/12
**Dimension:** Integration

**Issue:** SendGrid free tier may be outdated (2025-2026 changes). Single 30s retry in API route creates dangling promise. No dead-letter queue — failed notifications silently lost. At scale (50+ signups/day), 100/day email cap hit.

**Recommendation:** (1) Verify current SendGrid free tier or switch to Resend ($0 for first 100/day). (2) Replace in-memory retry with notification outbox pattern: insert `notification_pending` flag in lead tables, process via cron or edge function with exponential backoff. (3) Add notification dedup: batch into hourly digests instead of per-event. (4) Document upgrade trigger threshold.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-016 | Free-Text Cache Strategy Undefined — O-007 80% Target Unachievable
**Severity:** HIGH
**Reviewers:** 4/12 — but 2 CRITICAL-rated
**Dimension:** Business Logic + Data

**Issue:** `demo_cached_responses.trigger_key` is described as "semantic key" for free-text, but cache lookup is exact string match on a UNIQUE index. Fuzzy/semantic matching is impossible with B-tree. Free-text cache hit rate = 0%. O-007 (≥80% from cache) unachievable as written.

**Recommendation:** Make explicit decision: **(A) Cache is preset-commands only** — free-text always hits live AI. Rate limit is the cost control. Update O-007 to reflect this. **(B) Keyword bucket matching** — normalize input, extract keywords, map to finite cache key set. **(C) pgvector semantic search** — embedding column, ANN lookup. **Recommend Option A for launch** — simplest, honest, and rate limits already protect costs.

**Effort:** SMALL (for option A) | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-017 | JWT_SECRET Missing from Environment Variable Inventory
**Severity:** HIGH
**Reviewers:** 3/12 — but factually correct
**Dimension:** Security + Operations

**Issue:** Section 7.1 references `JWT_SECRET` for signing. Section 1.3 env list omits it. First deployment will have broken demo gate auth.

**Recommendation:** Add `JWT_SECRET` to Section 1.3 secrets list. Add startup validation that asserts all required env vars present. Add `INTERNAL_API_SECRET` too if REV-003 is approved. Specify `openssl rand -base64 32` for generation.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-018 | GDPR — subscribed Defaults to True + No Data Deletion Mechanism
**Severity:** HIGH
**Reviewers:** 3/12 — but legal compliance
**Dimension:** Business Logic + Security

**Issue:** `demo_leads.subscribed` defaults to `true` with no opt-in checkbox — violates GDPR/CAN-SPAM. No user-facing data deletion or unsubscribe mechanism. Legal vertical targets attorneys who will notice compliance gaps.

**Recommendation:** (1) Change default to `false`. Add explicit opt-in checkbox on email gate. (2) Add `subscribed_at timestamptz` for audit trail. (3) Add footer "Manage Data/Unsubscribe" link with simple email verification → toggle subscribed/soft-delete. (4) Add `/api/leads/unsubscribe` endpoint.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-019 | Competitive Analysis Endpoint Has Two Contradictory Integration Paths
**Severity:** HIGH
**Reviewers:** 2/12 — BRIDGE ×2
**Dimension:** Integration

**Issue:** Traceability matrix maps F-024 to standalone `/api/demos/competitive-analysis`. Phase 5 says it uses DemoShell + demo engine flow (`/api/demos/interact`). These have incompatible request/response shapes. Rate limiting defined differently for each.

**Recommendation:** Keep standalone endpoint (input shape is genuinely different — structured form vs. free text). Update traceability matrix. Add session validation to standalone endpoint. Route rate limiting through shared `rate-limiter.ts` with `demo_type='competitive_analysis'`.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-020 | Phase 4 Acceptance Requires Cache Data Created in Phase 5-6
**Severity:** HIGH
**Reviewers:** 2/12 — but blocks build sequencing
**Dimension:** Traceability

**Issue:** Phase 4 acceptance: "Preset commands return cached responses (0 API calls)." Section 2.4: cache seeds "generated during Phase 5-6." Phase 4 cannot pass its own criteria.

**Recommendation:** Move minimal cache seed generation into Phase 4: 1 vertical × 7 demos × 5 interactions = 35 entries. Enough to validate infrastructure. Full 280 entries remain Phase 5-6.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-021 | Calendly Booking Creates No Lead Record — KPI O-001 Unmeasurable
**Severity:** HIGH
**Reviewers:** 3/12
**Dimension:** Integration + Traceability

**Issue:** Booking data goes only to Calendly. No webhook captures it in Supabase. Highest-value conversion event is invisible to analytics. O-001 ("≥5 form submissions or call bookings per month") cannot be measured.

**Recommendation:** Add `POST /api/leads/booking-confirmed` webhook endpoint for Calendly's `invitee.created` event. Upsert into inquiries with `audience_type='booking'`. Trigger notification. Calendly free tier supports webhooks.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-022 | No Streaming for AI Responses — 30s Perceived Freeze
**Severity:** HIGH
**Reviewers:** 2/12 — ADVOCATE ×1, GUARDIAN ×1
**Dimension:** UX

**Issue:** Standard request/response cycle for Claude. Live AI calls take 10-20s. Users see a static "thinking" indicator for up to 30s. Modern UX users assume broken after 5s.

**Recommendation:** Implement Vercel AI SDK or Next.js streaming route handlers. Update ChatInterface and other demo components to handle chunked streamed responses. Users see text generating in real-time.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

## MEDIUM Findings (Fix during build)

### REV-023 | Demo Components Missing Loading, Error, and Empty States
**Severity:** MEDIUM
**Reviewers:** 8/12
**Dimension:** UX

**Recommendation:** Add React Suspense + skeleton loaders to DemoShell. For AI_UNAVAILABLE: auto-retry (3×) + "Use preset commands" button. For RATE_LIMITED: countdown timer + one-click booking CTA. For empty verticals: "Coming soon" with fallback CTA. Add to Phase 5 acceptance criteria.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-024 | Accessibility Gaps — ARIA Labels, Focus Management, Keyboard Navigation
**Severity:** MEDIUM
**Reviewers:** 5/12
**Dimension:** UX

**Recommendation:** Require `aria-live="polite"` on message feed containers. Keyboard navigation for PresetCommandBar. Focus management on EmailGateModal open/close. Add to Phase 5/6 acceptance criteria: Lighthouse Accessibility ≥90.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-025 | Docker Log Rotation Unspecified — VPS Disk Will Fill
**Severity:** MEDIUM
**Reviewers:** 3/12
**Dimension:** Operations

**Recommendation:** Add to docker-compose.yml: `logging: driver: "json-file", options: { max-size: "10m", max-file: "5" }`. Caps logs at 50MB per service. Add disk space alert at 80%.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-026 | Email Gate Pollution — No Verification for Fake Emails
**Severity:** MEDIUM
**Reviewers:** 3/12
**Dimension:** Business Logic

**Recommendation:** Integrate lightweight email validation API (e.g., Abstract, ZeroBounce) or add a "quarantine" flag for suspicious emails so notifications skip them. Block obvious disposable email domains via configurable blocklist.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-027 | demo_leads and inquiries Unlinked — No Cross-Funnel Attribution
**Severity:** MEDIUM
**Reviewers:** 3/12
**Dimension:** Data + Business Logic

**Recommendation:** Add nullable `demo_lead_id uuid FK → demo_leads.id` to inquiries. On contact form submit, if user has demo session cookie, extract lead_id from JWT and set on inquiry. Enables "X% of form submitters had previously used demos."

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-028 | Admin UI Missing — Config/Lead Management via Raw API Only
**Severity:** MEDIUM
**Reviewers:** 4/12
**Dimension:** Business Logic + UX

**Recommendation:** Add simple `/admin` route group with: lead list (with contacted toggle, notes, search), site_config editor, basic analytics. Protected by same admin secret. Add `PATCH /api/admin/leads/:id` for contacted/notes updates. Build as Phase 2.5.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-029 | Non-Atomic Counters on demo_sessions
**Severity:** MEDIUM
**Reviewers:** 4/12
**Dimension:** Data + Performance

**Recommendation:** Use atomic SQL: `UPDATE demo_sessions SET interactions_count = interactions_count + 1 WHERE id = ...`. Or replace app-level increments with a PostgreSQL trigger on demo_interactions INSERT.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-030 | Demo Session Expiry UX — Silent Re-Gate with No Context
**Severity:** MEDIUM
**Reviewers:** 4/12
**Dimension:** UX

**Recommendation:** Store email in 90-day localStorage hint (separate from JWT). On gate re-prompt, pre-fill email and show "Welcome back! Confirm email to continue." Implement sliding JWT renewal: refresh if token is valid and >12hr old.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-031 | Calendly Context Loss on Rate Limit — User Re-Enters Info
**Severity:** MEDIUM
**Reviewers:** 2/12
**Dimension:** Integration + UX

**Recommendation:** Pass email and name from DemoSessionContext to Calendly/Cal.com embed URL params for pre-filling. Add fallback: auto-open pre-filled SegmentedForm modal if embed fails.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-032 | OS Theme Preference Not Detected on First Load
**Severity:** MEDIUM
**Reviewers:** 2/12
**Dimension:** UX

**Recommendation:** Add initialization script in root layout `<head>` checking `window.matchMedia('(prefers-color-scheme: dark)').matches` if no localStorage value exists. Apply correct CSS class before first paint.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-033 | UTM / Marketing Context Not Captured
**Severity:** MEDIUM
**Reviewers:** 2/12
**Dimension:** Data + Business Logic

**Recommendation:** Add `marketing_context jsonb` column to inquiries and demo_leads. Capture UTM source/medium/campaign from URL params on form submission.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-034 | Lead Magnet Signed URL Expires in 1hr — No Re-Download Path
**Severity:** MEDIUM
**Reviewers:** 2/12
**Dimension:** Integration + UX

**Recommendation:** Add persistent re-download route: `GET /api/leads/magnet-download/:token` where token is UUID stored at capture. Generates fresh signed URL on demand. Or simply increase expiry to 7 days.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-035 | Rate Limits Table Cleanup Requires Supabase Pro (pg_cron)
**Severity:** MEDIUM
**Reviewers:** 3/12
**Dimension:** Operations

**Recommendation:** Use lazy cleanup in rate-limiter.ts: `DELETE FROM rate_limits WHERE identifier = $1 AND window_end < now()` on each rate check call. Or add cron entry in Docker container for nightly cleanup script. No Supabase Pro dependency.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-036 | Global Rate Limit Bypass — Users Get 29+ Live AI Calls Across Demo Types
**Severity:** MEDIUM
**Reviewers:** 2/12
**Dimension:** Business Logic

**Recommendation:** Add `global_daily: 15` to rate_limit_config. Enforce via `global_daily` row in rate_limits checked before per-demo checks. Caps total live AI across all demos.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

## LOW Findings (Can defer)

### REV-037 | Feature ID Gap F-046 through F-049
**Severity:** LOW
**Reviewers:** 1/12
**Recommendation:** Add note: "F-046 through F-049 reserved for post-launch core feature additions."
**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-038 | next-sitemap Package vs Native App Router sitemap.ts
**Severity:** LOW
**Reviewers:** 1/12
**Recommendation:** Use Next.js 14 native `app/sitemap.ts` and `app/robots.ts`. Remove next-sitemap dependency.
**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

## Commendations (What Reviewers Praised — Preserve These)

The following spec strengths were called out across multiple reviews:

1. **Cache-first demo engine architecture** (ALL reviewers) — The preset command sequences with cached responses, 80% hit target, and rate-limited live AI fallback is the right cost-control pattern. Preserve this design.

2. **SOW-to-spec traceability matrix** (ALL reviewers) — Every F-XXX maps to tables, endpoints, components, and phases with zero orphans. Described as "rare" and "exceptional" by multiple models.

3. **Phased delivery with independent milestones** (8+ reviewers) — Each phase delivers standalone value. Phase 4 can run parallel to Phases 2-3. No big-bang risk.

4. **Error taxonomy with conversion-aware messaging** (6+ reviewers) — RATE_LIMITED CTA to book a call turns frustration into conversion. Production-grade error codes.

5. **Secrets management** (5+ reviewers) — API keys in env vars, never in repo, Anthropic key never client-side, all AI proxied server-side. "Most personal projects get this wrong."

6. **Minimal state management** (4+ reviewers) — React Context for theme + session only, no Redux/Zustand. "Architecturally sound for a solo developer."

7. **Lead deduplication via UNIQUE email** (3+ reviewers) — demo_leads upsert pattern correctly handles returning visitors.

8. **PII-free logging** (3+ reviewers) — Using lead_id for correlation, never logging email/name. "Often overlooked in solo-developer projects."

---

## Build Readiness Assessment

| Review | Agent | Model | Build Readiness | Confidence | Top Risk |
|--------|-------|-------|----------------|------------|----------|
| 1 | GUARDIAN | Gemini 3 Flash | READY WITH CAVEATS | HIGH | Financial exposure via competitive analysis |
| 2 | GUARDIAN | Grok-4 | READY WITH CAVEATS | HIGH | Missing RLS + PII exposure |
| 3 | GUARDIAN | Claude Sonnet 4.6 | READY WITH CAVEATS | HIGH | Internal route exposure + rate limiter race |
| 4 | FOUNDATION | Grok-4 (run 1) | READY WITH CAVEATS | HIGH | inquiry_tags phantom + missing RLS |
| 5 | FOUNDATION | Gemini 3.1 Pro | **NOT READY** | HIGH | Custom JWT breaks Supabase RLS |
| 6 | FOUNDATION | Claude Sonnet 4.6 | READY WITH CAVEATS | HIGH | Internal route exposure + semantic cache mismatch |
| 7 | FOUNDATION | Grok-4 (run 2) | READY WITH CAVEATS | HIGH | FK gaps + enum enforcement |
| 8 | ADVOCATE | Gemini 3.1 Pro | READY WITH CAVEATS | HIGH | No streaming = 30s perceived freezes |
| 9 | ADVOCATE | Grok-4 | READY WITH CAVEATS | HIGH | Session expiry + missing states |
| 10 | BRIDGE | Grok-4 | READY WITH CAVEATS | HIGH | JWT session gaps + SendGrid assumptions |
| 11 | BRIDGE | Gemini 3.1 Pro | READY WITH CAVEATS | HIGH | Single-row cost tracking contention |
| 12 | BRIDGE | Claude Sonnet 4.6 | READY WITH CAVEATS | HIGH | Internal routes + rate limiter race |

| 13 | ADVOCATE | Claude Sonnet 4.6 | READY WITH CAVEATS | HIGH | Demo showroom UX gaps + legal disclaimer liability |

**Consensus: READY WITH CAVEATS (12/13). One NOT READY from Gemini 3.1 Pro FOUNDATION, citing custom JWT + Supabase RLS incompatibility — resolved by REV-001 (proxy all queries through server-side routes).**

The spec is buildable after resolving the 10 CRITICAL findings. All 13 reviewers gave HIGH confidence, indicating the spec is unusually detailed and well-structured — the issues are gaps to fill, not fundamental architecture problems.

---

## Late Review Addendum: ADVOCATE (Claude Sonnet 4.6)

This 13th review surfaced 8 net-new findings not caught by the previous 12 reviews, plus strengthened 7 existing findings. The new findings are heavily UX-focused and fill critical gaps in the demo showroom user journey.

### Strengthened Existing Findings (reviewer count updated)

- **REV-018** (GDPR/subscribed default) — Now 4/13 reviewers. This ADVOCATE review adds privacy policy page requirement and explicit consent mechanism.
- **REV-022** (No AI streaming) — Now 3/13 reviewers. This review adds per-demo loading copy and max visible wait time spec.
- **REV-023** (Missing loading/error/empty states) — Now 9/13 reviewers. This review adds DemoShell-level `isLoading` prop pattern.
- **REV-024** (Accessibility gaps) — Now 6/13 reviewers. This review adds specific WCAG requirements: focus trapping, aria-live, contrast minimums, axe-core scan.
- **REV-028** (Admin UI missing) — Now 5/13 reviewers. This review adds `GET /api/admin/leads/:id` and `PATCH /api/admin/leads/:id` for contacted/notes updates.
- **REV-032** (OS theme preference) — Now 3/13 reviewers. This review adds the blocking inline `<script>` pattern for FOUC prevention.
- **REV-034** (Lead magnet signed URL expiry) — Now 3/13 reviewers. This review adds email delivery as second download path.

### NEW CRITICAL Findings

### REV-039 | Email Gate Double-Submission — Phantom Leads and Duplicate Sessions
**Severity:** CRITICAL
**Reviewers:** 1/13 (single-source) — ADVOCATE (Claude Sonnet 4.6)
**Dimension:** UX + Data
**Confidence:** MEDIUM (single reviewer, but mechanically sound — mobile double-tap is a real and common issue)

**Issue:** EmailGateModal has no loading/disabled state after submit click. Mobile users frequently double-tap. Each tap fires POST to `/api/leads/demo-gate`. While the upsert handles DB correctly, each request may trigger a notification to Adam and create a separate demo session. Two concurrent requests racing can result in two session cookies set with undefined rate-limit behavior.

**Recommendation:** (1) Submit button transitions to disabled + spinner immediately on click. (2) Add idempotency key: client generates UUID, sends as header, server deduplicates within 60s window. (3) Add acceptance criterion: "Submitting twice in rapid succession results in exactly one session token and one lead record."

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-040 | Legal Vertical Disclaimer Undefined — Content, Placement, and Behavior Unspecified
**Severity:** CRITICAL
**Reviewers:** 1/13 (single-source, but LIABILITY finding) — ADVOCATE (Claude Sonnet 4.6)
**Dimension:** Business Logic + Security
**Confidence:** HIGH (legal compliance finding — the risk is real regardless of reviewer count)

**Issue:** SOW F-032 requires "prominent disclaimer." DemoDisclaimer component exists but its content, placement, size, dismissibility, and re-show behavior are never specified. "Prominent" is undefined. The legal vertical targets law firm decision-makers — a generated estate plan draft with no visible disclaimer could be taken as real legal guidance. Downloaded documents include no disclaimer text.

**Recommendation:** Add Section 7.5 "Legal Vertical Disclaimer Requirements": (1) Renders as dismissible banner at TOP of demo, above interaction UI. (2) Required exact copy: "All content in this demo is fictional and for demonstration purposes only. Nothing here constitutes legal advice. Do not rely on any generated documents for legal decisions." (3) Re-shown on every page load — not suppressible via localStorage. (4) Downloaded docs from legal vertical include disclaimer as first line. (5) Add `vertical_disclaimer_acknowledgments` table for audit trail (from earlier GUARDIAN finding).

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### NEW HIGH Findings

### REV-041 | SegmentedForm Has No Inline Validation or Submission Feedback
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** UX

**Issue:** Contact form has Zod server-side validation but no client-side feedback. No spec for field blur validation, submitting state, success state, or error display. "Sam the SMB Owner" experiences form anxiety with no feedback.

**Recommendation:** Add form UX states: inline validation on blur (`mode: 'onBlur'`), submit button disabled + "Sending..." on submit, success state replacing form with message + secondary CTA, error toast for API errors. Add to Phase 2 acceptance criteria.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-042 | Rate Limit CTA Is Terminal — No Option to Continue with Cached Presets
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** UX + Business Logic

**Issue:** When rate limited, user sees only a booking CTA. But preset commands use cache and don't consume live AI budget. Users could continue interacting but RateLimitNotice offers no path to do so. False dead end that cuts short the demo.

**Recommendation:** Redesign RateLimitNotice: primary CTA (book a call) + secondary action ("Continue with preset examples"). Include `next_presets` in the rate limit response body so the component can render clickable preset buttons.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-043 | Demo Showroom Has No Onboarding — 28-Card Grid with No Guidance
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** UX

**Issue:** DemoShowroomGrid presents a 7×4 matrix with no orientation for first-time visitors. Sam the SMB Owner doesn't know which vertical or demo type to start with. Email gate happens after demo selection, not before, so users arrive at the grid with no context.

**Recommendation:** Add vertical selector step before full grid on first visit (4 cards: "I run a general business," "I'm in construction," "I manage properties," "I work in legal"). Selection filters grid and persists in sessionStorage. Add "Recommended: Start Here" badge on ChatInterface card. Each demo card shows 2-sentence preview on hover/tap.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-044 | Lead Magnet Placed in Phase 6 — Primary Conversion Tool Missing for 10 Weeks
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** Business Logic + Traceability

**Issue:** F-035 (AI Enablement Playbook) is in Phase 6 (weeks 10-12), but it's a core conversion mechanism for the SMB persona. Service pages (Phase 2) and case studies (Phase 3) link to it as a CTA, but it won't exist. LeadMagnetGate component is built in Phase 2 pointing to content that doesn't exist until Phase 6.

**Recommendation:** Move PDF creation to Phase 2 (content task, not code task). Create minimal v1 (10-15 pages, Construction vertical) alongside Phase 2 code. Full version iterated in Phase 6. Update Phase 2 acceptance criteria: "Lead magnet PDF hosted in Supabase Storage and downloadable via gated flow."

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-045 | Booking Platform Decision Deferred Past Phase 2 Build Start
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** Integration

**Issue:** Calendly vs. Cal.com is "TBD" but BookingEmbed is built in Phase 2. The two platforms have meaningfully different embed implementations (Calendly: `data-url` + script; Cal.com: `@calcom/embed-react` npm package). Building for the wrong one means a component rewrite.

**Recommendation:** Add to Phase 1 acceptance criteria: "Booking platform decision documented." Abstract BookingEmbed behind a config interface: `{ platform: 'calendly' | 'calcom', url: string }` with platform-specific render implementations. Recommend Cal.com for full ownership and zero cost.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-046 | DocumentProcessor Mobile File Access Undefined
**Severity:** HIGH
**Reviewers:** 1/13
**Dimension:** UX

**Issue:** F-023 "file upload simulation" has no spec for mobile file picker, accepted file types, camera capture for document scanning, file size limits, or behavior on non-text uploads (images, PDFs). Sam the SMB Owner is likely on mobile.

**Recommendation:** Add to DocumentProcessor spec: accepted file types `.txt,.pdf,.doc,.docx,image/*`, 5MB client-side size validation, image preview + "We'll extract text" message, PDF text extraction via pdfjs-dist. Clarify upload is "simulation" in demo context with pre-loaded samples as primary path.

**Effort:** MEDIUM | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### NEW MEDIUM Findings

### REV-047 | Demo Interaction History Lost Without Warning on Navigation
**Severity:** MEDIUM
**Reviewers:** 1/13
**Dimension:** UX

**Recommendation:** For demos with meaningful user input (F-024 CompetitiveAnalysis, F-025 DocumentDrafter): add `beforeunload` listener when user has ≥1 interaction. For low-input demos (ChatInterface), intentional loss is acceptable — document per demo type. Alternatively persist to sessionStorage.

**Effort:** SMALL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

### REV-048 | F-007 Social Proof Strip Has No Data Source
**Severity:** MEDIUM
**Reviewers:** 1/13
**Dimension:** Traceability

**Recommendation:** Either (A) hardcode at build time with explicit `// UPDATE THESE` comments and a Phase 1 task to finalize 3-5 real metrics, or (B) add `social_proof` key to `site_config` for admin-updatable metrics. Make the choice explicit in spec.

**Effort:** TRIVIAL | **Decision:** ⬜ APPROVE / REJECT / DEFER

---

## Recommended Action

**Resolve all 10 CRITICAL findings before build begins.** These are not optional — they represent security vulnerabilities (RLS, route exposure, prompt injection), data corruption risks (race conditions, invalid SQL), missing dependencies (PDF generation), UX failures (double-submission, undefined disclaimers), and compliance gaps that would require mid-build rearchitecture if discovered later.

**HIGH findings should be resolved before Phase 4** (demo engine infrastructure), as most HIGH findings affect the demo engine directly.

**MEDIUM findings can be addressed during build** within their respective phases.

Return this document with your APPROVE/REJECT/DEFER decisions on each finding.
