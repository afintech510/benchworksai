# Phase 05: Dashboard + Demo Instrumentation
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 04 complete  
**Implements:** F-009, F-026, F-027  
**Recommended:** `claude --max-turns 40`

---

## 1. Context

You are executing **Phase 05: Dashboard + Demo Instrumentation** of the BenchworksAI Outbound Engine build.

**Your scope:** The complete Next.js ops dashboard — all pages, shared components, command bar, lead journey timeline, ICP explainability, reply review queue, client onboarding wizard, and all empty/error/loading states. This dashboard is the operator's daily tool AND a live demo asset shown to prospects during discovery calls. Visual quality matters.

**You are NOT building:** Test suite (Phase 06) or hardening/docs (Phase 07).

**Tech Stack:** Next.js 14+ (App Router), React, TanStack React Query, NextAuth.js, Tailwind CSS, Lucide React icons  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Sections 4.1–4.5 (Component Architecture) FIRST. Then Section 3.2 (API response shapes) and Section 3.3 (MCP tools for CommandBar).

## Skills Reference (read before building)
Before starting this phase, review this skill for design quality:
- `view /mnt/skills/public/frontend-design/SKILL.md` — Follow its design principles, tokens, and component patterns for ALL UI work. This dashboard must look production-grade during screen shares, not like a generic admin panel.

### What Already Exists
- Phase 01: Auth (Google OAuth login works), NextAuth session, GET /v1/clients endpoint
- Phase 02a: Suppression endpoints, webhook handlers
- Phase 02b: AI pipeline functions
- Phase 03: All FastAPI endpoints (campaigns, leads, reports, mailboxes, action-log), n8n workflows running
- Phase 04: 13 MCP tools with real data, dual MCP integration, command pattern documentation

### What You're Building
The operator's command center and the sales demo asset. Every page must load real data from the API endpoints built in Phases 01–04. The lead journey timeline is the hero component — it's what the operator shows prospects during discovery calls. The command bar lets the operator issue natural language commands. Every component needs empty, error, and loading states because this will be screen-shared.

---

## 2. Objective & Deliverables

### Objective
After this phase, the operator can log in, see all clients and campaigns, drill into lead detail with a visual journey timeline, issue natural language commands via the command bar, review flagged replies, onboard new clients, and monitor mailbox health — all from a polished, screen-share-ready dashboard.

### Deliverables

1. **Dashboard layout** — Sidebar nav, top bar with breadcrumbs, responsive shell — Spec Section 4.1
2. **Overview page** — All-client summary cards, live stats bar, alert feed — Spec Section 4.1, 4.2
3. **Client list page** — Client cards with key metrics from client_summary_mv — Spec Section 3.2
4. **Client detail page** — Campaigns, pipeline funnel, metrics, recent replies — Spec Section 4.1
5. **Campaign detail page** — Sequence steps, lead list (stage + score only), send/open/reply stats — Spec Section 4.1
6. **Lead detail page** — Enrichment data, ICP score breakdown (F-027), journey timeline (F-026) — Spec Section 3.2, 4.2
7. **Mailbox pool page** — Health grid visualization, assignment map, warm pool status — Spec Section 4.2
8. **Command bar** — NL input → Claude agent (via MCP) → response display — Spec Section 4.2
9. **Reply review queue** — Needs-review replies with context and resolve action — Spec Section 4.2 (SYN-020)
10. **Client onboarding wizard** — Multi-step form → POST /v1/clients + /v1/campaigns/launch — Spec Section 4.1 (SYN-026)
11. **Report history page** — Past reports, trigger manual generation — Spec Section 4.1
12. **Suppression list page** — Search, add, remove — Spec Section 4.1
13. **Settings page** — System config, API key status indicators — Spec Section 4.1
14. **Action log page** — Filterable, searchable, chronological — Spec Section 4.2
15. **All empty/error/loading states** — Per Section 4.5
16. **BFF proxy** — Next.js API route proxying to FastAPI with X-Forwarded-For — Spec Section 4.1

---

## 3. Implementation Instructions

### Task 1: BFF Proxy + React Query Setup
**Spec Reference:** Section 4.1, 4.3  
**Creates:** `frontend/app/api/proxy/[...path]/route.ts`, `frontend/lib/query-client.ts`, `frontend/lib/api.ts`

