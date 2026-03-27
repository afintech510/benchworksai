# Phase 05: Demo Features Build-Out
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 04 complete (soft dep: Phase 03 for site layout context)
**Implements:** F-020–F-026
**Recommended:** `claude --max-turns 100`

---

## 1. Context

You are executing **Phase 05: Demo Features Build-Out** — the largest and most complex phase. You are building all 7 interactive demo UI components that plug into the DemoShell infrastructure from Phase 04.

**Working Directory:** Project root
**Spec File:** `larkintech-spec-v2.md`

### What Already Exists (from Phases 00-04)
- Full marketing site (Phase 02-03): themes, layout, services, portfolio, pricing, contact, lead magnet
- Demo infrastructure (Phase 04): DemoLayout, DemoShowroomGrid, EmailGateModal, DemoShell, PresetCommandBar, RateLimitNotice, StreamingResponse, cache engine, rate limiter, all API endpoints (`/api/demos/session`, `/api/demos/interact`)
- Dynamic route: `app/(demos)/[demoType]/[vertical]/page.tsx` with placeholder content
- 35 cached preset entries (general_smb × 7 × 5)

### What You're Building
7 demo UI components, each rendering inside DemoShell. Each demo type has a unique UI (chat bubbles, charts, workflows, forms, document viewers, pipeline stages) but shares the same infrastructure (presets, streaming, rate limiting). Also: the competitive analysis standalone endpoint with PDF generation, and accessibility compliance across all demos.

---

## 2. Objective & Deliverables

### Objective
After this phase, all 7 demo types are functional with the general_smb vertical. Preset commands return cached responses. Free-text triggers streaming AI. Competitive analysis generates reports and PDFs. All demos are accessible (keyboard nav, screen readers, axe-core 0 violations) and mobile-responsive.

### Deliverables
1. **ChatInterface** (F-020) — Conversation UI, streaming, aria-live — `components/demos/ChatInterface.tsx`
2. **AnalyticsDashboard** (F-021) — Recharts, AI insights, simplified mobile — `components/demos/AnalyticsDashboard.tsx`
3. **WorkflowBuilder** (F-022) — Visual workflow, email/SMS previews — `components/demos/WorkflowBuilder.tsx`
4. **DocumentProcessor** (F-023) — Text paste + file upload, extraction display — `components/demos/DocumentProcessor.tsx`
5. **CompetitiveAnalysis** (F-024) — Form, synchronous report, PDF gen — `components/demos/CompetitiveAnalysis.tsx`
6. **DocumentDrafter** (F-025) — Template select, param form, document preview — `components/demos/DocumentDrafter.tsx`
7. **MarketingEngine** (F-026) — Pipeline stages, AI content per stage — `components/demos/MarketingEngine.tsx`
8. **`POST /api/demos/competitive-analysis`** — Standalone endpoint — Spec Section 3.2
9. **Demo route update** — Replace placeholders with real components
10. **Additional cache seeds** — 70 entries for general_smb (expand from 35 to 70)

---

## 3. Implementation Instructions

### Task 1: ChatInterface (F-020)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/ChatInterface.tsx`

Conversational chat UI:
- Message bubbles (user = right-aligned, AI = left-aligned)
- Text input field at bottom + send button
- PresetCommandBar integrated above the input (from DemoShell)
- When user sends text: show "thinking" indicator → stream response token-by-token via StreamingResponse
- When user clicks preset: show preset prompt as user message → instantly show cached response
- Markdown rendering in AI responses (use `sanitize-html` for XSS)
- `aria-live="polite"` on message container so screen readers announce new messages
- Mobile: full-width, input stays at bottom, messages scroll
- Loading message: "Thinking about your question..."

### Task 2: AnalyticsDashboard (F-021)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/AnalyticsDashboard.tsx`

