"""Apollo filter sets for Frowein Supply Yard (Center Moriches, NY).

Target: masonry, landscape, construction, excavation contractors in Suffolk County, NY
(covers Center Moriches + the Hamptons + surrounding eastern LI towns).

These are buyers of building/landscape/masonry materials — small to mid-size local contractors.
"""

# Suffolk County covers BOTH Center Moriches AND the Hamptons + Riverhead/Brookhaven/etc.
# Adding Nassau for west-of-Suffolk contractors who might still drive east for material.
EASTERN_LI = [
    "Suffolk County, New York, US",
    "Nassau County, New York, US",
]

# Tighter: Suffolk only (truly local to yard)
SUFFOLK_ONLY = [
    "Suffolk County, New York, US",
]


FROWEIN_FILTERS = {
    # ===== MASONRY & HARDSCAPE =====
    "fwn_masonry_hardscape": {
        "niche": "masonry",
        "target_leads": 150,
        "geo": "suffolk_nassau",
        "industry_keywords": [
            "masonry", "stone", "hardscape", "brick", "paver",
            "concrete", "stonework",
        ],
        "params": {
            "person_titles": [
                "Mason", "Masonry Contractor", "Masonry Foreman",
                "Stone Mason", "Hardscape Contractor",
                "Owner",  # broad — pair with employee filter to bias toward contractors
                "President",
            ],
            "person_locations": EASTERN_LI,
            "organization_num_employees_ranges": ["1,10", "11,50"],
        },
    },

    # ===== LANDSCAPE CONTRACTORS =====
    "fwn_landscape_contractors": {
        "niche": "landscape",
        "target_leads": 175,
        "geo": "suffolk_nassau",
        "industry_keywords": [
            "landscap", "garden", "lawn", "horticult",
            "tree service", "irrigation", "hardscape",
        ],
        "params": {
            "person_titles": [
                "Landscape Contractor", "Landscape Architect",
                "Landscape Designer", "Landscape Foreman",
                "Landscape Project Manager", "Landscaper",
                "Owner",
                "President",
            ],
            "person_locations": EASTERN_LI,
            "organization_num_employees_ranges": ["1,10", "11,50", "51,200"],
        },
    },

    # ===== GENERAL / CUSTOM HOME CONSTRUCTION =====
    "fwn_general_construction": {
        "niche": "construction",
        "target_leads": 175,
        "geo": "suffolk_nassau",
        "industry_keywords": [
            "construction", "builder", "homes", "residential",
            "custom home", "general contractor",
        ],
        "params": {
            "person_titles": [
                "General Contractor", "Custom Home Builder",
                "Construction Manager", "Building Contractor",
                "Project Manager", "Estimator",
                "Owner",
                "President",
            ],
            "person_locations": EASTERN_LI,
            "organization_num_employees_ranges": ["1,10", "11,50"],
        },
    },

    # ===== EXCAVATION & SITE WORK =====
    "fwn_excavation_sitework": {
        "niche": "excavation",
        "target_leads": 100,
        "geo": "suffolk_nassau",
        "industry_keywords": [
            "excavation", "site work", "grading", "earthwork",
            "demolition", "site preparation",
        ],
        "params": {
            "person_titles": [
                "Excavation Contractor", "Site Superintendent",
                "Site Work Manager", "Excavator",
                "Owner",
                "President",
            ],
            "person_locations": EASTERN_LI,
            "organization_num_employees_ranges": ["1,10", "11,50"],
        },
    },

    # ===== POOL CONTRACTORS (buy stone, concrete, decking) =====
    "fwn_pool_contractors": {
        "niche": "pool",
        "target_leads": 75,
        "geo": "suffolk_nassau",
        "industry_keywords": [
            "pool", "swimming pool", "spa", "aquatic",
        ],
        "params": {
            "person_titles": [
                "Pool Contractor", "Pool Builder",
                "Pool Project Manager",
                "Owner",
                "President",
            ],
            "person_locations": EASTERN_LI,
            "organization_num_employees_ranges": ["1,10", "11,50"],
        },
    },
}


def total_target() -> int:
    return sum(f["target_leads"] for f in FROWEIN_FILTERS.values())


if __name__ == "__main__":
    print(f"Total filter sets: {len(FROWEIN_FILTERS)}")
    print(f"Total target leads: {total_target()}")