BFF proxy route:
- Extracts JWT from NextAuth session cookie
- Forwards to FastAPI with `Authorization: Bearer {jwt}` header
- Appends `X-Forwarded-For` with real client IP (SYN-032)
- Returns FastAPI response to browser

React Query provider:
- Default stale time: 30 seconds
- Refetch on window focus: true
- Error handler: toast notification

API client helper:
- All frontend API calls go through `/api/proxy/v1/...`
- Typed response interfaces matching spec Section 3.2 shapes

### Task 2: Dashboard Shell (Layout + Nav)
**Spec Reference:** Section 4.1, 4.4  
**Creates:** `frontend/app/(dashboard)/layout.tsx`, nav components

Dashboard shell:
- **Sidebar:** Logo, nav links (Overview, Clients, Mailboxes, Review Queue, Reports, Suppression, Action Log, Settings). Collapsible on mobile.
- **Top bar:** Breadcrumbs (Overview → Client → Campaign → Lead), operator avatar/logout
- **Command bar:** Floating input at bottom or ⌘K modal (see Task 8)
- **Auth guard:** Middleware redirects unauthenticated users to /login

Follow `frontend-design` skill for color tokens, typography, spacing. Dashboard should feel clean and professional — not cluttered.

### Task 3: Overview Page
**Spec Reference:** Section 4.1, 4.2  
**Creates:** `frontend/app/(dashboard)/page.tsx`

Components:
- **StatsBar:** Emails sent today, replies received, meetings booked, active campaigns, mailbox health summary. Fetches from GET /v1/clients (aggregated) + GET /v1/health.
- **ClientMetricsCards:** One card per active client showing name, industry, active campaigns, positive replies this week. Fetches from GET /v1/clients (client_summary_mv).
- **AlertFeed:** Recent system_alert action_log entries. Fetches from GET /v1/action-log?action_type=system_alert&limit=10. Each alert has acknowledge button.
- **ReplyReviewQueue (mini):** Count of needs_review replies with link to full queue page.

**Empty state (SYN-019):** If 0 clients: "Welcome to BenchworksAI. Add your first client to get started." with CTA button → /clients/new.

### Task 4: Client Pages
**Creates:** `frontend/app/(dashboard)/clients/page.tsx`, `[clientId]/page.tsx`

**Client list:** Cards or table from GET /v1/clients. Each shows name, industry, status badge, active campaigns count, total leads, positive replies this week. Click → client detail.

**Client detail:**
- Header: client name, industry, status, notification config
- **PipelineFunnel:** Visual funnel showing lead counts at each stage (new → enriched → qualified → contacted → replied → interested → call_booked). Scoped to call_booked per SYN-025 — later stages tracked but not shown in funnel.
- **Campaign list:** Table of campaigns with status badge, lead count, reply count. Click → campaign detail.
- **Recent replies:** Last 5 reply_events for this client with classification pill and sentiment.
- **Metrics chart:** Weekly trend of emails sent, replies, positive replies (Recharts line chart).

### Task 5: Campaign + Lead Detail Pages
**Creates:** `frontend/app/(dashboard)/clients/[clientId]/campaigns/[campaignId]/page.tsx`, `frontend/app/(dashboard)/leads/[leadId]/page.tsx`

**Campaign detail:**
- Sequence steps display (from sequence_templates)
- Lead list: **stage pill + ICP score only** (SYN-012 — no journey data, no enrichment). Paginated. Click → lead detail.
- Campaign stats: emails sent, opens, replies, positive replies, meetings booked
- Campaign status + provision_stage indicator

**Lead detail page** (the demo page):
- Contact info: name, email, company, title, domain
- Enrichment data: company size, industry, tech stack (collapsed by default)
- **IcpScoreBreakdown (F-027):** Per-criterion display. Each criterion shows: name, score/max, progress bar, detail text. Total score prominent. Reasoning text below. Must match the `icp_breakdown` JSONB schema from leads table.
- **LeadJourneyTimeline (F-026):** Chronological vertical timeline from action_log. Each event shows: icon (per action_type), timestamp, action_type label (human-readable, not raw — e.g., "AI validated ICP fit" not "lead_scored"), detail summary. Clicking an event expands full action_detail JSON. Events <3: show what exists + "More events will appear" note.
- Pipeline stage badge + booking_status if set
- Reply history: all reply_events for this lead with classification, confidence, sentiment

