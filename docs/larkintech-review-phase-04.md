# Meta-Agent Review: Phase 04 — Demo Showroom Infrastructure

You are a code reviewer. This is a **CRITICAL review checkpoint** — the demo engine is the product's core differentiator. Errors here break Phase 05 and 06.

## Documents
1. `larkintech-spec-v2.md` — Sections 2.2, 2.5, 3.2, 4.1, 5.1, 7.1, 7.4, 8.1
2. Builder's Completion Report: [PASTE BELOW]

## Phase 04 Should Have Built
DemoLayout, DemoShowroomGrid with onboarding, EmailGateModal with idempotency, demo-gate/session/interact API endpoints, DemoShell with loading/error/empty states, PresetCommandBar, RateLimitNotice, StreamingResponse, cache lookup, dynamic demo route.

## Review Checklist (THOROUGH)

### Email Gate (SECURITY)
- [ ] JWT payload: decode a token — contains ONLY lead_id + jwt_version (NO email)
- [ ] Idempotency: submit same email twice rapidly → exactly 1 lead record, 1 session
- [ ] Submit button disables immediately on click (inspect component code)
- [ ] Opt-in checkbox: unchecked = subscribed:false in DB; checked = subscribed:true + subscribed_at
- [ ] Disposable email domains blocked (test with "test@mailinator.com")
- [ ] Session cookie: httpOnly=true, secure (in prod), sameSite='lax'
- [ ] Expired session: gate shows with pre-filled email from localStorage hint
- [ ] notification_outbox entry created for NEW emails only

### JWT Verification
- [ ] Valid token → passes
- [ ] jwt_version mismatch → rejects (change version in DB, re-verify)
- [ ] revoked_at set → rejects
- [ ] Expired token → rejects with SESSION_EXPIRED error

### Rate Limiter (CRITICAL — #2 finding in review)
- [ ] **Atomic test:** Fire 10 concurrent requests with limit=5 → EXACTLY 5 succeed
- [ ] Uses UPSERT (inspect SQL in rate-limiter.ts — single statement, not read-then-write)
- [ ] Global daily limit checked BEFORE per-demo limit
- [ ] Rate limit identifier is EMAIL (not session_id) — verify in code
- [ ] Limit values loaded from site_config (not hardcoded)
- [ ] Lazy cleanup: expired rate_limits rows deleted
- [ ] Rate limit response includes next_presets array

### Cache Engine
- [ ] Preset command → cached response returned instantly (0 API calls — check api_usage_log)
- [ ] Free-text → routes to live AI (verify api_usage_log gets entry)
- [ ] Cache lookup is exact match on trigger_key (preset-only, no fuzzy matching)

### Streaming & AI
- [ ] Free-text input → streaming response renders progressively
- [ ] Prompt guard blocks "ignore previous instructions" — returns deflection, no Claude call
- [ ] Daily spend check: manually set threshold to $0.01, verify hard reject
- [ ] api_usage_log entries have input_tokens, output_tokens, estimated_cost_cents
- [ ] Circuit breaker: after 3 failures → cache-only mode for 60s

### DemoShell
- [ ] Loading skeleton shown during API calls
- [ ] Error state shown on API failure with retry option
- [ ] Empty state when no active demos
- [ ] DemoDisclaimer renders (standard version)

### RateLimitNotice
- [ ] Shows when rate exceeded
- [ ] Primary CTA: book call / contact link
- [ ] Secondary: "Continue with presets" renders clickable buttons
- [ ] Countdown timer to reset_at

### Cross-Phase
- [ ] All demo interactions logged in demo_interactions with from_cache flag
- [ ] demo_sessions.interactions_count incremented by trigger (not app code)
- [ ] CSRF validation on all POST endpoints
- [ ] No modifications to Phase 01 schema

## Output: JSON with verdict, acceptance_criteria, issues_found, recommendation. **BLOCKER: non-atomic rate limiter, JWT containing email, missing RLS enforcement = automatic FIX.**
