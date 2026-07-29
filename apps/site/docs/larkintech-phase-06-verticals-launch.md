# Phase 06: Verticals, Nurture Engine, Admin, Legal & Launch
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 05 complete
**Implements:** F-029–F-032, F-046–F-049
**Recommended:** `claude --max-turns 100`

---

## 1. Context

You are executing **Phase 06: Verticals, Nurture Engine, Admin, Legal & Launch** — the final phase. You are populating all 4 verticals with demo content, building the AI-powered lead nurture engine, creating the admin UI, implementing the legal disclaimer system, connecting Cal.com webhooks, and preparing for launch.

**Working Directory:** Project root
**Spec Files:** `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md` (nurture engine spec)

### What Already Exists (from Phases 00-05)
- Complete marketing site: themes, layout, 5 services, 4 case studies, pricing, about, contact, lead magnet, SEO
- Complete demo infrastructure + all 7 demo UI components functional with general_smb
- 70 cached preset entries for general_smb
- Email gate, rate limiter, prompt guard, streaming, DemoShell
- All 19 database tables (including nurture tables: lead_scores, drip_campaigns, drip_enrollments, drip_messages) + 4 default drip campaigns seeded
- Admin auth middleware, notification outbox

### What You're Building
1. Remaining 210 cache entries (3 verticals × 7 demos × 10 each)
2. Vertical-specific content (sample docs, datasets, company profiles)
3. Lead nurture engine (scorer, drip engine, AI email writer, auto-analyst)
4. Admin UI (lead list, nurture dashboard, message review, config editor)
5. Legal disclaimer modal with stored acknowledgment
6. Cal.com booking webhook
7. Full QA and launch preparation

---

## 2. Objective & Deliverables

### Objective
After this phase, all 28 demo configurations are live with rich vertical content. Leads are automatically scored, enrolled in drip campaigns, and receive AI-generated personalized follow-ups. Adam has an admin dashboard to review leads, approve messages, and manage the system. Legal vertical has proper disclaimers. The site is production-ready and launched.

### Deliverables

**Vertical Content (F-029–F-032):**
1. 210 demo cached responses (construction, property_mgmt, legal × 7 demos × 10 each)
2. Vertical content records (sample_doc, dataset, company_profile, workflow_template, marketing_copy per vertical)
3. Legal vertical disclaimers and sample documents with "FICTIONAL" notices

**Nurture Engine (F-046–F-049):**
4. `lib/nurture/lead-scorer.ts` — real-time scoring with tier classification
5. `lib/nurture/drip-engine.ts` — campaign enrollment and step execution
6. `lib/nurture/email-writer.ts` — AI email generation with lead context assembly
7. `lib/nurture/auto-analyst.ts` — background competitive analysis completion
8. Drip campaign processor (Docker cron, every 15 min)

**Admin UI:**
9. `/admin` route group with LeadList, NurtureDashboard, MessageReviewQueue, LeadDetailView, ConfigEditor, CampaignManager
10. `GET /api/admin/leads` (enhanced: search, sort, filter)
11. `GET /api/admin/leads/:id`, `GET /api/admin/leads/:id/full-context`
12. `PATCH /api/admin/leads/:id` (contacted, notes)
13. `PATCH /api/admin/leads/:id/revoke`
14. `PATCH /api/admin/drip-messages/:id` (approve/edit/reject)
15. `POST /api/admin/drip-messages/:lead_id/generate`
16. `GET /api/admin/nurture-dashboard`
17. `POST /api/admin/cache/invalidate`

**Legal & Webhooks:**
18. LegalDisclaimerModal with stored acknowledgment
19. `POST /api/webhooks/booking-confirmed` (Cal.com)

**Launch:**
20. Full QA pass (28 configs, both themes, mobile + desktop)
21. Google Search Console setup
22. Lighthouse audit targets met

---

## 3. Implementation Instructions

### Task 1: Vertical Cache Seeds (210 entries)
**Spec Reference:** Section 2.4
**Creates:** `data/cache-seeds/[demo_type]/[vertical].json` files, seed SQL

