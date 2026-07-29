# Phase 02: Core Site & Lead Capture
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 01 complete
**Implements:** F-001–F-012, F-033–F-036, F-040–F-045
**Recommended:** `claude --max-turns 75`
**⚡ Can run PARALLEL with Phase 04**

---

## 1. Context

You are executing **Phase 02: Core Site & Lead Capture** of the Larkin Tech build.

**Your scope is strictly this phase.** Do not build demo showroom pages, demo engine components, or portfolio/pricing pages. You are building the marketing site shell, all service pages, about page, contact/lead capture, email notifications, lead magnet, booking embed, privacy page, and SEO infrastructure.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase, SendGrid, Cal.com, @react-pdf/renderer, react-hook-form, zod, pino
**Working Directory:** Project root
**Spec File:** `larkintech-spec-v2.md` — READ THIS FILE FIRST.

### What Already Exists (from Phase 00 + 01)
- Next.js project scaffolded with full directory structure
- Docker blue-green deployment pipeline
- All 19 database tables with RLS, triggers, seeds
- `lib/supabase/server.ts` and `lib/supabase/client.ts`
- `lib/validation/schemas.ts` (all Zod schemas)
- `lib/demo-engine/session.ts` (JWT module)
- `lib/auth/admin.ts` (admin middleware)
- `lib/auth/csrf.ts` (CSRF middleware)
- `lib/email/notify.ts` (SendGrid wrapper — NOT an API route)
- `lib/utils/logger.ts` (pino)
- `app/api/health/route.ts` (multi-dependency)
- `globals.css` with theme variables
- Root `app/layout.tsx` with theme init script

### What You're Building
The complete marketing website: dual-theme system, responsive layout, homepage with segmented hero, 5 SEO service pages, about page with integrated resume, contact page with segmented form and booking embed, privacy policy, lead magnet with PDF and download flow, email notification pipeline, and all SEO infrastructure. After this phase, the site is a fully functional lead generation machine — just without the demo showroom and portfolio.

---

## 2. Objective & Deliverables

### Objective
After this phase, visitors can browse the Larkin Tech marketing site in dark or light theme, read service pages optimized for SEO, view Adam's about/resume page, submit segmented contact forms that trigger email notifications, book discovery calls via Cal.com, download the AI Enablement Playbook via gated flow with persistent re-download, and find the site via search engines.

### Deliverables

1. **Dual-theme engine** — ThemeProvider, ThemeToggle, CSS custom properties, `prefers-color-scheme` detection, FOUC-free — Spec Section 4.3
2. **Layout components** — Navbar (sticky, mobile hamburger), Footer, MobileMenu, CTABanner — Spec Section 4.1
3. **Logo component** — Stylized "LaRKiN TECH" with A and I highlighted — Spec Section 4.2
4. **Homepage** — HeroSection (dual CTA: "Hire Me" / "Work With Me"), ServicesOverview (6 cards), SocialProofStrip (hardcoded metrics), AvailabilityBadge, DemoTeaser — Spec Section 4.1
5. **5 service pages** with ServicePageLayout — `/services/ai-solutions-architect`, `/prompt-engineering`, `/ai-automation`, `/fractional-cto`, `/ai-implementation` — Spec Sections 4.1, 4.4
6. **About page** — BioSection (headshot placeholder + narrative), SkillsMatrix, ResumeSection (generalized, no company names), ExternalLinks (LinkedIn, GitHub) — Spec Section 4.1
7. **Contact page** — SegmentedForm (audience-adaptive, inline validation on blur, submitting/success/error states), BookingEmbed (Cal.com config interface) — Spec Sections 4.1, 4.2
8. **Privacy policy page** at `/privacy` — Spec Section 7.6
9. **`POST /api/leads/inquiry`** — Zod validation, marketing_context UTM capture, demo_lead_id linking, notification_outbox insert — Spec Section 3.2
10. **`POST /api/leads/magnet-download`** — Email gate, persistent download_token, email delivery of link — Spec Section 3.2
11. **`GET /api/leads/magnet-download/:token`** — Re-download endpoint — Spec Section 3.2
12. **`PATCH /api/admin/config/:key`** — Update availability badge — Spec Section 3.2
13. **Notification outbox processor** — `lib/email/outbox.ts` — processes pending notifications with retry — Spec Section 2.2
14. **Lead magnet PDF v1** — Construction vertical, 10-15 pages — store in Supabase Storage — SOW F-035
15. **SEO infrastructure** — Meta tags, OG images, JSON-LD (Person, Service, Organization), native `app/sitemap.ts`, `app/robots.ts` — Spec Section 4.2
16. **AvailabilityBadge** — Reads from site_config, green/yellow/red states — Spec Section 4.2