**This page is the demo hero.** When the operator screen-shares it during a discovery call, the prospect sees their own journey. Make it visually compelling.

### Task 6: Mailbox Pool Page
**Creates:** `frontend/app/(dashboard)/mailboxes/page.tsx`

**MailboxHealthGrid:** Visual grid of mailboxes. Each cell shows email (truncated), health score, color-coded status (GREEN/YELLOW/RED via background color). Click → detail popover with bounce_rate, spam_rate, reply_rate, assigned client, warm-up status.

Summary stats: total mailboxes, active, warming, degraded, warm pool surplus %.

**Empty state:** "No mailboxes configured. Add sending accounts in Smartlead."

### Task 7: Reply Review Queue Page
**Spec Reference:** Section 4.2 (SYN-020)  
**Creates:** `frontend/app/(dashboard)/review/page.tsx`

Fetches GET /v1/reply-events?needs_review=true.

Each item shows:
- Lead name + company
- Reply body (full text)
- Classification + confidence score
- Suggested action from Claude
- Action buttons: "Confirm Interested" (→ route as interested), "Mark Not Interested" (→ dismiss), "Respond" (→ opens compose — post-MVP, for now just mark reviewed)

On action: PATCH to update reply_event needs_review=false + execute the routing action.

**Empty state:** "All caught up. No replies need review."

### Task 8: Command Bar
**Spec Reference:** Section 4.2  
**Creates:** `frontend/components/CommandBar.tsx`

**UX:** ⌘K (or Ctrl+K) opens a modal with text input. Operator types a natural language command. Submit sends to a FastAPI endpoint that forwards to Claude with MCP tools. Response streams back and displays in the modal.

**Implementation:**
- Frontend: modal with input, loading state, response display area
- Backend: `POST /v1/agent/command` endpoint that takes `{message: string}`, calls Claude API with both MCP servers configured, returns the response text
- Display: formatted response in the modal. If the response includes structured data (client list, metrics), render it nicely — not raw JSON.

**Note:** The full agentic loop (multi-turn conversation with tool use) may be complex. For MVP, support single-turn: operator sends command → agent calls tools → returns answer. Multi-turn conversation is a post-MVP enhancement.

### Task 9: Client Onboarding Wizard
**Spec Reference:** Section 4.1 (SYN-026)  
**Creates:** `frontend/app/(dashboard)/clients/new/page.tsx`

Multi-step form:
1. **Client Info:** Name, industry (dropdown: construction, legal, property_management), physical address (CAN-SPAM)
2. **ICP Definition:** Target titles (multi-select), company size range, geography, positive/negative signals (text areas)
3. **Campaign Config:** Campaign name, offer description, vertical, sequence steps (default 4), interval days (default 3)
4. **Notification:** Channel (email/Slack), target (email address or webhook URL)
5. **Review + Launch:** Summary of all inputs, "Launch Campaign" button

On submit: POST /v1/clients (create client) → POST /v1/campaigns/launch (trigger campaign provisioning). Show progress indicator as provision_stage advances.

**First-use routing:** If operator logs in and 0 clients exist (from GET /v1/clients), Overview page shows empty state with CTA to /clients/new.

### Task 10: Supporting Pages
**Creates:** Reports page, Suppression page, Action Log page, Settings page

**Reports:** `frontend/app/(dashboard)/reports/page.tsx` — List from GET /v1/client-reports. Filter by client. Each shows period, delivery status, metrics summary. "Generate Report" button per client.

**Suppression:** `frontend/app/(dashboard)/suppression/page.tsx` — Searchable table of suppressed emails. Add button (modal with email + reason). Delete button (operator only, confirm dialog).

**Action Log:** `frontend/app/(dashboard)/action-log/page.tsx` — Filterable table from GET /v1/action-log. Filters: client, lead, action_type, date range. Chronological, paginated. Expandable rows showing action_detail JSON.

**Settings:** `frontend/app/(dashboard)/settings/page.tsx` — Display system_config values. Editable for: operator_email, escalation_contact, Slack webhooks. API key status indicators (checks if keys are set in env — does NOT display actual keys). Shows Supabase, Redis, Smartlead, Apollo connectivity status from GET /v1/health.

### Task 11: Empty / Error / Loading States
**Spec Reference:** Section 4.5  
**Creates:** Global ErrorBoundary, skeleton components

