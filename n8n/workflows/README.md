# n8n Workflow Configurations

These JSON files are importable into n8n via Settings > Import Workflow.

## Workflows

These are the workflow JSON files actually present in this directory (7). All call
FastAPI over HTTP — no `executeCommand`/CLI nodes (spec SYN-005).

| File | Trigger | Schedule | Description |
|------|---------|----------|-------------|
| `reply-classification.json` | Cron (every 5 min) | `*/5 * * * *` | Pick up unclassified replies → Claude classify → route by classification |
| `health-monitor.json` | Cron (every 15 min) | `*/15 * * * *` | Aggregate Redis + Supabase reachability check |
| `deliverability-monitor.json` | Cron (every 6 hours) | `0 */6 * * *` | Smartlead REST → `mailbox_pool` health |
| `supabase-keepwarm.json` | Cron (every 4 hours) | `0 */4 * * *` | Touch both Supabase projects (free-tier anti-pause) |
| `internal-prospecting.json` | Cron (Mondays 10:00 UTC) | `0 10 * * 1` | Score internal leads (F-007), promote ≥ threshold to `qualified` |
| `weekly-report.json` | Cron (Mondays 12:00 UTC) | `0 12 * * 1` | Aggregate metrics → Claude narrative → Resend |
| `portfolio-status-monitor.json` | Cron (every 5 min) | `*/5 * * * *` | Fleet origin uptime checks → cache snapshot in Redis (powers /fleet-status) |

> Live schedules per `PROGRESS.md` supersede any values shown here if they ever drift.

## Environment Variables Required

All workflows use these env vars from the n8n container (set in docker-compose.yml):
- `SMARTLEAD_API_KEY` — Used in Bash nodes via `$SMARTLEAD_API_KEY`
- `SERVICE_KEY_N8N` — Used in HTTP Request nodes as `X-Service-Key` header

**NEVER hardcode API keys in n8n expressions or workflow JSON (SYN-029).**

## Import Instructions

1. Open n8n UI (http://localhost:5678 or /n8n via Caddy)
2. Go to Settings → Import Workflow
3. Upload JSON file
4. Configure credentials if prompted
5. Activate the workflow

## FastAPI Endpoints Called

All workflows call FastAPI via HTTP Request nodes with `X-Service-Key: ${SERVICE_KEY_N8N}`:
- `POST /v1/leads/import` — Lead import with suppression check
- `GET /v1/campaigns` — List campaigns
- `GET /v1/reports/{client_id}/metrics` — Metrics aggregation
- `POST /v1/reports/{client_id}/generate` — Report generation
- `POST /v1/webhooks/*` — Webhook re-processing
- `POST /v1/internal/*` — cron jobs (health-check, deliverability-check, keep-warm, prospect-cycle, portfolio-status-check)
