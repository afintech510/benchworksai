# Strategic Advisory: Larkin Tech

## Project Summary

**Brand:** Larkin Tech (stylized: LaRKiN TECH, with A and I visually highlighted)
**Domain:** LarkinTECH.ai
**Type:** Lead capture + portfolio site for AI consulting services and employment opportunities
**Owner:** Adam Larkin — AI Solutions Architect, Prompt Engineer, Fractional CTO
**Stack:** Next.js 14+ / TypeScript / Tailwind CSS / Supabase / Docker → Hetzner VPS
**Design:** Dual-theme (dark techy + clean minimal, user-toggleable)

### Target Audiences (Ranked)
1. **Recruiters & Hiring Managers** — Looking for AI/ML talent for full-time, contract, or fractional roles
2. **SMB Owners** — Need AI implementation, automation, or consulting but don't know where to start
3. **Agencies** — Seeking AI subcontractors or white-label AI implementation partners
4. **Enterprise / Mid-Market** — Larger orgs exploring AI transformation

### Conversion Actions
- Contact/inquiry form (segmented by audience type)
- Discovery call booking (Calendly/Cal.com/custom — TBD)
- Lead magnet download: AI Enablement Playbook (multi-vertical)

### Portfolio Projects
1. **Eastern LM Customer Lifecycle Engine** — Data pipeline, behavioral tagging, analytics dashboard
2. **Hamptons Estate Property Management** (obfuscated Happy Home) — Full-stack web app, service agreement, client portal
3. **Multi-Agent Orchestration Framework** — AI architecture, privilege escalation, policy engine

### Positioning Keywords (SEO Targets)
- AI Solutions Architect
- Prompt Engineer
- AI Systems Architect Consultant
- AI Implementation Consultant
- AI Automation Architect
- Fractional CTO / AI Advisor

---

## Strengths

**The positioning is strong.** "AI Solutions Architect" and "Fractional CTO / AI Advisor" are high-intent search terms with rising demand and relatively low competition compared to generic "web developer" or "software engineer." The .ai domain reinforces this positioning at the URL level.

**The portfolio is real and varied.** You have a conversational AI platform, a customer data engineering project, a full client engagement with deployed infrastructure, and a multi-agent architecture design. That's four different proof points across four different AI/engineering competencies. Most AI consultants have a ChatGPT wrapper and a blog post.

**The lead magnet concept is a force multiplier.** An "AI Enablement Playbook" that helps the prospect sell AI internally is not a standard PDF download — it's a tool that makes the prospect your advocate inside their organization. This is a sophisticated go-to-market insight.

**Dual audience (recruiters + clients) is achievable** if the information architecture is designed correctly from the start. Many people try this and fail because they build one page that speaks to neither. The key is segmented entry points.

---

## Recommendations

### Must-Address Before SOW Lock

#### 1. Information Architecture: Segmented Entry Points Are Critical
**Risk if ignored:** A site that tries to speak to recruiters AND SMB owners with the same hero section will convert neither.

**Recommendation:** The site needs distinct conversion paths — not separate sites, but clear audience routing:
- **Recruiters** want: credentials, experience timeline, tech stack proficiency, downloadable resume/CV, case studies showing *what you built and how*, links to GitHub/LinkedIn, clear availability status (open to full-time / contract / fractional)
- **SMB owners** want: outcomes, ROI language, "here's what AI can do for YOUR business," social proof, low-friction first step (free audit, discovery call)
- **Agencies** want: white-label capability signals, tech stack alignment, past collaboration examples, rate/engagement model hints

The homepage hero should have a clear fork: "Hire Me" vs. "Work With Me" — or use a smart layout that serves both above the fold. Portfolio projects serve both audiences but need different framing for each.

#### 2. The Logo Concept Needs a Fallback for Non-Visual Contexts
The "LaRKiN" stylization with highlighted A and I is clever for the visual logo, but you'll need:
- A standard text version for meta titles, emails, invoices
- Ensure "Larkin Tech" or "LarkinTECH" works as plain text
- The .ai domain already carries the AI signal, so the logo treatment is reinforcement, not the only signal

#### 3. Contact Form Must Be Segmented
**Why:** A recruiter submitting an inquiry has fundamentally different information needs than an SMB owner. One-size-fits-all forms create friction and lose context.

**Recommendation:** Start with audience-type selector on the form:
- "I'm hiring for a role" → fields: company, role type (FT/contract/fractional), timeline, budget range (optional)
- "I need AI help for my business" → fields: business type, what problem they're trying to solve, current tools, budget range
- "I'm an agency looking for a partner" → fields: agency name, project type, timeline, engagement model preference
- "Other" → open text

This also gives you segmentation data for follow-up sequences.

---

### Strong Suggestions

#### 4. Portfolio Case Studies: Go Deep, Not Wide
**Recommendation:** Full case study format for each project — Problem → Approach → Architecture → Results → Tech Stack. This serves both audiences:
- Recruiters see technical depth, system design thinking, and real-world problem solving
- SMB prospects see outcomes and the kind of transformation you deliver
- Include architecture diagrams (you already have mermaid chops), screenshots, and metrics where possible
- Each case study should end with a CTA relevant to the viewer's likely intent

