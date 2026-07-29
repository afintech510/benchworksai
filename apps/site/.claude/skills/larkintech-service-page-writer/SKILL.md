---
name: larkintech-service-page-writer
description: >
  Generates SEO-optimized content for Larkin Tech service pages. Creates complete page content including meta tags, headings, body copy, JSON-LD structured data, and internal linking suggestions. Targets: AI Solutions Architect, Prompt Engineering, AI Automation, Fractional CTO, AI Implementation. Triggers on: "write the [service] page", "generate service page for [keyword]", "create SEO content for [service page]", "write service page copy".
---

# Service Page Writer for Larkin Tech

## Purpose

Generates production-ready content for the 5 SEO service pages (F-008 through F-012). Each page targets a specific high-intent keyword and positions Adam Larkin as a hands-on AI practitioner.

## Target Pages

| Page | URL | Primary Keyword | Secondary Keywords |
|------|-----|----------------|-------------------|
| 1 | `/services/ai-solutions-architect` | AI solutions architect | AI architecture consulting, AI system design |
| 2 | `/services/prompt-engineering` | prompt engineer | prompt engineering services, LLM optimization |
| 3 | `/services/ai-automation` | AI automation architect | AI workflow automation, business process AI |
| 4 | `/services/fractional-cto` | fractional CTO AI advisor | part-time CTO, AI strategy advisor |
| 5 | `/services/ai-implementation` | AI implementation consultant | AI integration, enterprise AI deployment |

## Output Per Page

```markdown
## Meta
- title: "[keyword] | Larkin Tech" (≤60 chars, keyword in first 30)
- description: "[value prop with keyword, CTA-oriented]" (≤155 chars)
- og_title: "[same or variant]"
- og_description: "[same or variant]"

## JSON-LD
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "[service name]",
  "provider": { "@type": "Person", "name": "Adam Larkin", "url": "https://larkintech.ai" },
  "description": "[service description]",
  "areaServed": "United States"
}

## H1
[Headline — keyword-rich but human-readable]

## Body (≥500 words)
[Structured content: what the role means → how Adam operates → relevant use cases → engagement model → social proof → CTA]

## Internal Links
- Case study: [which portfolio project to link]
- Demo: [which demo to link]
- Related service: [which other service page]
```

## Writing Rules

1. **Practitioner voice, not consultant-speak.** "I build AI systems that..." not "We leverage cutting-edge AI to..."
2. **No AI hype.** Never: "unlock the power of", "revolutionize", "game-changing", "cutting-edge". Instead: specific capabilities and outcomes.
3. **Concrete examples.** Every claim backed by a what/how/result. "I built a customer lifecycle engine that reduced manual data entry by 80%" not "I improve operational efficiency."
4. **Each page must have a unique angle.** Not 5 variations of "I do AI stuff." The AI Solutions Architect page emphasizes system design. Prompt Engineering emphasizes LLM optimization. Fractional CTO emphasizes strategic advisory.
5. **Recruiter-readable AND SMB-readable.** Technical enough to impress a hiring manager, clear enough for a business owner who doesn't code.
6. **Keyword integration: natural, not stuffed.** Primary keyword in H1, first paragraph, one subheading, and conclusion. Secondary keywords sprinkled naturally.
7. **End with a CTA** that differs by page: some link to contact form, some to demo showroom, some to booking.
8. **500-800 words.** Long enough for SEO value, short enough to read.

## Page-Specific Angles

**AI Solutions Architect:** You're the person who designs the whole system — not just one model or one API call. Architecture diagrams, system boundaries, data flow, infrastructure decisions. Link to: Orchestration Framework case study.

**Prompt Engineering:** The craft of getting AI to do exactly what you need. System prompts, chain-of-thought, output formatting, evaluation. Not just "writing prompts" — engineering reliable AI behavior. Link to: Demo showroom (every demo is a prompt engineering showcase).

**AI Automation:** Taking manual business processes and rebuilding them with AI in the loop. Workflow design, trigger logic, human-in-the-loop patterns. Link to: Email/SMS workflow demo, Eastern LM case study.

**Fractional CTO:** Strategic AI advisory for companies that need senior tech leadership without a full-time hire. Technology evaluation, vendor selection, build-vs-buy, team guidance. Link to: Booking page (discovery call CTA).

**AI Implementation:** End-to-end delivery — from requirements to production deployment. Not just proof-of-concept, but systems that run in production. Link to: Hamptons Estate case study (full client engagement).
