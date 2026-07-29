# Statement of Work: Larkin Tech
**Version:** 1.0
**Date:** March 26, 2026
**Prepared for:** Adam Larkin — Owner / Operator
**Prepared by:** Spec Pipeline (Claude)

---

## 1. Executive Summary

Larkin Tech (LarkinTECH.ai) is a lead capture, portfolio showcase, and interactive AI demo showroom designed to generate two parallel outcomes: consulting client engagements and employment/contract opportunities in AI implementation. The site positions Adam Larkin as an AI Solutions Architect, Prompt Engineer, Fractional CTO, and AI Automation specialist.

The site serves four ranked audiences: (1) recruiters and hiring managers evaluating AI talent, (2) SMB owners exploring AI adoption, (3) agencies seeking AI subcontractors, and (4) enterprise leads. Every page is designed to drive one of three conversion actions: contact form submission, discovery call booking, or lead magnet download.

The differentiating feature is an **Interactive AI Demo Showroom** — a library of 7 fully functional AI demo tools across 4 industry verticals, gated behind email capture. Visitors don't just read about AI capabilities; they use them. Each demo is pre-loaded with cached response sequences to minimize API costs, with rate-limited live AI features available after the cached layer. This positions the site not as a portfolio but as a product showroom where prospects experience the work firsthand.

---

## 2. Project Objectives

| ID | Objective | Success Metric | Priority |
|----|-----------|----------------|----------|
| O-001 | Generate qualified consulting leads | ≥5 form submissions or call bookings per month within 90 days of launch | MUST |
| O-002 | Attract recruiter/hiring manager inquiries | ≥3 recruiter contacts per month within 90 days of launch | MUST |
| O-003 | Build email list via lead magnet + demo gates | ≥50 email captures per month within 90 days of launch | MUST |
| O-004 | Demonstrate AI implementation capabilities through live demos | All 7 demo types functional across 4 verticals at launch (28 demo configurations) | MUST |
| O-005 | Establish SEO authority for target positioning keywords | Indexed and ranking for ≥3 target keywords within 6 months | SHOULD |
| O-006 | Provide starter pricing transparency to pre-qualify leads | Pricing page with retainer + project tiers live at launch | MUST |
| O-007 | Minimize ongoing API costs for demo showroom | ≥80% of demo interactions served from cached/pre-loaded responses | MUST |

---

## 3. Feature Set

### 3.1 Core Features (Must-Have)

#### Site Foundation & Navigation

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-001 | Dual-Theme System | User-toggleable dark (techy terminal aesthetic) and light (clean minimal) themes. Persists across sessions. | As a visitor, I want to switch between dark and light themes so the site feels comfortable to me | Theme toggle visible on all pages; selection persists via local storage; all components render correctly in both themes; no flash of unstyled content on load |
| F-002 | Responsive Layout | Fully responsive across desktop, tablet, and mobile breakpoints | As a visitor, I want the site to work on my phone so I can browse on the go | All pages pass manual review at 320px, 768px, 1024px, 1440px widths; no horizontal scroll; all CTAs thumb-reachable on mobile |
| F-003 | Stylized Logo & Brand | "LaRKiN TECH" logo with A and I visually highlighted (color/font differentiation). Standard text fallback for meta contexts. | As a visitor, I want to recognize the brand immediately | Logo renders correctly in both themes; text fallback used in `<title>`, OG tags, and email headers |
| F-004 | Primary Navigation | Sticky nav with links to: Home, Services, Demos, Portfolio, Pricing, About, Contact | As a visitor, I want to find any section within one click | All nav links functional; mobile hamburger menu; active state indicator; smooth scroll for same-page anchors |

#### Audience Routing & Homepage

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-005 | Segmented Hero Section | Homepage hero with clear dual-path CTA: "Hire Me" (recruiter path) and "Work With Me" (client path). Both lead to relevant content with appropriate framing. | As a recruiter, I want to immediately see this person is available for hire. As an SMB owner, I want to see what services are offered. | Two distinct CTAs above the fold; each routes to appropriate content path; A/B testable |
| F-006 | Services Overview | Homepage section summarizing core service offerings with links to dedicated service pages | As a prospect, I want a quick overview of what Larkin Tech does before diving deeper | ≥4 service cards visible; each links to dedicated service page; copy speaks to outcomes, not just capabilities |
| F-007 | Social Proof Strip | Metrics, outcome highlights, or client results displayed prominently (e.g., "50% workflow reduction," "X orders processed monthly") | As a visitor, I want evidence this person delivers results | ≥3 proof points visible on homepage; numbers are specific and verifiable from portfolio projects |

