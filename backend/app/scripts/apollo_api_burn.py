"""Apollo API-based lead puller — burn expiring credits.

Workflow:
1. /api/v1/mixed_people/api_search       → paginated person list (FREE, no credits)
2. /api/v1/people/bulk_match (10 at a time, reveal_personal_emails=true) → reveal emails + full org data
3. Post-filter by org industry keywords (since api_search can't filter on industry)
4. Upsert into Supabase `leads` table with FULL enrichment_data for downstream research

Requires Apollo Master API key.

Usage (inside FastAPI container):
    docker exec \\
      -e APOLLO_API_KEY=xxx \\
      -e CAMPAIGN_ID=2eb3d412-e343-4630-b8fa-10e95a7ac7c0 \\
      -e MAX_CREDITS=3950 \\
      -e FILTER_SETS=mfg_water_treatment,hc_large_staffing \\
      benchworks-outbound-fastapi-1 \\
      python -m app.scripts.apollo_api_burn

Leave FILTER_SETS unset to run all 12.
"""
import os
import sys
import time
import httpx
from app.db.supabase import get_supabase

APOLLO_BASE = "https://api.apollo.io/api/v1"
DEFAULT_CLIENT_ID = "0e422e8f-e60f-42f0-9172-f3cea065ee0a"  # BenchworksAI internal


def _load_filters():
    """Pick filter source via FILTER_SOURCE env var."""
    source = os.environ.get("FILTER_SOURCE", "benchworks").lower()
    if source == "frowein":
        from app.scripts.frowein_filters import FROWEIN_FILTERS as F
        return F
    from app.scripts.apollo_filters import FILTER_SETS as F
    return F


def org_matches_niche(org: dict, keywords: list[str]) -> bool:
    """Post-filter: check if a returned org's industry/name matches the niche keywords."""
    if not keywords:
        return True
    haystack = " ".join([
        (org.get("name") or "").lower(),
        (org.get("industry") or "").lower(),
        " ".join((k or "").lower() for k in (org.get("keywords") or [])),
        (org.get("short_description") or "").lower(),
    ])
    return any(kw.lower() in haystack for kw in keywords)


def search_people(client: httpx.Client, api_key: str, params: dict, page: int, per_page: int = 100) -> dict:
    """FREE people search — no credit consumption."""
    body = {**params, "page": page, "per_page": per_page}
    resp = client.post(
        f"{APOLLO_BASE}/mixed_people/api_search",
        json=body,
        headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
        timeout=60.0,
    )
    if resp.status_code == 429:
        print("  rate limit on search — sleeping 30s")
        time.sleep(30)
        return search_people(client, api_key, params, page, per_page)
    if resp.status_code != 200:
        print(f"  SEARCH ERROR {resp.status_code}: {resp.text[:300]}")
        return {"people": [], "total_entries": 0}
    return resp.json()


def bulk_enrich(client: httpx.Client, api_key: str, details: list[dict]) -> list[dict]:
    """Reveal emails + full org enrichment. ~1 credit per revealed email."""
    body = {"details": details, "reveal_personal_emails": True}
    resp = client.post(
        f"{APOLLO_BASE}/people/bulk_match",
        json=body,
        headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
        timeout=120.0,
    )
    if resp.status_code == 429:
        print("  rate limit on enrich — sleeping 30s")
        time.sleep(30)
        return bulk_enrich(client, api_key, details)
    if resp.status_code != 200:
        print(f"  ENRICH ERROR {resp.status_code}: {resp.text[:300]}")
        return []
    return resp.json().get("matches", []) or []


