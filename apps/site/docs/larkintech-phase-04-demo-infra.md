# Phase 04: Demo Showroom Infrastructure
**Project:** Larkin Tech (LarkinTECH.ai)
**Spec:** `larkintech-spec-v2.md`
**Build Plan:** `larkintech-buildplan.md`
**Prerequisites:** Phase 01 complete
**Implements:** F-018, F-019, F-027, F-028
**Recommended:** `claude --max-turns 75`
**⚡ Can run PARALLEL with Phase 02 + 03**

---

## 1. Context

You are executing **Phase 04: Demo Showroom Infrastructure** of the Larkin Tech build.

**Scope:** Demo showroom index with onboarding, email gate with idempotency, cache engine, atomic rate limiter integration, prompt injection guard integration, Claude streaming, DemoShell with loading/error/empty states, PresetCommandBar, RateLimitNotice. Do NOT build the 7 individual demo UI components (that's Phase 05) or populate vertical content (Phase 06).

**Working Directory:** Project root
**Spec File:** `larkintech-spec-v2.md`

### What Already Exists (from Phase 00 + 01)
- Project scaffolded, Docker deployed
- All 19 tables with RLS, triggers, 35 minimal cache seeds (general_smb × 7 × 5)
- `lib/demo-engine/session.ts` (JWT with jwt_version)
- `lib/demo-engine/rate-limiter.ts` (atomic UPSERT)
- `lib/ai/prompt-guard.ts` (injection detection)
- `lib/ai/claude.ts` (Claude wrapper with streaming + circuit breaker)
- `lib/validation/schemas.ts` (all Zod schemas)
- All auth middleware (admin, CSRF)

**Note:** If running parallel with Phase 02, the marketing site layout (Navbar, Footer, themes) may or may not exist yet. Build demo pages with their own DemoLayout that doesn't depend on marketing layout components. The demo showroom has its own navigation (DemoNav with vertical tabs).

### What You're Building
The demo engine infrastructure — the shared platform that all 7 demo types plug into. After this phase, visitors can browse the showroom, go through the email gate, start a demo session, use preset commands (served from cache), and get rate-limited on live AI calls with graceful fallback. The individual demo UIs (chat, analytics, workflows, etc.) come in Phase 05.

---

## 2. Objective & Deliverables

### Objective
After this phase, the demo showroom index renders with vertical onboarding, the email gate captures leads with idempotency protection, demo sessions create and validate JWT tokens, preset commands return cached responses instantly, free-text routes to streaming Claude AI (rate-limited), and the DemoShell provides consistent loading/error/empty states for all future demo components.

### Deliverables
1. **DemoLayout** — `app/(demos)/layout.tsx` with DemoNav, vertical selector tabs — Spec Section 4.1
2. **DemoShowroomGrid** with VerticalSelector onboarding (first-visit) + empty state — Spec Section 4.1
3. **VerticalSelector** — 4 vertical cards, persists in sessionStorage — Spec Section 4.1
4. **EmailGateModal** — disabled+spinner on submit, idempotency key, opt-in checkbox, email validation, disposable domain block — Spec Sections 3.2, 4.1
5. **`POST /api/leads/demo-gate`** — subscribed defaults false, idempotency, jwt_version in JWT, email NOT in JWT, magnet downloads backfill — Spec Section 3.2
6. **`POST /api/demos/session`** — validates JWT (jwt_version + revoked_at), returns preset commands + rate limit info — Spec Section 3.2
7. **`POST /api/demos/interact`** — streaming response, atomic rate check (global + per-demo), prompt guard, cache lookup, api_usage_log, token tracking — Spec Section 3.2
8. **DemoShell** — wrapper with `isLoading`, `loadingMessage`, React Suspense, skeletons, error boundary — Spec Section 4.1
9. **PresetCommandBar** — clickable preset buttons that trigger cached responses — Spec Section 4.2
10. **RateLimitNotice** — primary CTA (book call) + secondary "Continue with presets" + next_presets — Spec Section 4.2
11. **DemoDisclaimer** — standard disclaimer + legal variant — Spec Section 4.1
12. **StreamingResponse** — renders streamed AI output progressively — Spec Section 4.1
13. **Demo route** — `app/(demos)/[demoType]/[vertical]/page.tsx` dynamic route — Spec Section 4.4
14. **`lib/demo-engine/cache.ts`** — cache lookup (preset-commands only) — Spec Section 4.1
15. **`lib/demo-engine/interaction-router.ts`** — routes input to cache or live AI — Spec Section 4.1

---

## 3. Implementation Instructions

### Task 1: Demo Layout & Navigation
**Spec Reference:** Section 4.1, 4.4
**Creates:** `app/(demos)/layout.tsx`, DemoNav component

DemoLayout wraps all demo pages. Includes:
- DemoNav: horizontal tab bar with vertical names (General SMB, Construction, Property Mgmt, Legal)
- Current vertical highlighted
- Link back to main site (/), link to contact
- Does NOT use the marketing Navbar — demo showroom has its own minimal nav

### Task 2: Demo Showroom Index with Onboarding
**Spec Reference:** Section 4.1, 4.2
**Creates:** `app/(demos)/page.tsx`, `components/demos/DemoShowroomGrid.tsx`, `components/demos/VerticalSelector.tsx`, `components/demos/DemoOnboarding.tsx`

**First-visit flow (no demo session cookie):**
1. Show VerticalSelector: 4 large cards — "I run a general business", "I'm in construction", "I manage properties", "I work in legal"
2. Selection persists in sessionStorage
3. Grid filters to selected vertical's 7 demos
4. "Recommended: Start Here" badge on ChatInterface card

**Returning visit:** Skip selector, show full grid (or filtered by last selection).

**Empty state:** If no demo_types are active, show "Demos Coming Soon" with CTA to /contact.

Grid cards: each shows demo_type display_name, description, icon, vertical context. Clicking a card → email gate (if no session) → demo page.

### Task 3: Email Gate
**Spec Reference:** Section 3.2, 4.1, 7.1
**Creates:** `app/(demos)/gate/page.tsx`, `components/demos/EmailGateModal.tsx`

**EmailGateModal:**
- Email input (required) + Name input (optional) + Company (optional)
- Opt-in checkbox (unchecked default): "Send me AI insights and updates (optional)"
- Submit button: immediately disabled + spinner on click. Re-enabled only on error.
- Client generates `X-Idempotency-Key` UUID, sends as header
- Email validation: format check + disposable domain blocklist (maintain a list of ~50 common disposable domains in `lib/validation/disposable-domains.ts`)
- On success: set session cookie, redirect to selected demo

**`POST /api/leads/demo-gate`:**
- Validate with `demoGateSchema`
- Check idempotency key: if seen in last 60s, return existing session token
- Upsert into `demo_leads` (email unique — update `last_seen_at` if exists)
- Set `subscribed` only if checkbox was checked
- Set `subscribed_at = now()` if subscribed
- Generate JWT: `{ lead_id, jwt_version, iat, exp }` — NO email
- Set httpOnly cookie: Secure, SameSite=Lax, 24hr maxAge
- On new email: insert `notification_outbox` entry
- On new email: backfill `UPDATE lead_magnet_downloads SET demo_lead_id = $id WHERE email = $email AND demo_lead_id IS NULL`
- Return: `{ success, lead_id, session_token (for non-cookie clients) }`

**Session expiry UX:**
- When gate is shown post-expiry: check localStorage for email hint
- Pre-fill email field, show "Welcome back! Confirm email to continue."
- Store email in 90-day localStorage key (separate from JWT) as a hint only

### Task 4: Demo Session Endpoint
**Spec Reference:** Section 3.2
**Creates:** `app/api/demos/session/route.ts`

**`POST /api/demos/session`:**
- Extract JWT from httpOnly cookie
- Verify: signature valid, not expired, jwt_version matches DB, revoked_at IS NULL
- Validate `demo_type` and `vertical` against demo_types/verticals tables
- Create `demo_sessions` row
- Load preset command sequence from `demo_cached_responses` for this config
- Check rate limits for this lead (returns remaining counts)
- Return: `{ session_id, demo_type, vertical, preset_commands: [{sequence, prompt_text, trigger_key}], rate_limit: {live_ai_remaining, resets_at} }`

### Task 5: Demo Interact Endpoint (Core Engine)
**Spec Reference:** Section 3.2
**Creates:** `app/api/demos/interact/route.ts`

**CAUTION:** This is the most complex endpoint. Multiple critical review findings addressed here.

**`POST /api/demos/interact`:**
1. Validate JWT (same as session endpoint)
2. Validate request body with `demoInteractSchema`
3. Verify `session_id` belongs to this lead
4. **Input routing:**
   - If `input_type = 'preset_command'`: look up `demo_cached_responses` by `trigger_key` → return cached response. Set `from_cache = true`.
   - If `input_type = 'text'` (free-text): proceed to live AI path.
5. **Rate limit check (free-text path only):**
   - Check global daily limit first: `checkAndIncrementRateLimit(email, 'global_daily', 'all', globalLimit)`
   - If under global: check per-demo limit: `checkAndIncrementRateLimit(email, 'email_daily', demoType, perDemoLimit)`
   - If either exceeded: return RATE_LIMITED with `next_presets` (remaining unused presets for this session)
6. **Prompt guard:** Run `guardInput(user_input)`. If unsafe, return deflection as response. No Claude call.
7. **Daily spend check:** Query `api_usage_log` for today's total. If >$10, hard reject.
8. **Claude call (streaming):**
   - Assemble system prompt: `getSystemPromptPrefix(demoType, vertical)` + vertical-specific context from `verticals.config`
   - Call `generateStreamingResponse()` from `lib/ai/claude.ts`
   - Return as streaming response (ReadableStream)
9. **After Claude completes:**
   - Extract input_tokens, output_tokens from response
   - Insert into `demo_interactions` (triggers session count update)
   - Insert into `api_usage_log` with cost estimate
10. **Return non-streaming (cached/blocked) responses as standard JSON. Return live AI as streaming.**

### Task 6: DemoShell & Loading States
**Spec Reference:** Section 4.1, 4.2
**Creates:** `components/demos/DemoShell.tsx`, `StreamingResponse.tsx`

**DemoShell** wraps every individual demo page:
- Props: `demoType, vertical, sessionId, presets, isLoading, loadingMessage, children`
- React Suspense boundary with skeleton loader fallback
- Error boundary: catches API errors, shows retry button
- Loading state: shows loadingMessage (demo-type specific, e.g., "Analyzing your data...")
- Empty state: shown when demo_type or vertical is inactive
- DemoDisclaimer rendered at bottom (legal variant if vertical='legal')
- PresetCommandBar rendered above the demo content

**StreamingResponse:** Renders streamed text token-by-token as it arrives from the API. Uses ReadableStream consumer pattern.

### Task 7: PresetCommandBar & RateLimitNotice
**Spec Reference:** Section 4.2
**Creates:** `components/demos/PresetCommandBar.tsx`, `RateLimitNotice.tsx`

**PresetCommandBar:** Row of clickable buttons, one per preset command. Shows `prompt_text`. On click, triggers the interact endpoint with `input_type='preset_command'` and `trigger_key`. As presets are used, they gray out or get checkmarks.

**RateLimitNotice:** Shown when rate limit exceeded. Two actions:
- Primary: "Book a discovery call for full access" → BookingEmbed or /contact
- Secondary: "Continue with preset examples" → renders remaining `next_presets` as clickable buttons
- Shows countdown timer to `reset_at`
- Shows which limit was hit (`limit_type` from error response)

### Task 8: Demo Dynamic Route
**Spec Reference:** Section 4.4
**Creates:** `app/(demos)/[demoType]/[vertical]/page.tsx`

Dynamic route that:
1. Validates `demoType` and `vertical` params against demo_types/verticals
2. Checks for demo session cookie — if missing, redirects to `/demos/gate?redirect=/demos/[demoType]/[vertical]`
3. Creates a demo session via `POST /api/demos/session`
4. Renders DemoShell with the appropriate demo component
5. For now, renders a **placeholder** inside DemoShell: "Demo component for [demoType] in [vertical] — built in Phase 05"
6. PresetCommandBar is functional with cached presets from Phase 01 seeds

### Task 9: Cache Lookup Module
**Spec Reference:** Section 2.2, 4.1
**Creates:** `lib/demo-engine/cache.ts`

- `lookupCachedResponse(demoType, vertical, triggerKey): Promise<CachedResponse | null>`
- Queries `demo_cached_responses` with exact match on `(demo_type, vertical, trigger_key)` WHERE `active = true`
- Returns null on miss (free-text always misses — cache is preset-only per REV-016)
- `getPresetSequence(demoType, vertical): Promise<PresetCommand[]>`
- Returns ordered list of presets for a demo config

### Task 10: Integration Test — Full Demo Flow
**Creates:** No new files — manual verification

Test the complete flow:
1. Visit /demos → see VerticalSelector
2. Select "General SMB" → see filtered grid
3. Click "AI Chatbot" card → see EmailGateModal
4. Submit email → session cookie set → redirect to /demos/chatbot/general_smb
5. See DemoShell with PresetCommandBar (5 presets from seed data)
6. Click preset → cached response returns instantly (0 API calls)
7. Type free text → streaming Claude response (or rate limit if exceeded)
8. Exhaust rate limit → see RateLimitNotice with "Continue with presets" option

---

## 4. Acceptance Criteria

- [ ] Showroom index shows VerticalSelector on first visit; grid after selection
- [ ] Vertical selection persists in sessionStorage across page navigations
- [ ] Empty state renders when no demos active
- [ ] Email gate: submit → disabled+spinner → success → cookie set → redirect
- [ ] Idempotency: double-submit produces exactly 1 lead record and 1 session
- [ ] Opt-in checkbox: unchecked = subscribed:false; checked = subscribed:true + subscribed_at set
- [ ] Returning visitor (same browser, valid session) bypasses gate
- [ ] Expired session: gate shows with email hint pre-filled + "Welcome back" message
- [ ] JWT contains ONLY lead_id + jwt_version (verify by decoding)
- [ ] JWT verification rejects when jwt_version mismatched or revoked_at set
- [ ] Preset commands return cached responses (0 API calls — verify via api_usage_log)
- [ ] Free-text routes to streaming Claude response
- [ ] Rate limit: 10 concurrent requests with limit=5 → exactly 5 succeed (atomic test)
- [ ] Global daily limit enforced across demo types
- [ ] Rate limit response includes next_presets array
- [ ] Prompt guard blocks "ignore previous instructions" — returns deflection, no Claude call
- [ ] Daily API spend check: set threshold to $0.01 for test, verify hard reject
- [ ] DemoShell shows loading skeleton during API call
- [ ] DemoShell shows error state on API failure
- [ ] All interactions logged in demo_interactions with from_cache flag and tokens
- [ ] api_usage_log entries created for live AI calls with cost estimate

---

## 5. Constraints

### Hard Constraints
- Do NOT build individual demo UI components (ChatInterface, AnalyticsDashboard, etc.) — Phase 05.
- Do NOT populate vertical content — Phase 06.
- Rate limiter MUST use atomic UPSERT. Test with concurrent requests.
- JWT MUST NOT contain email.
- All POST endpoints must pass CSRF validation.
- Use notification_outbox for email gate notifications.

### Soft Constraints
- Demo placeholder content in DemoShell is acceptable for this phase.
- Disposable email domain list can be minimal (~50 domains) for launch.
- Streaming response rendering can be basic — refined in Phase 05.

---

## 6. Completion Protocol
Provide structured report. **Critical for Phase 05:** Document the DemoShell props interface, how demo components plug in, the streaming response pattern, and how presets are loaded. Phase 05 builds directly on this foundation.

---

## 7. Execution & Orchestration
**Recommended:** `claude --max-turns 75`
**Task order:** Layout → Showroom → Gate → Session endpoint → Interact endpoint → DemoShell → Presets/RateLimit → Dynamic route → Cache → Integration test
**Resumption:** Check `PHASE-04-PROGRESS.md`.
**Progress Tracking:** Update after each task.