#### Service Pages (SEO-Optimized)

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-008 | AI Solutions Architect Page | Dedicated page at `/ai-solutions-architect` explaining the role, approach, relevant case studies, CTA | As a prospect searching "AI solutions architect," I want to understand what this person offers | Page has unique meta title/description targeting keyword; ≥500 words of content; links to relevant portfolio items; CTA to contact or book call |
| F-009 | Prompt Engineering Page | Dedicated page at `/prompt-engineering` | Same as F-008 | Same as F-008, targeting "prompt engineer" keyword |
| F-010 | AI Automation Page | Dedicated page at `/ai-automation` | Same as F-008 | Same as F-008, targeting "AI automation architect" keyword |
| F-011 | Fractional CTO / AI Advisor Page | Dedicated page at `/fractional-cto` explaining engagement model, what the role covers, who it's for | Same as F-008 | Same as F-008, targeting "fractional CTO" keyword |
| F-012 | AI Implementation Consulting Page | Dedicated page at `/ai-implementation` | Same as F-008 | Same as F-008, targeting "AI implementation consultant" keyword |

#### Portfolio / Case Studies

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-013 | Portfolio Index Page | Grid/list of all portfolio projects with thumbnails, titles, tech stack tags, and brief descriptions | As a visitor, I want to browse all projects at a glance | All 4 projects displayed; filterable by tech/category tag; links to individual case study pages |
| F-014 | Case Study: Multi-Agent Orchestration Framework | Full case study page — Problem → Approach → Architecture (mermaid diagrams) → Results → Tech Stack. Lead project, most prominent. | As a recruiter, I want to evaluate this person's system design and architecture skills | Page includes: problem statement, architecture diagram, tech stack list, outcomes/metrics, CTA |
| F-015 | Case Study: Eastern LM Customer Lifecycle Engine | Full case study — data pipeline, behavioral tagging, analytics dashboard, customer segmentation | As a hiring manager, I want to see data engineering and pipeline skills | Same structure as F-014; includes data flow diagram; metrics on records processed/segmented |
| F-016 | Case Study: Hamptons Estate Property Management | Full case study — obfuscated Happy Home. Full-stack client engagement, deployment, service model. | As an SMB owner, I want to see a real client engagement from start to delivery | Same structure as F-014; emphasizes client outcome and business transformation |
| F-017 | Case Study: HostHampton | Full case study — frontend showcase, event platform, fundraiser configuration. | As a visitor, I want to see frontend design and event tech capabilities | Same structure as F-014; emphasizes design quality and user experience |