#### 5. Dual Theme Is a Portfolio Piece — Treat It as One
The dark/light toggle is more than an aesthetic choice — it's a live demonstration of frontend engineering skill. Call it out subtly: a small "Built with [stack]" note in the footer, or a case study about the site itself. Recruiters and technical evaluators will notice.

#### 6. Lead Magnet Strategy: Vertical-Specific Playbooks
Your instinct to create multiple vertical versions is correct. Recommended initial verticals based on your experience and market:
- **Construction / Building Materials** (your domain expertise — Eastern, gravel, etc.)
- **Property Management / Real Estate** (Hamptons Estate case study proves this)
- **Local Services / SMBs** (broad but high-volume audience on Long Island)

Each playbook should be 70% universal AI enablement content + 30% vertical-specific examples and use cases. The vertical framing is what makes the prospect feel "this person understands MY business."

**Format recommendation:** Start with a well-designed PDF (faster to produce, universally accessible). NotebookLM is interesting but adds friction — the prospect needs a Google account and has to interact with an unfamiliar tool. A PDF they can forward to their boss is a lower-friction internal sales tool.

#### 7. "Availability Status" Badge
Add a visible, easily-updatable status indicator:
- 🟢 "Available for new engagements"
- 🟡 "Limited availability — booking Q2 2026"
- 🔴 "Fully booked — join waitlist"

This creates urgency for prospects and signals professionalism to recruiters. Trivial to implement (Supabase flag + conditional render) but high-impact.

#### 8. SEO: Build Around Service Pages, Not Just the Homepage
Each positioning keyword should have its own dedicated page:
- `/ai-solutions-architect` — What this role means, how you operate, relevant case studies
- `/prompt-engineering` — Your approach, examples, results
- `/fractional-cto` — Engagement model, what you bring, who this is for
- `/ai-automation` — Types of automation you build, ROI examples

These pages serve double duty: SEO targets AND educational content for prospects who don't know what they need yet. They also give recruiters specific URLs to share internally ("check out his AI automation page").

---

### Worth Considering

#### 9. Testimonials / Social Proof Section
Even one or two quotes from Johanna (obfuscated if needed) or colleagues go a long way. If you don't have formal testimonials yet, consider a "Results" section with metrics instead: "Reduced manual data entry by 80%," "Built customer lifecycle engine processing X orders/month," etc.

#### 10. Interactive AI Demo
A small, embedded AI interaction (even a simple chatbot using your Claude API integration) that lets visitors experience your work firsthand. "Talk to an AI I built" is a powerful proof point. This could be a Phase 2 feature — not launch-critical but high-impact. Could even be a stripped-down "Guy" from 57gravel.

#### 11. GitHub / Technical Presence Links
Recruiters will look for GitHub, LinkedIn, and possibly a technical writing presence. Make these prominent but not distracting. If your GitHub repos are private (client work), consider creating a few public demonstration repos that showcase your architecture patterns.

#### 12. Analytics & Lead Scoring from Day One
Since you're on Supabase already, instrument lead capture with basic scoring:
- Which page did they visit before converting?
- Which lead magnet vertical did they download?
- Did they view case studies? Which ones?
- Time on site, scroll depth on key pages

This gives you data to optimize conversion paths after launch.

---

### Potential Scope Cuts (Defer to Post-Launch)

| Feature | Why Defer |
|---------|-----------|
| Blog / content section | You said "not for launch" — correct call. SEO service pages provide more value per effort initially |
| Custom scheduler | Calendly embed or Cal.com gets you 90% of the value at 5% of the build effort for launch |
| Interactive AI demo | High-impact but non-trivial to build well. Launch without it, add in Phase 2 |
| Multi-vertical lead magnets | Launch with ONE strong playbook (construction/materials — your deepest domain). Add verticals as you learn which audiences convert |
| Notification/CRM pipeline | At launch, form submissions to Supabase + email notification is sufficient. Build the full CRM flow when volume justifies it |

---

## Questions for You

1. **Resume/CV download:** Do you want a downloadable resume PDF on the site for recruiters, or do you prefer they go through the contact form / LinkedIn? A downloadable resume lowers friction but also means they might not need to contact you.

2. **Pricing signals:** Do you want ANY pricing information on the site (e.g., "Engagements starting at $X/month," "Fractional CTO retainers from $X") or keep it entirely "contact for pricing"? Showing ranges filters out low-budget leads but may scare off some prospects.

3. **Which case study do you want to lead with?** The first one visitors see sets the tone. The multi-agent orchestration framework is the most impressive technically; the Hamptons Estate project shows end-to-end client delivery; Eastern LM shows data engineering depth.

4. **Do you have headshot / professional photos?** For recruiter-facing sites especially, a professional photo builds trust significantly.

5. **The 57gravel.ai omission** — you didn't select it for the portfolio. Is that intentional? It's arguably your most impressive AI project (conversational AI, "Guy" agent, photo upload for area calc). Is the concern about showing an unfinished product, or keeping it separate as its own brand?
