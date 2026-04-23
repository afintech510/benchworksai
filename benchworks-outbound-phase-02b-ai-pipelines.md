# Phase 02b: AI Pipelines (Classification, Scoring, Generation)
**Project:** BenchworksAI Outbound Engine  
**Spec:** `benchworks-outbound-spec-v2.md`  
**Build Plan:** `benchworks-outbound-buildplan.md`  
**Prerequisites:** Phase 01 complete  
**Implements:** F-002 (scoring), F-003 (classification), F-001 (generation), F-005 (narratives)  
**Recommended:** `claude --max-turns 20`  
**Parallel:** Can run simultaneously with Phase 02a (no shared dependencies beyond Phase 01)

---

## 1. Context

You are executing **Phase 02b: AI Pipelines** of the BenchworksAI Outbound Engine build.

**Your scope:** All Claude API integration functions — reply classification, ICP scoring, sequence copy generation, report narrative generation, and pre-call brief generation. Plus the circuit breaker wrapper for Claude API calls. You are NOT implementing webhook handlers (Phase 02a), n8n workflows (Phase 03), or how these functions are orchestrated — you're building the reusable functions that later phases call.

**Tech Stack:** FastAPI, Claude API (Anthropic SDK), Redis (circuit breaker state)  
**Working Directory:** `/home/user/benchworks-outbound`  
**Spec File:** `benchworks-outbound-spec-v2.md` — READ Section 5.3 (Claude API) FIRST. Then Section 8.4 (Circuit Breaker).

### What Already Exists
- Phase 01: All database tables, auth middleware, Redis client, structured logging, Supabase client

### What You're Building
The AI reasoning layer. Five distinct functions that take structured input and return structured JSON via Claude's tool_choice feature. Each function is a standalone, testable module with circuit breaker protection. Phase 03 (n8n) and Phase 04 (MCP) will call these functions — you're building the engines, not the car.

---

## 2. Objective & Deliverables

### Objective
After this phase, five Claude API functions are available as importable Python modules: classify_reply, score_lead, generate_sequence, generate_report_narrative, and generate_precall_brief. Each uses tool_choice for guaranteed structured JSON output. All calls are wrapped in a circuit breaker that trips after 5 consecutive failures.

### Deliverables

1. **Anthropic client setup** — Configured client with API key, model pinning — Spec Section 5.3
2. **Circuit breaker wrapper** — Redis-backed, per-service, configurable thresholds — Spec Section 8.4
3. **classify_reply()** — 6-category classification with confidence scoring — Spec Section 5.3
4. **score_lead()** — ICP scoring with per-criterion breakdown — Spec Section 5.3
5. **generate_sequence()** — Multi-step email sequence generation — Spec Section 5.3
6. **generate_report_narrative()** — Metrics → natural language summary
7. **generate_precall_brief()** — Lead context → discovery call briefing
8. **Confidence routing logic** — Determines needs_review flag based on threshold — Spec Section 3.4

---

## 3. Implementation Instructions

### Task 1: Anthropic Client Setup
**Spec Reference:** Section 5.3  
**Creates:** `backend/app/services/ai/client.py`

Initialize the Anthropic Python SDK client:
```python
from anthropic import Anthropic

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
MODEL = "claude-sonnet-4-20250514"  # Pinned — do not auto-upgrade
```

Add `anthropic` to pyproject.toml/requirements.txt.

### Task 2: Circuit Breaker
**Spec Reference:** Section 8.4  
**Creates:** `backend/app/services/circuit_breaker.py`

Redis-backed circuit breaker:

```python
class CircuitBreaker:
    def __init__(self, service_name: str, redis_client, failure_threshold=5, window_seconds=60, recovery_seconds=300):
        ...
    
    async def call(self, func, *args, **kwargs):
        # Check if circuit is open
        if await self.is_open():
            raise CircuitOpenError(f"{self.service_name} circuit is open")
        
        try:
            result = await func(*args, **kwargs)
            await self.record_success()
            return result
        except Exception as e:
            await self.record_failure()
            if await self.should_trip():
                await self.trip()
                # Fire Slack alert (non-blocking)
            raise
```

State management:
- `circuit:{service}:failures` — Redis counter with window_seconds TTL
- `circuit:{service}:open` — Redis key with recovery_seconds TTL
- Half-open: when open key expires, next call is a probe. Success → clear failures. Failure → re-trip.

