# Phase 00: Environment & Infrastructure Setup
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** None (first phase)
**Implements:** Infrastructure — no SOW features directly
**Recommended:** `claude --max-turns 25`

---

## 1. Context

You are executing **Phase 00: Environment & Infrastructure Setup** of the Larkin Tech build.

**Your scope is strictly this phase.** Do not implement database tables, API endpoints, UI components, or any application logic. This phase creates the project skeleton, Docker configuration, deployment pipeline, and development environment only.

**Tech Stack:**
- Next.js 14+ (App Router) / TypeScript / Tailwind CSS 3.4+
- Supabase (PostgreSQL 15) — managed cloud instance
- Docker + Docker Compose 24.x
- Nginx reverse proxy (blue-green deployment)
- GitHub Actions CI/CD
- Cloudflare (DNS + CDN + WAF)
- Hetzner VPS (CPX21, 3 vCPU, 4GB RAM)
- Node.js 20 LTS

**Working Directory:** Project root (create as `larkintech/`)
**Spec File:** Read `larkintech-spec-v2.md` Section 1.2 (Technology Stack), Section 1.3 (Deployment Topology), and Section 4.1 (Component Tree — directory structure only).

### What Already Exists
Nothing. This is a greenfield project.

### What You're Building
The complete project skeleton with Docker blue-green deployment, GitHub Actions CI/CD, Nginx proxy configuration, environment variable management, and development tooling. When this phase is complete, the project builds, runs in Docker, deploys with zero downtime, and is ready for Phase 01 (database schema + auth).

---

## 2. Objective & Deliverables

### Objective
After this phase, the project scaffolding is complete: the Next.js app builds and runs in Docker, the blue-green deployment pipeline works end-to-end, all environment variables are documented, and the development workflow is ready for Phase 01 to begin building on.

### Deliverables

1. **Next.js project scaffold** — App Router, TypeScript, Tailwind, ESLint — Spec Section 1.2
2. **Directory structure** — Matching spec Section 4.1 (app/, lib/, components/, data/, supabase/, docker/, public/) — create directories with `.gitkeep` where empty
3. **Docker Compose configuration** — Blue-green containers (app-blue:3000, app-green:3001) + nginx-proxy — Spec Section 1.3
4. **Dockerfiles** — Multi-stage Next.js build (builder + runner stages, non-root user)
5. **Nginx configuration** — Reverse proxy with upstream switching for blue-green deploys
6. **Blue-green deploy script** — `scripts/deploy.sh` implementing the 9-step process from Spec Section 1.3
7. **GitHub Actions workflow** — `.github/workflows/deploy.yml`: build → push GHCR → SSH deploy → health check
8. **Environment management** — `.env.example` with ALL env vars from Spec Section 1.3, plus startup validation
9. **Package dependencies** — All libraries from Spec Section 1.2 in `package.json`
10. **Docker log rotation** — Configured per Spec Section 1.3
11. **Supabase CLI setup** — `supabase/config.toml` initialized
12. **Base health check** — `app/api/health/route.ts` returning `{ status: "healthy", version: "0.0.1" }` (expanded in Phase 01)

---

## 3. Implementation Instructions

### Task 1: Project Scaffold
**Spec Reference:** Section 1.2
**Creates:** Project root with Next.js, TypeScript, Tailwind

```bash
npx create-next-app@latest larkintech --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*"
```

After scaffolding:
- Update `next.config.js` with `output: 'standalone'` (required for Docker)
- Configure `tailwind.config.ts` with CSS custom properties setup for dual-theme (the actual theme implementation is Phase 02 — just set up the config structure)
- Add `globals.css` skeleton with CSS variable placeholders for theme colors

### Task 2: Directory Structure
**Spec Reference:** Section 4.1 (Component Tree)
**Creates:** All directories from the spec

Create the full directory tree. Use `.gitkeep` files in empty directories:

