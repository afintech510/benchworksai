# Deploy migration — separate repos → monorepo

Both apps previously auto-deployed from their own repos:

| App          | Old repo                | VPS checkout            | Prod compose (untracked on box) |
|--------------|-------------------------|-------------------------|---------------------------------|
| site         | `larkin-tech`           | `/opt/larkin-tech`      | `docker-compose.vps.yml` (root) |
| backend/dash | `benchworksai-outbound` | `/opt/benchworks-outbound` | `docker-compose.vps.yml` (root) |

In the monorepo the deploy scripts run from `apps/site` and `infra` respectively,
and both boxes must check out **this** repo. Until each box is re-pointed, the
new workflows are **manual-trigger only** (`workflow_dispatch`) so a push here
cannot fire a deploy against a mis-configured box.

## Per-box migration (run once on each VPS)

1. Clone the monorepo alongside the old checkout, e.g. `/opt/benchworksai`:
   ```bash
   git clone git@github.com:afintech510/<monorepo>.git /opt/benchworksai
   ```
2. Move the untracked prod compose file into the new layout:
   - site box:    old `/opt/larkin-tech/docker-compose.vps.yml`
     → `/opt/benchworksai/apps/site/docker-compose.vps.yml`
   - backend box: old `/opt/benchworks-outbound/docker-compose.vps.yml`
     → `/opt/benchworksai/infra/docker-compose.vps.yml`
3. Bring the stack up once by hand from the new location to confirm parity:
   - site:    `cd /opt/benchworksai/apps/site && ./scripts/deploy.sh`
   - backend: `cd /opt/benchworksai/infra && docker compose -f docker-compose.vps.yml up -d --build`
4. Add/confirm repo secrets:
   - `VPS_SITE_PATH` = `/opt/benchworksai` (site box), `VPS_OUTBOUND_PATH` = `/opt/benchworksai` (backend box).
   - Carry over `VPS_HOST/USER/SSH_KEY/PORT` and the `NEXT_PUBLIC_*` build args
     from the old repos' secrets.

## Enable auto-deploy

Once a box is verified, uncomment the `push:` block in the matching workflow
(`deploy-site.yml` / `deploy-backend.yml`). The path filters ensure a site-only
change never rebuilds the backend stack and vice-versa.

## Retire old repos

After both boxes deploy cleanly from the monorepo, archive `larkin-tech` and
`benchworksai-outbound` on GitHub (Settings → Archive) so no one pushes to a
dead remote. Do not delete — the history is preserved here but the old repos
remain the canonical provenance record.
