# Meta-Agent Review: Phase 02 — Core Site & Lead Capture

You are a code reviewer. Verify Phase 02 was implemented correctly. **Adversarial review.**

## Documents
1. `larkintech-spec-v2.md` — Sections 3.2, 4.1-4.4, 5.2, 5.3, 7.5, 7.6, 8.1
2. Builder's Completion Report: [PASTE BELOW]

## Phase 02 Should Have Built
Dual-theme system, responsive layout, homepage with segmented hero, 5 service pages, about page, contact page with segmented form + Cal.com, privacy policy, lead magnet flow, email notification pipeline, SEO infrastructure.

## Review Checklist

### Theme System
- [ ] Toggle switches dark/light; persists in localStorage
- [ ] No FOUC on reload (blocking script works)
- [ ] prefers-color-scheme detected on first visit
- [ ] WCAG 4.5:1 contrast on body text in both themes
- [ ] ThemeToggle has updating aria-label

### Layout & Responsive
- [ ] Navbar sticky, mobile hamburger at ≤768px
- [ ] All pages render at 320px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on any page/breakpoint
- [ ] Footer has privacy link

### Forms & Lead Capture
- [ ] SegmentedForm: audience selector changes fields
- [ ] Inline validation fires on blur (not just submit)
- [ ] Submit: disabled + "Sending..." → success state replaces form
- [ ] Error: toast for API errors, field-level for validation
- [ ] Data lands in Supabase inquiries table with correct fields
- [ ] marketing_context captures UTM params from URL
- [ ] demo_lead_id set when demo session cookie exists
- [ ] notification_outbox entry created → email sent

### Lead Magnet
- [ ] Email gate → download + email delivery with persistent token
- [ ] Re-download via /api/leads/magnet-download/:token works
- [ ] PDF exists in Supabase Storage

### Booking
- [ ] Cal.com embed loads; fallback shown if blocked
- [ ] Pre-fill from session context works (if applicable)

### SEO
- [ ] All 5 service pages have unique <title> and <meta description>
- [ ] JSON-LD validates (Person, Service schemas)
- [ ] /sitemap.xml lists all public pages
- [ ] /robots.txt accessible

### Code Quality
- [ ] All data operations use lib/supabase/server.ts (service role)
- [ ] No direct SendGrid calls — all through notification_outbox
- [ ] CSRF validation on all POST endpoints
- [ ] No hardcoded secrets

## Output: JSON with verdict (PROMOTE/FIX/ESCALATE), acceptance_criteria, issues_found, recommendation.