---

## 3. Implementation Instructions

### Task 1: Dual-Theme System
**Spec Reference:** Section 4.3
**Creates:** `components/layout/ThemeToggle.tsx`, ThemeProvider context, updated `globals.css`

Build on the theme variables and init script from Phase 00. Create:
- ThemeProvider context wrapping the app
- ThemeToggle component with `aria-label` that updates ("Switch to dark mode" / "Switch to light mode")
- Verify: no FOUC on page load (blocking script handles it)
- Verify: `prefers-color-scheme` detected on first visit when no localStorage value exists
- Both themes must have WCAG 4.5:1 contrast for body text, 3:1 for large text

### Task 2: Layout Shell
**Spec Reference:** Section 4.1, 4.2
**Creates:** `components/layout/Navbar.tsx`, `Footer.tsx`, `MobileMenu.tsx`, `CTABanner.tsx`, `components/shared/Logo.tsx`

- Navbar: sticky, links to Home, Services, Demos (placeholder link), Portfolio (placeholder), Pricing (placeholder), About, Contact
- Mobile: hamburger menu at ≤768px
- Active page indicator in nav
- Logo: "LaRKiN TECH" with A and I visually differentiated (color/weight/font)
- Footer: nav links, social links (LinkedIn, GitHub), copyright, privacy link
- CTABanner: floating/sticky strip with primary CTA

### Task 3: Homepage
**Spec Reference:** Section 4.1
**Creates:** `app/page.tsx`, `components/home/HeroSection.tsx`, `ServicesOverview.tsx`, `SocialProofStrip.tsx`, `AvailabilityBadge.tsx`, `DemoTeaser.tsx`

- HeroSection: Two clear CTAs — "Hire Me" (→ /about) and "Work With Me" (→ /contact). Positioning statement above.
- ServicesOverview: 6 cards linking to service pages. Each has icon, title, one-line description.
- SocialProofStrip: 3-5 hardcoded metrics. Mark with `// PLACEHOLDER — finalize real metrics before launch`.
- AvailabilityBadge: Reads `site_config.availability_status` via server component. Green/yellow/red states.
- DemoTeaser: Preview/link to demo showroom (links to /demos — page built in Phase 04).

### Task 4: Service Pages
**Spec Reference:** Section 4.1, 4.4
**Creates:** `components/services/ServicePageLayout.tsx`, 5 page files under `app/(marketing)/services/`

Create ServicePageLayout shared component. Each page:
- Unique H1 with target keyword
- ≥500 words of content (use the `larkintech-service-page-writer` skill output if available, otherwise placeholder with `// PLACEHOLDER — replace with skill-generated content`)
- Unique `<title>` and `<meta description>` targeting keyword
- JSON-LD Service schema
- Internal links to relevant case studies (placeholder hrefs to /portfolio/[slug]) and demos
- CTA at bottom linking to contact or booking

**Pages:** ai-solutions-architect, prompt-engineering, ai-automation, fractional-cto, ai-implementation

### Task 5: About Page
**Spec Reference:** Section 4.1, 4.2
**Creates:** `app/(marketing)/about/page.tsx`, `components/about/BioSection.tsx`, `SkillsMatrix.tsx`, `ResumeSection.tsx`, `ExternalLinks.tsx`

- BioSection: Headshot image placeholder (`public/images/headshot.jpg` — create placeholder), professional bio (generalized, no company names)
- SkillsMatrix: Visual display of technical competencies (React, Next.js, TypeScript, Python, Supabase, Docker, Claude API, etc.)
- ResumeSection: Experience as capabilities and outcomes, NOT chronological. "Available for" section: full-time, contract, fractional, advisory.
- ExternalLinks: LinkedIn, GitHub icons. Open in new tab.
- JSON-LD Person schema

