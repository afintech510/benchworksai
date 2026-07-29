# Larkin Tech

AI SaaS platform: interactive demos, lead nurturing, and drip campaigns.

## What this is

A Next.js web app (`larkintech.ai`) that showcases interactive AI demos across business verticals, captures leads, and runs automated email drip / nurture campaigns. Backed by Supabase (Postgres + Auth + Storage) and the Anthropic API. Deployed to a single VPS using a self-contained blue-green setup behind its own nginx reverse proxy.

## Stack

- **Framework:** Next.js 16 (`next@16.2.1`, App Router, standalone output), React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Data/Auth:** Supabase (`@supabase/supabase-js`), Postgres 17
- **AI:** `@anthropic-ai/sdk`
- **Email:** SendGrid
- **Other libs:** `zod`, `react-hook-form`, `jose` (JWT), `pino` (logging), `recharts`, `mermaid`, `@react-pdf/renderer`
- **Tooling:** ESLint 9 (`eslint-config-next`), `tsx`, Playwright + `@axe-core/playwright` (a11y), Lighthouse CI (`@lhci/cli`)
- **Runtime image:** `node:20-alpine`

## Where it runs

- **Host:** Hetzner VPS `5.161.88.134` (ssh alias `hampton-vps`, user `root`), Cloudflare in front.
- **Path on VPS:** `/opt/larkin-tech`
- **Domain:** `larkintech.ai` (TLS via Let's Encrypt / certbot; certs mounted read-only from `/etc/letsencrypt`)
- **Reverse proxy:** This project runs its **own** `nginx-proxy` container (`larkintech-nginx`) that owns ports `80` and `443` on the host.
- **Shared network:** App + cron containers join the external Docker network `hosthampton_hampton_net` (defined in `docker-compose.vps.yml`, provided by host-hampton-ops).
- **Blue-green:** Two app containers — `larkintech-blue` and `larkintech-green` — each expose container port `3000`. In local compose they map to host `3200`→3000 (blue) and `3201`→3000 (green). nginx routes to whichever is active via `docker/upstream.conf`.

## Run locally

```bash
# 1. Install deps
npm ci

# 2. Configure env
cp .env.example .env.local   # then fill in values

# 3. Start Supabase locally (Studio :54323, API :54321, DB :54322)
npx supabase start

# 4. Apply migrations to the local DB
npx supabase db reset        # rebuilds local DB from migrations/ + seed.sql

# 5. Run the dev server (http://localhost:3000)
npm run dev
```

Other useful scripts (from `package.json`):

```bash
npm run build        # next build
npm run start        # next start (production)
npm run lint         # eslint
npm run type-check   # tsc --noEmit
npm run lighthouse   # Lighthouse CI autorun
npm run audit:a11y   # tsx scripts/audit-a11y.ts
```

## Deploy

Deployment is automated via GitHub Actions and a blue-green shell script on the VPS.

**CI pipeline — `.github/workflows/deploy.yml`** (triggers on push to `main`, or manual `workflow_dispatch`):

1. Checkout + Docker Buildx.
2. Log in to GHCR (`ghcr.io`) using `github.actor` + `GITHUB_TOKEN`.
3. Build and push the image to `ghcr.io/<repo>/larkintech-app`, tagged `:latest` and `:<git-sha>` (GHA layer cache). `NEXT_PUBLIC_*` build args are injected from repo secrets.
4. SSH to the VPS (`appleboy/ssh-action`): `cd /opt/larkin-tech && git pull && chmod +x scripts/deploy.sh && ./scripts/deploy.sh`.
5. Verify health by curling `http://localhost:3200/api/health` (falls back to `:3201`) and grepping for `"healthy"`.

**`scripts/deploy.sh` (blue-green):**

- Detects the active color by inspecting `docker/upstream.conf`.
- Tags the current image as `:previous`, then `docker pull`s `ghcr.io/afintech510/larkin-tech/larkintech-app:latest`.
- Brings up the **inactive** color (`docker compose --profile <target> up -d app-<target>`).
- Waits up to 30s (2s interval) for `http://localhost:3000/api/health` inside the new container. On failure it stops/removes the new container and leaves the old one active (deploy aborts).
- On success, rewrites `docker/upstream.conf` to point `larkintech_backend` at the new container and runs `docker exec larkintech-nginx nginx -s reload`.
- Stops + removes the old container and prunes dangling images.

**Rollback:**

```bash
cd /opt/larkin-tech
./scripts/deploy.sh --rollback   # flips upstream back to the other color (must still be running)
```

> Note: `scripts/deploy.sh` references `docker-compose.yml`. The `*.vps.yml` overlay supplies the shared external network; confirm the actual compose invocation on the host before relying on port mappings.

## Database

- **Supabase project ref:** `larkin-tech` (`supabase/config.toml`), Postgres major version **17**.
- **Local ports:** API `54321`, DB `54322`, Studio `54323` (config.toml also defines pooler/inbucket/analytics ports).
- **Migrations:** `supabase/migrations/`
  - `20260327000000_initial_schema.sql`
  - `20260327000001_storage_buckets.sql`
- **Seed data:** `supabase/seed.sql` (applied by `supabase db reset`).

Workflow:

```bash
npx supabase migration new <name>   # scaffold a new migration
npx supabase db reset               # rebuild local DB from migrations + seed
npx supabase db push                # push migrations to the linked remote project
```

**Key tables** (from the initial schema): `site_config`, `demo_types`, `verticals`, `vertical_content`, `demo_leads`, `inquiries`, `demo_sessions`, `demo_interactions`, `demo_cached_responses`, `rate_limits`, `lead_magnet_downloads`, `competitive_analyses`, `api_usage_log`, `vertical_disclaimer_acknowledgments`, `notification_outbox`, `lead_scores`, `drip_campaigns`, `drip_enrollments`, `drip_messages`.

## Environment & secrets

**App env vars** (see `.env.example`; copy to `.env.local` — never commit secrets):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SENDGRID_API_KEY`
- `JWT_SECRET`, `ADMIN_SECRET`
- `ADMIN_ALLOWED_IPS`, `NEXT_PUBLIC_SITE_URL`
- `INTERNAL_API_SECRET` (optional)

The three `NEXT_PUBLIC_*` vars are also baked in at **build time** as Docker `ARG`s (see `Dockerfile`). Containers read runtime env from `.env.local` via `env_file`.

**GitHub repo secrets used by CI** (`.github/workflows/deploy.yml`):

- `GITHUB_TOKEN` (built-in, for GHCR push)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (build args)
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` (SSH deploy)

## Cron

- **`drip-cron`** (`larkintech-drip-cron`): a long-running container that executes `scripts/process-drip.ts` every **15 minutes** (`sleep 900` loop). It processes scheduled drip campaign steps and the notification outbox (pending SendGrid emails). Defined in both `docker-compose.yml` and `docker-compose.vps.yml`.

## Day-to-day cheat sheet

```bash
npm run dev                                   # local dev server on :3000
npx supabase start                            # boot local Supabase stack
npx supabase db reset                         # rebuild local DB from migrations + seed
npm run type-check && npm run lint            # pre-commit checks

ssh hampton-vps                               # → root@5.161.88.134
docker ps                                     # see larkintech-{blue,green,nginx,drip-cron}
cat /opt/larkin-tech/docker/upstream.conf     # which color is live
docker logs -f larkintech-drip-cron           # watch drip processor
cd /opt/larkin-tech && ./scripts/deploy.sh --rollback   # emergency rollback
```

## Key files

- `Dockerfile` — multi-stage build (deps → builder → runner), Next.js standalone, exposes `3000`.
- `docker-compose.yml` — local/host compose: `app-blue` (3200→3000), `app-green` (3201→3000, `green` profile), `drip-cron`, `nginx-proxy` (80/443). Uses GHCR images.
- `docker-compose.vps.yml` — VPS overlay: `app-blue` + `drip-cron` joined to external network `hosthampton_hampton_net`, app `expose`d (no host port), local image tag `larkin-tech-app:latest`.
- `scripts/deploy.sh` — blue-green deploy + `--rollback`.
- `scripts/process-drip.ts` — drip / outbox processor run by `drip-cron`.
- `scripts/backup.sh` — backup helper.
- `.github/workflows/deploy.yml` — build → push GHCR → SSH deploy → health check.
- `docker/nginx.conf` — nginx config: HTTP→HTTPS redirect, ACME challenge, TLS termination for `larkintech.ai`, security headers/CSP, proxy to `larkintech_backend`.
- `docker/upstream.conf` — the `larkintech_backend` upstream; rewritten by `deploy.sh` on each blue-green switch.
- `app/api/health/route.ts` — health endpoint used by container healthchecks and CI.
- `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql` — database definition.

## Gotchas

- **Blue-green upstream switching:** The live color is determined solely by the contents of `docker/upstream.conf` (the script greps for `larkintech-green`). Never hand-edit it during a deploy. After editing, nginx must be reloaded (`docker exec larkintech-nginx nginx -s reload`) — `deploy.sh` does this for you. Rollback only works if the previous color's container is still running.
- **GHCR auth:** Pulling on the VPS and pushing from CI require GHCR auth. CI uses the built-in `GITHUB_TOKEN`; on the VPS you must be logged in (`docker login ghcr.io`) for `docker pull ghcr.io/afintech510/larkin-tech/larkintech-app:latest` to succeed.
- **Certbot certs:** nginx expects `/etc/letsencrypt/live/larkintech.ai/{fullchain,privkey}.pem`, mounted read-only into the container. Renewals use the ACME HTTP-01 challenge served from `/var/www/certbot` (also mounted read-only). nginx must be reloaded after a renewal to pick up new certs.
- **`NEXT_PUBLIC_*` are build-time:** Changing any `NEXT_PUBLIC_*` value requires a **rebuild** of the image (they are baked in), not just a container restart.
- **Don't print secrets:** `.env.local` and all secret *values* stay out of the repo and out of logs — this doc lists names only.
