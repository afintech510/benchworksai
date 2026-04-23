# Statement of Work: BenchworksAI Outbound Engine

**Version:** 1.1  
**Date:** April 8, 2026  
**Prepared for:** Adam Larkin / BenchworksAI  
**Prepared by:** Spec Pipeline — Tenth Ave Digital  
**Codename:** `benchworks-outbound`

---

## 1. Executive Summary

BenchworksAI is an AI implementation consultancy serving SMB clients in construction, legal, and property management. This project delivers an API-first, agent-controllable cold email outreach platform that the operator uses to run Done-For-You (DFY) outbound campaigns on behalf of 5–15 simultaneous clients — plus BenchworksAI's own internal prospecting engine.

The system automates the full outbound lifecycle: campaign provisioning, lead enrichment, ICP scoring, multi-step cold email sequences, reply classification, meeting booking, deliverability monitoring, and client reporting. Every action is executable via API or MCP tool call, enabling a Claude-powered agent layer to manage campaigns through natural language commands. No step in the workflow requires a human to click buttons in a SaaS dashboard.

The internal prospecting engine (targeting SMB owners on Long Island and the Northeast) doubles as a live proof-of-concept. During discovery calls, the operator screen-shares the ops dashboard and walks the prospect through the exact system that found them, qualified them, and booked the call. The system is the demo.

The platform runs on self-hosted infrastructure (Hetzner VPS), uses Smartlead for sending, Apollo for enrichment, n8n for workflow orchestration, Supabase (shared instance with Row-Level Security) for state management, FastAPI for the MCP/agent layer, and Next.js for the ops dashboard.

---

## 2. Project Objectives

| ID | Objective | Success Metric | Priority |
|----|-----------|----------------|----------|
| O-001 | Automate full outbound campaign lifecycle without manual dashboard intervention | Operator can launch a new client campaign from onboarding payload to first email sent with zero manual steps in Smartlead UI | MUST |
| O-002 | Manage 5–15 simultaneous client campaigns from a unified interface | All active campaigns visible, controllable, and reportable from a single ops dashboard and NL command interface | MUST |
| O-003 | Classify and route prospect replies without human review | Reply classification accuracy ≥90% on a labeled test set; interested replies routed to client within 5 minutes of receipt | MUST |
| O-004 | Maintain mailbox deliverability programmatically | Degraded mailboxes detected and rotated within 6 hours; warm pool maintains ≥20% surplus capacity | MUST |
| O-005 | Generate automated client reports | Weekly performance summaries delivered to each client via email or Slack without manual data pulling | MUST |
| O-006 | Run BenchworksAI internal prospecting as a live demo asset | Prospect journey from discovery through booking is fully visible and narrate-able in the ops dashboard during a screen share | MUST |
| O-007 | Enforce security best practices across all layers | Google OAuth auth, RLS data isolation, rate limiting, TLS, append-only audit log, CAN-SPAM compliance — all verifiable via test suite | MUST |
| O-008 | Maintain a test suite that catches regressions in critical automated decisions | Tier 1 tests (classification, scoring, RLS isolation) pass before any deployment | MUST |
| O-009 | Enable natural language campaign management via Claude agent | Operator can issue commands like "pause client X" or "add 200 leads to client Y" and have them executed via MCP tool calls | SHOULD |
| O-010 | Serve as a replicable template for future DFY client engagements | Architecture and tooling patterns documented well enough to replicate for client-specific systems | SHOULD |

---

## 3. Feature Set

