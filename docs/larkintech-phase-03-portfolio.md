# Phase 03: Portfolio & Pricing
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 02 complete
**Implements:** F-013–F-017, F-037–F-039
**Recommended:** `claude --max-turns 50`

---

## 1. Context

You are executing **Phase 03: Portfolio & Pricing** of the Larkin Tech build.

**Scope:** Portfolio index page, 4 case study pages with architecture diagrams, and pricing page with retainer + project tiers. Do NOT build demo showroom features or modify the lead capture system.

**Working Directory:** Project root
**Spec File:** `larkintech-spec-v2.md`

### What Already Exists (from Phases 00-02)
- Full marketing site shell with dual-theme, responsive layout
- Homepage with hero, services overview, social proof
- 5 service pages with SEO
- About page with resume section
- Contact page with segmented form + Cal.com booking
- Lead magnet download flow
- Email notification pipeline
- All database tables, RLS, auth

### What You're Building
Portfolio showcase and pricing page. The portfolio leads with the Multi-Agent Orchestration Framework and includes 3 additional projects. Each case study follows Problem → Approach → Architecture → Results format with Mermaid diagrams. The pricing page shows retainer tiers and project-based pricing with CTAs to the contact form.

---

## 2. Objective & Deliverables

### Objective
After this phase, visitors can browse the portfolio, read detailed case studies with architecture diagrams, and view pricing options. Each case study and pricing tier links back to the contact form with pre-filled context.

### Deliverables
1. **PortfolioGrid** — filterable project cards — Spec Section 4.1
2. **CaseStudyLayout** — shared layout component — Spec Section 4.2
3. **TechStackBadges** — tech tag display component — Spec Section 4.2
4. **ArchitectureDiagram** — Mermaid renderer or pre-rendered SVG — Spec Section 4.2
5. **4 case study pages:** Orchestration Framework (lead), Eastern LM, Hamptons Estate, HostHampton — Spec Sections 4.1
6. **RetainerTiers** — 3-tier comparison cards — Spec Section 4.2
7. **ProjectPricing** — project type pricing list — Spec Section 4.2
8. **Pricing page** combining both components with CTAs — Spec Section 4.1

---

## 3. Implementation Instructions

### Task 1: Portfolio Grid
**Spec Reference:** Section 4.1, 4.2
**Creates:** `app/(marketing)/portfolio/page.tsx`, `components/portfolio/PortfolioGrid.tsx`

Grid of 4 project cards. Each card: thumbnail/screenshot area (placeholder image), title, one-line description, tech stack tags, link to case study. Tag filtering: filter by technology (React, Python, Docker, AI, etc.) or category (Architecture, Data, Full-Stack, Frontend).

Orchestration Framework card should be visually prominent — larger, first position, or "Featured" badge.

### Task 2: Case Study Layout
**Spec Reference:** Section 4.2
**Creates:** `components/portfolio/CaseStudyLayout.tsx`, `TechStackBadges.tsx`, `ArchitectureDiagram.tsx`

CaseStudyLayout accepts: title, problem, approach, architecture (Mermaid string or SVG), results, techStack[], CTAs.

TechStackBadges: renders technology names as styled pills/badges.

ArchitectureDiagram: renders Mermaid diagrams. Options:
- Use `mermaid` library loaded client-side for dynamic rendering
- Or pre-render Mermaid to SVG at build time and serve as static images
- Recommend client-side rendering for flexibility

### Task 3: Case Study — Multi-Agent Orchestration Framework (LEAD)
**Spec Reference:** Section 4.1 (F-014)
**Creates:** `app/(marketing)/portfolio/orchestration-framework/page.tsx`

**Content** (use `larkintech-case-study-writer` skill output if available, otherwise write based on known context):

- **Problem:** Organizations need multiple AI agents to collaborate on complex tasks, but existing frameworks lack formal privilege escalation, policy enforcement, and audit trails.
- **Approach:** Designed a multi-agent architecture with a Chief of Staff agent, maturity ladder (Levels 0-4), policy engine, and tenant isolation.
- **Architecture:** Mermaid diagram showing agent hierarchy, privilege escalation flow, policy engine.
- **Results:** Production-ready assessment after 3 review cycles. Six-week phased build sequence.
- **Tech Stack:** Python, LangGraph/CrewAI, FastAPI, PostgreSQL, Redis, Docker

CTA: "Interested in AI agent architecture? Let's talk." → /contact

### Task 4: Case Study — Eastern LM Customer Lifecycle Engine
**Spec Reference:** Section 4.1 (F-015)
**Creates:** `app/(marketing)/portfolio/customer-lifecycle-engine/page.tsx`

- **Problem:** Thousands of POS orders with no customer identity linking. Orphaned orders, missing analytics, no behavioral segmentation.
- **Approach:** Built a customer lifecycle engine with phone-first E.164 matching, email fallback, behavioral tagging (repeat/high-value/VIP), customer_type enum.
- **Architecture:** Mermaid diagram showing data pipeline: POS → matching engine → enrichment → segmentation → analytics dashboard.
- **Results:** Matched orphaned orders to customer profiles. Enabled behavioral segmentation. Order Analytics Dashboard built with React, PapaParse, Recharts.
- **Tech Stack:** React, TypeScript, Supabase/PostgreSQL, PapaParse, Recharts

