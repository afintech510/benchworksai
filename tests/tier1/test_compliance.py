"""Tier 1: CAN-SPAM compliance tests (Spec Section 9.2)."""
import pytest

from app.services.compliance import validate_template


@pytest.mark.tier1
def test_template_without_address():
    """Missing address → auto-appended, compliance_validated=true."""
    body = "Hey {{first_name}}, let's chat about AI for your business."
    address = "123 Main St, Long Island, NY 11001"
    is_valid, final_body, footer = validate_template(body, address)
    assert not is_valid  # Was not valid without modification
    assert address in final_body
    assert "Reply STOP" in final_body
    assert footer is not None


@pytest.mark.tier1
def test_template_without_optout():
    """Missing opt-out → auto-appended."""
    body = "Hey {{first_name}}, we help construction firms. 123 Main St, Long Island, NY 11001"
    address = "123 Main St, Long Island, NY 11001"
    is_valid, final_body, footer = validate_template(body, address)
    # Address is present but no opt-out
    assert "Reply STOP" in final_body


@pytest.mark.tier1
def test_template_with_compliance():
    """Has both address + opt-out → no modification, validated=true."""
    body = "Hey {{first_name}}, we help construction firms.\n\n123 Main St, Long Island, NY 11001\nReply STOP to unsubscribe."
    address = "123 Main St, Long Island, NY 11001"
    is_valid, final_body, footer = validate_template(body, address)
    assert is_valid
    assert footer is None
    assert final_body == body  # No modification


@pytest.mark.tier1
def test_template_footer_separate():
    """Auto-appended footer stored separately."""
    body = "Hello {{first_name}}"
    address = "456 Oak Ave, Suite 200"
    is_valid, final_body, footer = validate_template(body, address)
    assert footer is not None
    assert footer.startswith("\n---\n")
    assert address in footer