### 3.1 Core Features (Must-Have)

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-001 | Campaign launch automation | Receive client onboarding payload (ICP, niche, offer, geography) via webhook, provision Smartlead campaign, assign mailboxes, generate sequence copy via Claude, create sequence steps, trigger lead enrichment | As the operator, I want to submit a client onboarding form and have a fully configured campaign created automatically so that I never touch the Smartlead dashboard manually | Campaign appears in Smartlead with correct mailbox assignments, sequence steps, and settings within 60 seconds of payload submission; campaign metadata logged in Supabase |
| F-002 | Lead enrichment pipeline | Accept raw lead list (company, domain, role), enrich via Apollo API (email, title, firmographics, tech stack), score against client ICP via Claude, push qualified leads (score ≥70) into active Smartlead campaign | As the operator, I want raw lead lists automatically enriched and scored so that only qualified prospects enter sequences | Enriched leads stored in Supabase with full Apollo data; ICP score and reasoning recorded; qualified leads appear in Smartlead campaign within 5 minutes of enrichment |
| F-003 | Reply detection and classification | Receive Smartlead reply webhook, fetch full thread, classify via Claude (interested / not_interested / OOO / referral / question / unsubscribe), route by classification, pause sequence for interested replies | As the operator, I want prospect replies automatically classified and routed so that interested replies reach the client immediately and uninterested replies are handled without manual review | Classification matches expected label on ≥90% of test fixtures; interested replies trigger client notification within 5 minutes; sequence paused for interested and unsubscribe classifications |
| F-004 | Deliverability monitoring and mailbox rotation | Cron job (every 6 hours) fetches per-mailbox health metrics from Smartlead, scores GREEN/YELLOW/RED, removes RED mailboxes from campaigns, activates warm-up, assigns replacement from warm pool, alerts operator | As the operator, I want degraded mailboxes automatically detected and swapped so that client campaigns never send from compromised accounts | RED mailbox removed from active campaigns within one cron cycle (6 hours); replacement mailbox assigned from warm pool; Slack alert fired; incident logged in Supabase |
| F-005 | Client reporting (weekly) | Cron job (Monday 8am ET) aggregates per-client metrics (emails sent, opens, replies, positive replies, meetings booked, sequence performance), generates narrative summary via Claude, delivers via client's preferred channel | As a DFY client, I want a weekly performance summary so that I understand campaign results without logging into any system | Report delivered to correct channel; metrics match Smartlead + Supabase data; narrative includes trend comparison to prior week and actionable recommendation |
| F-006 | Multi-client orchestration (dual MCP architecture) | Claude agent uses two MCP servers: (1) Smartlead's native MCP server for sending-layer operations (campaign CRUD, lead import/export, mailbox management, inbox operations) and (2) a custom FastAPI-based MCP server for business logic (Supabase state, ICP scoring, reply routing, suppression list, reporting, action logging). Smartlead CLI (`@smartlead/cli`) used in n8n Bash nodes for cron-driven data pulls (analytics, lead exports, health metrics). NL command execution composes tools from both MCP servers. | As the operator, I want to issue natural language commands to manage campaigns so that routine operations don't require navigating APIs manually | MCP tools execute correctly for: create/pause/resume campaign (Smartlead MCP), import leads (Smartlead MCP + custom MCP for scoring), get client metrics (custom MCP + Smartlead MCP), rotate mailbox (Smartlead MCP + custom MCP for pool state), get system alerts (custom MCP); all tool calls logged in action_log |
| F-007 | Internal BenchworksAI prospecting engine | Weekly cron sources prospects via Apollo (construction, legal, property mgmt on Long Island → Northeast), enriches, scores against BenchworksAI ICP, pushes qualified leads into vertical-specific sequences, handles replies, routes to booking flow | As the operator, I want BenchworksAI's own outbound running on the same system I sell to clients so that I can demo it live and generate my own pipeline | Prospects sourced, enriched, scored, and sequenced weekly; reply handling routes to operator pipeline; full journey visible in dashboard |
| F-008 | Cal.com booking flow | Self-hosted Cal.com instance with "Discovery Call" event type (30 min), intake questions, webhook on booking/cancellation to n8n, Supabase lead stage update, pre-call brief generation via Claude | As a prospect, I want to book a discovery call from the email I received so that I can learn about BenchworksAI's services | Cal.com booking link functional; webhook fires on booking; Supabase lead stage updated to 'call_booked'; pre-call brief generated and delivered to operator |
| F-009 | Ops dashboard (Next.js) | Client overview, campaign status, mailbox health grid, action log, alert feed, command bar (NL input to MCP agent); demo-optimized with lead journey timeline and ICP score explainability | As the operator, I want a single dashboard showing all client campaigns, system health, and prospect journeys so that I can manage operations and demo the system to prospects | Dashboard loads with all active clients; client drill-down shows campaigns, leads, and replies; command bar sends requests to MCP agent and displays responses; all pages load in <2 seconds |
| F-010 | Supabase state layer (shared DB + RLS) | Shared PostgreSQL instance with Row-Level Security policies enforcing client_id isolation on all multi-tenant tables; core tables: clients, campaigns, leads, reply_events, mailbox_pool, action_log, suppression_list, client_reports, system_config | As the operator, I want a single database with guaranteed client data isolation so that cross-client operations work natively while data never leaks between clients | RLS policies active on all client-scoped tables; isolation test suite passes (Client A query returns zero Client B rows); cross-client aggregation queries work for operator role |
| F-015 | Google OAuth + RBAC-ready auth | NextAuth.js with Google OAuth provider; operator role with full access; auth middleware on all FastAPI endpoints via JWT verification; RBAC schema supporting future read-only client role | As the operator, I want to log in with my Google account and have all API endpoints secured so that no unauthorized access is possible | Google OAuth login works; unauthenticated API requests return 401; JWT includes role claim; RBAC middleware rejects insufficient permissions |
| F-016 | API key management | All external API keys (Smartlead, Apollo, Claude, Cal.com) stored in Docker environment variables; documented rotation procedure; no keys in code, database, or client-accessible surfaces | As the operator, I want API keys securely stored and easy to rotate so that a compromised key can be replaced without code changes | All API calls use env-sourced keys; rotation procedure documented; no keys appear in Supabase, git, or dashboard UI |
| F-017 | Rate limiting | slowapi middleware on all FastAPI endpoints; per-IP and per-key limits; Smartlead API call throttling to stay within plan rate limits; circuit breaker on repeated failures | As the operator, I want API endpoints protected from abuse and external API rate limits respected so that a runaway agent loop can't burn credits or trigger bans | Rate limit headers returned on FastAPI responses; excess requests return 429; Smartlead calls throttled to plan limit; circuit breaker triggers after 5 consecutive failures |
| F-018 | Tiered test suite | Tier 1 (blocks deploy): reply classification accuracy, ICP scoring consistency, RLS isolation, Smartlead wrapper error handling, n8n webhook smoke tests. Tier 2 (weekly): Playwright dashboard tests, deliverability logic, report generation. Tier 3 (pre-major-change): full E2E pipeline, load tests | As the operator, I want automated tests that catch regressions in critical decisions so that I don't deploy a broken classification prompt or a leaky RLS policy | Tier 1 suite runs in <5 minutes; classification accuracy ≥90% on 50+ fixtures; RLS test inserts for 2 clients and asserts zero cross-contamination; all Tier 1 tests pass before any production deployment |
| F-019 | System health monitoring + alerting | Health check endpoints on all services (FastAPI, n8n, Supabase, Cal.com); cron-based monitoring; Slack alerts for service down, high error rate, or disk/memory thresholds | As the operator, I want to know immediately if any system component fails so that I can remediate before client campaigns are affected | Health check endpoint returns service status JSON; Slack alert fires within 5 minutes of service failure; false positive rate <1 alert/week |
| F-020 | TLS + encrypted connections | Caddy reverse proxy with automatic HTTPS on all public endpoints; SSL connections between FastAPI and Supabase; no plaintext API traffic | As the operator, I want all data encrypted in transit so that credentials and PII are never exposed on the network | All public endpoints serve HTTPS; Caddy auto-renews certificates; Supabase connection string uses sslmode=require |
| F-021 | Append-only audit log | action_log table with RLS preventing UPDATE/DELETE for all roles except superadmin; every automated and manual action logged with timestamp, actor, client_id, action_type, and detail JSON | As the operator, I want a tamper-resistant record of every system action so that I can audit decisions, debug issues, and demonstrate system behavior during demos | INSERT succeeds; UPDATE/DELETE return permission denied for operator role; log entries appear for all campaign, lead, mailbox, and classification events |
| F-023 | Global suppression list | Cross-client suppression table; unsubscribe classification triggers addition; lead import checks suppression before inserting into any campaign; manual addition supported | As the operator, I want a single suppression list that prevents re-contacting opted-out prospects across all client campaigns so that we never violate CAN-SPAM | Unsubscribe reply adds email to suppression_list; subsequent lead import for any client skips suppressed emails; manual add/remove works via dashboard and MCP tool |
| F-024 | CAN-SPAM compliance enforcement | Sequence template validation: reject templates missing physical address or unsubscribe mechanism; auto-append compliance footer if missing; compliance flag per template stored in Supabase | As the operator, I want the system to enforce compliance in every outgoing email so that no campaign sends without required legal elements | Template without address or opt-out instruction is rejected at creation; auto-append fallback adds compliance footer; sent emails include required elements |
| F-025 | Smartlead integration layer (MCP + CLI) | Smartlead's native MCP server handles sending-layer operations (campaign CRUD, leads, mailboxes, inbox); Smartlead CLI (`@smartlead/cli`) used in n8n Bash nodes for cron-driven data pulls (analytics export, lead CSV export, health metrics). Custom FastAPI MCP server handles business logic (scoring, routing, state, reporting). Response caching in Supabase (15-min TTL for read operations) for dashboard reads. Provider portability maintained: swapping Smartlead means replacing the Smartlead MCP/CLI references; custom MCP server and all business logic remain unchanged. | As the operator, I want Smartlead's sending capabilities accessible to both the Claude agent and n8n cron jobs while keeping my business logic independent so that I can swap providers without rewriting workflows | Smartlead MCP tools callable by Claude agent; CLI commands execute in n8n Bash nodes; cached reads serve dashboard when Smartlead API is slow; custom MCP server has zero Smartlead-specific logic |
| F-026 | Lead journey timeline | Visual timeline component in dashboard showing a prospect's full journey: source → enrichment → scoring → sequence entry → email events → reply → classification → booking; timestamped, interactive, demo-optimized | As the operator demoing to a prospect, I want to show their exact journey through the system so that they understand the product by experiencing it | Timeline renders for any lead with ≥3 action_log entries; events display in chronological order with timestamps; clicking an event shows detail; component loads in <1 second |
| F-027 | ICP score explainability | Dashboard component showing score breakdown: which ICP criteria matched, point contribution per criterion, reasoning text from Claude scoring response; accessible from lead detail view | As the operator demoing the system, I want to click an ICP score and see exactly why a lead scored 84 so that the scoring feels transparent and credible | Score breakdown renders with per-criterion points; reasoning text displayed; sum of criteria matches total score; component renders for all scored leads |

