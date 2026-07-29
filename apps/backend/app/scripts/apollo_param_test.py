"""Isolate which Apollo params produce results."""
import os
import httpx

KEY = os.environ["APOLLO_API_KEY"]

tests = [
    ("titles only", {"person_titles": ["CEO"]}),
    ("titles + LI/NYC", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US", "New York, New York, US"],
    }),
    ("titles + LI/NYC + revenue", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US"],
        "organization_revenue_min": 5_000_000,
        "organization_revenue_max": 50_000_000,
    }),
    ("titles + LI/NYC + revenue_range alt", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US"],
        "revenue_range": {"min": 5000000, "max": 50000000},
    }),
    ("titles + LI/NYC + industries (string)", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US"],
        "organization_industries": ["Healthcare Staffing"],
    }),
    ("titles + LI/NYC + q_keywords", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US"],
        "q_keywords": "healthcare staffing",
    }),
    ("titles + LI/NYC + employee range", {
        "person_titles": ["CEO"],
        "person_locations": ["Suffolk County, New York, US", "Nassau County, New York, US"],
        "organization_num_employees_ranges": ["51,200"],
    }),
    ("trust officer LI/NYC bare", {
        "person_titles": ["Trust Officer", "Trustee", "Wealth Advisor"],
        "person_locations": ["New York, New York, US", "Suffolk County, New York, US", "Nassau County, New York, US"],
    }),
    ("attorney + estate keyword", {
        "person_titles": ["Attorney", "Partner"],
        "person_locations": ["New York, New York, US", "Suffolk County, New York, US"],
        "q_keywords": "estate planning",
    }),
]

with httpx.Client(timeout=30.0) as client:
    for label, params in tests:
        body = {**params, "page": 1, "per_page": 1}
        resp = client.post(
            "https://api.apollo.io/api/v1/mixed_people/api_search",
            json=body,
            headers={"X-Api-Key": KEY, "Content-Type": "application/json"},
        )
        if resp.status_code == 200:
            print(f"{label:50s}: total={resp.json().get('total_entries', 0)}")
        else:
            print(f"{label:50s}: HTTP {resp.status_code} {resp.text[:200]}")