#### Interactive AI Demo Showroom

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-018 | Demo Showroom Index | Landing page for all demos organized by feature type and vertical market. Grid layout with preview cards. | As a visitor, I want to browse available demos and pick one relevant to my industry | All demos listed; filterable by vertical and by feature type; each card shows feature name, vertical, and brief description |
| F-019 | Email Gate for Demos | Email submission required before accessing any demo. Captures email, name, company (optional), vertical interest. Stores to Supabase. | As a site owner, I want every demo interaction to generate a lead | Form appears before demo loads; validates email; stores to `demo_leads` table; sets session cookie so user isn't re-gated on same visit |
| F-020 | Demo: AI Chatbot / Conversational Agent | Interactive chatbot demo. Pre-loaded with vertical-specific conversation sequences. Cached responses served first; live AI after cache exhausted (rate-limited). | As a prospect, I want to experience an AI chatbot configured for my industry | Chatbot renders in a conversation UI; ≥10 pre-loaded exchanges per vertical; smooth transition to live AI; rate limit: 5 live AI messages per session |
| F-021 | Demo: AI-Powered Analytics Dashboard | Interactive dashboard with faux business data (revenue, customers, trends). AI-generated insights panel. Vertical-specific datasets. | As a prospect, I want to see how AI can surface insights from my business data | Dashboard renders charts (Recharts); AI insight panel shows pre-generated analysis; ≥3 data views per vertical; data is clearly marked as demo/sample |
| F-022 | Demo: Automated Email/SMS Marketing Workflows | Visual workflow builder or walkthrough showing AI-generated marketing sequences. Shows trigger → action → AI-written copy chain. | As a prospect, I want to see how AI can automate my marketing | Visual workflow with ≥3 steps; AI-generated email/SMS copy samples per vertical; editable trigger conditions |
| F-023 | Demo: Document Processing / Extraction | Upload or paste text → AI extracts structured data (OCR simulation for images, PDF parsing demo). Pre-loaded with sample documents per vertical. | As a prospect, I want to see AI extract data from my documents | Accepts text paste and shows extraction results; pre-loaded sample docs per vertical (invoice, lease, legal doc, receipt); extracted data displayed in structured table |
| F-024 | Demo: Free Business & Competitive Analysis | Enter your business name + up to 3 competitors → AI generates competitive analysis report. Rate-limited live feature. | As an SMB owner, I want a free analysis of my business vs. competitors | Input form for business + competitors; generates analysis (cached template + live AI fill); rate limit: 1 analysis per email per 24 hours; output is downloadable PDF or shareable link |
| F-025 | Demo: AI Document Drafting / Creation | Select document type (legal doc, quote, report, marketing copy) → AI generates draft from prompts. Vertical-specific templates. | As a prospect, I want to see AI draft documents relevant to my business | ≥3 document types per vertical; pre-loaded example outputs; user can input custom parameters for live generation (rate-limited); output downloadable |
| F-026 | Demo: Custom Marketing Engine & Workflows | End-to-end marketing pipeline demo: audience targeting → content generation → channel distribution → analytics. Vertical-specific campaigns. | As a prospect, I want to see a complete AI marketing workflow | Visual pipeline with ≥4 stages; AI-generated content at each stage; vertical-specific examples; interactive "run campaign" simulation |
| F-027 | Demo Cached Response System | Backend system that stores pre-generated AI responses for each demo × vertical combination. Serves cached responses before falling back to live API. | As a site owner, I want to minimize API costs while maintaining interactive quality | Cache hit rate ≥80%; cache populated for all 28 demo configurations; fallback to live API is seamless; cache refresh mechanism available |
| F-028 | Demo Rate Limiting | Per-session and per-email rate limits on live AI features across all demos. Configurable per demo type. | As a site owner, I want to prevent API cost overruns | Rate limits enforced per session and per email; configurable limits per demo; friendly "limit reached" message with CTA to book a call for full access |

#### Vertical Market Configurations

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-029 | Vertical: General SMB | All 7 demos configured with retail/restaurant/general small business data, copy, and examples | As a general SMB owner, I want demos that feel relevant to my type of business | All 7 demos have SMB-specific data, copy, sample documents, and conversation flows |
| F-030 | Vertical: Construction / Building Materials | All 7 demos configured with construction industry data — material quotes, supplier comms, project tracking, compliance docs | As a construction business owner, I want demos that speak my industry language | All 7 demos have construction-specific data and workflows |
| F-031 | Vertical: Property Management / Real Estate | All 7 demos configured with property management data — lease agreements, tenant comms, maintenance workflows, listing analytics | As a property manager, I want demos that match my operational workflows | All 7 demos have property management-specific data and workflows |
| F-032 | Vertical: Attorneys / Estate Planning | All 7 demos configured with legal data — estate planning documents, client intake, case management, billing automation, legal research | As a law firm decision-maker, I want demos that show AI applied to legal workflows | All 7 demos have legal-specific data, documents, and workflows; all demo content clearly marked as fictional/sample; no real client data |