### 3.2 Enhancement Features (Post-MVP)

| ID | Feature | Description | Dependency | Deferred Until |
|----|---------|-------------|------------|----------------|
| F-011 | Waterfall enrichment | Apollo → Prospeo → manual fallback for email finding | F-002 | Post-MVP (add when Apollo hit rate <60% in a vertical) |
| F-012 | A/B sequence testing framework | Per-step variant tracking, statistical significance calculation, auto-promote winner | F-001 | Post-MVP Phase 2 |
| F-013 | Client-facing reporting portal | Read-only dashboard view for DFY clients (filtered to their data) | F-009, F-015 | Post-MVP Phase 2 |
| F-014 | Slack bot for operator commands | Slack slash commands → MCP agent (alternative to dashboard command bar) | F-006 | Post-MVP Phase 2 |
| F-022 | CI/CD pipeline (GitHub Actions) | Automated lint + Tier 1 tests + deploy on push to main | F-018 | Post-MVP Phase 2 |
| F-028 | Mailbox provisioning automation | Google Workspace Admin API + DNS API for domain setup | F-004 | Post-MVP Phase 3 (when >30 mailboxes) |
| F-029 | Deadman's switch escalation | If operator hasn't acknowledged CRITICAL alert in 24h, notify backup contact | F-019 | Post-MVP Phase 2 |
| F-030 | GDPR compliance mode | Per-client flag enabling privacy notice link, data processing record, right-to-deletion workflow | F-023 | Post-MVP (when EU-targeting clients onboard) |
| F-031 | Client reports as .docx / .pdf | Weekly reports exportable as formatted Word or PDF documents | F-005 | Post-MVP Phase 2 |

