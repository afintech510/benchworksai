# Meta-Agent Review: Phase 05 — Demo Features Build-Out

You are a code reviewer. Verify all 7 demo UI components were implemented correctly. Focus on: functionality, accessibility, mobile responsiveness, and proper integration with Phase 04 infrastructure.

## Documents
1. `larkintech-spec-v2.md` — Sections 3.2, 4.1, 5.1, 7.4, 7.5
2. Builder's Completion Report: [PASTE BELOW]

## Phase 05 Should Have Built
ChatInterface, AnalyticsDashboard, WorkflowBuilder, DocumentProcessor, CompetitiveAnalysis (+ standalone endpoint + PDF), DocumentDrafter, MarketingEngine. All functional with general_smb. 70 cached presets. Accessibility pass.

## Review Checklist

### All 7 Demos (verify each)
- [ ] Renders inside DemoShell for general_smb vertical
- [ ] Preset commands work → cached response (verify from_cache=true in DB)
- [ ] Free-text → streaming Claude response
- [ ] Loading state shown during API calls
- [ ] Error state shown on failure
- [ ] "Sample Data" disclaimer visible
- [ ] Renders on mobile (320px) without breaking

### Per-Demo Checks
- [ ] **ChatInterface:** Messages as bubbles, streaming progressive, `aria-live="polite"` on container
- [ ] **AnalyticsDashboard:** Charts render (Recharts), simplified mobile view (single chart)
- [ ] **WorkflowBuilder:** Stages display, "Run" animates progression, vertical layout on mobile
- [ ] **DocumentProcessor:** Text paste → extraction; file upload → preview; accepted types enforced; 5MB limit
- [ ] **CompetitiveAnalysis:** Form → report → PDF download; beforeunload fires; rate limit 1/day enforced; result stored in competitive_analyses table
- [ ] **DocumentDrafter:** Type selector → params → generated doc; beforeunload fires; download works
- [ ] **MarketingEngine:** Pipeline stages → "Run" → content per stage

### Accessibility (CRITICAL)
- [ ] All modals: focus trap + Escape dismissal + return focus to trigger
- [ ] ChatInterface: aria-live announces new messages (test with screen reader or inspect DOM)
- [ ] All buttons keyboard accessible (Tab → Enter/Space)
- [ ] Form inputs: aria-invalid on errors, role="alert" on error messages
- [ ] **axe-core: run on every demo page → 0 violations**

### Cache Seeds
- [ ] 70 entries exist for general_smb (10 per demo type)
- [ ] Each demo has coherent 10-step preset sequence

### Competitive Analysis Endpoint
- [ ] POST /api/demos/competitive-analysis: validates JWT, shared rate-limiter, prompt guard
- [ ] PDF generated and stored in Supabase Storage
- [ ] competitive_analyses table populated with report_data + pdf_storage_path

### Cross-Phase
- [ ] Demo components plug into DemoShell without modifying Phase 04 code
- [ ] All Claude calls go through lib/ai/claude.ts (no direct API calls)
- [ ] api_usage_log entries created for all live AI calls
- [ ] No Phase 04 infrastructure modified

## Output: JSON with verdict, acceptance_criteria, issues_found, recommendation.
