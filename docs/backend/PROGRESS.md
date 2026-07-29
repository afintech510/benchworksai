# BenchworksAI Outbound Engine — Progress & Handoff

**Last updated:** 2026-05-20
**Working directory:** `c:\Users\alark\projects\benchworks-outbound`
**Sibling repo:** `c:\Users\alark\projects\larkin-tech` (marketing site, now serving `benchworksai.com`)
**Live URLs:**
- `https://benchworksai.com` — marketing site + demos (larkin)
- `https://app.benchworksai.com` — ops dashboard (this repo)
- `https://n8n.benchworksai.com` — orchestration
- VPS direct: `5.161.88.134` (Hetzner CPX, `ssh hampton-vps`)

---

## TL;DR — what's running

Everything from the original phase plan is deployed except real-client onboarding and Google OAuth. SSL is on Cloudflare Full (strict). Demo audit passes 7/7. Inbound (larkin) → outbound (this) handoff is live and exercised.

---

## Stack

| Layer | Tech | Status |
|---|---|---|
| Marketing | Next.js 16 (larkin-tech repo) | Live on VPS as `larkintech-blue` |
| Ops dashboard | Next.js 14 (this repo, frontend/) | Live behind hampton_nginx |
| Backend | FastAPI 0.115 (Python 3.11) | Live, `DEBUG=false` |
| Database | Supabase Cloud — 2 projects (benchworks `zycblg…`, larkin `dckvgt…`) | Live, both protected by keep-warm cron |
| Cache / queue / circuit | Redis 7 (auth-protected) | Live |
| Reverse proxy | Caddy (internal) → hampton_nginx (public) | Live with Cloudflare origin cert |
| AI | Anthropic Claude Sonnet 4 | Wired, 7-demo audit passes |
| Orchestration | n8n 2.18.5 (pinned, sqlite) | Live with 6 published workflows |
| Email sending | Smartlead (campaign send) + Resend (transactional) | Smartlead key set, no campaigns yet · Resend key set, domain unverified |
| Booking | Cal.com (cloud) | Webhook live, fires to larkin → handoff → benchworks |
| Notifications | Slack | Not used (operator preference) |

---

## What's done since the initial commit

### n8n — fully live (was the biggest blocker)
- Pinned `n8nio/n8n:2.18.5`, joined `hosthampton_hampton_net`, exposed via `n8n.benchworksai.com`
- **Encryption key rotated off placeholder** (no stored credentials to migrate)
- Refactored 2 workflows that depended on the now-restricted `executeCommand` node to call new FastAPI HTTP endpoints instead (spec SYN-005 compliance: all integrations through FastAPI)
- 6 published workflows running on cron:
  - `bw-deliverability-monitor` (every 6h) — Smartlead REST → `mailbox_pool`
  - `bw-health-monitor` (every 15m) — Redis + Supabase reachability
  - `bw-reply-classification` (every 5m) — pure HTTP
  - `bw-weekly-report` (Mondays 12:00 UTC) — pure HTTP
  - `bw-internal-prospecting` (Mondays 10:00 UTC, F-007) — scores BenchworksAI internal leads via Claude
  - `bw-supabase-keepwarm` (every 4h) — touches both Supabase projects to prevent free-tier auto-pause
- 4 dormant duplicates from earlier UI imports remain as drafts (harmless, delete via UI when convenient)

### Inbound handoff (larkin → benchworks)
- `POST /v1/inbound/handoff` (this repo, [backend/app/routes/inbound.py](backend/app/routes/inbound.py))
- Auth: `LARKIN_SERVICE_KEY` (separate from `SERVICE_KEY_N8N` for rotation independence)
- Idempotent on `(email, "Inbound (Larkin)" campaign)` under the BenchworksAI internal client
- Fires from larkin when:
  - Lead score crosses `tier='on_fire'` ([larkin: lib/nurture/lead-scorer.ts](../larkin-tech/lib/nurture/lead-scorer.ts))
  - Cal.com `BOOKING_CREATED` / `BOOKING_CANCELLED` / `BOOKING_RESCHEDULED` ([larkin: app/api/webhooks/booking-confirmed/route.ts](../larkin-tech/app/api/webhooks/booking-confirmed/route.ts))
- Stage advances forward only (never demotes); booking_status set on book/cancel

### F-007 internal prospecting (was the last unfinished feature)
- `POST /v1/internal/prospect-cycle` — scores unscored leads under the BenchworksAI internal client via Claude, promotes leads >= threshold to `qualified`
- n8n weekly cron `bw-internal-prospecting` calls it
- Smoke-tested: scored 5 existing leads (26–69, threshold 70 → 0 promoted)

### Cal.com (cloud account, no self-hosting)
- Account: adam@benchworksai.com, 3 event types
- Webhook `c358d2fb-934d-…` → `https://benchworksai.com/api/webhooks/booking-confirmed`
- Subscribes BOOKING_CREATED + BOOKING_RESCHEDULED + BOOKING_CANCELLED
- `CALCOM_API_KEY` set on fastapi env (for future API-driven queries)
- Booking embed on `/contact` points to `https://cal.com/adam-benchworksai-com/30min`

### Resend (replaces SendGrid)
- `lib/email/notify.ts` rewritten for Resend
- Larkin env has `RESEND_API_KEY` + `RESEND_FROM="BenchworksAI <onboarding@resend.dev>"`
- Test send succeeded (id `9dce5e96-…`); domain verification still needed before sending to non-self addresses