### 3.3 Explicitly Out of Scope

- **White-label / multi-operator SaaS.** This is a single-operator platform. No user management, billing, or tenant provisioning UI. Multi-operator support is a future product decision, not a build phase.
- **Custom CRM for DFY clients.** Clients receive reports and reply notifications. They don't log in, manage leads, or modify campaigns. If a client needs CRM access, integrate with their existing CRM via webhook (Attio, Folk, HubSpot) — do not build a CRM.
- **Email template visual builder.** Sequence copy is generated via Claude and stored as plain text/HTML. No drag-and-drop email builder. Cold email should be plain text anyway for deliverability.
- **SMS or LinkedIn outreach.** Email-only for MVP. Multi-channel outreach (SMS via Twilio, LinkedIn via Dripify/Expandi) is a future expansion.
- **Inbound lead capture.** This system is outbound-only. Website forms, chatbots, or inbound routing are separate systems.
- **Mobile app.** Dashboard is web-only. Responsive design for tablet screen-sharing is sufficient.
- **Self-hosted Supabase.** Use Supabase Cloud for MVP. Self-hosted migration is a future infrastructure decision based on cost and data sovereignty needs.
- **Smartlead replacement.** The abstraction layer (F-025) enables future provider swaps but building a custom SMTP sending engine is not in scope.

