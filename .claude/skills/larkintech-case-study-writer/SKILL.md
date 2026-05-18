---
name: larkintech-case-study-writer
description: >
  Generates full case study content for Larkin Tech portfolio projects. Creates Problem → Approach → Architecture → Results narratives with Mermaid diagrams, tech stack badges, and audience-specific CTAs. Triggers on: "write case study for [project]", "generate the [project] case study", "create portfolio content for [project]", "write up [project name]".
---

# Case Study Writer for Larkin Tech

## Purpose

Generates production-ready case study content for the 4 portfolio projects. Each case study serves dual audiences: recruiters evaluating technical depth and SMB prospects evaluating business outcomes.

## Target Projects

### 1. Multi-Agent Orchestration Framework (LEAD case study)
**Competency showcase:** System architecture, AI agent design, privilege escalation, policy engine
**Known facts:** Multi-agent architecture with Chief of Staff agent, privilege escalation maturity ladder (Levels 0-4), policy engine, audit log, tenant isolation. Assessed as production-ready after three review cycles. Six-week phased build sequence.
**Mermaid diagram:** Agent hierarchy, privilege escalation flow, policy engine decision tree
**Audience hook — Recruiters:** "Designed a production-grade multi-agent orchestration framework with formal privilege escalation"
**Audience hook — SMBs:** "Built a system that lets multiple AI agents work together safely on complex business tasks"

### 2. Eastern LM Customer Lifecycle Engine
**Competency showcase:** Data engineering, pipeline design, behavioral analytics, customer segmentation
**Known facts:** Built customer lifecycle engine addressing orphaned orders (phone-first E.164 matching, email fallback), non-updating aggregate stats, behavioral tagging (repeat/high-value/VIP), customer_type enum. Order Analytics Dashboard with React, PapaParse, Recharts.
**Mermaid diagram:** Data pipeline flow (POS → matching → enrichment → segmentation → dashboard)
**Audience hook — Recruiters:** "Built a customer data pipeline processing thousands of orders with intelligent identity matching"
**Audience hook — SMBs:** "Turned messy POS data into actionable customer insights — who's a VIP, who's at risk of churning"

### 3. Hamptons Estate Property Management (obfuscated Happy Home)
**Competency showcase:** Full-stack client delivery, service agreement, deployed infrastructure
**Known facts:** Full client engagement for property management company. Next.js, TypeScript, Tailwind, Supabase, Docker on Hetzner VPS. Digital Services Agreement with tiered pricing. MWBE certification research. Google Maps integration.
**OBFUSCATION RULES:** Never mention "Happy Home", "Johanna", or "Saldana". Use "Hamptons Estate Property Management" throughout. Generalize location to "Hamptons area, Long Island."
**Mermaid diagram:** System architecture (client portal, admin dashboard, notification system, maps integration)
**Audience hook — Recruiters:** "Delivered a complete digital platform for a property management company — from contract to production"
**Audience hook — SMBs:** "Built a custom management platform that replaced manual processes with automated workflows"

### 4. HostHampton
**Competency showcase:** Frontend design, event platform, community engagement
**Known facts:** Fundraiser page with custom trucker hats/patches, reusable FUNDRAISER_CONFIG JS object, multi-step lead capture form with Hamptons boutique aesthetic, Twilio MMS marketing consideration.
**Mermaid diagram:** Event flow (landing → form → payment → confirmation → follow-up)
**Audience hook — Recruiters:** "Designed and built a high-conversion event platform with boutique aesthetics and modular config"
**Audience hook — SMBs:** "Created an event platform that looks premium and converts visitors into attendees"

## Output Format Per Case Study

```markdown
# [Project Name]

## The Challenge
[2-3 paragraphs: What was broken/missing? What was the business impact? Why couldn't off-the-shelf solutions work?]

## The Approach
[2-3 paragraphs: How did Adam scope the problem? What was the technical strategy? What made this approach different?]

## Architecture
[Mermaid diagram code — valid syntax, renders correctly]

[1-2 paragraphs explaining the architecture diagram]

## Key Technical Decisions
[3-5 bullet points: specific patterns, tools, trade-offs, and why they were chosen]

## Results
[Metrics where available, qualitative improvements, client impact]

## Tech Stack
[List of technologies with version badges]

## [CTA — varies by audience context]
```

## Writing Rules

1. **Problem-first narrative.** Start with pain, not technology. The reader should feel the problem before seeing the solution.
2. **Specific over general.** "Matched 3,200 orphaned orders to customer profiles using E.164 phone normalization" not "Improved data quality."
3. **Architecture diagrams must be valid Mermaid.** Test the syntax. Use `graph TD` or `graph LR` for flowcharts, `erDiagram` for data models.
4. **Dual-audience CTAs.** End each case study with context-appropriate next steps. The UI will show recruiter-appropriate or SMB-appropriate CTA based on the user's path.
5. **Hamptons Estate: strict obfuscation.** Zero references to real client name, contact name, or exact location.
6. **No employer names** in the narrative. Focus on what was built, not where Adam worked.
7. **Honest about estimates.** If a metric is estimated, say "approximately" or "estimated." Don't present estimates as exact measurements.

## Context Adam Must Provide

For each project, the skill will prompt for facts only Adam knows:
- Specific metrics (records processed, time saved, performance improvements)
- Key technical decisions and their rationale
- Client feedback or outcome statements (obfuscated if needed)
- Timeline and effort level
- Challenges encountered and how they were resolved
