# BenchworksAI — Monorepo

Single home for the BenchworksAI product and public site. Both codebases were merged
here with full git history preserved (via `git subtree`).

## Layout

```
apps/
  site/        Public marketing site — benchworksai.com (Next.js App Router)
               Formerly the `larkin-tech` repo.
  dashboard/   Internal operations dashboard (Next.js) — leads, mailboxes,
               reports, fleet-status. Formerly `benchworksai-outbound/frontend`.
  backend/     Outbound API service (Python/FastAPI) + integration tests.
               Formerly `benchworksai-outbound/backend`.

infra/         Orchestration: docker-compose stacks, n8n workflows, Supabase
               config. Formerly the root of `benchworksai-outbound`.

docs/
  backend/     Build plans, SOW, spec, and phase docs for the outbound backend.
```

## Provenance

| Path            | Origin repo               | Origin remote                                    |
|-----------------|---------------------------|--------------------------------------------------|
| `apps/site`     | larkin-tech               | github.com/afintech510/larkin-tech               |
| `apps/dashboard`| benchworksai-outbound     | github.com/afintech510/benchworksai-outbound     |
| `apps/backend`  | benchworksai-outbound     | github.com/afintech510/benchworksai-outbound     |
| `infra`, `docs` | benchworksai-outbound     | github.com/afintech510/benchworksai-outbound     |

## Deploys

CI is path-filtered per app under [.github/workflows](.github/workflows). A change
under `apps/site/**` deploys only the site; `apps/backend/**` / `apps/dashboard/**`
deploy the backend stack. See each workflow for the target host.