---

## 4. Users & Personas

### Persona: Operator (Adam)

- **Role:** Solo founder, technical operator, sales closer
- **Goal:** Manage all client campaigns + BenchworksAI's own outbound from a single interface with minimal manual intervention
- **Technical Comfort:** High — builds full-stack AI systems, comfortable with APIs, SQL, Docker, CLI
- **Key Workflows:**
  1. Receive new client → submit onboarding payload → system creates campaign automatically
  2. Monitor dashboard daily: check alert feed, review reply queue, glance at health grid
  3. Issue NL commands for ad-hoc operations: "pause client X", "add leads to client Y", "generate report for client Z"
  4. Weekly: review auto-generated client reports before delivery (optional — reports can auto-send)
  5. Discovery calls: screen-share dashboard, walk prospect through their own lead journey, demo scoring and classification
- **Pain Points:** Manual dashboard clicking in Instantly/Smartlead UI; context-switching between 10+ client campaigns; can't show prospects a live system

### Persona: DFY Client

- **Role:** SMB owner/operator who hired BenchworksAI to run outbound
- **Goal:** Get meetings booked with qualified prospects without managing the outreach system
- **Technical Comfort:** Low to Medium — can read emails and Slack messages, comfortable with Cal.com booking links, does not want to learn new software
- **Key Workflows:**
  1. Receive weekly performance report via email or Slack
  2. Get notified when an interested prospect replies (with context and suggested next steps)
  3. Prospect books a call → client receives calendar invite
  4. Occasionally: forward a lead list or referral contact to operator for import
- **Pain Points:** Doesn't know if outreach is working; doesn't want to log in to anything; wants meetings, not metrics

### Persona: Prospect (Cold Email Recipient)

- **Role:** SMB owner/operator in construction, legal, or property management
- **Goal:** Evaluate whether BenchworksAI's services are relevant to their business
- **Technical Comfort:** Low — reads email on phone, clicks links, fills basic forms
- **Key Workflows:**
  1. Receive cold email sequence (3–4 touches over 2 weeks)
  2. Reply to express interest, ask a question, or opt out
  3. Receive calendar booking link → book discovery call
  4. Attend call (operator shows them the system that found them)
- **Pain Points:** Gets too many cold emails; skeptical of automation pitches; values seeing proof over hearing promises

---

## 5. Competitive & Design References

| Reference | URL | What to Emulate | What to Avoid |
|-----------|-----|-----------------|---------------|
| Smartlead Dashboard | smartlead.ai | Campaign overview layout, mailbox health visualization | Complexity — their UI serves power users managing 100+ campaigns; ours serves one operator managing 15 |
| Linear | linear.app | Clean command bar UX, keyboard-first navigation, information density without clutter | Over-engineering the project management angle — this is an ops dashboard, not a PM tool |
| Vercel Dashboard | vercel.com/dashboard | Deployment status indicators, real-time logs, minimal chrome | Enterprise features — team management, org switching |
| PostHog | posthog.com | Event timeline visualization (model for lead journey timeline) | Analytics depth — we show a prospect journey, not full product analytics |
| Cal.com Booking | cal.com | Clean booking flow, intake questions, calendar integration | None — use as-is |

---

## 6. Technical Constraints & Existing Infrastructure

### Existing Stack
- **Frontend:** Next.js (App Router)
- **Backend:** FastAPI (Python 3.11+)
- **Database:** Supabase Cloud (PostgreSQL 15+) with Row-Level Security
- **Hosting:** Hetzner VPS (CX31 or CX41) — Docker Compose deployment
- **Orchestration:** n8n (self-hosted on Hetzner)
- **Reverse Proxy:** Caddy (automatic HTTPS)
- **AI APIs:** Claude API (Anthropic), OpenAI (fallback)
- **Sending:** Smartlead.ai (native MCP server + CLI `@smartlead/cli` + REST API)
- **Enrichment:** Apollo.io API
- **Calendar:** Cal.com (self-hosted on Hetzner)
- **Domains:** Multiple custom sending domains (Porkbun/Namecheap) + Google Workspace