#### Lead Capture & Conversion

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-033 | Segmented Contact Form | Contact form with audience-type selector (hiring for a role / need AI help / agency partner / other). Fields adapt based on selection. | As a visitor, I want to submit an inquiry relevant to my situation | Form renders on `/contact`; audience selector changes visible fields; all submissions stored to Supabase `inquiries` table with audience_type; email notification to Adam on submission |
| F-034 | Discovery Call Booking | Embedded booking widget (Calendly, Cal.com, or custom — TBD). Accessible from multiple CTAs across the site. | As a prospect, I want to schedule a call without back-and-forth emails | Booking widget loads on dedicated page and in modal from CTA buttons; confirms booking with email to both parties |
| F-035 | Lead Magnet: AI Enablement Playbook | Downloadable PDF resource — "AI Enablement Playbook" — designed as an internal sales tool for prospects to pitch AI adoption within their org. Initial version for Construction / Building Materials vertical. | As an SMB decision-maker, I want a resource I can share with my team to justify AI investment | PDF download gated behind email capture; stored in `lead_magnet_downloads` table; PDF is professionally designed; content is vertical-specific |
| F-036 | Email Notification System | Automated email to Adam on every form submission, demo email capture, and lead magnet download. Summary digest option. | As the site owner, I want to know immediately when a lead comes in | Email sent within 60 seconds of form submission; includes all form fields; no false positives |

#### Pricing Page

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-037 | Pricing Tiers Display | Pricing page showing retainer packages and project-based engagement options. Mix of fixed retainer tiers + project pricing ranges. | As a prospect, I want to understand the cost before reaching out | ≥3 retainer tiers displayed; project pricing ranges listed; each tier links to contact form or booking CTA |
| F-038 | Retainer Packages | Defined tiers (e.g., Starter / Growth / Enterprise) with included hours, service scope, and SLA. Specific pricing shown. | As a prospect, I want to compare packages and self-select my fit | Each tier shows: price, included services, hours/scope, what's not included; recommended tier highlighted |
| F-039 | Project-Based Pricing | Pricing ranges for common project types (AI chatbot build, workflow automation, document system, full implementation). | As a prospect, I want to estimate what my specific project would cost | ≥4 project types with "starting at" pricing; each links to contact form with project type pre-selected |

#### About Page & Recruiter Path

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-040 | About Page | Professional bio page with headshot photo, generalized career narrative (no employer names), core competencies, tech stack proficiency, and personal positioning statement. | As a recruiter, I want to evaluate this candidate's background and fit | Page includes: headshot, bio (≥300 words), tech stack visual, competency areas; no specific company names |
| F-041 | Integrated Resume Section | Resume/CV content built into the About page — experience presented as capabilities and outcomes, not a traditional chronological resume. Skills matrix, notable achievements, engagement types available. | As a recruiter, I want to assess qualifications without needing a separate PDF | Skills matrix rendered visually; achievements listed with metrics where possible; "Available for" section shows: full-time, contract, fractional, advisory |
| F-042 | Availability Status Badge | Visible indicator on homepage and about page showing current availability: Available (green) / Limited (yellow) / Booked (red). Admin-updatable via Supabase flag. | As a recruiter, I want to know if this person is available right now | Badge renders on homepage hero and about page; updates within 60 seconds of Supabase flag change; three states with distinct colors |
| F-043 | LinkedIn / GitHub / External Links | Prominent but non-distracting links to professional profiles | As a recruiter, I want to cross-reference on LinkedIn and check GitHub | Links visible on about page and footer; open in new tab; icons match current theme |

#### SEO & Meta

| ID | Feature | Description | User Story | Acceptance Criteria |
|----|---------|-------------|------------|---------------------|
| F-044 | SEO Meta Tags | Unique meta title, description, and OG tags for every page. Structured data (JSON-LD) for Person, Service, and Organization schemas. | As a search engine, I need to understand and index this site correctly | Every page has unique `<title>` and `<meta description>`; OG image generated; JSON-LD validates in Google's Rich Results Test |
| F-045 | Sitemap & Robots.txt | Auto-generated sitemap.xml and robots.txt | As a search engine, I need to discover all pages | Sitemap includes all public pages; robots.txt allows all crawlers; sitemap submitted to Google Search Console |

### 3.2 Enhancement Features (Nice-to-Have)

