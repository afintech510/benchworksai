# Meta-Agent Review: Phase 06 — Verticals, Nurture, Admin, Legal & Launch

You are a code reviewer. This is the **FINAL review before launch.** Verify completeness across the entire system — 28 demo configs, nurture engine, admin UI, legal compliance, and production readiness.

## Documents
1. `larkintech-spec-v2.md` + `larkintech-spec-v2-addendum.md`
2. Builder's Completion Report: [PASTE BELOW]

## Phase 06 Should Have Built
210 additional cache seeds (3 verticals), vertical content, lead nurture engine (scorer, drip, email writer, auto-analyst), admin UI, legal disclaimer modal, Cal.com webhook, full QA, launch preparation.

## Review Checklist

### Vertical Content (28 Configurations)
- [ ] All 28 demo configs (7 × 4) have ≥10 cached presets
- [ ] Construction demos: use construction terminology (CMU blocks, bids, change orders)
- [ ] Property management demos: use PM terms (leases, maintenance requests, tenants)
- [ ] Legal demos: use legal terms (trusts, estate plans, power of attorney)
- [ ] **Legal demos: EVERY cached response includes "fictional example" disclaimer**
- [ ] Seed script is idempotent
- [ ] vertical_content table populated for all 4 verticals

### Nurture Engine
- [ ] Lead scorer: recalculates on interaction, tier thresholds correct (test: score a lead from 0 to 70+)
- [ ] Drip enrollment: triggers when tier threshold crossed (test: push lead to "warm" → verify enrollment)
- [ ] Email writer: generates personalized email with lead context (inspect generated subject + body)
- [ ] requires_approval=true → status=pending_review; =false → auto-approved
- [ ] Auto-analyst: completes partial competitive analysis + generates PDF + notifies Adam
- [ ] Drip processor cron runs on schedule
- [ ] Respects subscribed flag (unsubscribed leads don't receive emails)
- [ ] API usage tracked for nurture email generation (doesn't exceed daily cap)

### Admin UI
- [ ] All admin pages require admin auth (test without secret → 403)
- [ ] Lead list: search by email works, filter by tier works, sort by score works
- [ ] Lead detail: shows score breakdown, demo history, competitive analysis, drip status
- [ ] Message queue: approve → status changes to 'approved' → dispatches via outbox
- [ ] Message queue: edit → saves changes → can then approve
- [ ] Message queue: reject → status changes to 'rejected'
- [ ] Config editor: change availability status → badge updates on public site
- [ ] Cache invalidation: request → matching entries set to active=false

### Legal Compliance
- [ ] Legal disclaimer modal: appears before ANY legal vertical demo
- [ ] Checkbox required before "Continue" enables
- [ ] Acknowledgment stored in vertical_disclaimer_acknowledgments with disclaimer_version
- [ ] Modal re-appears on every page load (clear cookies, revisit → modal reappears)
- [ ] Downloaded legal docs include disclaimer as first line (check PDF/text output)

### Webhook
- [ ] Cal.com booking webhook: verify signature → create inquiry → link demo_lead → score recalc → notification
- [ ] Test with sample webhook payload

### Production Readiness (LAUNCH BLOCKERS)
- [ ] **Lighthouse Performance ≥85** on homepage, service pages, demo showroom
- [ ] **Lighthouse Accessibility ≥90** on all SSR pages
- [ ] **Lighthouse SEO ≥95** on all SSR pages
- [ ] **axe-core 0 violations** across all pages
- [ ] Site loads in <3s on simulated 4G
- [ ] SSL certificate active (HTTPS only)
- [ ] .env.production verified on VPS (all required vars present)
- [ ] Blue-green deploy verified end-to-end
- [ ] Health check endpoint returns healthy with ?deep=true
- [ ] Nightly pg_dump backup configured
- [ ] Sitemap submitted to Google Search Console
- [ ] Cloudflare admin IP allowlist configured

### Security Final Check
- [ ] RLS still enforced: anon key cannot read demo_leads (test!)
- [ ] No hardcoded secrets in codebase (grep for API keys, passwords)
- [ ] No console.log or debug statements in production code
- [ ] Admin auth: wrong secret → 403; brute force → 429
- [ ] All POST endpoints validate CSRF origin

### Cross-Phase Integration
- [ ] Contact form inquiry → score recalculation → drip enrollment (if eligible) → message generation
- [ ] Demo interaction → score update → tier change → enrollment check
- [ ] Competitive analysis → auto-analyst → PDF → notification → score boost
- [ ] Cal.com booking → inquiry → score boost → on_fire campaign trigger

## Output: JSON with verdict, acceptance_criteria, issues_found, recommendation. **This is launch gate. PROMOTE = ready to launch. FIX = fix before launch. ESCALATE = human decision on scope.**