### Constraints
- Must run entirely on Hetzner VPS infrastructure (no AWS/GCP/Azure)
- Monthly infrastructure budget target: $300–550 including all SaaS subscriptions
- Solo operator — no dedicated DevOps, QA, or support staff
- Smartlead operations use native MCP server (agent) and CLI (n8n crons); custom MCP server owns business logic only — no Smartlead-specific code in custom server
- Supabase Cloud for MVP (self-hosted Supabase is out of scope but the schema must be portable)
- No paid CI/CD services for MVP — tests run locally via Pytest + Playwright

---

## 7. Assets & Materials

| Asset | Status | Location/Notes |
|-------|--------|----------------|
| BenchworksAI branding | Needed | Logo, color palette, typography for dashboard and reports — define in frontend-design skill tokens |
| Sending domains | Partially available | Some domains owned; additional domains needed for mailbox scaling (budget: $10–15/domain) |
| Google Workspace accounts | Partially available | Existing accounts for some domains; additional provisioning needed |
| Sequence copy templates | Needed | Construction, legal, property management vertical templates — Claude-generated, operator-approved |
| ICP definitions | Available | Construction, legal, property mgmt ICPs defined in architecture doc; BenchworksAI internal ICP defined |
| Reply classification fixtures | Needed | 50+ labeled reply examples for test suite — collect from initial campaigns + synthetic generation |
| Cal.com event configuration | Needed | Discovery call event type, intake questions, webhook endpoints |
| Smartlead API credentials | Needed | Account signup + plan selection required |
| Apollo API credentials | Needed | Account signup + credit plan required |

---

## 8. Delivery Phases & Timeline

### Phase 1: Foundation — Week 1–2
**Features:** F-010, F-015, F-016, F-020, F-021, F-025

**Deliverables:**
- Supabase schema deployed with all core tables and RLS policies
- Google OAuth authentication on Next.js (skeleton app) and FastAPI JWT middleware
- Smartlead CLI installed (`npm install -g @smartlead/cli`) and configured; Smartlead MCP server connection verified
- Custom business logic MCP server (FastAPI): Supabase CRUD tools, action logging, suppression list, response caching layer (15-min TTL)
- Cal.com deployed on Hetzner with discovery call event type and webhook configuration
- Caddy reverse proxy with HTTPS for all services
- Docker Compose configuration for full stack (n8n, FastAPI, Next.js, Cal.com, Caddy, Redis)
- Environment variable management documented
- RLS isolation tests written and passing (Tier 1)

**Milestone Criteria:** Operator can log in to dashboard skeleton; Smartlead MCP tools callable by Claude; Smartlead CLI returns campaign data from terminal; custom MCP server reads/writes Supabase; Cal.com booking page functional; RLS tests pass; all services accessible via HTTPS.

### Phase 2: Core Pipelines — Week 3–4
**Features:** F-001, F-002, F-003, F-008, F-023, F-024

**Deliverables:**
- Campaign launch automation workflow (n8n): webhook → Smartlead campaign + mailbox assignment + Claude sequence generation + lead import trigger
- Lead enrichment pipeline (n8n): raw list → Apollo enrichment → Claude ICP scoring → qualified lead import to Smartlead
- Reply classification workflow (n8n): Smartlead webhook → Claude classification → routing (pause, notify, suppress, tag)
- Cal.com booking webhook → n8n → Supabase lead stage update + pre-call brief generation
- Global suppression list with import-time checking
- CAN-SPAM compliance validation on sequence templates
- Reply classification test fixtures (50+) and accuracy tests (Tier 1)
- ICP scoring test fixtures (20+) and consistency tests (Tier 1)

**Milestone Criteria:** End-to-end flow works: onboarding payload → campaign created → leads enriched and imported → test reply classified correctly → interested reply triggers notification and sequence pause → booking link sent → Cal.com booking updates Supabase. Classification accuracy ≥90% on test fixtures.

### Phase 3: Operations — Week 5–6
**Features:** F-004, F-005, F-017, F-019

**Deliverables:**
- Deliverability monitoring cron (n8n): 6-hour cycle using Smartlead CLI (`smartlead analytics` + `smartlead mailbox`) in Bash nodes, mailbox health scoring, auto-rotation via Smartlead CLI/MCP, warm pool state in Supabase
- Mailbox pool management in Supabase (status tracking, assignment, health history)
- Weekly reporting automation (n8n): Smartlead CLI analytics export + Supabase pipeline data → Claude narrative → email/Slack delivery
- Rate limiting middleware on all FastAPI endpoints
- System health monitoring cron with Slack alerting
- Deliverability logic tests (Tier 2)
- Report generation tests (Tier 2)

