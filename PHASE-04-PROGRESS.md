# Phase 04: Demo Showroom Infrastructure — Progress

## Status: COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Demo Layout & Navigation | DONE | `app/demos/layout.tsx`, `DemoNav.tsx` — own layout separate from marketing |
| Task 2: Demo Showroom Index | DONE | `VerticalSelector`, `DemoShowroomGrid`, `DemoOnboarding` with sessionStorage |
| Task 3: Email Gate | DONE | `EmailGateModal`, `POST /api/leads/demo-gate` with idempotency + disposable blocklist |
| Task 4: Demo Session Endpoint | DONE | `POST /api/demos/session` — JWT verify, preset loading |
| Task 5: Demo Interact Endpoint | DONE | `POST /api/demos/interact` — streaming, rate limit, prompt guard, cache routing |
| Task 6: DemoShell & Loading | DONE | `DemoShell`, `StreamingResponse`, `DemoDisclaimer` |
| Task 7: PresetCommandBar & RateLimitNotice | DONE | Preset buttons with used state, rate limit with countdown + CTA |
| Task 8: Demo Dynamic Route | DONE | `app/demos/[demoType]/[vertical]/page.tsx` — full demo page with chat-like UI |
| Task 9: Cache Lookup Module | DONE | `lib/demo-engine/cache.ts` — lookupCachedResponse + getPresetSequence |
| Task 10: Build & Lint | DONE | 0 errors, 0 warnings |

## Architecture Decisions

1. **Layout restructure**: Moved marketing Navbar/Footer from root layout into `app/(marketing)/layout.tsx`. Root layout provides only `<html>`, `<body>`, ThemeProvider. Demo layout provides its own DemoNav.
2. **Route structure**: Using `app/demos/` (regular folder) instead of `app/(demos)/` route group. URL: `/demos/[demoType]/[vertical]`.
3. **Interaction router**: Preset commands go to cache (0 API calls), free-text goes to live Claude AI (rate-limited).
4. **Idempotency**: In-memory cache with 60s TTL for duplicate submit protection on email gate.
5. **Streaming**: `ReadableStream` from Claude API piped through `TransformStream` that captures full text for DB logging after completion.

## Files Created
- `app/demos/layout.tsx`
- `app/demos/page.tsx`
- `app/demos/gate/page.tsx`
- `app/demos/[demoType]/[vertical]/page.tsx`
- `app/(marketing)/layout.tsx`
- `app/api/leads/demo-gate/route.ts`
- `app/api/demos/session/route.ts`
- `app/api/demos/interact/route.ts`
- `components/demos/DemoNav.tsx`
- `components/demos/VerticalSelector.tsx`
- `components/demos/DemoShowroomGrid.tsx`
- `components/demos/DemoOnboarding.tsx`
- `components/demos/EmailGateModal.tsx`
- `components/demos/DemoShell.tsx`
- `components/demos/StreamingResponse.tsx`
- `components/demos/DemoDisclaimer.tsx`
- `components/demos/PresetCommandBar.tsx`
- `components/demos/RateLimitNotice.tsx`
- `lib/demo-engine/cache.ts`
- `lib/demo-engine/interaction-router.ts`
- `lib/demo-engine/prompts.ts`
- `lib/validation/disposable-domains.ts`

## Files Modified
- `app/layout.tsx` — Removed Navbar/Footer/CTABanner (moved to marketing layout)
- `app/(marketing)/page.tsx` — Moved from `app/page.tsx` (URL unchanged)

## Phase 05 Integration Notes
- **DemoShell props**: `demoDisplayName, vertical, verticalDisplayName, isLoading, loadingMessage, error, onRetry, children`
- **Demo components plug in** as `children` of DemoShell — each demo type builds its own UI
- **Streaming pattern**: Use `StreamingResponse` component with a `ReadableStream<Uint8Array>`
- **Presets loaded** via `POST /api/demos/session` response → `preset_commands` array
- **Interact API**: `POST /api/demos/interact` with `{ session_id, input_type, user_input?, trigger_key? }`
