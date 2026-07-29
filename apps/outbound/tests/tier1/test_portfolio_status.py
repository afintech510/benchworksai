"""Tier 1: Fleet/portfolio uptime monitor."""
import pytest

from app.services import portfolio_monitor as pm


@pytest.mark.tier1
def test_status_for():
    assert pm._status_for(200) == "up"
    assert pm._status_for(301) == "up"
    assert pm._status_for(399) == "up"
    assert pm._status_for(500) == "down"
    assert pm._status_for(0) == "down"  # unreachable / curl error


@pytest.mark.tier1
def test_detect_flips_no_previous():
    curr = {"results": [{"host": "a.com", "status": "up"}]}
    assert pm.detect_flips(None, curr) == []
    assert pm.detect_flips({}, curr) == []


@pytest.mark.tier1
def test_detect_flips_transition():
    prev = {"results": [{"host": "a.com", "status": "up"}, {"host": "b.com", "status": "up"}]}
    curr = {"results": [{"host": "a.com", "status": "down"}, {"host": "b.com", "status": "up"}]}
    flips = pm.detect_flips(prev, curr)
    assert flips == [{"host": "a.com", "from": "up", "to": "down"}]


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_run_portfolio_checks_shape(monkeypatch):
    """A failed origin check yields status=down, not an exception."""

    async def fake_check(host, nginx_ip):
        # alternate up/down so we exercise both branches
        return {"origin_code": 200 if "benchworksai" in host else 0, "origin_ms": 12}

    monkeypatch.setattr(pm, "_check_origin", fake_check)
    snapshot = await pm.run_portfolio_checks()

    assert snapshot["ts"]
    assert len(snapshot["results"]) == len(pm.PORTFOLIO)
    for row in snapshot["results"]:
        assert set(row) >= {"group", "host", "origin_code", "origin_ms", "edge_code", "edge_ms", "status"}
        assert row["status"] in ("up", "down")
        assert row["edge_code"] is None  # edge not measured server-side
    # at least one up (benchworks hosts) and one down (origin_code 0)
    statuses = {r["status"] for r in snapshot["results"]}
    assert statuses == {"up", "down"}


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_portfolio_status_requires_auth(client):
    """GET status with no auth → 401."""
    response = await client.get("/v1/internal/portfolio-status")
    assert response.status_code == 401


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_portfolio_status_service_key_blocked(client, service_headers):
    """Service key is scoped to POST /v1/internal/* only → GET read is 403."""
    response = await client.get("/v1/internal/portfolio-status", headers=service_headers)
    assert response.status_code == 403
