"""Fleet/portfolio uptime monitor.

Runs ORIGIN HTTP checks against the shared nginx for every public hostname in
the fleet. Most of these domains are co-located on the same VPS as this stack,
so the only accurate way to measure them from here is to hit the shared nginx
container directly over the internal docker network — mirroring the proven
loopback command used on the box:

    curl --resolve <host>:443:<nginx-ip> -ksS -L -o /dev/null \
         -w '%{http_code} %{time_total}' https://<host>/

The true Cloudflare-EDGE view cannot be measured from the VPS (it hairpins on
co-located domains), so edge_* fields are left null here and are only populated
if an external collector pushes them later.
"""
import asyncio
import socket
from datetime import datetime, timezone

import structlog

from app.config import get_settings

logger = structlog.get_logger()

# Grouped portfolio of public hostnames to monitor. Excludes intentionally-down
# and accidental-fallthrough hostnames (hhpw.mygravelguy.com, app/api.hosthampton.com,
# larkintech.ai, maningo.hosthampton.com).
PORTFOLIO: list[tuple[str, str]] = [
    ("Host Hampton", "www.hosthampton.com"),
    ("Eastern LM", "easternlm.com"),
    ("My Gravel Guy", "mygravelguy.com"),
    ("Maningo", "maningomethod.com"),
    ("Larkin app", "benchworksai.com"),
    ("Benchworks", "app.benchworksai.com"),
    ("Benchworks", "n8n.benchworksai.com"),
    ("Benchworks", "rentals.benchworksai.com"),
    ("Eastern Truck", "easterntruckrepair.com"),
]

REDIS_KEY = "bw:portfolio_status:latest"
SNAPSHOT_TTL = 1800  # seconds (30 min) — stale snapshot expires on its own
_CHECK_TIMEOUT = 10.0  # seconds per host


def _resolve_nginx_ip(target: str) -> str | None:
    """Resolve the shared nginx container hostname to an IP for curl --resolve.

    Returns None when not on the shared network (e.g. local dev) — checks then
    fall back to normal DNS resolution of each public host.
    """
    try:
        return socket.gethostbyname(target)
    except OSError as e:
        logger.warning("portfolio_nginx_resolve_failed", target=target, error=str(e))
        return None


async def _check_origin(host: str, nginx_ip: str | None) -> dict:
    """Single origin HTTP check. Never raises — returns origin_code 0 on error."""
    cmd = [
        "curl", "-ksS", "-L", "-o", "/dev/null",
        "-w", "%{http_code} %{time_total}",
        "--max-time", str(int(_CHECK_TIMEOUT)),
    ]
    if nginx_ip:
        cmd += ["--resolve", f"{host}:443:{nginx_ip}"]
    cmd.append(f"https://{host}/")

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, _err = await asyncio.wait_for(proc.communicate(), timeout=_CHECK_TIMEOUT + 5)
    except (asyncio.TimeoutError, FileNotFoundError, OSError) as e:
        logger.warning("portfolio_origin_check_error", host=host, error=str(e))
        return {"origin_code": 0, "origin_ms": None}

    parts = (out or b"").decode(errors="replace").strip().split()
    code = int(parts[0]) if parts and parts[0].isdigit() else 0
    ms: int | None = None
    if len(parts) >= 2:
        try:
            ms = round(float(parts[1]) * 1000)
        except ValueError:
            ms = None
    return {"origin_code": code, "origin_ms": ms}


def _status_for(origin_code: int) -> str:
    """2xx/3xx = up; everything else (incl. 0 = unreachable) = down."""
    return "up" if 200 <= origin_code < 400 else "down"


async def run_portfolio_checks() -> dict:
    """Run all origin checks concurrently and return a snapshot dict."""
    settings = get_settings()
    nginx_target = settings.portfolio_nginx_host
    nginx_ip = _resolve_nginx_ip(nginx_target)

    async def one(group: str, host: str) -> dict:
        origin = await _check_origin(host, nginx_ip)
        return {
            "group": group,
            "host": host,
            "origin_code": origin["origin_code"],
            "origin_ms": origin["origin_ms"],
            "edge_code": None,
            "edge_ms": None,
            "status": _status_for(origin["origin_code"]),
        }

    results = await asyncio.gather(*(one(g, h) for g, h in PORTFOLIO))
    return {
        "ts": datetime.now(timezone.utc).isoformat(),
        "nginx_target": nginx_target,
        "nginx_resolved": nginx_ip is not None,
        "results": list(results),
    }


def detect_flips(prev: dict | None, curr: dict) -> list[dict]:
    """Return up<->down transitions between two snapshots, keyed by host."""
    if not prev or not prev.get("results"):
        return []
    prev_status = {r["host"]: r["status"] for r in prev["results"]}
    flips: list[dict] = []
    for r in curr.get("results", []):
        old = prev_status.get(r["host"])
        if old and old != r["status"]:
            flips.append({"host": r["host"], "from": old, "to": r["status"]})
    return flips