Create circuit breaker instances for:
- `claude_circuit` — Claude API calls
- `apollo_circuit` — Apollo API calls (used in Phase 03)
- `smartlead_circuit` — Smartlead calls (used in Phase 03)

**Redis failure mode:** If Redis is unavailable, circuit breaker fails open (assume closed, allow calls). Log warning.

### Task 3: Reply Classification Function
**Spec Reference:** Section 5.3 (Classification Prompt + tool_choice)  
**Creates:** `backend/app/services/ai/classification.py`

```python
async def classify_reply(
    reply_body: str,
    sequence_context: dict,  # {subject, body_step_1}
    circuit_breaker: CircuitBreaker
) -> ClassificationResult:
```

**CRITICAL — Use tool_choice for guaranteed JSON (SYN-028):**

Define the classification tool schema exactly as shown in spec Section 5.3:
```python
tools = [{
    "name": "classify_reply",
    "description": "Classify a cold email reply",
    "input_schema": {
        "type": "object",
        "properties": {
            "classification": {"type": "string", "enum": ["interested", "not_interested", "ooo", "referral", "question", "unsubscribe"]},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
            "key_intent": {"type": "string"},
            "extracted_referral": {
                "anyOf": [
                    {"type": "object", "properties": {"name": {"type": "string"}, "email": {"type": "string"}, "context": {"type": "string"}}},
                    {"type": "null"}
                ]
            },
            "suggested_action": {"type": "string"}
        },
        "required": ["classification", "confidence", "sentiment", "key_intent", "suggested_action"]
    }
}]
```

Call via circuit breaker:
```python
response = await circuit_breaker.call(
    client.messages.create,
    model=MODEL,
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "tool", "name": "classify_reply"},
    messages=[{"role": "user", "content": prompt}]
)
```

Extract the tool use result from response.content (find the block with type="tool_use").

Return a Pydantic `ClassificationResult` model.

**Confidence routing (SYN-020):**
```python
classification_result.needs_review = (
    classification_result.confidence < settings.CLASSIFICATION_CONFIDENCE_THRESHOLD  # 0.85
    or classification_result.classification == "question"
)
```

### Task 4: ICP Scoring Function
**Spec Reference:** Section 5.3 (ICP Scoring Prompt)  
**Creates:** `backend/app/services/ai/scoring.py`

```python
async def score_lead(
    lead_data: dict,  # enriched lead from Apollo
    client_icp: dict,  # from clients.icp JSONB
    circuit_breaker: CircuitBreaker
) -> ScoringResult:
```

Use tool_choice with schema matching spec's scoring criteria:
- company_size (max 20)
- title_match (max 25)
- geography (max 20)
- ai_tools (max 15)
- digital_presence (max 20)

Returns: `ScoringResult` with score (0-100), qualified (bool), breakdown (dict of per-criterion objects), reasoning (str).

The `breakdown` format must match the `leads.icp_breakdown` JSONB schema in spec Section 3.2 (GET /v1/leads/{id} response) so the dashboard can render it directly.

### Task 5: Sequence Copy Generation
**Spec Reference:** Section 5.3  
**Creates:** `backend/app/services/ai/generation.py`

```python
async def generate_sequence(
    client_icp: dict,
    offer: str,
    vertical: str,
    geography: str,
    num_steps: int = 4,
    circuit_breaker: CircuitBreaker
) -> list[SequenceStep]:
```

Returns a list of `SequenceStep(step_number, subject, body)`. Body includes `{{first_name}}`, `{{company_name}}` merge tags that Smartlead will replace.

Use tool_choice with a schema that returns an array of step objects.