def person_to_lead_row(person: dict, campaign_id: str, filter_name: str, niche: str) -> dict | None:
    """Build a `leads` row from a bulk_match response, capturing the FULL org snapshot."""
    email = (person.get("email") or "").strip().lower()
    if not email or "email_not_unlocked" in email or "@" not in email:
        return None

    org = person.get("organization") or {}

    # Full org snapshot — everything Apollo gave us, for downstream research
    org_snapshot = {
        "apollo_org_id": org.get("id"),
        "name": org.get("name"),
        "primary_domain": org.get("primary_domain"),
        "website_url": org.get("website_url"),
        "industry": org.get("industry"),
        "industries": org.get("industries"),
        "secondary_industries": org.get("secondary_industries"),
        "industry_tag_id": org.get("industry_tag_id"),
        "naics_codes": org.get("naics_codes"),
        "sic_codes": org.get("sic_codes"),
        "keywords": org.get("keywords"),
        "estimated_num_employees": org.get("estimated_num_employees"),
        "annual_revenue": org.get("organization_revenue"),
        "annual_revenue_printed": org.get("organization_revenue_printed"),
        "headcount_growth_6mo": org.get("organization_headcount_six_month_growth"),
        "headcount_growth_12mo": org.get("organization_headcount_twelve_month_growth"),
        "headcount_growth_24mo": org.get("organization_headcount_twenty_four_month_growth"),
        "founded_year": org.get("founded_year"),
        "raw_address": org.get("raw_address"),
        "street_address": org.get("street_address"),
        "city": org.get("city"),
        "state": org.get("state"),
        "postal_code": org.get("postal_code"),
        "country": org.get("country"),
        "phone": org.get("phone") or org.get("sanitized_phone"),
        "linkedin_url": org.get("linkedin_url"),
        "twitter_url": org.get("twitter_url"),
        "facebook_url": org.get("facebook_url"),
        "crunchbase_url": org.get("crunchbase_url"),
        "angellist_url": org.get("angellist_url"),
        "logo_url": org.get("logo_url"),
        "publicly_traded_exchange": org.get("publicly_traded_exchange"),
        "publicly_traded_symbol": org.get("publicly_traded_symbol"),
        "retail_location_count": org.get("retail_location_count"),
    }

    # Full person snapshot
    person_snapshot = {
        "apollo_id": person.get("id"),
        "linkedin_url": person.get("linkedin_url"),
        "twitter_url": person.get("twitter_url"),
        "facebook_url": person.get("facebook_url"),
        "github_url": person.get("github_url"),
        "photo_url": person.get("photo_url"),
        "headline": person.get("headline"),
        "seniority": person.get("seniority"),
        "departments": person.get("departments"),
        "subdepartments": person.get("subdepartments"),
        "functions": person.get("functions"),
        "city": person.get("city"),
        "state": person.get("state"),
        "country": person.get("country"),
        "postal_code": person.get("postal_code"),
        "formatted_address": person.get("formatted_address"),
        "time_zone": person.get("time_zone"),
        "email_status": person.get("email_status"),
        "personal_emails": person.get("personal_emails"),
        "employment_history": person.get("employment_history"),
        "intent_strength": person.get("intent_strength"),
    }

    return {
        "client_id": _CLIENT_ID,
        "campaign_id": campaign_id,
        "email": email,
        "first_name": person.get("first_name"),
        "last_name": person.get("last_name"),
        "company": org.get("name"),
        "title": person.get("title"),
        "domain": org.get("primary_domain"),
        "enrichment_data": {
            "niche": niche,
            "filter_set": filter_name,
            "person": person_snapshot,
            "organization": org_snapshot,
        },
        "source": "apollo_api_2026_05",
        "source_batch_id": filter_name,
        "stage": "enriched",
        "enriched_at": "now()",
    }


