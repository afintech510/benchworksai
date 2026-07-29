---
name: larkintech-cache-seed-generator
description: >
  Generates demo cached response entries for the Larkin Tech demo showroom. Each entry is a preset interaction (prompt + AI response) for a specific demo type × vertical combination. Triggers on: "generate cache seeds", "seed the demos", "seed [demo_type] [vertical]", "generate preset interactions for [vertical]", "populate cache for [demo_type]". Outputs JSON matching the demo_cached_responses table schema, ready for database insertion via seed.sql.
---

# Cache Seed Generator for Larkin Tech Demo Showroom

## Purpose

Generates the pre-loaded demo interactions that power the Larkin Tech demo showroom's cache-first architecture. Each seed entry represents a preset command (what the user clicks) and the AI response they see — served instantly from the database with zero API calls.

The demo showroom has 7 demo types × 4 verticals = 28 configurations. Each needs ≥10 preset interactions. Total target: 280 entries.

## How to Use

**Single config:** "Generate cache seeds for chatbot construction"
**Batch vertical:** "Seed all demos for construction" (generates 7 × 10 = 70 entries)
**Batch demo type:** "Seed chatbot for all verticals" (generates 4 × 10 = 40 entries)
**Full batch:** "Seed all demos for all verticals" (generates 280 entries)

## Demo Types & Their Response Patterns

| Demo Type | Response Style | response_data Type |
|-----------|---------------|-------------------|
| `chatbot` | Conversational text, industry Q&A | `{"type":"text"}` |
| `analytics` | Business metrics + AI insight narrative | `{"type":"chart","chartData":{...},"insight":"..."}` |
| `email_sms` | Workflow steps + generated email/SMS copy | `{"type":"workflow","steps":[...],"preview":"..."}` |
| `doc_processing` | Extracted fields from sample documents | `{"type":"table","fields":[{"label":"...","value":"..."}]}` |
| `competitive_analysis` | Business comparison report | `{"type":"analysis","scores":{},"strengths":[],"opportunities":[]}` |
| `doc_drafting` | Generated document text | `{"type":"document","title":"...","content":"..."}` |
| `marketing_engine` | Campaign pipeline with content per stage | `{"type":"pipeline","stages":[{"name":"...","content":"..."}]}` |

## Vertical Context

| Vertical | Industry Terms | Sample Companies | Key Workflows |
|----------|---------------|-----------------|---------------|
| `general_smb` | Revenue, customers, inventory, marketing | "Coastal Café", "Main Street Retail" | Sales tracking, email campaigns, invoicing |
| `construction` | Material quotes, bids, project tracking, safety | "Horizon Builders", "Atlas Masonry Supply" | Quote generation, bid management, compliance |
| `property_mgmt` | Leases, tenants, maintenance, listings | "Harbor View Properties", "Eastshore Mgmt" | Lease generation, maintenance dispatch, tenant comms |
| `legal` | Estate plans, trusts, intake, billing, case mgmt | "Sterling & Associates" | Document drafting, client intake, case tracking |

## Output Format

Generate a JSON array. Each entry matches the `demo_cached_responses` table:

```json
[
  {
    "demo_type": "chatbot",
    "vertical": "construction",
    "trigger_key": "material_quote_intro",
    "sequence_order": 1,
    "prompt_text": "Show me how AI handles a material quote request",
    "response_text": "Here's how I'd handle a quote request for a typical residential project...",
    "response_data": { "type": "text", "content": "..." },
    "active": true,
    "content_version": 1
  }
]
```

## Quality Rules

1. **Tell a coherent story.** The 10 presets should flow as a narrative demo — each builds on the previous. Don't generate 10 unrelated questions.
2. **Use real industry language.** Construction demos talk about "6x6x16 CMU blocks" not "building materials." Legal demos reference "revocable living trusts" not "legal documents."
3. **Response length: 100-300 words.** Long enough to be impressive, short enough to read in the demo UI.
4. **response_data must be valid JSON** matching the demo type's pattern above. Charts need plausible numbers. Tables need realistic fields.
5. **No real company names, people, or addresses.** All fictional.
6. **Legal vertical: every response must include** "This is a fictional example for demonstration purposes."
7. **Trigger keys must be unique** within a demo_type + vertical combination.
8. **Sequence order matters.** 1 = first thing user sees. 10 = the deepest demo interaction.

## Suggested Interaction Sequences

**Chatbot (any vertical):**
1. Introduction / "What can you do?"
2. Common industry question
3. Specific task request
4. Follow-up on the task
5. Complex multi-step question
6. Edge case / error handling demo
7. Integration question ("Can you connect to X?")
8. ROI / business value question
9. Comparison request
10. "How do I get started?"

**Analytics Dashboard:**
1. Overview of business metrics
2. Revenue trend analysis
3. Customer segmentation
4. Specific KPI deep dive
5. Anomaly detection / alert
6. Forecasting / projection
7. Competitive benchmarking
8. Seasonal pattern analysis
9. Drill-down into a specific segment
10. Action recommendations

Adapt these patterns to each vertical's specific terminology and workflows.
