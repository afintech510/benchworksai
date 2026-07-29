# BenchworksAI Outbound — AGENTS.md

AI outbound sales engine: Apollo → Smartlead campaigns, Claude lead scoring & reply classification, orchestrated by n8n, with a Next.js ops dashboard and FastAPI backend on Supabase.

> Operating runbook for agents and operators. Verified against repo files on 2026-06-12. Some fleet/VPS facts live outside this repo and are marked **(fleet, verify on box)**. Cross-reference `agent-vps-operations.md` (general VPS guide) and `PROGRESS.md` (live state of this project). Never print secret values.

---

## 1. What this is

An AI-driven B2B outbound sales platform. Core pipeline: Apollo enrichment → Claude ICP scoring → import qualified leads to Smartlead → Smartlead sends sequences → replies are classified by Claude → bookings via Cal.com. n8n runs the scheduled glue; all integrations route through the FastAPI service (spec rule SYN-005). A sibling repo (`larkin-tech`, serves `benchworksai.com`) hands inbound leads to this repo via `POST /v1/inbound/handoff`.

## 2. Stack

| Layer | Tech |
|---|---|
| Ops dashboard | Next.js 14.2 (App Router), next-auth 4, @tanstack/react-query 5, @supabase/supabase-js 2, Tailwind 3 (`frontend/`) |
| Backend API | FastAPI 0.115, Python 3.11, uvicorn, pydantic 2 / pydantic-settings, structlog, slowapi (rate limit), supabase-py, anthropic 0.42, httpx, tenacity (`backend/`) |
| Database | Supabase Cloud (Postgres) |
| Cache / queue / rate-limit store | Redis 7 (password-protected) |
| Orchestration | n8n (image pinned `n8nio/n8n:2.18.5` on the VPS; compose default tag is `:latest` — pin before deploy) |
| Booking | Cal.com (cloud account; a `calcom` service exists in `docker-compose.yml` but prod uses the hosted account) |
| Reverse proxy | Caddy 2 (internal, HTTP only) behind shared `hampton_nginx` (public TLS) |
| AI | Anthropic Claude (Sonnet 4) |
| Email | Smartlead (campaign send) + Resend (transactional) |

## 3. Where it runs