**Milestone Criteria:** Degraded mailbox detected and rotated in test scenario; weekly report generated and delivered for test client; rate limiting returns 429 on excess requests; health check endpoint returns service status; Slack alerts fire on simulated service failure.

### Phase 4: Agent Layer — Week 7–8
**Features:** F-006, F-018 (full suite)

**Deliverables:**
- Dual MCP integration: Smartlead native MCP server connected + custom FastAPI MCP server with full business logic tool set (Supabase state, ICP scoring, reply routing, suppression, reporting, action logging)
- Claude agent integration: tool-use composing both MCP servers for natural language command execution
- n8n workflow smoke tests (Tier 1)
- MCP tool integration tests — verify Smartlead MCP + custom MCP compose correctly (Tier 1)
- Full Tier 1 test suite integrated and documented
- Tier 2 test suite written

**Milestone Criteria:** Operator can issue NL commands ("pause client X's campaign" → Smartlead MCP, "show me all clients with reply rate below 2%" → custom MCP + Smartlead MCP, "add 200 leads to client Y" → custom MCP scoring + Smartlead MCP import) and have them executed correctly. All Tier 1 tests pass. Tier 2 tests pass.

### Phase 5: Dashboard — Week 9–10
**Features:** F-009, F-026, F-027

**Deliverables:**
- Ops dashboard (Next.js): client overview, campaign status grid, mailbox health visualization, alert feed, action log viewer
- Command bar: NL input routed to Claude agent, response displayed inline
- Lead journey timeline component (demo hero): visual chronological journey from source through booking
- ICP score explainability component: per-criterion breakdown with reasoning
- Playwright dashboard tests (Tier 2)

**Milestone Criteria:** Dashboard loads with real data from all previous phases; operator can navigate client → campaign → lead → journey timeline; command bar executes MCP commands; timeline renders for leads with 3+ events; ICP breakdown renders for all scored leads; Playwright tests pass. Dashboard is screen-share ready.

### Phase 6: Internal Prospecting Engine — Week 11–12
**Features:** F-007

**Deliverables:**
- BenchworksAI ICP configured in Supabase
- Apollo sourcing queries for construction, legal, property management verticals (Long Island → Northeast)
- Vertical-specific sequence templates (3 verticals × 4 steps = 12 email templates) — Claude-generated, operator-approved
- Weekly prospecting cron: source → enrich → score → import to vertical-specific Smartlead campaigns
- Reply handling routed to operator pipeline and Cal.com booking
- Pre-call brief generation for booked discovery calls
- Full demo walkthrough documented and tested

**Milestone Criteria:** First batch of prospects sourced, enriched, scored, and imported; sequence emails sending; test reply classified and routed correctly; booking flow works end-to-end; operator can demo the full journey for a real prospect in the dashboard.

### Phase 7: Hardening & Polish — Week 13–14
**Deliverables:**
- Tier 3 test suite (full E2E pipeline test with mock data)
- Test fixture expansion (classification fixtures to 100+)
- Documentation: operator runbook, mailbox provisioning guide, client onboarding checklist, API key rotation procedure
- Dashboard UX polish based on first demo feedback
- Performance optimization (query indexes, caching tuning, page load targets)
- Security audit: review all RLS policies, rate limits, auth flows, key storage
- Changelog and version tagging

**Milestone Criteria:** All three test tiers pass; documentation complete; dashboard loads all pages in <2 seconds; security audit produces no CRITICAL findings; system ready for first paying DFY client.

---

## 9. Commercial Terms

Not applicable — internal build for BenchworksAI. The system generates revenue through DFY client engagements priced at $1,500–3,000/month per client.

---

## 10. Assumptions & Dependencies