Interactive dashboard:
- Recharts charts: line chart (revenue trend), bar chart (category breakdown), pie chart (customer segments)
- Data loaded from `vertical_content` table (content_type='dataset') — if not populated yet, use hardcoded general_smb sample data with `// PLACEHOLDER`
- AI insights panel: shows pre-generated narrative analysis alongside charts
- Date range filter (simulated — switches between pre-loaded datasets)
- Simplified mobile view: single scrolling chart instead of multi-panel grid
- Loading message: "Crunching your numbers..."

### Task 3: WorkflowBuilder (F-022)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/WorkflowBuilder.tsx`

Visual workflow display:
- Horizontal pipeline on desktop: Trigger → Condition → Action → AI Content → Delivery
- Vertical step-by-step on mobile
- Each stage is a card showing: stage name, configuration, AI-generated content
- Email/SMS preview panels: shows sample generated copy
- Step-through animation: clicking "Run" progresses through stages
- Loading message: "Building your workflow..."

### Task 4: DocumentProcessor (F-023)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/DocumentProcessor.tsx`

Document extraction demo:
- Two input modes: text paste area OR file upload
- File upload: `accept=".txt,.pdf,.doc,.docx,image/*"`, 5MB client-side limit
- On image upload: show thumbnail + "We'll extract text from this image"
- Pre-loaded sample documents per vertical (from `vertical_content` or hardcoded)
- "Try a sample" button loads a pre-loaded doc
- Extracted data displayed as structured table (field name → extracted value)
- Loading message: "Extracting document data..."

### Task 5: CompetitiveAnalysis (F-024)
**Spec Reference:** Section 3.2, 4.1
**Creates:** `components/demos/CompetitiveAnalysis.tsx`, `app/api/demos/competitive-analysis/route.ts`

Structured form + report:
- Input form: business name (required), business URL (optional), up to 3 competitors (name + URL each)
- Vertical selector (pre-filled from session)
- Submit → synchronous Claude generation (60s timeout) → full report display
- `beforeunload` warning when form has data entered
- Report sections: business summary, competitor summaries, strengths, opportunities, AI recommendations, score
- Download as PDF button: generated via @react-pdf/renderer, stored in Supabase Storage, linked via `competitive_analyses` table
- Rate limit: 1 per email per 24 hours (via shared rate-limiter with demo_type='competitive_analysis')

**`POST /api/demos/competitive-analysis`:**
- Validate JWT session
- Validate with `competitiveAnalysisSchema`
- Check rate limit (shared rate-limiter, 1/day)
- Prompt guard on business names
- Call Claude (synchronous, 60s timeout, Sonnet)
- Store result in `competitive_analyses` table
- Generate PDF, store in Supabase Storage, set `pdf_storage_path`
- Insert into `demo_interactions` + `api_usage_log`
- Return: `{ analysis_id, report, download_url }`
- Loading message: "Analyzing your competitive landscape..."

### Task 6: DocumentDrafter (F-025)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/DocumentDrafter.tsx`

Document generation demo:
- Document type selector (per vertical): quotes, contracts, reports, marketing copy, legal docs
- Parameter form: fields adapt based on document type (recipient, amounts, dates, terms)
- Generate button → streaming Claude response → formatted document preview
- Download button: renders document as downloadable text/PDF
- `beforeunload` warning when form has data
- Legal vertical: generated docs include disclaimer as first line
- Loading message: "Drafting your document..."

### Task 7: MarketingEngine (F-026)
**Spec Reference:** Section 4.1
**Creates:** `components/demos/MarketingEngine.tsx`

Campaign pipeline demo:
- Multi-stage visualization: Audience Targeting → Content Generation → Channel Distribution → Analytics
- Each stage is a card/panel with AI-generated content
- "Run Campaign" button: animates progression through stages, generating content at each step
- Vertical-specific examples (construction: bid follow-up campaign, SMB: seasonal promotion)
- Loading message: "Launching your campaign..."

### Task 8: Demo Route Integration
**Creates:** Update `app/(demos)/[demoType]/[vertical]/page.tsx`

