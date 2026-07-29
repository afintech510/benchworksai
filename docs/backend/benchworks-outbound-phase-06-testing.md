# Phase 06: Testing Suite
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 05 complete  
**Implements:** F-018  
**Recommended:** `claude --max-turns 25`

---

## 1. Context

You are executing **Phase 06: Testing Suite** of the BenchworksAI Outbound Engine build.

**Your scope:** The complete tiered test suite — Tier 1 (blocks deployment, <5 min), Tier 2 (weekly, Playwright + integration), and test fixtures. You are writing tests against the existing system built in Phases 01–05. You are NOT fixing bugs found during testing (report them) or building new features.

**Tech Stack:** Pytest, Playwright (Python), httpx (async test client), Supabase test project  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Section 9 (Testing Strategy) COMPLETELY.

### What Already Exists
- Phases 01–05: Complete system — database, auth, webhooks, AI pipelines, n8n workflows, MCP server, dashboard. Everything is built and running.

### What You're Building
The safety net. Tier 1 tests catch regressions in the most critical automated decisions (classification accuracy, RLS isolation, webhook security). Tier 2 tests verify the dashboard works end-to-end. Test fixtures provide labeled data for AI function validation. After this phase, the operator can run `make test-tier1` before any deployment and know the system is sound.

---

## 2. Objective & Deliverables

### Objective
After this phase, `make test-tier1` runs all critical tests in <5 minutes and blocks deployment on failure. `make test-tier2` runs Playwright browser tests and integration tests weekly. Test fixtures are documented and maintainable.

### Deliverables

1. **Test infrastructure** — conftest.py, test database setup, fixture loading, Makefile commands
2. **Tier 1: Reply classification accuracy** — 50+ labeled fixtures, ≥90% accuracy assertion — Spec Section 9.2
3. **Tier 1: ICP scoring consistency** — 20+ lead profiles with expected score ranges — Spec Section 9.2
4. **Tier 1: RLS isolation** — Multi-client data insertion, cross-client query assertion — Spec Section 9.2
5. **Tier 1: Webhook security** — Signature verification, timestamp rejection, dedup — Spec Section 9.2
6. **Tier 1: Auth middleware** — Valid/invalid/expired JWT, service key scope, session invalidation — Spec Section 9.2
7. **Tier 1: Suppression enforcement** — Import blocks suppressed emails — Spec Section 9.2
8. **Tier 1: CAN-SPAM compliance** — Template validation + auto-append — Spec Section 9.2
9. **Tier 1: Warm pool depletion** — Campaign paused when pool empty — Spec Section 9.2
10. **Tier 1: Webhook idempotency** — Duplicate event processed once — Spec Section 9.2
11. **Tier 2: Playwright dashboard tests** — Login, navigation, command bar, timeline — Spec Section 9.3
12. **Tier 2: Deliverability scoring logic** — Mock health data → correct classification — Spec Section 9.3
13. **Tier 2: Report generation** — Mock metrics → narrative + delivery — Spec Section 9.3
14. **Test fixtures** — JSON files in tests/fixtures/ — Spec Section 9.5
15. **Makefile commands** — `make test-tier1`, `make test-tier2`, `make test-all`

---

## 3. Implementation Instructions

### Task 1: Test Infrastructure
**Spec Reference:** Section 9.5  
**Creates:** `tests/conftest.py`, `tests/fixtures/`, `Makefile` updates

**conftest.py:**
- Async test client for FastAPI (httpx.AsyncClient)
- Test database setup: use separate Supabase project or local Docker PostgreSQL with identical schema. Migrations applied before test run.
- Fixture loading: helper that reads JSON from `tests/fixtures/` directory
- Auth fixtures: valid operator JWT, expired JWT, invalid JWT, n8n service key
- Test data seeding: create 2 test clients (Client A, Client B) with campaigns, leads, and reply_events before each test module. Clean up after.
- Redis test client (authenticated)

**Makefile additions:**
```makefile
test-tier1:
	cd backend && python -m pytest tests/tier1/ -v --tb=short -x
test-tier2:
	cd backend && python -m pytest tests/tier2/ -v --tb=short
	cd frontend && npx playwright test
test-all:
	make test-tier1 && make test-tier2
```

**CRITICAL:** No real PII in test fixtures. Use fictional but realistic names, companies, emails.

### Task 2: Classification Accuracy Fixtures + Tests
**Spec Reference:** Section 9.2 (test_reply_classification_accuracy)  
**Creates:** `tests/fixtures/classification_replies.json`, `tests/tier1/test_classification.py`

