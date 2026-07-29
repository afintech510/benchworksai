"""Create Frowein Supply Yard client + campaign."""
from app.db.supabase import get_supabase

db = get_supabase()

icp = {
    "target_titles": [
        "Owner", "President", "General Manager", "Project Manager",
        "Mason", "Masonry Contractor", "Landscape Contractor",
        "General Contractor", "Excavation Contractor",
    ],
    "target_industries": [
        "construction", "landscaping", "masonry", "site work",
        "residential construction", "hardscape",
    ],
    "geography": "Suffolk County, NY (Center Moriches + Hamptons)",
    "company_size_min": 1,
    "company_size_max": 50,
    "positive_signals": [
        "Local LI", "Buys aggregate/stone/pavers",
        "Serves Hamptons/Eastern LI clients",
    ],
    "negative_signals": [
        "National chain", "Out of region", "Service-only no materials",
    ],
}

client_result = db.table("clients").insert({
    "name": "Frowein Supply Yard",
    "industry": "building_supply",
    "icp": icp,
    "notification_channel": "email",
    "notification_target": "",
    "status": "active",
    "physical_address": "110 Frowein Rd, Center Moriches, NY 11934",
}).execute()
client_id = client_result.data[0]["id"]
print(f"CLIENT_ID: {client_id}")

camp_result = db.table("campaigns").insert({
    "client_id": client_id,
    "name": "Local Contractor Outreach — Eastern LI",
    "status": "draft",
    "vertical": "contractor",
    "offer": "Building / landscape / masonry materials supply (Center Moriches yard)",
    "geography": "Suffolk County, NY",
}).execute()
camp_id = camp_result.data[0]["id"]
print(f"CAMPAIGN_ID: {camp_id}")