Use the `larkintech-cache-seed-generator` skill if available. Otherwise generate content following these rules:
- 10 preset interactions per demo × vertical combination
- Use vertical-specific terminology (see spec Section 2.2 verticals.config)
- Coherent narrative sequence per demo
- Legal vertical: every response includes "This is a fictional example for demonstration purposes"

Generate as JSON fixture files, then create an idempotent seed script that loads them into `demo_cached_responses`.

### Task 2: Vertical Content Population
**Spec Reference:** Section 2.2 (vertical_content)
**Creates:** Seed data for `vertical_content` table

Use the `larkintech-vertical-content-generator` skill if available. Generate per vertical:
- 3-5 sample documents
- 1-2 datasets (chart-ready JSON)
- 1 company profile
- 2-3 workflow templates
- 3-5 marketing copy samples

Insert via idempotent seed script.

### Task 3: Lead Scorer
**Spec Reference:** Addendum Part 1, Section 1
**Creates:** `lib/nurture/lead-scorer.ts`

```typescript
export async function calculateLeadScore(leadId: string): Promise<LeadScore>
```
- Queries all scoring dimensions (demo_sessions count, interactions, competitive_analyses, magnet_downloads, inquiries, return visits)
- Computes weighted score (0-100) using the scoring table from the addendum
- Determines tier: cold (0-19), warm (20-44), hot (45-69), on_fire (70+)
- Upserts into `lead_scores` table
- Returns score + breakdown

**Trigger integration:** Call `calculateLeadScore()` after:
- `POST /api/leads/demo-gate` (new session)
- `POST /api/demos/interact` (live AI interaction only)
- `POST /api/demos/competitive-analysis`
- `POST /api/leads/magnet-download`
- `POST /api/leads/inquiry`
- `POST /api/webhooks/booking-confirmed`

### Task 4: Drip Campaign Engine
**Spec Reference:** Addendum Part 1, Section 2
**Creates:** `lib/nurture/drip-engine.ts`

```typescript
export async function evaluateDripTriggers(leadId: string, event: string): Promise<void>
export async function processScheduledSteps(): Promise<void>
```

**evaluateDripTriggers:** After score recalculation, check if any active drip campaign should enroll this lead:
- Match on trigger_tier (lead's tier >= campaign's trigger_tier)
- Match on trigger_vertical (if specified)
- Match on trigger_event
- Don't double-enroll (check drip_enrollments)
- On enrollment: set current_step=0, calculate next_step_at from step 1's delay_hours

**processScheduledSteps:** Called by Docker cron every 15 min:
- Query `drip_enrollments WHERE status='active' AND next_step_at <= now()`
- For each: load lead context, get current step's prompt template, call email writer
- Insert generated message into `drip_messages`
- Update enrollment: increment current_step, calculate next next_step_at
- If final step: set status='completed'
- Respect lead's `subscribed` flag — skip if unsubscribed

### Task 5: AI Email Writer
**Spec Reference:** Addendum Part 1, Section 3
**Creates:** `lib/nurture/email-writer.ts`

```typescript
export async function generateEmail(leadId: string, promptTemplate: string): Promise<DripMessage>
```

- Assemble full lead context (see LeadContext interface in addendum)
- Render the prompt template with lead variables (Mustache-style: {{lead_name}}, {{vertical}}, {{demo_list}}, etc.)
- Call Claude (Sonnet, non-streaming, max 500 tokens)
- Parse response into subject + body
- Insert into `drip_messages` with status based on step's `requires_approval`
- Track tokens in api_usage_log

### Task 6: Auto-Analyst
**Spec Reference:** Addendum Part 1, Section 4
**Creates:** `lib/nurture/auto-analyst.ts`

Triggered on `competitive_analyses` INSERT:
- Check if `report_data` is complete
- If incomplete: re-run full analysis via Claude (server-side, no demo rate limit)
- Generate PDF via @react-pdf/renderer
- Store in Supabase Storage
- Update `competitive_analyses` record with pdf_storage_path
- Notify Adam via notification_outbox with lead context + report link
- Recalculate lead score (+15 points)
- Evaluate drip triggers