| ID | Feature | Description | Dependency | Deferred Until |
|----|---------|-------------|------------|----------------|
| F-050 | Blog / Content Section | Markdown-driven blog for thought leadership and SEO content | None | Post-Launch Phase 2 |
| F-051 | Interactive AI Demo on Homepage | Small embedded chatbot or AI widget on the homepage (not gated) as a teaser for the full demo showroom | F-020, F-027 | Post-Launch Phase 2 |
| F-052 | Lead Scoring System | Automated scoring based on pages visited, demos used, time on site, lead magnet downloads | F-019, F-033 | Post-Launch Phase 2 |
| F-053 | CRM Pipeline View | Admin dashboard showing all leads with status tracking, notes, and follow-up reminders | F-033, F-036 | Post-Launch Phase 2 |
| F-054 | Additional Vertical Playbooks | Lead magnet PDFs for Property Management, Legal, and General SMB verticals | F-035 | Post-Launch Phase 2 |
| F-055 | A/B Testing Framework | Ability to test hero copy, CTA placement, and pricing presentation variations | F-005 | Post-Launch Phase 2 |
| F-056 | Demo Analytics Dashboard | Admin view showing which demos are most used, which verticals convert best, drop-off points | F-018 through F-032 | Post-Launch Phase 2 |
| F-057 | Custom Scheduling System | Replace Calendly/Cal.com embed with fully custom booking system | F-034 | Post-Launch Phase 2 |

### 3.3 Explicitly Out of Scope

- **E-commerce / payment processing** — No online payments at launch. Pricing is informational; engagements close offline.
- **User accounts / authentication** — Visitors do not create accounts. Email capture only.
- **Blog CMS** — No content management system at launch. Service pages and portfolio are statically built.
- **57gravel.ai integration** — Separate product/brand. Not included in Larkin Tech site.
- **Client portal / project management** — No client-facing dashboard for active engagements.
- **Multi-language support** — English only.
- **Native mobile app** — Web-only, responsive.
- **Real client data in demos** — All demo data is fictional/sample. No real business or legal data.
- **Full CRM system** — Lead capture and email notification only. No pipeline management at launch.
- **Automated follow-up email sequences** — Manual follow-up at launch. Automation deferred.

---

## 4. Users & Personas

### Persona: Rachel the Recruiter
- **Role:** Technical recruiter or hiring manager at a mid-to-large company or staffing agency
- **Goal:** Evaluate Adam's AI/ML capabilities, system design skills, and availability for contract or full-time roles
- **Technical Comfort:** Medium — understands tech roles but doesn't code
- **Key Workflows:** Lands on site → scans hero/positioning → navigates to About page → reviews skills matrix and portfolio → views 1-2 case studies → checks availability badge → submits contact form or books call
- **Pain Points:** Hard to evaluate AI talent without seeing real work; most candidates have similar resumes but vastly different capabilities

### Persona: Sam the SMB Owner
- **Role:** Small business owner (10-50 employees) exploring AI for the first time
- **Goal:** Understand what AI can do for their specific business and find someone trustworthy to implement it
- **Technical Comfort:** Low — uses software daily but doesn't understand how it's built
- **Key Workflows:** Finds site via search or referral → reads services overview → visits demo showroom → tries 1-2 demos in their vertical → downloads AI Enablement Playbook → submits contact form or books discovery call
- **Pain Points:** Overwhelmed by AI hype; doesn't know what's real vs. vaporware; afraid of getting sold something they don't need; needs to justify AI spend to partners/spouse

### Persona: Alex the Agency Partner
- **Role:** Project manager or owner at a digital agency that needs AI subcontracting
- **Goal:** Find a reliable AI implementation partner for client projects
- **Technical Comfort:** High — understands architecture and can evaluate technical capability
- **Key Workflows:** Referred or finds via search → reviews portfolio and case studies → checks tech stack alignment → reviews pricing → contacts via form (agency option)
- **Pain Points:** Previous AI subcontractors overpromised and underdelivered; needs to see real architecture, not just demos

### Persona: Dan from Duffley Law (Enterprise Vertical Lead)
- **Role:** Law firm leadership evaluating AI implementation for estate planning practice
- **Goal:** Find someone who can build AI tools for document drafting, intake, billing, and internal workflows
- **Technical Comfort:** Low — understands what they want AI to do, not how it works
- **Key Workflows:** Finds site via job posting response or referral → visits legal vertical demo page → tries document drafting and chatbot demos → sees case studies → downloads playbook → books call
- **Pain Points:** Needs someone who understands both AI AND legal workflows; security and confidentiality are non-negotiable; previous tech hires didn't understand the domain

---

## 5. Competitive & Design References