- **Host:** single Hetzner VPS, IP `5.161.88.134`, SSH alias `hampton-vps` (user `root`, key `~/.ssh/id_ed25519_headless`). Cloudflare in front (Full strict).
- **/opt path:** **(fleet, verify on box)** deployed under `/opt` alongside other projects (e.g. `/opt/hosthampton`, `/opt/easternlm-web`). Confirm the exact directory with `ssh hampton-vps 'ls /opt'` — it is not recorded in this repo.
- **Domains:**
  - `app.benchworksai.com` → ops dashboard (this repo's `nextjs` + `/v1/*` API via `fastapi`)
  - `n8n.benchworksai.com` → n8n editor (basic auth)
  - `benchworksai.com` (apex + www) → the **larkin-tech** marketing site, NOT this repo
- **Proxy / network:** `docker-compose.yml` defines its own `caddy` service. The Caddyfile (`docker/Caddyfile`) sets `auto_https off` and listens on **`:80` only** — it does NOT terminate TLS despite compose publishing `80:80` and `443:443`. Public HTTPS is terminated by the shared `hampton_nginx` container (owned by the host-hampton-ops repo at `/opt/hosthampton`, config `/opt/hosthampton/nginx/nginx.conf`), which proxies to this stack. On the VPS the app containers join `hosthampton_hampton_net` so nginx can reach them. **(fleet)** `os-adam` references reaching this stack at `host.docker.internal:3005` — the repo compose does NOT bind 3005; if a host-port mapping exists it was added on the box, so confirm with `ssh hampton-vps 'docker ps'` rather than trusting either source.
  - Caddy internal routes (`docker/Caddyfile`): `/v1/*` → `fastapi:8000`, `/n8n/*` → `n8n:5678` (strips `/n8n`), `/book/*` → `calcom:3000` (strips `/book`), everything else → `nextjs:3000`. Caddy injects `X-Request-ID` on every request.

## 4. Run locally

Uses `docker-compose.dev.yml` (3 services: `caddy` on `:80`, `nextjs` on `:3000`, `fastapi` on `:8000`, plus `redis`). It ships placeholder Supabase/secret values inline, so the API starts but DB calls fail until you point at a real project.

```bash
# from repo root
docker compose -f docker-compose.dev.yml up --build
# nextjs:  http://localhost:3000
# fastapi: http://localhost:8000   (health: http://localhost:8000/v1/health)
# caddy:   http://localhost:80     (routes to both)
```

Backend tests (run from repo root via Makefile):

```bash
make test-tier1     # pytest tests/tier1 (marker: tier1)
make test-tier2     # pytest tests/tier2
make test-all
```

The `make health-check` target curls `http://localhost:80/v1/health`. Tier-2 Playwright tests are noted as not yet written (`PROGRESS.md`).

## 5. Deploy

No GitHub Actions / CI for this repo — deployment is **manual `docker compose` on the VPS** (repo: `https://github.com/afintech510/benchworksai-outbound`, branch `main`). The production compose is `docker-compose.yml` (6 services: caddy, nextjs, fastapi, n8n, calcom, redis), reading all secrets from a `.env` file that lives only on the VPS (gitignored).

```bash
ssh hampton-vps                       # then on the box:
cd /opt/<benchworks-dir>              # verify actual path: ls /opt
git pull
docker compose up -d --build          # or: make rebuild
docker compose ps                     # confirm all 6 healthy
```

Operational rules from the fleet runbook apply: always `git pull` before building; never force-push `main`; pin the n8n image tag (the VPS runs `n8nio/n8n:2.18.5`, not `:latest`) so workflows don't break on upgrade.

## 6. Database

- **Provider:** Supabase Cloud, project name **benchworks** (project ref is abbreviated `zycblg…` in `PROGRESS.md`; the full ref + keys are NOT committed — they live in the operator's memory file, do not reproduce them). A second project **larkin** (`dckvgt…`) belongs to the sibling repo.
- **Connection (names only):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`.
- **Migrations:** `supabase/migrations/` — `001_core_tables.sql`, `002_updated_at_triggers.sql`, `003_rls_policies.sql`, `004_materialized_view.sql`, `005_seed_data.sql`, plus `all_migrations.sql` (concatenation of the above for one-shot paste).
- **How to apply:** there is no Supabase CLI config in this repo. Apply by pasting `supabase/migrations/all_migrations.sql` into the Supabase **SQL Editor** for the benchworks project (per `PROGRESS.md`). Apply individual files in numeric order if doing incrementally.
- **Key tables (`001_core_tables.sql`):** `system_config`, `clients`, `campaigns`, `mailbox_pool`, `leads`, `reply_events`, `sequence_templates`, `suppression_list`, `action_log`, `action_log_archive`, `client_reports`, `sessions`. Plus materialized view `client_summary_mv` (`004`, refreshed on a schedule — see Cron). RLS policies in `003`.

## 7. Environment & secrets

Secrets live in a `.env` file **on the VPS only** (gitignored; `.env` and `.env.local` are excluded, as are `*.pem`/`*.key`). `.env.example` is the committed template. Backend settings are bound in `backend/app/config.py`.

Required / used variable **names** (no values):

- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- Redis: `REDIS_PASSWORD`, `REDIS_URL`
- Smartlead: `SMARTLEAD_API_KEY`, `SMARTLEAD_WEBHOOK_SECRET`
- Apollo: `APOLLO_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Cal.com: `CALCOM_WEBHOOK_SECRET`, `CALCOM_DATABASE_URL`, `CALCOM_ENCRYPTION_KEY` (and `CALCOM_API_KEY` on the deployed env per `PROGRESS.md`, not in `.env.example`)
- Resend: `RESEND_API_KEY`
- Slack (defined but unused per operator preference): `SLACK_WEBHOOK_ALERTS`, `SLACK_WEBHOOK_REPLIES`, `SLACK_WEBHOOK_BOOKINGS`
- n8n: `N8N_BASIC_AUTH_ACTIVE`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`, `N8N_DB_TYPE`, `N8N_DB_POSTGRESDB_HOST`, `N8N_DB_POSTGRESDB_PORT`, `N8N_DB_POSTGRESDB_DATABASE`, `N8N_DB_POSTGRESDB_USER`, `N8N_DB_POSTGRESDB_PASSWORD` (note: the live VPS n8n runs on sqlite per `PROGRESS.md`; also requires `N8N_ENCRYPTION_KEY` — keep off the placeholder)
- Service keys: `SERVICE_KEY_N8N` (n8n→FastAPI, header `X-Service-Key`), `LARKIN_SERVICE_KEY` (larkin→FastAPI inbound handoff; bound in `config.py` as `larkin_service_key`, deployment-only — not in `.env.example`)
- Frontend: `FRONTEND_URL`

Never commit `.env`; never log API keys (spec SYN-029).

## 8. Cron / scheduled jobs

n8n runs the schedule (6 published workflows on the VPS; definitions in `n8n/workflows/`, see `n8n/workflows/README.md`). All call FastAPI over HTTP with `X-Service-Key: $SERVICE_KEY_N8N`:

| Workflow | Schedule | Purpose |
|---|---|---|
| `bw-reply-classification` | `*/5 * * * *` | classify new replies via Claude |
| `bw-health-monitor` | `*/15 * * * *` | Redis + Supabase reachability |
| `bw-deliverability-monitor` | `0 */6 * * *` | Smartlead REST → `mailbox_pool` health |
| `bw-supabase-keepwarm` | every 4h | touch both Supabase projects (free-tier anti-pause) |
| `bw-internal-prospecting` | Mondays 10:00 UTC | score internal leads (F-007), promote ≥ threshold to `qualified` |
| `bw-weekly-report` | Mondays 12:00 UTC | aggregate metrics → Claude narrative → Resend |

(Schedules per `PROGRESS.md`, which supersedes the slightly different cadences listed in `n8n/workflows/README.md` — trust the live values when they differ.) `client_summary_mv` refresh is commented out in `004_materialized_view.sql`; enable via `cron.schedule` or an n8n step if needed. `action_log` archival cron is noted as not yet done.

## 9. Day-to-day cheat sheet

```bash
# local dev up
docker compose -f docker-compose.dev.yml up --build

# health (local)
curl -s http://localhost:8000/v1/health

# health (prod, via Cloudflare/nginx)
curl -s https://app.benchworksai.com/v1/health

# VPS: status of all containers
ssh hampton-vps 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# VPS: deploy this stack (confirm /opt dir first)
ssh hampton-vps 'cd /opt/<benchworks-dir> && git pull && docker compose up -d --build'

# VPS: tail backend / dashboard logs
ssh hampton-vps 'cd /opt/<benchworks-dir> && docker compose logs -f fastapi'

# trigger internal prospecting cycle (service-key auth)
curl -s -X POST "https://app.benchworksai.com/v1/internal/prospect-cycle?limit=25" -H "X-Service-Key: $SERVICE_KEY_N8N"

# run backend tests
make test-tier1
```

## 10. Key files

| Path | What |
|---|---|
| `docker-compose.yml` | prod stack (6 services); secrets from `.env` |
| `docker-compose.dev.yml` | local stack (caddy/nextjs/fastapi/redis, inline placeholders) |
| `docker/Caddyfile` | internal reverse-proxy routes, `auto_https off`, X-Request-ID |
| `Makefile` | up/down/logs/rebuild/health-check/test targets |
| `backend/app/main.py` | FastAPI app + router registration + request-id middleware |
| `backend/app/config.py` | all env var bindings (source of truth for names) |
| `backend/app/routes/` | API routers (clients, campaigns, leads, webhooks, inbound, internal, agent, …) |
| `supabase/migrations/` | schema (`001`–`005`) + `all_migrations.sql` |
| `n8n/workflows/` | importable workflow JSON + README |
| `frontend/` | Next.js 14 ops dashboard |
| `PROGRESS.md` | authoritative live-state / handoff doc |
| `agent-vps-operations.md` | general VPS/SSH/Docker runbook (all projects) |
| `benchworks-outbound-spec-v2.md` | locked architecture spec |

## 11. Gotchas / operational rules

- **Caddy ≠ TLS here.** Caddy is HTTP-only (`auto_https off`, `:80`). Public HTTPS is `hampton_nginx` (Cloudflare Origin cert at `/etc/ssl/benchworksai/` on the box). Don't expect Caddy to manage certs.
- **`benchworksai.com` apex is NOT this repo** — it's the larkin-tech marketing site. This repo owns `app.` and `n8n.` only.
- **All integrations go through FastAPI** (spec SYN-005). n8n's `executeCommand` node is restricted on the box; never reintroduce shelling out — call a FastAPI endpoint instead.
- **Pin n8n.** VPS runs `n8nio/n8n:2.18.5`; the compose default `:latest` will drift. Don't rotate the n8n encryption key without care (currently off-placeholder, no stored creds historically).
- **Two service keys, rotate independently:** `SERVICE_KEY_N8N` (internal cron) and `LARKIN_SERVICE_KEY` (inbound handoff).
- **Supabase free tier** auto-pauses; the `bw-supabase-keepwarm` cron prevents it. Don't disable it until Pro upgrade.
- **Apollo is free-tier:** `organizations/enrich` works; `people/match` + `mixed_people/search` are blocked. Use `backend/app/scripts/apollo_csv_import.py` for dashboard CSV exports.
- **Resend domain unverified:** transactional email only reaches self-addresses until `notifications.benchworksai.com` is verified.
- **Auth is still dev-credentials login** — Google OAuth env vars exist but the swap-in is not done. Treat the dashboard as not yet hardened for external users.
- **Secrets:** `.env`/`*.pem`/`*.key` are gitignored and VPS-only. Full Supabase ref + keys live in the operator's memory file, never in the repo — do not print or commit them.
- **Stale path note:** `PROGRESS.md` headers reference `c:\Users\alark\...`; the actual checkout here is `C:\Users\adam\projects\benchworksai-outbound`. Same repo, different machine/user.
- **VPS disk runs hot** (fleet): `docker image prune -f` periodically; never restart shared `hampton_redis`/`hampton_nginx` without warning — they serve other projects.
