"""12 Apollo search filter sets across 3 niches (Manufacturers, Healthcare Staffing, Family Offices/Trust).

GEO FOCUS: Long Island + NYC + immediate adjacent (Center Moriches, NY 11934 base).

API LIMITATIONS (verified May 2026):
- /mixed_people/api_search does NOT support industry filtering by name (no documented tag IDs)
- q_keywords param is rejected (zero results)
- revenue_range filter is documented as `revenue_range[min]/[max]` but yields very thin results
- Best approach: niche-specific titles + locations, then post-filter by org industry in bulk_match response

Each filter set picks titles that ARE niche-implying (Trust Officer = wealth, Plant Manager = mfg).
"""

LI_NYC_LOCATIONS = [
    "Suffolk County, New York, US",
    "Nassau County, New York, US",
    "New York, New York, US",
    "Brooklyn, New York, US",
    "Queens, New York, US",
    "The Bronx, New York, US",
    "Staten Island, New York, US",
    "Westchester County, New York, US",
]

LI_NYC_TRISTATE = LI_NYC_LOCATIONS + [
    "Hudson County, New Jersey, US",
    "Bergen County, New Jersey, US",
    "Fairfield County, Connecticut, US",
]


FILTER_SETS = {
    # ===== MANUFACTURERS — 4 sets, tristate geo =====
    # Strategy: niche-specific operational titles + employee ranges (51+ implies real mfg)
    "mfg_specialty_electronics": {
        "niche": "manufacturers",
        "target_leads": 150,
        "geo": "tristate",
        "industry_keywords": ["electronics", "semiconductor", "industrial control",
                               "aerospace", "defense", "precision"],
        "params": {
            "person_titles": [
                "VP Manufacturing", "VP Operations", "Director of Manufacturing",
                "Director of Operations", "Plant Manager", "Plant Director",
                "Manufacturing Engineer", "Operations Manager",
            ],
            "person_locations": LI_NYC_TRISTATE,
            "organization_num_employees_ranges": ["51,200", "201,500", "501,1000"],
        },
    },
    "mfg_mechanical_machinery": {
        "niche": "manufacturers",
        "target_leads": 100,
        "geo": "tristate",
        "industry_keywords": ["machinery", "hvac", "pump", "motor",
                               "industrial", "conveyor", "material handling"],
        "params": {
            "person_titles": [
                "VP Operations", "Director Engineering", "Plant Manager",
                "Plant Director", "VP Manufacturing", "Operations Manager",
            ],
            "person_locations": LI_NYC_TRISTATE,
            "organization_num_employees_ranges": ["51,200", "201,500"],
        },
    },
    "mfg_food_beverage_eq": {
        "niche": "manufacturers",
        "target_leads": 75,
        "geo": "tristate",
        "industry_keywords": ["food", "beverage", "pharmaceutical",
                               "chemical", "processing"],
        "params": {
            "person_titles": [
                "VP Operations", "Director of Manufacturing", "Plant Manager",
                "COO", "Plant Director",
            ],
            "person_locations": LI_NYC_TRISTATE,
            "organization_num_employees_ranges": ["51,200", "201,500"],
        },
    },
    "mfg_water_treatment": {
        "niche": "manufacturers",
        "target_leads": 75,
        "geo": "li_nyc",
        "industry_keywords": ["water", "wastewater", "environmental",
                               "filtration", "treatment"],
        "params": {
            "person_titles": [
                "VP Operations", "Plant Manager", "Operations Manager",
                "Director of Operations", "VP Engineering",
            ],
            "person_locations": LI_NYC_LOCATIONS,
        },
    },

    # ===== HEALTHCARE STAFFING — 4 sets, LI+NYC =====
    # Strategy: titles that ONLY exist in staffing/recruitment world
    "hc_large_staffing": {
        "niche": "healthcare_staffing",
        "target_leads": 125,
        "geo": "li_nyc",
        "industry_keywords": ["staffing", "nursing", "healthcare", "medical",
                               "travel nurse", "locum"],
        "params": {
            "person_titles": [
                "VP Staffing", "Director of Staffing", "Staffing Director",
                "Chief Operating Officer", "Director of Operations",
                "VP of Healthcare Staffing", "VP of Nursing Staffing",
            ],
            "person_locations": LI_NYC_LOCATIONS,
            "organization_num_employees_ranges": ["51,200", "201,500", "501,1000"],
        },
    },
    "hc_midsize_regional": {
        "niche": "healthcare_staffing",
        "target_leads": 150,
        "geo": "li_nyc",
        "industry_keywords": ["staffing", "nursing", "healthcare", "medical"],
        "params": {
            "person_titles": [
                "Staffing Coordinator", "Staffing Manager", "Staffing Director",
                "Director of Nursing", "Recruitment Director",
                "Director of Recruitment", "Owner",
            ],
            "person_locations": LI_NYC_LOCATIONS,
            "organization_num_employees_ranges": ["11,50", "51,200"],
        },
    },
    "hc_physician_locum": {
        "niche": "healthcare_staffing",
        "target_leads": 100,
        "geo": "li_nyc",
        "industry_keywords": ["physician", "locum", "medical recruitment",
                               "medical staffing", "doctor"],
        "params": {
            "person_titles": [
                "Recruiter", "Physician Recruiter", "Director of Recruitment",
                "VP Operations", "Recruitment Director",
                "Medical Recruiter",
            ],
            "person_locations": LI_NYC_LOCATIONS,
        },
    },
    "hc_allied_health": {
        "niche": "healthcare_staffing",
        "target_leads": 100,
        "geo": "li_nyc",
        "industry_keywords": ["allied health", "therapy", "lab", "imaging",
                               "diagnostic", "rehabilitation"],
        "params": {
            "person_titles": [
                "Director of Operations", "Operations Manager", "Staffing Director",
                "Owner", "CEO", "President",
            ],
            "person_locations": LI_NYC_LOCATIONS,
            "organization_num_employees_ranges": ["11,50", "51,200"],
        },
    },

    # ===== FAMILY OFFICES & TRUST — 4 sets, LI+NYC =====
    # Strategy: hyper-specific titles (Trust Officer, Trustee) only exist in this niche
    "wt_family_office_trust": {
        "niche": "wealth_trust",
        "target_leads": 175,
        "geo": "li_nyc",
        "industry_keywords": ["family office", "trust", "wealth management",
                               "private wealth", "advisory", "investment"],
        "params": {
            "person_titles": [
                "Trustee", "Trust Officer", "Senior Trust Officer",
                "Family Office Manager", "Family Office Director",
                "Wealth Advisor", "Private Wealth Advisor",
                "Chief Investment Officer",
            ],
            "person_locations": LI_NYC_LOCATIONS,
        },
    },
    "wt_estate_probate_law": {
        "niche": "wealth_trust",
        "target_leads": 150,
        "geo": "li_nyc",
        "industry_keywords": ["estate", "trust", "probate", "law",
                               "attorney", "elder law"],
        "params": {
            "person_titles": [
                "Estate Planning Attorney", "Trust Attorney", "Probate Attorney",
                "Estate Attorney", "Partner", "Managing Partner",
            ],
            "person_locations": LI_NYC_LOCATIONS,
        },
    },
    "wt_investment_advisory": {
        "niche": "wealth_trust",
        "target_leads": 175,
        "geo": "li_nyc",
        "industry_keywords": ["investment", "wealth", "advisory",
                               "financial advisory", "private bank"],
        "params": {
            "person_titles": [
                "Managing Director", "Senior Wealth Advisor", "Wealth Advisor",
                "Financial Advisor", "Private Wealth Manager",
                "Senior Partner", "Founder", "Chief Investment Officer",
            ],
            "person_locations": LI_NYC_LOCATIONS,
            "organization_num_employees_ranges": ["11,50", "51,200", "201,500"],
        },
    },
    "wt_corporate_trustees": {
        "niche": "wealth_trust",
        "target_leads": 75,
        "geo": "li_nyc",
        "industry_keywords": ["trust company", "corporate trust", "bank",
                               "trust services"],
        "params": {
            "person_titles": [
                "Trust Officer", "Senior Trust Officer",
                "VP Trust Services", "Director of Trust Administration",
                "Trust Administrator",
            ],
            "person_locations": LI_NYC_LOCATIONS,
            "organization_num_employees_ranges": ["201,500", "501,1000", "1001,5000"],
        },
    },
}


def total_target_leads() -> int:
    return sum(f["target_leads"] for f in FILTER_SETS.values())


def org_matches_niche(org: dict, keywords: list[str]) -> bool:
    """Post-filter: check if a returned org's industry/name/keywords matches the niche."""
    if not keywords:
        return True
    haystack = " ".join([
        (org.get("name") or "").lower(),
        (org.get("industry") or "").lower(),
        " ".join((k or "").lower() for k in (org.get("keywords") or [])),
        " ".join((org.get("industries") or [])).lower() if isinstance(org.get("industries"), list) else "",
        (org.get("short_description") or "").lower(),
    ])
    return any(kw.lower() in haystack for kw in keywords)


if __name__ == "__main__":
    print(f"Total filter sets: {len(FILTER_SETS)}")
    print(f"Total target leads: {total_target_leads()}")