| Reference | URL | What to Emulate | What to Avoid |
|-----------|-----|-----------------|---------------|
| AI consultant portfolios | (to be researched during design phase) | Clean positioning, clear CTAs, technical credibility | Generic "I do AI" messaging without proof |
| Vercel.com | vercel.com | Dark theme execution, typography, speed feel | Over-abstraction — Larkin Tech needs to be more personal |
| Linear.app | linear.app | Clean minimal theme, information density, professional polish | Enterprise-only feel — need warmth for SMB audience |
| Stripe.com | stripe.com | Developer-credible documentation style, interactive examples | Too product-focused — this is a services site |

---

## 6. Technical Constraints & Existing Infrastructure

### Existing Stack
- **Frontend:** Next.js 14+ / TypeScript / Tailwind CSS
- **Backend:** Next.js API routes + Supabase (PostgreSQL)
- **Database:** Supabase (hosted PostgreSQL + Auth + Storage + Edge Functions)
- **AI API:** Anthropic Claude API (primary), potential OpenAI/Gemini for specific demos
- **Hosting:** Hetzner VPS (SSH alias: hampton-vps, IP 5.161.88.134) via Docker
- **Domain:** LarkinTECH.ai (to be purchased)
- **Email:** SendGrid (existing integration experience)
- **SMS (future):** Twilio (existing integration experience)

### Constraints
- Must run on existing Hetzner VPS (Docker deployment)
- API costs for demo showroom must be manageable — target <$50/month at moderate traffic via caching strategy
- No paid SaaS dependencies over $50/month individually
- Adam is sole developer — architecture must be maintainable by one person
- All demo data must be clearly fictional — no real client, business, or legal data

---

## 7. Assets & Materials

| Asset | Status | Location/Notes |
|-------|--------|----------------|
| Logo / Brand kit | Needed | "LaRKiN TECH" stylization concept defined; needs visual design execution |
| Headshot photo | Available | Adam will provide; for About page |
| Portfolio content | Partially available | Architecture diagrams, code, and project knowledge exist; need to be written up as case studies |
| Demo data sets | Needed | Fictional data sets required for all 4 verticals × 7 demo types |
| AI Enablement Playbook | Needed | Lead magnet PDF — content to be created (Construction/Materials vertical first) |
| Service page copy | Needed | ≥500 words per service page (5 pages) |
| Pricing details | Partially available | Retainer + project model confirmed; specific numbers TBD |
| Sample legal documents | Needed | Fictional estate planning docs for legal vertical demos (clearly marked as samples) |

---

## 8. Delivery Phases & Timeline

### Phase 1: Foundation & Core Site — Target: Week 1-2
**Deliverables:**
- Project scaffolding (Next.js 14 + TypeScript + Tailwind + Supabase) [F-001, F-002, F-003, F-004]
- Dual-theme system with toggle [F-001]
- Homepage with segmented hero, services overview, social proof [F-005, F-006, F-007]
- Primary navigation and responsive layout [F-002, F-004]
- Supabase schema for leads, demo_leads, inquiries tables
- Docker deployment to Hetzner VPS

**Milestone Criteria:** Site loads at LarkinTECH.ai with dual-theme toggle, homepage renders correctly on mobile and desktop, navigation works.

### Phase 2: Service Pages, About & Lead Capture — Target: Week 2-3
**Deliverables:**
- 5 SEO-optimized service pages [F-008 through F-012]
- About page with headshot, bio, skills matrix, resume section [F-040, F-041]
- Availability status badge [F-042]
- External profile links [F-043]
- Segmented contact form [F-033]
- Email notification system [F-036]
- Discovery call booking integration (embed — specific platform TBD) [F-034]
- SEO meta tags and structured data [F-044, F-045]

**Milestone Criteria:** All service pages live and indexed; contact form submits to Supabase and triggers email notification; booking widget functional.

### Phase 3: Portfolio & Case Studies — Target: Week 3-4
**Deliverables:**
- Portfolio index page [F-013]
- 4 full case study pages with diagrams [F-014, F-015, F-016, F-017]
- Pricing page with retainer tiers and project pricing [F-037, F-038, F-039]

**Milestone Criteria:** All 4 case studies live with architecture diagrams; pricing page displays all tiers; CTAs on case studies and pricing link to contact/booking.