### Task 6: Contact Page + Segmented Form
**Spec Reference:** Section 3.2, 4.1, 4.2
**Creates:** `app/(marketing)/contact/page.tsx`, `components/contact/SegmentedForm.tsx`, `BookingEmbed.tsx`, `FormSuccessState.tsx`

**SegmentedForm (F-033):**
- Audience selector at top: "I'm hiring" / "I need AI help" / "I'm an agency" / "Other"
- Fields adapt based on selection (per spec Section 3.2 request shape)
- React Hook Form with `mode: 'onBlur'` for inline validation
- Submit button: disabled + "Sending..." on submit
- Success state: form replaced by `FormSuccessState` component with message + secondary CTA ("While you wait, explore our AI demos →")
- Error state: toast at top of form for API errors, field-level errors for 400s
- Captures `marketing_context` (UTM params from URL)
- If user has demo session cookie, extracts `lead_id` and sets `demo_lead_id` on inquiry

**BookingEmbed (F-034):**
- Config interface: `{ platform: 'calcom', url: string }`
- Cal.com embed via `@calcom/embed-react` or iframe
- Error boundary: if embed fails, show fallback "Email me to schedule" with mailto link
- Pre-fill name/email from DemoSessionContext if available

**`POST /api/leads/inquiry`:**
- Validate with `inquirySchema`
- Insert into `inquiries` table
- Insert into `notification_outbox` (type: 'lead_inquiry')
- If demo session cookie present, set `demo_lead_id`
- Return success message

### Task 7: Lead Magnet Flow
**Spec Reference:** Section 3.2, 4.1
**Creates:** `components/contact/LeadMagnetGate.tsx`, lead magnet API routes

**LeadMagnetGate component:**
- Email + name input form
- On submit: calls `POST /api/leads/magnet-download`
- Success state: "Your download has started. We've also sent the link to [email]."
- PDF auto-downloads + email with download link sent

**`POST /api/leads/magnet-download`:**
- Upsert into `lead_magnet_downloads` with `download_token` UUID
- Link to `demo_leads` if email matches
- Generate signed Supabase Storage URL (7-day expiry)
- Send email to user with persistent re-download link
- Insert into `notification_outbox` for Adam

**`GET /api/leads/magnet-download/:token`:**
- Look up `lead_magnet_downloads` by `download_token`
- Generate fresh signed URL
- Redirect to URL

**Lead magnet PDF:**
- If skill-generated content is available, use it. Otherwise create a minimal 5-page placeholder PDF using @react-pdf/renderer.
- Upload to Supabase Storage under `downloads/ai-playbook-construction.pdf`

### Task 8: Privacy Policy Page
**Spec Reference:** Section 7.6
**Creates:** `app/(marketing)/privacy/page.tsx`

Simple one-page privacy policy covering:
- What data is collected (email, name, company, demo interactions)
- How it's used (lead capture, notifications, analytics)
- Third parties (Supabase, SendGrid, Anthropic — for demo AI features)
- User rights (unsubscribe, data deletion request via email)
- Contact information

Footer on all pages links to `/privacy`.

### Task 9: Email Notification Pipeline
**Spec Reference:** Section 2.2 (notification_outbox), Section 5.2
**Creates:** `lib/email/outbox.ts`, email templates

Build notification outbox processor:
- `processOutbox()`: queries `notification_outbox WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= now())`
- For each: call `lib/email/notify.ts` to send via SendGrid
- On success: set `status = 'sent'`, `completed_at = now()`
- On failure: increment `retry_count`, set `next_retry_at` with exponential backoff (30s, 120s, 600s, 3600s). Max 4 retries → `status = 'exhausted'`
- Call `processOutbox()` after each lead capture API call (lazy processing)

Email templates:
- Lead inquiry notification (to Adam): includes all form fields
- Lead magnet download notification (to Adam): includes email, magnet slug
- Lead magnet delivery (to user): includes download link with persistent token

### Task 10: SEO Infrastructure
**Spec Reference:** Section 4.2
**Creates:** `components/shared/SEOHead.tsx`, `StructuredData.tsx`, `app/sitemap.ts`, `app/robots.ts`

