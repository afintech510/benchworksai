---
name: larkintech-vertical-content-generator
description: >
  Generates vertical-specific sample data, documents, and datasets for the Larkin Tech demo showroom. Creates fictional but realistic content for the vertical_content table including sample documents, datasets, company profiles, workflow templates, and marketing copy. Triggers on: "generate vertical content", "create sample data for [vertical]", "generate [content_type] for [vertical]", "populate vertical data".
---

# Vertical Content Generator for Larkin Tech

## Purpose

Creates the fictional-but-realistic sample data that powers the demo showroom's vertical-specific experiences. Each vertical needs documents, datasets, company profiles, workflows, and marketing copy that look and feel authentic to that industry.

## Content Types

For each vertical, generate content matching the `vertical_content` table schema:

```json
{
  "vertical_id": "construction",
  "content_type": "sample_doc",
  "content_key": "material_quote_residential",
  "content_data": { ... }
}
```

### Content Types by Vertical

**General SMB (general_smb):**
- `sample_doc`: Invoices, receipts, purchase orders, customer agreements
- `dataset`: Monthly revenue (12mo), customer list (50 entries), inventory levels, sales by category
- `company_profile`: "Coastal Café" (restaurant), "Main Street Retail" (boutique)
- `workflow_template`: Welcome email sequence, abandoned cart follow-up, seasonal promotion
- `marketing_copy`: Social media posts, email newsletters, Google Ads copy

**Construction (construction):**
- `sample_doc`: Material quotes, bid proposals, change orders, safety inspection forms, delivery tickets
- `dataset`: Project costs (10 projects), material inventory, supplier pricing, crew scheduling
- `company_profile`: "Horizon Builders" (GC), "Atlas Masonry Supply" (supplier)
- `workflow_template`: Bid follow-up sequence, safety compliance checklist, material reorder triggers
- `marketing_copy`: Bid cover letters, project completion announcements, supplier outreach

**Property Management (property_mgmt):**
- `sample_doc`: Residential lease agreements, maintenance work orders, tenant notices, property listings, move-in checklists
- `dataset`: Rental income (12mo × 20 units), maintenance costs, occupancy rates, tenant payment history
- `company_profile`: "Harbor View Properties" (10 units), "Eastshore Management" (50 units)
- `workflow_template`: New tenant onboarding, maintenance request → dispatch → completion, lease renewal
- `marketing_copy`: Listing descriptions, tenant newsletters, rental market updates

**Legal / Estate Planning (legal):**
- `sample_doc`: Last Will and Testament, Revocable Living Trust, Power of Attorney, Healthcare Directive, Client Intake Form
- `dataset`: Case load tracking (20 cases), billing hours (quarterly), client contact list
- `company_profile`: "Sterling & Associates" (3-attorney estate planning firm)
- `workflow_template`: New client intake → consultation → engagement letter → document drafting → review → execution
- `marketing_copy`: Client education articles, referral outreach, estate planning checklist

## Quality Rules

1. **All content is fictional.** No real company names, people, addresses, phone numbers, or SSNs.
2. **Legal vertical: EVERY document must begin with** "FICTIONAL SAMPLE — NOT LEGAL ADVICE — FOR DEMONSTRATION PURPOSES ONLY"
3. **Internal consistency.** Invoice line items should sum to the total. Dates should be sequential. Names should be consistent across documents for the same fictional company.
4. **Industry-appropriate formatting.** Construction quotes have line items with unit prices. Leases have numbered sections. Legal docs have proper attestation blocks.
5. **Realistic scale.** A small restaurant has $30-80K monthly revenue, not $5M. A 3-attorney firm has 20-40 active cases, not 500.
6. **Datasets must be chart-ready.** Include numeric data that Recharts can render: arrays of {label, value} objects, time series with dates, category breakdowns.

## Output Format

JSON array matching `vertical_content` table, grouped by content_type:

```json
[
  {
    "vertical_id": "construction",
    "content_type": "sample_doc",
    "content_key": "material_quote_residential",
    "content_data": {
      "title": "Material Quote — Residential Foundation",
      "from": "Atlas Masonry Supply",
      "to": "Horizon Builders",
      "date": "2026-02-15",
      "items": [
        {"description": "8\" CMU Block (8x8x16)", "qty": 450, "unit": "ea", "price": 2.85, "total": 1282.50},
        {"description": "Type S Mortar Mix (80lb bag)", "qty": 24, "unit": "bag", "price": 8.50, "total": 204.00}
      ],
      "subtotal": 1486.50,
      "delivery": 175.00,
      "total": 1661.50
    }
  }
]
```

## Batch Commands

- "Generate all content for construction" → All 5 content types
- "Generate sample_docs for all verticals" → sample_docs across all 4
- "Generate everything" → All content types × all verticals