```
app/
├── (marketing)/
│   ├── services/
│   ├── portfolio/
│   ├── pricing/
│   ├── about/
│   ├── contact/
│   └── privacy/
├── (demos)/
│   ├── gate/
│   └── [demoType]/
│       └── [vertical]/
├── api/
│   ├── leads/
│   ├── demos/
│   ├── admin/
│   ├── webhooks/
│   └── health/
lib/
├── supabase/
├── ai/
│   ├── prompts/
│   └── vertical-configs/
├── demo-engine/
├── email/
│   └── templates/
├── nurture/
├── validation/
└── utils/
components/
├── ui/
├── layout/
├── home/
├── services/
├── portfolio/
├── pricing/
├── about/
├── contact/
├── demos/
├── admin/
└── shared/
data/
├── cache-seeds/
│   ├── chatbot/
│   ├── analytics/
│   ├── email-sms/
│   ├── doc-processing/
│   ├── competitive-analysis/
│   ├── doc-drafting/
│   └── marketing-engine/
├── case-studies/
└── service-pages/
public/
├── images/
│   └── portfolio/
└── downloads/
supabase/
├── migrations/
└── seed.sql (empty placeholder)
docker/
scripts/
```

### Task 3: Docker Configuration
**Spec Reference:** Section 1.3
**Creates:** `Dockerfile`, `docker-compose.yml`, `docker/nginx.conf`

**Dockerfile** (multi-stage):
- Stage 1 (`builder`): `node:20-alpine`, install deps, build Next.js
- Stage 2 (`runner`): `node:20-alpine`, copy standalone output, non-root user, expose 3000
- Use `.dockerignore` to exclude `node_modules`, `.next`, `.git`

**docker-compose.yml**:
- `app-blue`: builds from Dockerfile, port 3000, env_file, restart: unless-stopped
- `app-green`: same image, port 3001, env_file, restart: unless-stopped, `profiles: ["green"]` (starts only during deploy)
- `nginx-proxy`: nginx:alpine, ports 80:80 443:443, volumes for config + certs, depends_on app-blue
- ALL services include log rotation:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "5"
  ```

**docker/nginx.conf**:
- Upstream block pointing to app-blue:3000 by default
- `include /etc/nginx/conf.d/upstream.conf;` for dynamic switching
- SSL passthrough (Cloudflare handles SSL termination)
- Proxy headers: `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`
- Health check location: `/api/health`

### Task 4: Blue-Green Deploy Script
**Spec Reference:** Section 1.3 (9-step process)
**Creates:** `scripts/deploy.sh`

Implement the deployment process from spec:
1. Pull new image from GHCR
2. Start green container (port 3001)
3. Wait for health check on localhost:3001/api/health (30s timeout, 2s interval)
4. If healthy: update nginx upstream to 3001, reload nginx, stop blue
5. If unhealthy: stop green, keep blue, exit with error code + alert message
6. Tag working image as `larkintech-app:previous` for rollback
7. Include `--rollback` flag that reverses the switch

Make the script executable and well-commented.

### Task 5: GitHub Actions Workflow
**Spec Reference:** Section 1.3
**Creates:** `.github/workflows/deploy.yml`

Steps:
1. Trigger: push to `main` branch
2. Build Docker image
3. Push to GHCR (`ghcr.io/[username]/larkintech-app:latest`)
4. SSH to VPS (using secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`)
5. Run `scripts/deploy.sh`
6. Verify health check
7. On failure: send notification (echo to job summary for now)

Include caching for Docker layers and Node modules.

### Task 6: Environment Management
**Spec Reference:** Section 1.3
**Creates:** `.env.example`, `lib/utils/env-validation.ts`

`.env.example` — ALL variables with descriptions:
```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
SENDGRID_API_KEY=SG....

# Auth
JWT_SECRET=           # Generate: openssl rand -base64 32
ADMIN_SECRET=         # Generate: openssl rand -base64 32  (min 32 chars)

# Security
ADMIN_ALLOWED_IPS=    # Comma-separated IPs for admin endpoint access
NEXT_PUBLIC_SITE_URL=https://larkintech.ai

# Optional
INTERNAL_API_SECRET=  # For internal module auth if needed
```

`lib/utils/env-validation.ts` — Startup validation:
```typescript
const REQUIRED_ENV = [
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY',
  'ANTHROPIC_API_KEY', 'SENDGRID_API_KEY', 'JWT_SECRET', 'ADMIN_SECRET'
];

export function validateEnv() {
  const missing = REQUIRED_ENV.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

Call `validateEnv()` in the root layout's server component or in `instrumentation.ts`.

### Task 7: Package Dependencies
**Spec Reference:** Section 1.2
**Creates:** Updated `package.json`

Install all dependencies:
```bash
# Core
npm install @supabase/supabase-js jose zod pino

