# Meta-Agent Review: Phase 00 — Environment & Infrastructure

You are a code reviewer evaluating the output of an AI coding agent. Verify that Phase 00 of the Larkin Tech build was implemented correctly before proceeding to Phase 01.

**Your role is adversarial.** Do not assume the builder did things correctly. Check everything independently.

## Documents to Read
1. **Specification:** `larkintech-spec-v2.md` — Sections 1.2, 1.3, 4.1, 4.3
2. **Builder's Completion Report:** [paste below or check PHASE-00-PROGRESS.md]
3. **Source Code:** Inspect actual files

## What Phase 00 Should Have Built
**Objective:** Project scaffolding, Docker blue-green deployment, CI/CD pipeline, theme foundation, health check.

**Expected Deliverables:** Next.js project, full directory structure, Docker Compose (3 services), Dockerfile, deploy scripts, GitHub Actions, .env.example, env validation, Tailwind + theme config, health endpoint.

---

## Review Checklist

### 1. Spec Compliance

**Section 1.2 (Tech Stack)**
- [ ] package.json includes ALL deps from spec: @supabase/supabase-js, jose, zod, pino, @react-pdf/renderer, react-hook-form, recharts, sanitize-html
- [ ] No unauthorized dependencies added
- [ ] TypeScript configured correctly

**Section 1.3 (Deployment)**
- [ ] Docker Compose has 3 services: app-blue (3000), app-green (3001), nginx (80)
- [ ] Green container uses profiles (not started by default)
- [ ] Log rotation on ALL services: json-file, max-size 10m, max-file 5
- [ ] Dockerfile is multi-stage with non-root user
- [ ] deploy.sh implements blue-green: start green → health check → switch nginx → stop blue
- [ ] rollback.sh exists and reverses the switch
- [ ] .env.example contains ALL variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, SENDGRID_API_KEY, JWT_SECRET, ADMIN_SECRET, INTERNAL_API_SECRET, ADMIN_ALLOWED_IPS, NEXT_PUBLIC_SITE_URL

**Section 4.1 (Directory Structure)**
- [ ] app/ has route groups: (marketing)/, (demos)/, api/
- [ ] lib/ has subdirs: supabase/, ai/, demo-engine/, email/, nurture/, validation/, utils/
- [ ] components/ has subdirs: ui/, layout/, home/, services/, portfolio/, pricing/, about/, contact/, demos/, shared/, admin/
- [ ] data/ has: cache-seeds/ (with 7 subdirs), case-studies/, service-pages/
- [ ] supabase/ has: migrations/, config.toml
- [ ] docker/ exists with Dockerfile and nginx.conf
- [ ] scripts/ has deploy.sh and rollback.sh (executable)

**Section 4.3 (Theme)**
- [ ] globals.css has [data-theme="dark"] and [data-theme="light"] selectors
- [ ] Root layout has blocking <script> in <head> for FOUC prevention
- [ ] Script checks localStorage first, then prefers-color-scheme media query

### 2. Acceptance Criteria (Independent Verification)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` returns 0 errors
- [ ] `docker compose build` succeeds
- [ ] `docker compose up -d` starts containers
- [ ] curl localhost:3000/api/health returns JSON with status "healthy"
- [ ] Nginx proxies correctly (curl localhost:80 works)
- [ ] Removing JWT_SECRET from .env causes startup error

### 3. Code Quality
- [ ] No hardcoded secrets or credentials
- [ ] No console.log statements
- [ ] .gitignore includes .env.local, .env.production, node_modules, .next
- [ ] Scripts are executable (chmod +x)

---

## Builder's Completion Report
[PASTE THE BUILDER'S COMPLETION REPORT HERE]

---

## Output Requirements
Respond with valid JSON: verdict (PROMOTE/FIX/ESCALATE), acceptance_criteria results, spec_compliance deviations, issues_found, cross_phase_notes, recommendation.