### Task 7: Drip Campaign Processor (Cron)
**Creates:** `scripts/process-drip.ts`, Docker cron configuration

Create a Node.js script that calls `processScheduledSteps()` and `processOutbox()`.

Add to docker-compose.yml: a cron service or `command` entry that runs this script every 15 minutes. Can use:
- Separate `cron` container with Node.js
- Or `node-cron` package running inside the main app container
- Or a simple `while sleep 900; do node scripts/process-drip.js; done` in a Docker entrypoint

### Task 8: Admin UI
**Spec Reference:** Section 3.2 (admin endpoints), Addendum Part 1 Section 5
**Creates:** `app/(marketing)/admin/` route group + components

**Protected by admin auth middleware.** All pages check `x-admin-secret` via cookie or header.

**Pages:**
- `/admin` — NurtureDashboard: lead counts by tier (cold/warm/hot/on_fire), pending messages count, recent leads list, campaign enrollment stats
- `/admin/leads` — LeadList: searchable, filterable (type, tier, contacted), sortable (score, date). Each row: name, email, tier badge, demo count, last seen, contacted toggle
- `/admin/leads/[id]` — LeadDetailView: full context (score breakdown, demo sessions, interactions, competitive analysis, drip enrollment, sent messages, pending messages)
- `/admin/messages` — MessageReviewQueue: pending_review messages with subject, body preview, lead name, approve/edit/reject buttons
- `/admin/config` — ConfigEditor: availability status, rate limits, social proof

**API endpoints (add to existing api/admin/):**
- `GET /api/admin/leads` — enhanced with `?search=`, `?tier=`, `?sort=score`, `?contacted=false`
- `GET /api/admin/leads/:id` — single lead
- `GET /api/admin/leads/:id/full-context` — complete lead context for detail view
- `PATCH /api/admin/leads/:id` — update contacted, notes
- `PATCH /api/admin/leads/:id/revoke` — increment jwt_version
- `PATCH /api/admin/drip-messages/:id` — approve, edit, reject
- `POST /api/admin/drip-messages/:lead_id/generate` — manually trigger AI email
- `GET /api/admin/nurture-dashboard` — aggregate stats
- `POST /api/admin/cache/invalidate` — invalidate cache entries by demo_type/vertical

### Task 9: Legal Disclaimer Modal
**Spec Reference:** Section 7.5
**Creates:** `components/demos/LegalDisclaimerModal.tsx`

Required for the legal vertical ONLY. Shows before any legal demo loads:
- Modal with exact copy: "All content in this demo is fictional and for demonstration purposes only. Nothing here constitutes legal advice. Do not rely on any generated documents for legal decisions."
- Required checkbox: "I understand this is a demonstration with fictional content"
- "Continue" button only enabled after checkbox
- On accept: insert into `vertical_disclaimer_acknowledgments` table
- Re-shown on EVERY page load — not suppressible via localStorage
- Downloaded documents from legal vertical include disclaimer as first line

### Task 10: Cal.com Booking Webhook
**Spec Reference:** Section 3.2
**Creates:** `app/api/webhooks/booking-confirmed/route.ts`

- Verify Cal.com webhook signature
- Extract: email, name, event_type, scheduled_time from payload
- Upsert into `inquiries` with `audience_type='booking'`
- Link to `demo_leads` if email matches (set demo_lead_id)
- Insert notification_outbox entry
- Recalculate lead score (+25 points)
- Evaluate drip triggers (may trigger "on_fire" campaign)

### Task 11: Full QA Pass
**Creates:** No new files — comprehensive testing

Test matrix:
- All 28 demo configs (7 types × 4 verticals): presets work, correct vertical content displayed
- Both themes (dark + light) on all pages
- Mobile (320px) + tablet (768px) + desktop (1440px)
- All forms: contact, email gate, lead magnet, competitive analysis
- All notifications: verify emails sent for each capture type
- Legal vertical: disclaimer modal appears, acknowledgment stored
- Rate limiting: verify per-demo + global limits work
- Admin UI: lead list, detail view, message review queue, config editor
- Lead scoring: verify scores update on interactions
- Drip engine: verify enrollment on score change, message generation
- Lighthouse: Performance ≥85, Accessibility ≥90, SEO ≥95