Create 50+ labeled reply examples:
- interested × 15 (various: eager, curious, conditional interest, "let's chat", "send me more info")
- not_interested × 10 (explicit decline, wrong person, company not relevant, "not now", "no thanks")
- ooo × 8 (standard auto-replies, various formats, date ranges)
- referral × 5 (redirects to colleague, provides name/email, "talk to my partner")
- question × 7 (asks about pricing, timeline, specifics, doesn't commit)
- unsubscribe × 5 (explicit opt-out, "remove me", "stop emailing", "unsubscribe")

Each fixture:
```json
{
  "id": "CLS-001",
  "reply_body": "Hi, this sounds interesting. Can we set up a call next week?",
  "sequence_context": {"subject": "Quick question about {{company}}", "body_step_1": "..."},
  "expected_classification": "interested",
  "expected_confidence_min": 0.8,
  "notes": "Clear positive intent with call request"
}
```

Test:
```python
async def test_reply_classification_accuracy():
    fixtures = load_fixtures("classification_replies.json")
    correct = 0
    for fixture in fixtures:
        result = await classify_reply(fixture["reply_body"], fixture["sequence_context"], circuit_breaker)
        if result.classification == fixture["expected_classification"]:
            correct += 1
        if fixture.get("expected_confidence_min"):
            assert result.confidence >= fixture["expected_confidence_min"], f"Low confidence on {fixture['id']}"
    
    accuracy = correct / len(fixtures)
    assert accuracy >= 0.90, f"Classification accuracy {accuracy:.2%} below 90% threshold"
```

**Note:** This test calls the real Claude API. It will cost ~$0.50-1.00 per run and take 2-3 minutes.

### Task 3: ICP Scoring Fixtures + Tests
**Spec Reference:** Section 9.2 (test_icp_scoring_consistency)  
**Creates:** `tests/fixtures/scoring_leads.json`, `tests/tier1/test_scoring.py`

Create 20+ lead profiles with expected score ranges:
- 5 high-quality matches (score expected 75-100)
- 5 moderate matches (score expected 45-70)
- 5 poor matches (score expected 10-40)
- 5 edge cases (wrong industry but right size, right industry but too large, etc.)

Each fixture includes enriched lead data + ICP definition + expected score range.

Test asserts:
- Score falls within expected range (±15 points tolerance for AI variability)
- `qualified` flag matches threshold (score ≥ 70)
- `breakdown` contains all 5 criteria
- Each criterion score ≤ its max value

### Task 4: RLS Isolation Tests
**Spec Reference:** Section 9.2 (test_rls_isolation)  
**Creates:** `tests/tier1/test_rls.py`

Test for EVERY client-scoped table:
1. Insert test data for Client A and Client B
2. Set Supabase client context to Client A's JWT
3. Query each table → assert zero Client B rows returned
4. Repeat with Client B context → assert zero Client A rows returned

Tables to test: clients, campaigns, leads, reply_events, sequence_templates, client_reports, mailbox_pool (via assigned_client_id).

**action_log append-only test:**
1. Insert a test action_log entry → succeeds
2. Attempt UPDATE on that entry → assert permission denied
3. Attempt DELETE on that entry → assert permission denied

### Task 5: Webhook Security Tests
**Spec Reference:** Section 9.2 (test_webhook_handlers)  
**Creates:** `tests/tier1/test_webhooks.py`

Tests:
- `test_valid_signature` — Correct HMAC → 200, reply_event created
- `test_invalid_signature` — Wrong HMAC → 401, no DB write
- `test_expired_timestamp` — Timestamp >5 min old → 401
- `test_missing_signature` — No signature header → 401
- `test_idempotency` — Same event_id sent twice → only one reply_event created, second returns 200 with "duplicate"
- `test_unknown_lead` — Reply for non-existent smartlead_lead_id → 200 (graceful, no crash), warning logged

### Task 6: Auth Middleware Tests
**Spec Reference:** Section 9.2 (test_auth_middleware)  
**Creates:** `tests/tier1/test_auth.py`

Tests:
- `test_valid_jwt` — Valid operator JWT → 200 on protected endpoint
- `test_no_jwt` — No Authorization header → 401
- `test_expired_jwt` — JWT past maxAge → 401
- `test_invalid_signature` — JWT signed with wrong secret → 401
- `test_invalidated_session` — Valid JWT but sessions.is_valid=false → 401
- `test_service_key_allowed` — Service key on allowed endpoint (GET /v1/health) → 200
- `test_service_key_blocked` — Service key on restricted endpoint (PATCH /v1/campaigns/*/status) → 403
- `test_rate_limit` — 101 requests in 1 minute → 101st returns 429

### Task 7: Suppression + Compliance Tests
**Spec Reference:** Section 9.2  
**Creates:** `tests/tier1/test_suppression.py`, `tests/tier1/test_compliance.py`

Suppression tests:
- `test_suppressed_email_blocked` — Add email to suppression → lead import skips it
- `test_suppression_case_insensitive` — Suppress "Test@Example.com" → blocks "test@example.com"
- `test_suppression_crud` — Add, list (appears), delete (gone), re-import (works)

Compliance tests:
- `test_template_without_address` — Missing address → auto-appended, compliance_validated=true
- `test_template_without_optout` — Missing opt-out → auto-appended
- `test_template_with_compliance` — Has both → no modification, validated=true
- `test_template_footer_stored` — Auto-appended footer stored separately in compliance_footer column

### Task 8: Warm Pool + Circuit Breaker Tests
**Creates:** `tests/tier1/test_operational.py`

Warm pool test:
- Seed mailbox_pool with 1 ready mailbox
- Trigger rotation (assign it) → pool now empty
- Trigger another rotation → should pause campaign + fire alert (mock Slack)
- Verify campaign status = 'paused' in DB

Circuit breaker test (with mocked Claude API):
- Mock 5 consecutive 500 responses → circuit trips
- Next call raises CircuitOpenError without hitting mock
- Wait for TTL → probe call succeeds → circuit closes

### Task 9: Tier 2 — Playwright Dashboard Tests
**Spec Reference:** Section 9.3  
**Creates:** `frontend/tests/`, Playwright config

Install Playwright: `npx playwright install chromium`

Tests:
- `test_login_flow` — Navigate to app → redirect to login → (mock Google OAuth or use test credentials) → dashboard loads
- `test_navigation` — Login → Overview → click client → client detail → click campaign → campaign detail → click lead → lead detail with timeline
- `test_command_bar` — ⌘K → type "show me all clients" → response appears
- `test_empty_states` — With 0 clients, overview shows welcome CTA
- `test_review_queue` — Navigate to /review → see needs_review items (or empty state)

**Playwright config:**
- Browser: Chromium (primary)
- Viewport: 1440px (desktop), 768px (tablet)
- Base URL: configurable via env var
- Screenshot on failure: enabled

### Task 10: Tier 2 — Integration Tests
**Creates:** `tests/tier2/test_deliverability.py`, `tests/tier2/test_reporting.py`

Deliverability logic test:
- Seed mailbox with bounce_rate=6% → health scoring returns RED
- Seed mailbox with bounce_rate=4% → returns YELLOW
- Seed mailbox with bounce_rate=1% → returns GREEN

Report generation test:
- Mock campaign stats + Supabase pipeline data
- Call generate_report_narrative() → verify returns 3-5 sentence string
- Verify report stored in client_reports table

---

## 4. Acceptance Criteria

- [ ] `make test-tier1` passes in <5 minutes
- [ ] Classification accuracy ≥90% on 50+ fixtures
- [ ] ICP scoring within expected ranges for 20+ fixtures
- [ ] RLS isolation: zero cross-client data leakage across all tested tables
- [ ] action_log UPDATE/DELETE both fail with permission denied
- [ ] All webhook security tests pass (signature, timestamp, dedup)
- [ ] All auth tests pass (JWT valid/invalid/expired, service key scope, rate limit)
- [ ] Suppression blocks import, case-insensitive
- [ ] CAN-SPAM auto-append works
- [ ] Warm pool depletion pauses campaign
- [ ] Circuit breaker trips and recovers
- [ ] `make test-tier2` passes (Playwright + integration)
- [ ] All fixtures documented in tests/fixtures/README.md
- [ ] Zero test relies on shared mutable state between tests

---

## 5. Constraints

### Hard Constraints
- Tier 1 MUST complete in <5 minutes. If classification tests are slow (real API calls), parallelize or reduce fixture count to 50 minimum.
- No real PII in fixtures. Fictional but realistic data only.
- Each test MUST create its own data and clean up — no shared mutable state.
- Test database uses identical schema and migrations as production.
- Do NOT fix bugs found during testing — report them in the completion report for operator to triage.

### Soft Constraints
- Organize tests: `tests/tier1/`, `tests/tier2/`, `tests/fixtures/`, `frontend/tests/`
- Use pytest markers: `@pytest.mark.tier1`, `@pytest.mark.tier2` for selective runs
- Mock external services (Smartlead, Apollo, Slack) in tests — don't depend on live APIs except Claude for classification accuracy tests

---

## 6. Completion Protocol

Provide: Files Created (all test files + fixtures), Acceptance Criteria (PASS/FAIL), **Bugs Found** (list any failures that indicate bugs in Phases 01–05 code — these need to be fixed before Phase 07), Test Run Times, Fixture Documentation.

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 25`

### Task Planning
1. Read spec Section 9 completely
2. Set up test infrastructure (Task 1)
3. Build Tier 1 tests in order of criticality: RLS (4) → auth (6) → webhooks (5) → classification (2) → scoring (3) → suppression (7) → operational (8)
4. Build Tier 2: Playwright (9) → integration (10)
5. Run full suite, document results

### Resumption Protocol
Check `tests/` directory for existing test files. Run `make test-tier1` to see what passes/fails. Resume from first incomplete test category.