### Apollo
- `APOLLO_API_KEY` set on fastapi env
- Current tier is free-plan: `organizations/enrich` works, `people/match` + `mixed_people/search` blocked
- Existing CSV import path ([backend/app/scripts/apollo_csv_import.py](backend/app/scripts/apollo_csv_import.py)) handles dashboard exports

### SSL hardening
- Cloudflare zone in **Full (strict)** mode
- Origin cert (15-yr Cloudflare Origin CA, `*.benchworksai.com, benchworksai.com`) installed at `/etc/ssl/benchworksai/` on VPS
- hampton_nginx terminates HTTPS for all 4 hosts (apex + www + app + n8n)
- HTTP :80 returns 301 → HTTPS at origin (direct-IP visitors only; Cloudflare hits :443)
- [backend/app/scripts/nginx_ssl_rewrite.py](backend/app/scripts/nginx_ssl_rewrite.py) is the idempotent patcher used for cutover

### Repos
- `https://github.com/afintech510/benchworksai-outbound` — `main` branch, current
- `https://github.com/afintech510/larkin-tech` — `main` branch, current

### Domain split
- `benchworksai.com` (apex + www) → larkin marketing
- `app.benchworksai.com` → ops dashboard (this repo)
- `n8n.benchworksai.com` → n8n editor (basic auth: `admin / benchworks-n8n-2026`)
- Internal hub at [/internal](https://benchworksai.com/internal) (noindex, never linked from nav) — every URL, ops UI, infra dashboard, raw API endpoint, and credentials note. Send `/explore` to clients instead.

---

## Pre-launch checklist

| Item | Status |
|---|---|
| Cloudflare SSL Flexible → Full (strict) with origin cert | ✅ |
| `DEBUG=false` on FastAPI | ✅ |
| Rotate `N8N_ENCRYPTION_KEY` off placeholder | ✅ |
| Rotate `LARKIN_SERVICE_KEY` / `BENCHWORKS_HANDOFF_KEY` | ✅ |
| Replace dev credentials login with Google OAuth | ⏳ next-biggest engineering item |
| Rotate external vendor keys exposed in chat history (Anthropic, Smartlead, Cal.com, Resend, Apollo) | ⏳ requires you to generate new ones in each vendor dashboard |
| Resend sending domain verification (`notifications.benchworksai.com`) | ⏳ needed before nurture emails reach non-self recipients |
| Supabase Pro upgrade (kills the keep-warm hack) | ⏳ ~$25/mo per project |

---

## What's still NOT done

- **Real client onboarding** — only the seed BenchworksAI internal client exists
- **Smartlead campaigns** — no campaigns provisioned, no leads sent
- **Slack notifications** — operator preference (no Slack)
- **Tier-2 Playwright tests** — never written
- **action_log archival cron** (Phase 07)
- **Operator runbook + DR drill** (Phase 07)
- **Performance audit / N+1 check** (Phase 07)

---

## Useful endpoints (curl-friendly)

| URL | Auth |
|---|---|
| `https://app.benchworksai.com/v1/health` | none |
| `https://benchworksai.com/api/health` | none |
| `POST /v1/inbound/handoff` | `X-Service-Key: $LARKIN_SERVICE_KEY` |
| `POST /v1/internal/keep-warm` | `X-Service-Key: $SERVICE_KEY_N8N` |
| `POST /v1/internal/health-check` | `X-Service-Key: $SERVICE_KEY_N8N` |
| `POST /v1/internal/deliverability-check` | `X-Service-Key: $SERVICE_KEY_N8N` |
| `POST /v1/internal/prospect-cycle?limit=25` | `X-Service-Key: $SERVICE_KEY_N8N` |
| `https://benchworksai.com/admin/audit` | `Authorization: Bearer $ADMIN_SECRET` (one-click 7-demo E2E test) |

---

## Reference files

| File | Purpose |
|---|---|
| `benchworks-outbound-buildplan.md` | Original 9-phase plan |
| `benchworks-outbound-spec-v2.md` | Architecture spec (LOCKED) |
| `benchworks-outbound-sow.md` | Statement of work (v1.1) |
| `backend/app/scripts/demo_audit.sh` | Shell version of the 7-demo audit |
| `backend/app/scripts/nginx_ssl_rewrite.py` | One-shot nginx HTTPS patcher |
| `backend/app/scripts/apollo_csv_import.py` | Apollo dashboard CSV → Supabase importer |
| `supabase/migrations/all_migrations.sql` | Combined migrations for SQL Editor paste |
| `~/.claude/projects/c--Users-alark-projects/memory/benchworks-supabase.md` | DB credentials |
| `~/.claude/projects/c--Users-alark-projects/memory/benchworks-strategy.md` | 3 niches + 12 Apollo filter sets (LOCKED) |

---

## Recommended next moves

1. **Google OAuth swap-in** — only real engineering left before live-client safe. Spec section 7.1 has the design.
2. **Resend domain verification** + flip `RESEND_FROM` to `adam@notifications.benchworksai.com` so nurture emails can ship to real recipients.
3. **First real-client onboarding** through `/clients/new` — Smartlead campaign provision, ICP scoring, first sequence.
4. **Phase 07** (hardening + docs + DR drill).