### Task 12: Launch Preparation
**Creates:** Configuration files, documentation

- Google Search Console: verify site ownership, submit sitemap
- Cloudflare: verify SSL, caching rules, admin IP allowlist configured
- Supabase: verify all seeds loaded, RLS enforced, storage buckets created
- Docker: verify blue-green deploy works end-to-end
- Backup: set up nightly pg_dump script on VPS
- Monitoring: configure UptimeRobot or equivalent for health check endpoint
- Final `.env.production` verification on VPS
- Domain: verify LarkinTECH.ai DNS points to Cloudflare

---

## 4. Acceptance Criteria

### Verticals
- [ ] All 28 demo configurations functional with ≥10 cached interactions each
- [ ] Construction demos use construction terminology and sample data
- [ ] Property management demos use PM terminology and sample data
- [ ] Legal demos use legal terminology; all responses include fictional disclaimer
- [ ] Seed script is idempotent (run twice = no errors)

### Nurture Engine
- [ ] Lead scores recalculate on new interactions (verify score changes)
- [ ] Tier thresholds correct: 20=warm, 45=hot, 70=on_fire
- [ ] Drip enrollment triggers when tier threshold crossed
- [ ] AI email writer generates personalized email with lead context
- [ ] Messages with `requires_approval=true` enter pending_review status
- [ ] Messages with `requires_approval=false` auto-send via outbox
- [ ] Drip processor runs on schedule (15 min)
- [ ] Auto-analyst completes partial competitive analyses + generates PDF

### Admin
- [ ] Admin pages protected by admin auth
- [ ] Lead list: search, filter by tier, sort by score, toggle contacted
- [ ] Lead detail: full context (score, sessions, interactions, competitive analysis, drip status)
- [ ] Message queue: approve/edit/reject works; approved messages dispatch via outbox
- [ ] Config editor: availability status, rate limits updatable
- [ ] Cache invalidation: sets matching entries to active=false

### Legal
- [ ] Legal disclaimer modal appears before ANY legal vertical demo
- [ ] Checkbox required before "Continue" enables
- [ ] Acknowledgment stored in vertical_disclaimer_acknowledgments
- [ ] Modal re-appears on every page load (not persistent)
- [ ] Downloaded legal docs include disclaimer as first line

### Webhook
- [ ] Cal.com booking webhook: creates inquiry, links demo_lead, triggers score recalc

### QA / Launch
- [ ] All 28 demo configs tested in both themes on mobile + desktop
- [ ] All forms trigger notifications
- [ ] Lighthouse: Performance ≥85, Accessibility ≥90, SEO ≥95 on all SSR pages
- [ ] Site loads in <3s on 4G mobile
- [ ] axe-core: 0 violations

---

## 5. Constraints

### Hard Constraints
- Do NOT modify demo infrastructure (Phase 04) or demo components (Phase 05).
- All legal vertical content must include fictional disclaimers.
- All drip messages require lead's `subscribed=true` before sending.
- Admin UI must use the existing admin auth middleware.
- Nurture engine must respect api_usage_log daily spend cap.

### Soft Constraints
- Vertical content quality matters more than quantity. Better to have 8 excellent presets than 10 mediocre ones.
- Admin UI can be functional over beautiful. Clean, usable, no design awards needed.
- Drip campaign prompt templates can be refined post-launch.

---

## 6. Completion Protocol
Provide structured report. **Critical:** Document all placeholder content that needs replacement, any drip campaigns that need prompt tuning, admin UI features that are minimal, and any QA issues found + their severity.

---

## 7. Execution & Orchestration
**Recommended:** `claude --max-turns 100` (plan for 2-3 `--continue` cycles)
**Task order:** Cache seeds → Vertical content → Lead scorer → Drip engine → Email writer → Auto-analyst → Cron → Admin UI → Legal disclaimer → Webhook → QA → Launch prep
**Resumption:** Check `PHASE-06-PROGRESS.md`. Content generation tasks can be done out of order.
**Progress Tracking:** Update after each major task.