Replace placeholder content with actual demo components:
```typescript
const DEMO_COMPONENTS = {
  chatbot: ChatInterface,
  analytics: AnalyticsDashboard,
  email_sms: WorkflowBuilder,
  doc_processing: DocumentProcessor,
  competitive_analysis: CompetitiveAnalysis,
  doc_drafting: DocumentDrafter,
  marketing_engine: MarketingEngine,
};
```
Dynamic import the correct component based on `demoType` URL param. Pass DemoShell props.

### Task 9: Accessibility Pass
**Creates:** Updates across all demo components

- All modals: focus trap on open, Escape to close, return focus to trigger on close
- ChatInterface: `aria-live="polite"` on message container
- All buttons: keyboard accessible (Enter/Space activate)
- ThemeToggle: aria-label updates on state change
- Form inputs: `aria-invalid` on errors, `role="alert"` on error messages
- Tab order: logical progression through all interactive elements
- Run axe-core: target 0 violations

### Task 10: Expand Cache Seeds
**Creates:** Update seed data files

Expand general_smb from 35 to 70 cached entries (10 per demo type instead of 5). Use the `larkintech-cache-seed-generator` skill if available, otherwise create realistic placeholder content. Each demo type should have a coherent 10-step preset sequence.

---

## 4. Acceptance Criteria

- [ ] All 7 demo types render inside DemoShell for general_smb vertical
- [ ] ChatInterface: messages appear as bubbles, streaming renders progressively, aria-live announces
- [ ] AnalyticsDashboard: charts render with sample data, mobile shows single-chart view
- [ ] WorkflowBuilder: stages display with generated content, step-through animation works
- [ ] DocumentProcessor: paste text → extraction table; file upload → preview + extraction
- [ ] CompetitiveAnalysis: form → synchronous report → PDF download from Storage
- [ ] DocumentDrafter: type selector → params → generated preview → download
- [ ] MarketingEngine: pipeline stages → "Run" → content generated per stage
- [ ] Each demo has 10 cached preset interactions for general_smb
- [ ] Live AI streaming works on all demos when presets exhausted (rate-limited)
- [ ] "Sample Data" disclaimer visible on all demos
- [ ] All modals trap focus, dismiss on Escape
- [ ] axe-core: 0 violations across all demo pages
- [ ] All demos usable on mobile (320px width)
- [ ] CompetitiveAnalysis: beforeunload fires with ≥1 form field filled
- [ ] DocumentDrafter: beforeunload fires with ≥1 form field filled
- [ ] Competitive analysis PDF stored in Supabase Storage

---

## 5. Constraints

### Hard Constraints
- Do NOT modify Phase 04 infrastructure (DemoShell, endpoints, rate limiter). Plug into it.
- Do NOT populate non-general_smb verticals (Phase 06).
- Rate limiter behavior is set — do not bypass or modify.
- All Claude calls go through `lib/ai/claude.ts` wrapper. No direct API calls.
- Legal vertical demos are built but content comes in Phase 06.

### Soft Constraints
- Demo data for non-general_smb verticals can show "Select General SMB to see this demo in action" placeholder.
- Chart data may be hardcoded if vertical_content not populated. Mark with `// PLACEHOLDER`.
- PDF generation for competitive analysis should work but styling can be basic.

---

## 6. Completion Protocol
Provide structured report. **Critical for Phase 06:** Document which demo components need vertical-specific data/content, what format that data should be in, and which components have placeholder content.

---

## 7. Execution & Orchestration
**Recommended:** `claude --max-turns 100` (largest phase — plan for 2-3 `--continue` cycles)
**Task order:** ChatInterface → AnalyticsDashboard → WorkflowBuilder → DocumentProcessor → CompetitiveAnalysis (with endpoint) → DocumentDrafter → MarketingEngine → Route integration → Accessibility → Cache expansion
**Resumption:** Check `PHASE-05-PROGRESS.md`. Critical: don't re-build completed demos.
**Progress Tracking:** Update after each demo component is complete.
