"""One-off Apollo lead puller — burn expiring credits before renewal.

Usage (inside FastAPI container):
    docker exec -e APOLLO_API_KEY=xxx -e TARGET_CREDITS=3950 \
        benchworks-outbound-fastapi-1 python -m app.scripts.apollo_burn

Reads ICP filters from APOLLO_SEARCH_JSON env var (JSON-encoded Apollo search params).
"""
import os
import json
import time
import sys
import httpx
from app.db.supabase import get_supabase

APOLLO_URL = "https://api.apollo.io/api/v1/mixed_people/search"
BENCHWORKS_CLIENT_ID = "0e422e8f-e60f-42f0-9172-f3cea065ee0a"


def main():
    api_key = os.environ.get("APOLLO_API_KEY")
    if not api_key:
        print("ERROR: APOLLO_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    target_credits = int(os.environ.get("TARGET_CREDITS", "3950"))
    search_params = json.loads(os.environ.get("APOLLO_SEARCH_JSON", "{}"))
    campaign_id = os.environ.get("CAMPAIGN_ID")

    if not campaign_id:
        print("ERROR: CAMPAIGN_ID not set — create a campaign row first", file=sys.stderr)
        sys.exit(1)

    db = get_supabase()

    # Pre-fetch suppression list once
    suppressed = {row["email"].lower() for row in
                  db.table("suppression_list").select("email").execute().data}
    print(f"Loaded {len(suppressed)} suppressed emails")

    headers = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "X-Api-Key": api_key,
    }

    credits_used = 0
    leads_inserted = 0
    leads_skipped_suppression = 0
    leads_skipped_duplicate = 0
    page = 1
    per_page = 100

    with httpx.Client(timeout=60.0) as client:
        while credits_used < target_credits:
            body = {**search_params, "page": page, "per_page": per_page}
            print(f"\n[page {page}] requesting...")

            resp = client.post(APOLLO_URL, json=body, headers=headers)
            if resp.status_code != 200:
                print(f"ERROR {resp.status_code}: {resp.text[:500]}")
                break

            data = resp.json()
            people = data.get("people", []) + data.get("contacts", [])
            if not people:
                print("No more results — stopping")
                break

            batch = []
            for person in people:
                if credits_used >= target_credits:
                    break

                email = (person.get("email") or "").lower().strip()
                if not email or email == "email_not_unlocked@domain.com":
                    continue

                # Each revealed email = 1 credit
                credits_used += 1

                if email in suppressed:
                    leads_skipped_suppression += 1
                    continue

                org = person.get("organization") or {}
                batch.append({
                    "client_id": BENCHWORKS_CLIENT_ID,
                    "campaign_id": campaign_id,
                    "email": email,
                    "first_name": person.get("first_name"),
                    "last_name": person.get("last_name"),
                    "company": org.get("name"),
                    "title": person.get("title"),
                    "domain": org.get("primary_domain") or org.get("website_url"),
                    "enrichment_data": {
                        "apollo_id": person.get("id"),
                        "linkedin_url": person.get("linkedin_url"),
                        "city": person.get("city"),
                        "state": person.get("state"),
                        "country": person.get("country"),
                        "headline": person.get("headline"),
                        "seniority": person.get("seniority"),
                        "departments": person.get("departments"),
                        "organization": {
                            "id": org.get("id"),
                            "industry": org.get("industry"),
                            "employees": org.get("estimated_num_employees"),
                            "linkedin_url": org.get("linkedin_url"),
                            "founded_year": org.get("founded_year"),
                        },
                    },
                    "source": "apollo_burn_2026_05",
                    "source_batch_id": f"apollo_{page}",
                    "stage": "enriched",
                    "enriched_at": "now()",
                })

            if batch:
                # Upsert in chunks of 100 to avoid timeout
                try:
                    result = db.table("leads").upsert(
                        batch,
                        on_conflict="email,campaign_id",
                        ignore_duplicates=True,
                    ).execute()
                    inserted = len(result.data) if result.data else 0
                    leads_inserted += inserted
                    leads_skipped_duplicate += len(batch) - inserted
                except Exception as e:
                    print(f"INSERT ERROR: {e}")
                    # Retry one-by-one to skip bad rows
                    for row in batch:
                        try:
                            db.table("leads").upsert(
                                row, on_conflict="email,campaign_id",
                                ignore_duplicates=True,
                            ).execute()
                            leads_inserted += 1
                        except Exception:
                            pass

            print(f"  credits_used={credits_used} inserted={leads_inserted} "
                  f"suppressed={leads_skipped_suppression} dupes={leads_skipped_duplicate}")

            if len(people) < per_page:
                print("Reached end of results")
                break

            page += 1
            time.sleep(0.5)  # gentle rate limit

    print("\n" + "=" * 50)
    print(f"DONE")
    print(f"Credits used:        {credits_used}")
    print(f"Leads inserted:      {leads_inserted}")
    print(f"Skipped suppression: {leads_skipped_suppression}")
    print(f"Skipped duplicates:  {leads_skipped_duplicate}")
    print(f"Pages walked:        {page}")


if __name__ == "__main__":
    main()