### Task 5: Case Study — Hamptons Estate Property Management
**Spec Reference:** Section 4.1 (F-016)
**Creates:** `app/(marketing)/portfolio/hamptons-estate/page.tsx`

**OBFUSCATION:** Never mention "Happy Home", "Johanna", or "Saldana". All references use "Hamptons Estate Property Management." Location: "Hamptons area, Long Island."

- **Problem:** Property management company running on manual processes — spreadsheets, phone calls, paper forms. Needed digital transformation.
- **Approach:** Full-stack client engagement from contract negotiation through production deployment. Tiered service agreement with system ownership vesting.
- **Architecture:** Mermaid diagram showing client portal, admin dashboard, notification system, Google Maps integration, payment processing.
- **Results:** Complete digital platform deployed. Automated client communications, service scheduling, and billing.
- **Tech Stack:** Next.js, TypeScript, Tailwind, Supabase, Docker, SendGrid, Twilio, Google Maps API, Stripe Connect

### Task 6: Case Study — HostHampton
**Spec Reference:** Section 4.1 (F-017)
**Creates:** `app/(marketing)/portfolio/host-hampton/page.tsx`

- **Problem:** Community event organization needed a polished digital presence with lead capture and fundraiser support.
- **Approach:** Designed a high-conversion event platform with boutique Hamptons aesthetic and modular configuration.
- **Architecture:** Mermaid diagram showing landing page → multi-step form → payment → confirmation → follow-up flow.
- **Results:** Reusable FUNDRAISER_CONFIG architecture enabling rapid event deployment. Multi-step lead capture form with high completion rate.
- **Tech Stack:** React, JavaScript, Tailwind, Twilio MMS

### Task 7: Pricing Page
**Spec Reference:** Section 4.1 (F-037, F-038, F-039)
**Creates:** `app/(marketing)/pricing/page.tsx`, `components/pricing/RetainerTiers.tsx`, `ProjectPricing.tsx`

**RetainerTiers (F-038):** 3 comparison cards side-by-side:
- **Starter** — $X/month. Best for: SMBs starting with AI. Includes: X hours, Y capabilities.
- **Growth** — $X/month. Best for: Growing companies. Includes: expanded scope.
- **Enterprise** — Custom pricing. Best for: Full AI transformation. Includes: fractional CTO, dedicated support.
- Recommended tier highlighted with accent border.

**ProjectPricing (F-039):** 4+ project types:
- AI Chatbot Build — Starting at $X
- Workflow Automation — Starting at $X
- Document AI System — Starting at $X
- Full AI Implementation — Starting at $X

**Note:** Use placeholder pricing with `// PLACEHOLDER — Adam to finalize pricing`. Mark prominently.

Each tier/project CTA links to `/contact` with pre-filled `audience_type` and `project_type` via URL query params. The SegmentedForm from Phase 02 should read these params to pre-select the audience type.

### Task 8: Contact Form Pre-Fill Integration
**Creates:** Update to `components/contact/SegmentedForm.tsx`

Read URL query params (`?type=smb_client&project=chatbot_build`) and pre-select the audience type and project type in the form. This connects pricing CTAs to the contact form seamlessly.

---

## 4. Acceptance Criteria

- [ ] Portfolio index shows 4 projects with tag filtering
- [ ] Orchestration Framework is visually prominent (lead position or badge)
- [ ] Each case study renders: problem, approach, architecture diagram, results, tech stack badges, CTA
- [ ] Architecture diagrams render correctly (Mermaid or SVG) in both themes
- [ ] Hamptons Estate: zero mentions of "Happy Home", "Johanna", "Saldana" in any file
- [ ] Pricing page shows retainer tiers + project pricing
- [ ] Pricing CTAs link to /contact with pre-filled form params
- [ ] Contact form reads URL params and pre-selects audience type
- [ ] All pages render in both themes at all breakpoints (320px–1440px)
- [ ] All pages have unique meta titles and descriptions

---

## 5. Constraints

### Hard Constraints
- Do NOT modify database schema or auth system.
- Do NOT build demo showroom features.
- All case study content must follow Problem → Approach → Architecture → Results structure.
- Hamptons Estate obfuscation is non-negotiable.

### Soft Constraints
- Case study content may be placeholder if skill output not available. Mark clearly.
- Pricing numbers are placeholders. Mark with `// PLACEHOLDER`.
- Architecture diagrams should be valid Mermaid syntax. Test rendering.

---

## 6. Completion Protocol
Provide structured report: Files Created, Acceptance Criteria Results, Spec Ambiguities (especially: pricing specifics, case study metrics), Warnings for Next Phase.

---

## 7. Execution & Orchestration
**Recommended:** `claude --max-turns 50`
**Resumption:** Check `PHASE-03-PROGRESS.md`. Resume from first incomplete task.
**Progress Tracking:** Update `PHASE-03-PROGRESS.md` after each task.
