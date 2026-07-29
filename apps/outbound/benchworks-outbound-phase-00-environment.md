# Phase 00: Environment Setup
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** None  
**Implements:** Infrastructure  
**Recommended:** `claude --max-turns 10`

---

## 1. Context

You are executing **Phase 00: Environment Setup** of the BenchworksAI Outbound Engine build.

**Your scope is strictly this phase.** You are creating project scaffolding, Docker Compose configuration, and verifying all services start cleanly. You are NOT implementing database schemas, auth, API endpoints, or any business logic.

**Tech Stack:** Next.js 14+ (App Router), FastAPI (Python 3.11+), Supabase Cloud (PostgreSQL 15+), Redis 7+, n8n 1.30+, Cal.com, Caddy 2+, Docker Compose on Hetzner CX41.

**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Section 1.2 (Technology Stack) and Section 1.3 (Deployment Topology) before starting.

### What Already Exists
Nothing. This is a greenfield build.

### What You're Building
A fully scaffolded monorepo with Docker Compose running all 6 services (Caddy, Next.js, FastAPI, n8n, Cal.com, Redis). All containers start, communicate, and respond to health checks. Environment variables are documented. The foundation is ready for Phase 01 to build on.

---

## 2. Objective & Deliverables

### Objective
After this phase, `docker compose up -d` starts all services, Caddy serves HTTPS with X-Request-ID injection, Redis requires authentication and persists data, and the developer can begin building features.

### Deliverables
1. **Project structure** — monorepo with `/frontend` (Next.js), `/backend` (FastAPI), `/docker`, `/supabase` directories
2. **docker-compose.yml** — 6 services per spec Section 1.3
3. **Caddyfile** — reverse proxy config with HTTPS + X-Request-ID + domain mapping per spec Section 1.3
4. **Redis config** — `--requirepass` + `--appendonly yes` + Docker volume
5. **FastAPI skeleton** — health endpoint, structured logging, CORS config
6. **Next.js skeleton** — App Router structure, basic layout
7. **.env.example** — every environment variable placeholder documented
8. **Makefile** — convenience commands (up, down, logs, restart)

---

## 3. Implementation Instructions

### Task 1: Project Scaffolding
**Creates:** Directory structure, README

