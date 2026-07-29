"""Free survey of lead counts per filter set (no credits consumed)."""
import os
import time
import httpx


def _load_filters():
    source = os.environ.get("FILTER_SOURCE", "benchworks").lower()
    if source == "frowein":
        from app.scripts.frowein_filters import FROWEIN_FILTERS as F
        return F
    from app.scripts.apollo_filters import FILTER_SETS as F
    return F


def main():
    api_key = os.environ["APOLLO_API_KEY"]
    FILTER_SETS = _load_filters()
    print(f"{'filter_set':<35s} {'total':>8s} {'target':>7s} {'pull':>7s}")
    print("-" * 65)

    grand_total = 0
    realistic_pull = 0

    with httpx.Client(timeout=30.0) as client:
        for name, fs in FILTER_SETS.items():
            body = {**fs["params"], "page": 1, "per_page": 1}
            resp = client.post(
                "https://api.apollo.io/api/v1/mixed_people/api_search",
                json=body,
                headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            )
            if resp.status_code != 200:
                print(f"{name:<35s} ERR {resp.status_code}")
                continue
            total = resp.json().get("total_entries", 0)
            target = fs["target_leads"]
            pull = min(total, target)
            grand_total += total
            realistic_pull += pull
            print(f"{name:<35s} {total:>8d} {target:>7d} {pull:>7d}")
            time.sleep(0.4)

    print("-" * 65)
    print(f"{'TOTALS':<35s} {grand_total:>8d} {'':>7s} {realistic_pull:>7d}")
    print(f"\nRealistic credit burn: ~{realistic_pull} (1 credit per email reveal)")


if __name__ == "__main__":
    main()
