# n8n Workflow Configurations

These JSON files are importable into n8n via Settings > Import Workflow.

## Workflows

| File | Trigger | Schedule | Description |
|------|---------|----------|-------------|
| `campaign-launch.json` | Webhook (from FastAPI) | On-demand | Staged campaign provisioning: Smartlead → mailboxes → sequence → enrichment |
| `reply-classification.json` | Cron (every 5 min) | `*/5 * * * *` | Pick up unclassified replies → Claude classify → route by classification |
| `lead-enrichment.json` | Webhook (from campaign launch) | On-demand | Apollo enrichment → Claude scoring → qualified import to Smartlead |
| `deliverability-monitor.json` | Cron (every 6 hours) | `0 */6 * * *` | Smartlead CLI health check → score → rotate RED → warm pool guard |
| `weekly-report.json` | Cron (Monday 12:00 UTC) | `0 12 * * 1` | Aggregate metrics → Claude narrative → Resend/Slack delivery |
| `health-monitor.json` | Cron (every 15 min) | `*/15 * * * *` | Ping all services → Slack alert on failure |
| `internal-prospecting.json` | Cron (Sunday 22:00 UTC) | `0 22 * * 0` | Apollo search → enrich → score → import to BenchworksAI campaigns |
| `reengagement.json` | Cron (every hour) | `0 * * * *` | Check for cancelled bookings >24h → send re-engagement email |

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