Implement all states from spec Section 4.5:
- **ErrorBoundary:** Wrap every data-dependent component. Fallback: component name + "Unable to load" + retry button + collapsed error detail. Log error with request_id to console.
- **Skeleton loaders:** Create reusable skeleton components for: StatsBar, ClientMetricsCard, PipelineFunnel, MailboxHealthGrid, LeadJourneyTimeline, ReplyReviewQueue. React Query `isLoading` → show skeleton.
- **Empty states:** Implement every empty state from the Section 4.5 table.

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] `npm run build` succeeds without errors
- [ ] No TypeScript errors in strict mode
- [ ] No console errors on any page load

### Functional Checks
- [ ] **Auth flow:** Unauthenticated → redirect to /login → Google OAuth → redirect to dashboard with session
- [ ] **Overview:** Loads with real client data from client_summary_mv. Stats bar populated. Alert feed shows recent alerts.
- [ ] **Client drill-down:** Overview → click client → client detail (campaigns, funnel, metrics) → click campaign → campaign detail (leads list with stage + score)
- [ ] **Lead journey (F-026):** Click lead → lead detail → timeline renders chronological events with human-readable labels, expandable detail. For a lead with ≥3 events, timeline shows full journey.
- [ ] **ICP breakdown (F-027):** Lead detail shows per-criterion score bars with points, max, and detail text. Total score matches sum.
- [ ] **Command bar:** ⌘K opens modal → type "show me all clients" → response displays client list → close modal
- [ ] **Review queue:** Shows needs_review replies. "Confirm Interested" button routes reply correctly.
- [ ] **Onboarding wizard:** Complete all steps → client created → campaign launched → progress shown
- [ ] **Mailbox health:** Grid renders with color-coded health indicators
- [ ] **Empty states:** With 0 clients, overview shows welcome message + CTA
- [ ] **Error states:** Disconnect FastAPI → components show error boundary fallback with retry
- [ ] **Loading states:** Throttle network → skeleton loaders visible during data fetch
- [ ] **All pages load in <2 seconds** on local network
- [ ] **Breadcrumbs:** Correct at every navigation level
- [ ] **Responsive:** Dashboard usable at 768px+ (tablet for screen sharing)

---

## 5. Constraints

### Hard Constraints
- **Read the `frontend-design` skill BEFORE writing any components.** Follow its design tokens, component patterns, and styling constraints.
- Campaign lead list shows **stage + score only** — no journey data, no enrichment_data (SYN-012 N+1 prevention).
- PipelineFunnel shows stages through **call_booked only** — later stages not in funnel (SYN-025).
- LeadJourneyTimeline displays **human-readable event labels** — translate action_type to natural language (e.g., "lead_scored" → "AI validated ICP fit (Score: 84)").
- All API calls go through BFF proxy (/api/proxy/) — never call FastAPI directly from browser.
- Do NOT implement Playwright tests — that's Phase 06.

### Soft Constraints
- Use Tailwind utility classes (not CSS modules or styled-components).
- Use Lucide React for icons.
- Use Recharts for any charts/graphs.
- Keep component files under 200 lines — extract sub-components if needed.
- Mobile-first is NOT required (operator uses desktop/tablet), but 768px+ should work for screen sharing.

---

## 6. Completion Protocol

Provide: Files Created (all pages + components), Acceptance Criteria (PASS/FAIL), Screenshots or descriptions of key pages, Decisions Made (design choices, component library selections), Warnings for Phase 06 (which pages need Playwright coverage, any known UX rough edges).

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 40`
This is the second-largest phase. Many pages and components.

### Task Planning
1. **Read `frontend-design` skill first**
2. Read spec Sections 4.1–4.5, 3.2 (API shapes), 3.3 (MCP for CommandBar)
3. Build infrastructure first: BFF proxy + React Query + API client (Task 1)
4. Build shell: layout + nav + auth guard (Task 2)
5. Build pages top-down: Overview (3) → Client (4) → Campaign + Lead (5) → Mailbox (6) → Review (7) → Command Bar (8) → Onboarding (9) → Supporting (10)
6. Add all empty/error/loading states last (Task 11) — sweep across all components
7. Test every page with real data

### Resumption Protocol
Check `frontend/app/(dashboard)/` for existing pages. Check `frontend/components/` for shared components. Resume from first incomplete page.