| # | Assumption / Dependency | Risk if Wrong |
|---|------------------------|---------------|
| A-001 | Smartlead API remains stable and maintains current feature coverage | HIGH — entire sending layer depends on it; mitigated by F-025 abstraction |
| A-002 | Apollo provides adequate contact coverage for SMB verticals (construction, legal, property mgmt) on Long Island | MEDIUM — if coverage <50%, need waterfall enrichment (F-011) earlier than planned |
| A-003 | Supabase Cloud free/pro tier supports the required RLS complexity and query volume | LOW — PostgreSQL RLS is well-established; Supabase Pro ($25/mo) handles this scale |
| A-004 | Claude API (Sonnet) maintains current classification and structured output quality across model updates | MEDIUM — test suite (F-018) catches regressions; model version pinning available |
| A-005 | Google Workspace accounts for sending domains are provisionable at current pricing (~$6/user/mo) | LOW — stable pricing; Outlook via Infomaniak is fallback |
| A-006 | Hetzner VPS capacity is sufficient for all services (n8n + FastAPI + Next.js + Cal.com + Caddy + Redis) | LOW — CX41 (8 vCPU, 16GB) handles this easily; vertical scaling available |
| A-007 | Operator has 15–20 hours/week available for system management during build and initial operation | MEDIUM — if less available, Phase 7 polish may need to extend |
| A-008 | DFY clients accept email or Slack as report delivery channels (no custom portal needed for MVP) | LOW — F-013 (client portal) is a post-MVP enhancement if needed |
| A-009 | Cold email reply volumes are manageable by automated classification (no human review backlog) | MEDIUM — if ambiguous replies exceed 20% of volume, need a human review queue UI |
| A-010 | Cal.com self-hosted runs reliably on shared Hetzner VPS alongside other services | LOW — Cal.com is lightweight; dedicated container with resource limits |

---

## 11. Risks & Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-001 | Smartlead API deprecation or pricing change | MEDIUM | HIGH | Abstraction layer (F-025) enables provider swap; all business logic in MCP server, not Smartlead-specific code |
| R-002 | Reply classification false positives (interested → premature client notification) | MEDIUM | HIGH | Confidence threshold ≥0.85 for auto-routing; lower-confidence replies queued for review; accuracy tracked in Supabase; test suite catches regression |
| R-003 | RLS policy misconfiguration leaks client data | LOW | CRITICAL | Tier 1 isolation tests run before every deployment; explicit RLS test for every client-scoped table; policy review in Phase 7 security audit |
| R-004 | Apollo contact data quality below threshold in target verticals | HIGH | MEDIUM | Monitor hit rates per vertical; trigger F-011 (waterfall enrichment) if Apollo coverage <60%; manual LinkedIn fallback for high-value leads |
| R-005 | Mailbox deliverability degradation across multiple accounts simultaneously | MEDIUM | HIGH | 20%+ warm pool surplus; automated rotation (F-004); domain diversity (don't concentrate mailboxes on one domain provider) |
| R-006 | Claude model update changes classification or scoring behavior | MEDIUM | MEDIUM | Pin model version in API calls; test suite (F-018) catches drift; re-evaluate prompts on each model version upgrade |
| R-007 | CAN-SPAM violation via template omission | LOW | HIGH | Template validation (F-024) rejects non-compliant templates; auto-append fallback; compliance audit in Phase 7 |
| R-008 | Operator burnout from managing 15 simultaneous campaigns solo | MEDIUM | HIGH | Automation reduces manual work; NL command interface (F-006) reduces context-switching; deadman switch (F-029) for coverage gaps |
| R-009 | Hetzner VPS failure causes full system outage | LOW | HIGH | Docker Compose enables rapid redeploy; Supabase Cloud handles data persistence independently; daily VPS snapshot backups |
| R-010 | Prospect objects to being cold emailed and escalates publicly | LOW | MEDIUM | Immediate suppression on any complaint; professional, non-spammy sequence copy; physical address and opt-out in all emails; operator responds personally to any escalation |

---

## 12. Claude Skill Utilization Plan

| Skill | Phase(s) | Application |
|-------|----------|-------------|
| `frontend-design` | Phase 5 | Dashboard build: design tokens, component patterns, timeline component, stats widgets, command bar. Read BEFORE writing any React. |
| `docx` | Phase 7 / Post-MVP | F-031: client reports as Word docs. Also useful for generating operator runbook as .docx. |
| `xlsx` | Phase 2 | F-002: lead list import/export. Accept .xlsx from clients, export qualified leads as .xlsx for review. |
| `pdf` | Phase 7 / Post-MVP | F-031: client reports as PDF. Pre-call briefs as PDF attachments. |
| `spec-pipeline` | Now | This SOW. Reusable for speccing client projects as a service offering. |
| `build-prompter` | Phase 6 (of pipeline) | Post-spec-lock: generates BUILDPLAN.md and Claude Code operator prompts for each build phase. |

---

## 13. Sign-Off

By confirming this SOW, the operator agrees that the scope, features, phases, and technical approach described above accurately represent the intended project. Enhancement features (Section 3.2) are acknowledged as post-MVP and will be scoped separately.

- [ ] **SOW Confirmed** — Adam Larkin — [Date]