- SEOHead: generates `<title>`, `<meta description>`, OG tags per page
- StructuredData: renders JSON-LD script tags (Person, Service, Organization schemas)
- `app/sitemap.ts`: native Next.js 14 sitemap generation listing all public pages
- `app/robots.ts`: native Next.js 14 robots.txt allowing all crawlers
- Default OG image at `public/images/og-image.png` (placeholder — create with site name)

### Task 11: Responsive Validation
**Creates:** No new files — validation pass on all components

Verify every page renders correctly at: 320px, 768px, 1024px, 1440px. All CTAs thumb-reachable on mobile. Hamburger menu works. Forms usable on mobile.

---

## 4. Acceptance Criteria

### Theme
- [ ] Theme toggle switches dark/light; persists via localStorage; no FOUC
- [ ] OS dark mode preference detected on first visit
- [ ] Both themes: WCAG 4.5:1 contrast on body text
- [ ] ThemeToggle has `aria-label` that updates

### Layout
- [ ] Navbar sticky on scroll, all links work
- [ ] Mobile hamburger appears at ≤768px, menu opens/closes
- [ ] Footer renders on all pages with privacy link
- [ ] Logo renders correctly in both themes

### Homepage
- [ ] HeroSection shows two CTAs: "Hire Me" → /about, "Work With Me" → /contact
- [ ] ServicesOverview shows 6 cards linking to service pages
- [ ] AvailabilityBadge reflects site_config value (test by changing via admin API)

### Service Pages
- [ ] All 5 pages render with unique `<title>` and `<meta description>`
- [ ] JSON-LD validates in Google Rich Results Test (or manual verification)
- [ ] Each page has ≥500 words of content (or placeholder marked)

### Contact Form
- [ ] Audience selector changes visible fields
- [ ] Inline validation fires on blur (not just submit)
- [ ] Submit: button disabled + "Sending..." → success state replaces form
- [ ] Error: toast for 400/429, field errors for validation
- [ ] Data appears in Supabase `inquiries` table with correct audience_type
- [ ] `notification_outbox` entry created → email sent to Adam within 60s

### Lead Magnet
- [ ] Email gate → signed URL returned + email sent to user with download link
- [ ] Re-download via `/api/leads/magnet-download/:token` works after 24 hours
- [ ] `lead_magnet_downloads` table populated with download_token
- [ ] PDF exists in Supabase Storage

### Booking
- [ ] Cal.com embed loads and functions
- [ ] Fallback shown if embed fails to load

### SEO
- [ ] Sitemap accessible at /sitemap.xml listing all pages
- [ ] robots.txt accessible
- [ ] OG image exists

### Responsive
- [ ] All pages render at 320px, 768px, 1024px, 1440px without horizontal scroll

---

## 5. Constraints

### Hard Constraints
- Do NOT build demo showroom pages, demo engine UI, or portfolio/pricing pages.
- Database schema from Phase 01 is READ-ONLY. Do not modify tables.
- Use `lib/supabase/server.ts` for ALL data operations. Never use anon client for data.
- Use notification_outbox pattern for all emails. Do not call SendGrid directly from API routes.
- CSRF validation on all POST endpoints.

### Soft Constraints
- Service page content may be placeholder if skill output not available. Mark clearly.
- Cal.com embed URL will need configuration — document the setup.
- Lead magnet PDF may be minimal placeholder. Mark for replacement.
- If headshot image not available, use a styled initials circle placeholder.

---

## 6. Completion Protocol

Provide structured report: Files Created, Files Modified, Acceptance Criteria Results, Spec Ambiguities, Blocked Items, Decisions Made, Warnings for Next Phase (especially: which placeholder content needs replacement, Cal.com configuration needed).

---

## 7. Execution & Orchestration

**Recommended:** `claude --max-turns 75`

**Task Planning:** Read spec Sections 3.2, 4.1-4.4, 5.2, 5.3, 7.5, 7.6, 8.1 first. Build in order: theme → layout → homepage → services → about → contact → lead magnet → privacy → notifications → SEO → responsive check.

**Resumption (--continue):** Check `PHASE-02-PROGRESS.md`. Resume from first incomplete task.

**Progress Tracking:** Update `PHASE-02-PROGRESS.md` after each task.