The prompt should instruct Claude to:
- Write in plain text (no HTML) for deliverability
- Keep subject lines under 60 characters
- Include a clear CTA in each step
- Vary the angle across steps (don't repeat the same pitch)
- Reference the specific vertical and geography naturally

### Task 6: Report Narrative Generation
**Creates:** `backend/app/services/ai/narrative.py`

```python
async def generate_report_narrative(
    metrics: dict,  # from GET /v1/reports/{client_id}/metrics
    client_name: str,
    period: str,  # e.g., "April 1–7, 2026"
    circuit_breaker: CircuitBreaker
) -> str:
```

Returns a 3–5 sentence natural language summary with:
- Key metrics highlighted
- Trend comparison (if prior_period metrics provided)
- One actionable recommendation

This function does NOT need tool_choice — plain text response is fine. Still wrap in circuit breaker.

### Task 7: Pre-Call Brief Generation
**Creates:** `backend/app/services/ai/brief.py`

```python
async def generate_precall_brief(
    lead: dict,  # full lead record with enrichment
    icp_score: int,
    icp_breakdown: dict,
    reply_history: list,  # reply_events for this lead
    client_context: dict,  # client name, offer, vertical
    circuit_breaker: CircuitBreaker
) -> str:
```

Returns a structured briefing (markdown) covering:
- Lead summary (name, company, title, company size)
- ICP match highlights
- Reply history and sentiment
- Suggested talking points for discovery call
- Key questions to ask based on intake form answers (if available from Cal.com)

Plain text response, wrapped in circuit breaker.

### Task 8: Pydantic Models
**Creates:** `backend/app/models/ai.py`

Define response models:
```python
class ClassificationResult(BaseModel):
    classification: Literal["interested", "not_interested", "ooo", "referral", "question", "unsubscribe"]
    confidence: float
    sentiment: Literal["positive", "neutral", "negative"]
    key_intent: str
    extracted_referral: Optional[dict]
    suggested_action: str
    needs_review: bool
    model_version: str

class CriterionScore(BaseModel):
    score: int
    max: int
    detail: str

class ScoringResult(BaseModel):
    score: int
    qualified: bool
    breakdown: dict[str, CriterionScore]
    reasoning: str
    model_version: str

class SequenceStep(BaseModel):
    step_number: int
    subject: str
    body: str
```

---

## 4. Acceptance Criteria

### Automated Checks
- [ ] All new modules import without errors
- [ ] Pydantic models validate correctly

### Functional Checks
- [ ] **Classification:** Call `classify_reply` with a clearly interested reply → returns `classification: "interested"`, `confidence > 0.8`
- [ ] **Classification (low confidence):** Ambiguous reply → `needs_review = true`
- [ ] **Classification (structured output):** Response is valid JSON parsed directly from tool_use block — no "Here is your JSON:" preamble
- [ ] **Scoring:** Call `score_lead` with a matching lead profile → returns score > 70, `qualified = true`, breakdown has all 5 criteria
- [ ] **Scoring (breakdown format):** `breakdown` matches the schema expected by the dashboard (spec Section 3.2 GET /v1/leads/{id})
- [ ] **Sequence generation:** Call `generate_sequence` → returns 4 steps with subject + body, subjects < 60 chars, body contains merge tags
- [ ] **Report narrative:** Call `generate_report_narrative` with sample metrics → returns 3-5 sentence summary
- [ ] **Pre-call brief:** Call `generate_precall_brief` → returns structured briefing with lead summary and talking points
- [ ] **Circuit breaker trip:** Mock 5 consecutive Claude failures → circuit opens → next call raises CircuitOpenError without hitting API
- [ ] **Circuit breaker recovery:** After TTL expires → probe call succeeds → circuit closes

---

## 5. Constraints

### Hard Constraints
- Use `tool_choice` for classification and scoring — NOT prompt-only "return JSON" instructions (SYN-028).
- Pin model to `claude-sonnet-4-20250514` — do not use `claude-sonnet-4-latest` or any other model string.
- All Claude calls MUST go through the circuit breaker wrapper.
- `ClassificationResult.needs_review` must be set based on confidence threshold from `system_config.classification_confidence_threshold` (0.85).
- Do NOT implement webhook handlers, n8n workflows, or API endpoints that call these functions — just the functions themselves.

### Soft Constraints
- Follow async patterns from Phase 01.
- Include `model_version` in all AI result models for traceability.
- Handle Anthropic API errors gracefully (rate limit → retry with backoff before circuit counts it as failure).

---

## 6. Completion Protocol

Provide structured report: Files Created, Acceptance Criteria (PASS/FAIL), Spec Ambiguities, Decisions Made (especially: prompt wording choices, retry strategy), Warnings for Phase 03 (how to call these functions, any setup required).

---

## 7. Execution & Orchestration

### Run Configuration
**Recommended:** `claude --max-turns 20`

### Task Planning
1. Read spec Section 5.3 and 8.4
2. Set up Anthropic client (Task 1)
3. Build circuit breaker (Task 2) — used by everything
4. Build classification (Task 3) — most complex, test thoroughly
5. Build scoring (Task 4)
6. Build generation functions (Tasks 5-7)
7. Build Pydantic models (Task 8)
8. Test each function with real Claude API calls

### Resumption Protocol
Check `backend/app/services/ai/` directory for existing files. Resume from first missing function.
