"""Test configuration and shared fixtures."""
import json
import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Add backend app root to path (apps/backend, which contains app/)
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.config import get_settings


@pytest_asyncio.fixture
async def client():
    """Async test client for FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def operator_jwt():
    """Generate a valid operator JWT for testing."""
    from jose import jwt
    settings = get_settings()
    token = jwt.encode(
        {"sub": "test-operator", "email": "operator@test.com", "role": "operator", "jti": "test-session-001"},
        settings.nextauth_secret,
        algorithm="HS256",
    )
    return token


@pytest.fixture
def expired_jwt():
    """Generate an expired JWT."""
    from jose import jwt
    import time
    settings = get_settings()
    token = jwt.encode(
        {"sub": "test-operator", "email": "operator@test.com", "role": "operator", "jti": "expired-001", "exp": int(time.time()) - 3600},
        settings.nextauth_secret,
        algorithm="HS256",
    )
    return token


@pytest.fixture
def invalid_jwt():
    """JWT signed with wrong secret."""
    from jose import jwt
    token = jwt.encode(
        {"sub": "test-operator", "email": "operator@test.com", "role": "operator", "jti": "bad-001"},
        "wrong-secret-key",
        algorithm="HS256",
    )
    return token


@pytest.fixture
def service_key():
    """n8n service key."""
    return get_settings().service_key_n8n


@pytest.fixture
def auth_headers(operator_jwt):
    """Auth headers for operator."""
    return {"Authorization": f"Bearer {operator_jwt}"}


@pytest.fixture
def service_headers(service_key):
    """Auth headers for n8n service."""
    return {"X-Service-Key": service_key}


def load_fixtures(filename: str) -> list:
    """Load test fixtures from JSON file."""
    path = Path(__file__).parent / "fixtures" / filename
    with open(path) as f:
        return json.load(f)
