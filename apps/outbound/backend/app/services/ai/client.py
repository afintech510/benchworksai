"""Anthropic client setup (Spec Section 5.3)."""
from anthropic import Anthropic

from app.config import get_settings

# Pin model version — do not auto-upgrade (SYN-028)
MODEL = "claude-sonnet-4-20250514"


def get_anthropic_client() -> Anthropic:
    settings = get_settings()
    return Anthropic(api_key=settings.anthropic_api_key)