```
benchworks-outbound/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app with health endpoint
│   │   ├── config.py       # Settings from env vars
│   │   └── middleware/
│   │       └── __init__.py
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── requirements.txt
├── docker/
│   ├── Caddyfile
│   └── redis.conf          # (optional — CLI args preferred)
├── supabase/
│   └── migrations/         # Empty — Phase 01 fills this
├── tests/
│   └── fixtures/           # Empty — Phase 06 fills this
├── docker-compose.yml
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

### Task 2: Docker Compose
**Spec Reference:** Section 1.3  
**Creates:** `docker-compose.yml`

Configure 6 services:
- **caddy**: Caddy 2 image, ports 80+443, mounts Caddyfile, depends on nextjs + fastapi
- **nextjs**: Build from `frontend/Dockerfile`, port 3000, env_file .env
- **fastapi**: Build from `backend/Dockerfile`, port 8000, env_file .env
- **n8n**: Official n8n image, port 5678, env vars for basic auth + postgres DB config (DB_TYPE=postgresdb, DB_POSTGRESDB_* pointing to Supabase — use placeholder values in .env.example)
- **calcom**: Cal.com Docker image, port 3001
- **redis**: Redis 7 image, port 6379, command `redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes`, volume `redis-data:/data`

All services on a shared Docker network `benchworks-net`.

### Task 3: Caddy Configuration
**Spec Reference:** Section 1.3  
**Creates:** `docker/Caddyfile`

For local development, use `localhost` with Caddy's auto-TLS. Add `header * X-Request-ID {http.request.uuid}` globally.

Route map:
- `/` → nextjs:3000 (dashboard)
- `/v1/*` → fastapi:8000 (API)
- `/n8n/*` → n8n:5678 (workflow editor — add basic_auth directive with env vars)
- `/book/*` → calcom:3001 (booking)

### Task 4: FastAPI Skeleton
**Spec Reference:** Section 1.2, 3.1  
**Creates:** `backend/app/main.py`, `backend/app/config.py`, `backend/Dockerfile`

FastAPI app with:
- CORS middleware (allow frontend origin)
- Health endpoint: `GET /v1/health` returns `{"status": "healthy", "service": "benchworks-api", "timestamp": "ISO8601"}`
- Structured JSON logging via `structlog`
- Settings loaded from env vars via pydantic-settings

Dependencies in pyproject.toml:
- fastapi, uvicorn, pydantic, pydantic-settings, structlog, python-jose[cryptography], httpx, slowapi, redis

Dockerfile: Python 3.11 slim, pip install, uvicorn CMD.

### Task 5: Next.js Skeleton
**Creates:** `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/Dockerfile`

Minimal Next.js 14 App Router app:
- Root layout with html/body
- Home page: "BenchworksAI Dashboard — Phase 00 Complete"
- package.json with: next, react, react-dom, @tanstack/react-query, next-auth, tailwindcss, lucide-react

Dockerfile: Node 20, npm install, npm run build, npm start CMD.

### Task 6: Environment Template
**Creates:** `.env.example`

Document every env var the system needs (with placeholder values and comments):
```
# -- Auth --
NEXTAUTH_SECRET=change-me-to-random-64-char-string
NEXTAUTH_URL=https://app.benchworksai.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# -- Supabase --
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# -- Redis --
REDIS_PASSWORD=change-me
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# -- Smartlead --
SMARTLEAD_API_KEY=
SMARTLEAD_WEBHOOK_SECRET=

# -- Apollo --
APOLLO_API_KEY=

# -- Claude / Anthropic --
ANTHROPIC_API_KEY=

# -- Cal.com --
CALCOM_WEBHOOK_SECRET=

# -- Resend --
RESEND_API_KEY=

# -- Slack --
SLACK_WEBHOOK_ALERTS=
SLACK_WEBHOOK_REPLIES=
SLACK_WEBHOOK_BOOKINGS=

# -- n8n --
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=change-me
N8N_DB_TYPE=postgresdb
N8N_DB_POSTGRESDB_HOST=
N8N_DB_POSTGRESDB_PORT=5432
N8N_DB_POSTGRESDB_DATABASE=n8n
N8N_DB_POSTGRESDB_USER=
N8N_DB_POSTGRESDB_PASSWORD=

# -- Service Keys --
SERVICE_KEY_N8N=change-me
```

### Task 7: Makefile + Gitignore
**Creates:** `Makefile`, `.gitignore`

Makefile commands: `up`, `down`, `logs`, `restart`, `build`, `health-check` (curl localhost health endpoint).

.gitignore: .env, node_modules, __pycache__, .next, redis-data, *.pyc

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] `docker compose build` succeeds without errors
- [ ] `docker compose up -d` starts all 6 containers (verify with `docker compose ps`)
- [ ] `curl -s http://localhost:8000/v1/health` returns 200 with JSON body
- [ ] Redis requires auth: `docker compose exec redis redis-cli PING` returns `NOAUTH` error; `redis-cli -a $REDIS_PASSWORD PING` returns `PONG`
- [ ] `.env.example` documents every env var referenced in docker-compose.yml and application code

### Functional Checks
- [ ] Next.js app loads at http://localhost:3000
- [ ] FastAPI OpenAPI docs load at http://localhost:8000/docs
- [ ] n8n UI loads at http://localhost:5678 (behind basic auth)

---

## 5. Constraints

### Hard Constraints
- Follow the tech stack exactly as specified in spec Section 1.2. No library substitutions.
- Redis MUST require authentication and use appendonly persistence.
- Caddy MUST inject X-Request-ID on every request.
- Do NOT implement auth, database schemas, or business logic — those are Phase 01+.

### Soft Constraints
- Use the directory structure as shown. If you need adjustments, document why.
- If a Docker image version is uncertain, pin to latest stable.

---

## 6. Completion Protocol

When all acceptance criteria pass, provide the structured completion report:
- Files Created (table)
- Acceptance Criteria Results (all PASS/FAIL with evidence)
- Decisions Made (any implementation choices not in spec)
- Warnings for Next Phase

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 10`

### Task Planning
1. Read spec Section 1.2 and 1.3
2. Create project structure
3. Build Docker Compose + Caddyfile
4. Scaffold FastAPI + Next.js
5. Create .env.example + Makefile
6. Build and verify all containers start
7. Run acceptance checks

### Resumption Protocol
If this is a `--continue` run: check filesystem for what exists, identify incomplete tasks, resume from first incomplete task.
