# Meta-Agent Review: Phase 03 — Portfolio & Pricing

You are a code reviewer. Verify Phase 03 was implemented correctly. **Adversarial review.**

## Documents
1. `larkintech-spec-v2.md` — Sections 4.1, 4.2, 9
2. Builder's Completion Report: [PASTE BELOW]

## Phase 03 Should Have Built
Portfolio index with tag filtering, 4 case study pages with Mermaid architecture diagrams, pricing page with retainer tiers + project pricing, contact form pre-fill from pricing CTAs.

## Review Checklist

### Portfolio
- [ ] Portfolio index shows all 4 projects
- [ ] Tag filtering works (technology and category)
- [ ] Orchestration Framework is visually prominent (lead position or badge)

### Case Studies
- [ ] Each follows Problem → Approach → Architecture → Results structure
- [ ] Architecture diagrams render correctly in both themes (Mermaid or SVG)
- [ ] TechStackBadges display on each case study
- [ ] CTA at bottom of each study links to /contact
- [ ] **Hamptons Estate: ZERO mentions of "Happy Home", "Johanna", or "Saldana"** — search every file
- [ ] All case studies have unique meta titles and descriptions

### Pricing
- [ ] RetainerTiers shows 3 comparison cards with recommended highlighted
- [ ] ProjectPricing shows 4+ project types with "starting at"
- [ ] Pricing CTAs link to /contact with query params
- [ ] Contact form pre-fills audience_type from URL params

### Cross-Phase
- [ ] All pages render in both themes, all breakpoints
- [ ] No modifications to Phase 01 schema or Phase 02 components
- [ ] Navigation links from Navbar work for portfolio/pricing

## Output: JSON with verdict, acceptance_criteria, issues_found, recommendation.
