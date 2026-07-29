"""Bulk-import Apollo dashboard CSV exports into Supabase `leads` table.

Run after exporting CSVs from Apollo.io dashboard.

Usage:
    docker exec -e CAMPAIGN_ID=xxx -e CLIENT_ID=xxx -e CSV_DIR=/tmp/apollo_csvs \
        -e NICHE_TAG=manufacturers \
        benchworks-outbound-fastapi-1 python -m app.scripts.apollo_csv_import

Expected CSV columns (Apollo's standard export format):
    First Name, Last Name, Title, Company, Email, Email Status,
    Person LinkedIn URL, Company LinkedIn URL, Company Website, City, State,
    Country, Industry, # Employees, Annual Revenue, Seniority, Departments,
    Phone, Mobile, Apollo ID, etc.
"""
import os
import csv
import glob
import sys
from app.db.supabase import get_supabase


def normalize_email(s: str) -> str:
    return (s or "").strip().lower()


def parse_int(s: str) -> int | None:
    try:
        return int((s or "").replace(",", "").strip())
    except (ValueError, AttributeError):
        return None


def main():
    campaign_id = os.environ.get("CAMPAIGN_ID")
    client_id = os.environ.get("CLIENT_ID", "0e422e8f-e60f-42f0-9172-f3cea065ee0a")
    csv_dir = os.environ.get("CSV_DIR", "/tmp/apollo_csvs")
    niche_tag = os.environ.get("NICHE_TAG", "unknown")

    if not campaign_id:
        print("ERROR: CAMPAIGN_ID env var required", file=sys.stderr)
        sys.exit(1)

    db = get_supabase()

    suppressed = {row["email"].lower() for row in
                  db.table("suppression_list").select("email").execute().data}
    print(f"Loaded {len(suppressed)} suppressed emails")

    csv_files = sorted(glob.glob(f"{csv_dir}/*.csv"))
    print(f"Found {len(csv_files)} CSV files in {csv_dir}")

    total_seen = 0
    total_inserted = 0
    total_suppressed = 0
    total_no_email = 0
    total_dupe = 0

    for csv_path in csv_files:
        filter_name = os.path.basename(csv_path).replace(".csv", "")
        print(f"\n--- {filter_name} ---")
        batch = []

        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_seen += 1
                email = normalize_email(row.get("Email", ""))

                if not email or "@" not in email:
                    total_no_email += 1
                    continue
                if email in suppressed:
                    total_suppressed += 1
                    continue

                batch.append({
                    "client_id": client_id,
                    "campaign_id": campaign_id,
                    "email": email,
                    "first_name": (row.get("First Name") or "").strip() or None,
                    "last_name": (row.get("Last Name") or "").strip() or None,
                    "company": (row.get("Company") or "").strip() or None,
                    "title": (row.get("Title") or "").strip() or None,
                    "domain": (row.get("Company Website") or row.get("Website") or "").strip() or None,
                    "enrichment_data": {
                        "apollo_id": row.get("Apollo Contact Id") or row.get("Apollo ID"),
                        "linkedin_url": row.get("Person Linkedin Url") or row.get("Person LinkedIn URL"),
                        "company_linkedin_url": row.get("Company Linkedin Url"),
                        "city": row.get("City"),
                        "state": row.get("State"),
                        "country": row.get("Country"),
                        "industry": row.get("Industry"),
                        "seniority": row.get("Seniority"),
                        "departments": row.get("Departments"),
                        "phone": row.get("Work Direct Phone") or row.get("Phone"),
                        "mobile": row.get("Mobile Phone") or row.get("Mobile"),
                        "email_status": row.get("Email Status"),
                        "organization": {
                            "employees": parse_int(row.get("# Employees", "")),
                            "annual_revenue": parse_int(row.get("Annual Revenue", "")),
                            "industry": row.get("Industry"),
                            "linkedin_url": row.get("Company Linkedin Url"),
                            "website": row.get("Company Website"),
                            "founded_year": parse_int(row.get("Founded Year", "")),
                        },
                    },
                    "source": f"apollo_csv_{niche_tag}",
                    "source_batch_id": filter_name,
                    "stage": "enriched",
                    "enriched_at": "now()",
                })

        # Bulk upsert in chunks of 200
        for i in range(0, len(batch), 200):
            chunk = batch[i:i+200]
            try:
                result = db.table("leads").upsert(
                    chunk,
                    on_conflict="email,campaign_id",
                    ignore_duplicates=True,
                ).execute()
                inserted = len(result.data) if result.data else 0
                total_inserted += inserted
                total_dupe += len(chunk) - inserted
            except Exception as e:
                print(f"  chunk error: {e}")
                # Fall back to row-by-row
                for row in chunk:
                    try:
                        db.table("leads").upsert(
                            row, on_conflict="email,campaign_id",
                            ignore_duplicates=True,
                        ).execute()
                        total_inserted += 1
                    except Exception:
                        total_dupe += 1

        print(f"  processed {len(batch)} rows")

    print(f"\n{'='*50}")
    print(f"DONE")
    print(f"CSV rows seen:    {total_seen}")
    print(f"Inserted:         {total_inserted}")
    print(f"Skipped (no email): {total_no_email}")
    print(f"Skipped (suppression): {total_suppressed}")
    print(f"Skipped (duplicate): {total_dupe}")


if __name__ == "__main__":
    main()