def main():
    global _CLIENT_ID
    api_key = os.environ.get("APOLLO_API_KEY")
    campaign_id = os.environ.get("CAMPAIGN_ID")
    _CLIENT_ID = os.environ.get("CLIENT_ID", DEFAULT_CLIENT_ID)
    max_credits = int(os.environ.get("MAX_CREDITS", "3950"))
    filter_subset = os.environ.get("FILTER_SETS", "").strip()
    # Default OFF — capture everything, filter via SQL after the burn
    skip_post_filter = os.environ.get("POST_FILTER", "").lower() not in ("1", "true", "yes")
    FILTER_SETS = _load_filters()

    if not api_key or not campaign_id:
        print("ERROR: APOLLO_API_KEY and CAMPAIGN_ID required", file=sys.stderr)
        sys.exit(1)

    if filter_subset:
        names = [n.strip() for n in filter_subset.split(",")]
        sets_to_run = {n: FILTER_SETS[n] for n in names if n in FILTER_SETS}
    else:
        sets_to_run = FILTER_SETS

    print(f"Running {len(sets_to_run)} filter sets, max credits: {max_credits}")
    print(f"Campaign: {campaign_id}")
    print(f"Post-filter by industry keywords: {'OFF' if skip_post_filter else 'ON'}")

    db = get_supabase()
    suppressed = {row["email"].lower() for row in
                  db.table("suppression_list").select("email").execute().data}
    print(f"Suppression list: {len(suppressed)} entries")

    credits_used = 0
    total_inserted = 0
    total_dropped_industry = 0
    per_filter_stats = {}

    with httpx.Client() as client:
        for filter_name, filter_def in sets_to_run.items():
            if credits_used >= max_credits:
                print(f"\nReached credit cap ({credits_used}/{max_credits}), stopping")
                break

            target = filter_def["target_leads"]
            params = filter_def["params"]
            industry_keywords = filter_def.get("industry_keywords", [])
            niche = filter_def["niche"]
            print(f"\n=== {filter_name} (target {target}, niche={niche}) ===")

            inserted_this_filter = 0
            dropped_this_filter = 0
            seen_ids = set()
            page = 1
            empty_pages = 0

            while inserted_this_filter < target and credits_used < max_credits:
                data = search_people(client, api_key, params, page)
                people = data.get("people", [])
                total_avail = data.get("total_entries", 0)

                if page == 1:
                    print(f"  Apollo says {total_avail:,} matches available")

                if not people:
                    empty_pages += 1
                    if empty_pages > 1:
                        break
                    page += 1
                    continue

                # Collect IDs to bulk-enrich (max 10 per call)
                ids_to_enrich = []
                for p in people:
                    pid = p.get("id")
                    if not pid or pid in seen_ids:
                        continue
                    seen_ids.add(pid)
                    ids_to_enrich.append(pid)

                # Enrich in batches of 10
                for i in range(0, len(ids_to_enrich), 10):
                    if inserted_this_filter >= target or credits_used >= max_credits:
                        break
                    batch_ids = ids_to_enrich[i:i+10]
                    details = [{"id": pid} for pid in batch_ids]
                    matches = bulk_enrich(client, api_key, details)

                    rows = []
                    for match in matches:
                        row = person_to_lead_row(match, campaign_id, filter_name, niche)
                        if not row:
                            continue
                        # Each successful reveal = 1 credit (count it whether we keep the row or not)
                        credits_used += 1
                        if row["email"] in suppressed:
                            continue
                        # Post-filter by industry keywords
                        if not skip_post_filter:
                            org_data = row["enrichment_data"]["organization"]
                            if not org_matches_niche(org_data, industry_keywords):
                                dropped_this_filter += 1
                                total_dropped_industry += 1
                                continue
                        rows.append(row)

                    if rows:
                        # Dedupe within batch by email (Apollo can return same person twice across pages)
                        seen_emails = set()
                        unique_rows = []
                        for r in rows:
                            if r["email"] not in seen_emails:
                                seen_emails.add(r["email"])
                                unique_rows.append(r)

                        try:
                            result = db.table("leads").insert(unique_rows).execute()
                            n = len(result.data) if result.data else 0
                            inserted_this_filter += n
                            total_inserted += n
                        except Exception as e:
                            err_msg = str(e)[:200]
                            # If batch fails (often due to dup email from a prior filter set), retry row-by-row
                            for row in unique_rows:
                                try:
                                    db.table("leads").insert(row).execute()
                                    inserted_this_filter += 1
                                    total_inserted += 1
                                except Exception as e2:
                                    # silent skip on duplicate, log other errors once
                                    if "duplicate" not in str(e2).lower() and "23505" not in str(e2):
                                        pass  # too noisy; uncomment for debug

                    print(f"  batch credits={credits_used} inserted={inserted_this_filter}/{target} "
                          f"dropped(industry)={dropped_this_filter}")
                    time.sleep(0.3)

                if len(people) < 100:
                    break
                page += 1
                time.sleep(0.5)

            per_filter_stats[filter_name] = {
                "inserted": inserted_this_filter,
                "dropped": dropped_this_filter,
                "target": target,
            }

    print("\n" + "=" * 65)
    print("DONE")
    print(f"Total credits used:   {credits_used}")
    print(f"Total leads inserted: {total_inserted}")
    print(f"Dropped (industry mismatch): {total_dropped_industry}")
    print("\nPer-filter breakdown:")
    print(f"{'filter':<35s} {'kept':>5s} {'dropped':>8s} {'target':>7s}")
    for name, stats in per_filter_stats.items():
        print(f"{name:<35s} {stats['inserted']:>5d} {stats['dropped']:>8d} {stats['target']:>7d}")


if __name__ == "__main__":
    main()
