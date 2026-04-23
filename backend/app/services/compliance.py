"""CAN-SPAM template validation (Spec Section 2.2 — F-024)."""
import re


def validate_template(body: str, client_physical_address: str) -> tuple[bool, str, str | None]:
    """Validate and auto-fix CAN-SPAM compliance.

    Returns: (is_valid_without_modification, final_body, compliance_footer_or_none)
    """
    has_address = bool(client_physical_address and client_physical_address.lower() in body.lower())
    has_optout = bool(re.search(
        r"(reply\s+stop|unsubscribe|opt[\s-]?out|remove\s+me)",
        body,
        re.IGNORECASE,
    ))

    if has_address and has_optout:
        return True, body, None

    # Auto-append compliance footer
    footer = f"\n---\n{client_physical_address}\nReply STOP to unsubscribe."
    return False, body + footer, footer