### Phase 4: Demo Showroom Infrastructure — Target: Week 4-6
**Deliverables:**
- Demo showroom index page [F-018]
- Email gate system [F-019]
- Cached response system / pre-loaded response engine [F-027]
- Rate limiting system [F-028]
- Demo UI shell (shared layout for all demos)

**Milestone Criteria:** Email gate captures and stores leads; cache system serves pre-loaded responses; rate limiter enforces per-session and per-email limits.

### Phase 5: Demo Features Build-Out — Target: Week 6-10
**Deliverables:**
- AI Chatbot demo [F-020]
- AI Analytics Dashboard demo [F-021]
- Email/SMS Marketing Workflow demo [F-022]
- Document Processing / Extraction demo [F-023]
- Business & Competitive Analysis demo [F-024]
- AI Document Drafting demo [F-025]
- Custom Marketing Engine demo [F-026]

**Milestone Criteria:** All 7 demo types functional with pre-loaded responses for at least 1 vertical.

### Phase 6: Vertical Market Content & Launch — Target: Week 10-12
**Deliverables:**
- All 4 vertical configurations populated with data, copy, and sample docs [F-029, F-030, F-031, F-032]
- AI Enablement Playbook PDF (Construction vertical) [F-035]
- Lead magnet download gate
- Full QA pass across all pages, demos, and themes
- Google Search Console setup and sitemap submission
- Launch

**Milestone Criteria:** All 28 demo configurations (7 × 4) functional; lead magnet downloadable; all forms and notifications working; site passes Lighthouse performance audit ≥85 on all scores.

---

## 9. Commercial Terms

Self-built project. No external client. Costs are infrastructure and API only:
- **Domain:** LarkinTECH.ai — ~$30-80/year depending on registrar
- **Hosting:** Existing Hetzner VPS — no incremental cost
- **Supabase:** Free tier likely sufficient at launch; Pro tier ($25/month) if needed
- **Claude API:** Budget $50/month for demo showroom (caching strategy should keep this low)
- **SendGrid:** Free tier (100 emails/day) sufficient at launch
- **Calendly/Cal.com:** Free tier for booking (or self-hosted Cal.com)
- **Total estimated monthly operating cost at launch:** ~$75-125/month

---

## 10. Assumptions & Dependencies

- Adam will provide headshot photo before Phase 2
- Portfolio case study content will be drafted (by Adam or AI-assisted) during Phase 3
- Pricing tier specifics (dollar amounts, included services) will be finalized before Phase 3
- Domain LarkinTECH.ai is available and will be purchased before Phase 1 deployment
- Fictional demo data sets for all 4 verticals will need to be created — this is a significant content effort across Phase 5-6
- Legal vertical demo content (estate planning docs) must be clearly marked as fictional and not constitute legal advice
- Discovery call booking platform decision (Calendly vs. Cal.com vs. custom) will be made before Phase 2

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 28 demo configurations is a large content surface area | High | High | Build demo framework first (Phase 4), then populate iteratively. Use AI-assisted content generation for vertical data sets. Templatize wherever possible — most demo logic is shared, only data/copy varies by vertical. |
| API costs exceed budget if caching isn't effective | Medium | Medium | Build cache-first architecture; log cache miss rate; set hard API spend caps; alert if budget threshold reached |
| Sole developer bottleneck | High | Medium | Phased delivery with independent milestones; each phase is usable without subsequent phases; Phase 1-3 site is fully functional without demo showroom |
| Demo content perceived as misleading | Low | High | All demo pages include clear "Sample Data" disclaimer; legal vertical includes "Not Legal Advice" notice; no real business names in demo data |
| Legal vertical demos create liability exposure | Low | High | All legal documents clearly marked as fictional templates; disclaimer on every legal demo page; no real case data; consult with legal professional if needed |
| SEO results take longer than 6 months | Medium | Low | Service pages provide value beyond SEO (education, link targets for outreach); paid channels (LinkedIn, targeted outreach) supplement organic traffic |

---

## 12. Sign-Off

By confirming this SOW, the scope, features, and phases described above are locked as the canonical project definition for Larkin Tech.

- [ ] **SOW Confirmed** — Adam Larkin — [Date]
