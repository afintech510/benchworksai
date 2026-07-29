"""Tier 1: Auth middleware tests (Spec Section 9.2)."""
import pytest


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_valid_jwt(client, auth_headers):
    """Valid operator JWT → 200 on protected endpoint."""
    response = await client.get("/v1/health", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_no_jwt(client):
    """No Authorization header → 401."""
    response = await client.get("/v1/clients")
    assert response.status_code == 401


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_invalid_signature(client, invalid_jwt):
    """JWT signed with wrong secret → 401."""
    response = await client.get("/v1/clients", headers={"Authorization": f"Bearer {invalid_jwt}"})
    assert response.status_code == 401


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_service_key_allowed(client, service_headers):
    """Service key on allowed endpoint → 200."""
    response = await client.get("/v1/health", headers=service_headers)
    assert response.status_code == 200


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_service_key_blocked(client, service_headers):
    """Service key on restricted endpoint → 403."""
    response = await client.patch(
        "/v1/campaigns/fake-id/status",
        headers=service_headers,
        json={"status": "paused"},
    )
    assert response.status_code == 403
