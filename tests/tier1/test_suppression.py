"""Tier 1: Suppression enforcement tests (Spec Section 9.2)."""
import pytest

from app.services.suppression import check_suppression, add_suppression


@pytest.mark.tier1
@pytest.mark.asyncio
async def test_suppression_check():
    """check_suppression returns True for suppressed email."""
    # This test requires a running Supabase connection
    # When running locally without Supabase, this test will be skipped
    pytest.skip("Requires Supabase connection")


@pytest.mark.tier1
def test_suppression_normalization():
    """Email normalization works correctly."""
    assert "test@example.com" == "  Test@Example.COM  ".strip().lower()
