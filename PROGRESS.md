# BenchworksAI Outbound Engine — Progress & Handoff

**Last updated:** 2026-05-02
**Working directory:** `c:\Users\alark\projects\benchworks-outbound`
**Live URL:** https://app.benchworksai.com (Cloudflare Flexible SSL — pre-launch hardening required)
**VPS direct:** http://5.161.88.134:3005

---

## Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) | Live on VPS |
| Backend | FastAPI (Python 3.11) | Live on VPS |
| Database | Supabase Cloud (PostgreSQL + RLS) | Provisioned, 12 tables, seed data loaded |
| Cache/Queue | Redis 7 (auth-protected) | Live on VPS |
| Reverse proxy | Caddy (internal) → hampton_nginx (public) | Live |
| AI | Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`) | Wired, smoke-tested |
| Orchestration | n8n | **NOT RUNNING** (workflows authored only) |
| Email sending | Smartlead | API key wired, no campaigns sent yet |
| Booking | Cal.com | **NOT RUNNING** |
| Notifications | Resend / Slack | **NOT WIRED** |

---

## What's Complete

### Phase 00: Environment Setup ✅
- Project scaffolding (Next.js + FastAPI + Docker Compose)
- Caddy reverse proxy with X-Request-ID injection
- Redis with `--requirepass` + appendonly
- `.env.example` with all variables documented
- FastAPI `/v1/health` endpoint

### Phase 01: Schema + Auth + Infrastructure ✅ (with deferrals)
- All 12 Supabase migrations applied to live project (`zycblgaakmzzuxyisjoh`)
  - `system_config`, `clients`, `campaigns`, `mailbox_pool`, `leads`, `reply_events`, `sequence_templates`, `suppression_list`, `action_log`, `action_log_archive`, `client_reports`, `sessions`
- RLS enabled on all client-scoped tables
- Append-only RLS on `action_log` (no UPDATE/DELETE policies)
- BenchworksAI internal client + 10 system_config rows seeded
- `client_summary_mv` materialized view created
- `updated_at` auto-trigger function
- FastAPI JWT middleware (HS256) + sessions table integration
- Service key auth middleware (restricted n8n role)
- Rate limiting (slowapi + Redis + X-Forwarded-For trust)
- POST `/v1/auth/logout` endpoint
- Structured logging with request_id
- **DEFERRAL:** Google OAuth swapped for `CredentialsProvider` dev login (admin@benchworksai.com / benchworks2026). See pre-launch checklist.

### Phase 02a: Webhook Handlers + Smartlead ✅
- Shared webhook security middleware (HMAC-SHA256 + ±5min timestamp + Redis SETNX dedup, 60-min TTL)
- POST `/v1/webhooks/smartlead/reply` (validates → matches lead → stores raw, classification deferred)
- POST `/v1/webhooks/smartlead/bounce` (validates → adds to suppression → stage update)
- POST `/v1/webhooks/calcom/booking` (email match → domain fallback → unmapped path)
- POST `/v1/webhooks/calcom/cancelled` (no stage revert per SYN-024, Redis re-engagement schedule)
- Suppression list CRUD (GET/POST/DELETE `/v1/suppression`)
- Suppression check integrated into lead import path
- CAN-SPAM template validation + auto-append logic
- Smartlead unsubscribe sync via CLI subprocess wrapper

### Phase 02b: AI Pipelines ✅
- Anthropic client with `tool_choice` for structured JSON
- Reply classification (6 categories: interested, not_interested, ooo, referral, question, unsubscribe + confidence + sentiment)
- ICP scoring (5 criteria: company_size/20, title_match/25, geography/20, ai_tools/15, digital_presence/20)
- Sequence copy generation (subject + body per step, merge tags `{{first_name}}`, `{{company_name}}`)
- Report narrative generation (plain text)
- Pre-call brief generation (markdown)
- Confidence routing (≥0.85 auto, <0.85 sets `needs_review = true`)
- Redis-backed circuit breaker (5 failures → trip, 300s TTL recovery, fails open if Redis down)

### Phase 03: n8n Orchestration ⚠️ PARTIAL
- 4 workflow JSON templates authored in `n8n/workflows/`:
  - `reply-classification.json` (every 5 min)
  - `health-monitor.json` (every 15 min)
  - `deliverability-monitor.json` (every 6 hours)
  - `weekly-report.json` (Mondays 12:00 UTC)
- README with import instructions
- **GAP:** n8n is NOT running on the VPS. None of the cron-driven features (deliverability monitoring, weekly reports, health alerts, internal prospecting) are actually executing.
- **GAP:** Internal prospecting cron (F-007) workflow not yet authored.

### Phase 04: MCP Server + Agent ✅
- 13 MCP tools registered with real Supabase implementations
- MCP protocol handler at `/v1/mcp` (`/tools` and `/call` endpoints)
- All tool calls log to `action_log` with `initiated_by='agent'`
- POST `/v1/agent/command` — single-turn Claude agent with tool use
- End-to-end smoke test passing: NL prompt → Claude → tool → Supabase → final answer

### Phase 05: Dashboard ✅
- All pages built (12 routes)
- BFF proxy with JWT cookie forwarding + X-Forwarded-For
- React Query 30s stale time
- Sidebar nav, CommandBar (Ctrl+K), all empty/error/loading states
- Dev login flow live
- **NOTE:** Placeholder `app/page.tsx` was deleted so `(dashboard)/page.tsx` resolves at `/`

### Phase 06: Testing Suite ⚠️ PARTIAL
- Tier-1 pytest written:
  - `test_auth.py`, `test_webhooks.py`, `test_compliance.py`, `test_classification.py`, `test_suppression.py`
  - 50 labeled classification fixtures in `tests/fixtures/classification_replies.json`
- **GAP:** Tier-2 Playwright tests NOT written
- **GAP:** Tests not yet executed against live Supabase + Anthropic

---

## Deployment State

### Running on VPS (`hampton-vps` / `5.161.88.134`)
```
benchworks-outbound-caddy-1     port 3005:80, joined hosthampton_hampton_net
benchworks-outbound-nextjs-1    internal :3000
benchworks-outbound-fastapi-1   internal :8000
benchworks-outbound-redis-1     internal :6379, password protected
```

### Public routing
- DNS: `app.benchworksai.com` → A record → `5.161.88.134`
- Cloudflare: Flexible SSL mode (HTTPS to visitor, HTTP to origin) — **TEMPORARY**
- nginx (`hampton_nginx`): server block for `app.benchworksai.com:80` → `benchworks-outbound-caddy-1:80`
- Caddy: routes `/v1/*` → fastapi:8000, everything else → nextjs:3000

### Configured credentials
- Supabase URL + anon key + service_role key
- Anthropic API key
- Smartlead API key + generated webhook secret (`d92ad47d82c8df3ce08f7a7838039c07c75abc02496996f51e3d7147e5137aaf`)
- Dev login: `admin@benchworksai.com` / `benchworks2026`
- Service key: `benchworks-service-key`
- Redis password: `benchworks-redis-pw`

All live config is in `/opt/benchworks-outbound/docker-compose.vps.yml` on the VPS.

---

## What's NOT Done

### Pre-launch hardening (TRACKED — don't go live without these)
1. Cloudflare SSL: Flexible → Full (strict) with origin cert
2. Replace dev credentials login with Google OAuth or hashed user records
3. Rotate Smartlead webhook secret + Anthropic key (both pasted in chat history)
4. Set `DEBUG=false` in FastAPI env
5. n8n credentials and any secrets need to be encrypted at rest

### Functional gaps
1. **n8n not deployed** — no cron-driven jobs running
2. **Internal prospecting workflow (F-007) not authored**
3. **Cal.com not deployed** — `/v1/webhooks/calcom/*` handlers ready but no Cal.com instance
4. **Notification webhooks unconfigured** — Slack `SLACK_WEBHOOK_*` env vars empty, Resend `RESEND_API_KEY` empty
5. **Apollo API key empty** — lead enrichment will fail
6. **No real client onboarded yet** — only the BenchworksAI seed client; no campaigns launched, no leads imported, no Smartlead campaigns provisioned
7. **Tier-2 Playwright tests not written**
8. **Tests never run against live infrastructure**

### Phase 07 scope (NOT STARTED)
- Security audit (RLS review, rate limits, auth flows, key storage)
- DR drill (pg_restore to fresh Supabase project, verify RLS + FKs)
- action_log archival cron (>90 days → `action_log_archive`)
- Operator runbook
- Client onboarding checklist
- Demo walkthrough script (F-007 live proof)
- Deploy rollback procedure
- Performance audit (query indexes, N+1 check, <2s page load target)

### Phase 08 scope (NOT STARTED)
- Visual/UX validation in real browser (Claude in Chrome on live app)
- Human-driven, not automated

---

## Reference Files

| File | Purpose |
|------|---------|
| `benchworks-outbound-buildplan.md` | Master phase plan (9 phases, 22 SOW features) |
| `benchworks-outbound-spec-v2.md` | Architecture spec (LOCKED) — schema, API design, webhook handlers, circuit breaker spec |
| `benchworks-outbound-sow.md` | Statement of work (v1.1) — 31 features, 7 delivery phases, 10 risks |
| `benchworks-outbound-phase-00-environment.md` ... `phase-06-testing.md` | Phase operator prompts |
| `agent-vps-operations.md` | VPS SSH access, Docker architecture, deployment procedures |
| `supabase/migrations/all_migrations.sql` | Combined migrations for SQL Editor paste |
| `~/.claude/projects/c--Users-alark-projects/memory/benchworks-supabase.md` | DB credentials (saved to user's Claude Code memory) |
| `~/.claude/projects/c--Users-alark-projects/memory/benchworks-prelaunch.md` | Pre-launch hardening checklist |

**Phase 07 and 08 operator prompt files do NOT exist on disk.** Work from the buildplan summary or have the user generate them.

---

## Recommended Next Steps (in order)

1. **Stand up n8n on the VPS** — add `n8n` service to `/opt/benchworks-outbound/docker-compose.vps.yml`, configure with Supabase Postgres backing or its own SQLite. Import the 4 workflow JSONs. Configure env vars. Verify the health-monitor cron fires and reaches FastAPI.
2. **Author the F-007 internal prospecting workflow** (missing from `n8n/workflows/`)
3. **End-to-end smoke test with real data**: onboard a test client via `/clients/new`, launch a campaign, fire a synthetic Smartlead reply webhook, see it classified, watch it land in the review queue if confidence is low.
4. **Run tier-1 pytest** against live infrastructure. Fix any breakage.
5. **Then move to Phase 07** (hardening + docs + archival cron + runbook + demo script).
6. **Phase 08** (visual validation) — only after 07 and a real-data demo work.

Alternative path: skip n8n for now and go straight to Phase 07 if user wants documentation/audit complete before further integration. Surface this tradeoff explicitly.