# PDF generation
npm install @react-pdf/renderer

# UI / Forms
npm install react-hook-form @hookform/resolvers

# Dev
npm install -D @types/node supabase
```

Do NOT install dependencies for features built in later phases (e.g., recharts is Phase 05). Only install what's needed for the foundation + what the spec lists as core dependencies.

### Task 8: Supabase CLI Setup
**Spec Reference:** Section 2.3
**Creates:** `supabase/config.toml`

```bash
npx supabase init
```

Verify `supabase/config.toml` exists. Create empty `supabase/migrations/` directory and placeholder `supabase/seed.sql`.

### Task 9: Base Health Check
**Spec Reference:** Section 3.2 (GET /api/health)
**Creates:** `app/api/health/route.ts`

Minimal health check (expanded in Phase 01):
```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    version: '0.0.1',
    timestamp: new Date().toISOString()
  });
}
```

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` returns 0 errors
- [ ] `docker compose build` completes without errors
- [ ] `docker compose up -d` starts app-blue and nginx-proxy containers
- [ ] `curl -f http://localhost:3000/api/health` returns `{"status":"healthy"}`
- [ ] `curl -f http://localhost:80/api/health` returns `{"status":"healthy"}` (via nginx)

### Functional Checks
- [ ] Blue-green deploy script: `./scripts/deploy.sh` starts green, switches upstream, stops blue
- [ ] Blue-green rollback: `./scripts/deploy.sh --rollback` reverses the switch
- [ ] Environment validation: removing a required env var from `.env` causes startup failure with clear error message
- [ ] All directories from spec Section 4.1 exist in the project
- [ ] `.env.example` contains all variables from Spec Section 1.3

### CI Check
- [ ] GitHub Actions workflow file is valid YAML (syntax check)

---

## 5. Constraints

### Hard Constraints
- Follow the tech stack exactly as specified in spec Section 1.2. No library substitutions.
- Docker Compose must support blue-green deployment as described in spec Section 1.3.
- Use `output: 'standalone'` in next.config.js for Docker compatibility.
- Do NOT implement any database tables, API endpoints (except health), or UI components.
- Do NOT install UI libraries (recharts, lucide-react) — those are for later phases.

### Soft Constraints
- Use multi-stage Docker build for smallest possible image size.
- Non-root user in Docker runner stage.
- If Supabase CLI requires configuration choices, use defaults and document.
- If you encounter ambiguity about which Node.js version to pin, use Node 20 LTS.

---

## 6. Completion Protocol

When all acceptance criteria pass, provide this structured report:

### Files Created
| File | Purpose | Lines |
|------|---------|-------|
| [path] | [what it does] | [approx lines] |

### Files Modified
| File | Changes | Why |
|------|---------|-----|

### Acceptance Criteria Results
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|

### Spec Ambiguities
| Location | Ambiguity | Decision Made | Rationale |
|----------|-----------|---------------|-----------|

### Blocked Items
| Task | Blocker | Required From |
|------|---------|---------------|

### Decisions Made
[Any implementation choices not explicitly covered by the spec]

### Warnings for Next Phase
[Anything Phase 01 should know — patterns established, config decisions, gotchas]

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 25`
This phase is low complexity and should complete in a single session.

### Task Planning
Before writing any code:
1. Read spec Section 1.2 (Technology Stack), 1.3 (Deployment Topology), 4.1 (Component Tree)
2. Plan the directory structure
3. Execute tasks sequentially (1 → 9)
4. Verify each task before proceeding

### Resumption Protocol (--continue)
If this session is a --continue of a previous run:
1. Read this prompt to re-establish full context
2. Check the filesystem — what has already been created?
3. Look for `PHASE-00-PROGRESS.md` in project root
4. Resume from the first incomplete task
5. Do NOT re-implement completed tasks

### Autonomous Decision Authority
- **Spec defines it:** Follow exactly.
- **Spec is silent:** Make a reasonable choice. Mark with `// SPEC-AMBIGUITY: [choice made and why]`
- **Blocked by external dependency:** Mark with `// BLOCKED: [what's missing]` and continue

### Progress Tracking
After completing each major task, update `PHASE-00-PROGRESS.md`:
```markdown
# Phase 00 Progress
- [x] Task 1: Project Scaffold
- [x] Task 2: Directory Structure
- [ ] Task 3: Docker Configuration
...
```
