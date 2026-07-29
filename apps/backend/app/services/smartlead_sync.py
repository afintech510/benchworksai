"""Smartlead suppression sync (Spec Section 3.4 — SYN-018).

Remove unsubscribed emails from all active Smartlead campaigns.
"""
import subprocess

import structlog

from app.config import get_settings

logger = structlog.get_logger()


async def remove_from_smartlead(email: str) -> bool:
    """Remove email from all active Smartlead campaigns via CLI.

    Returns True on success, False on failure (local suppression still applies).
    """
    settings = get_settings()
    if not settings.smartlead_api_key:
        logger.warning("smartlead_sync_skipped", reason="no_api_key")
        return False

    try:
        result = subprocess.run(
            [
                "smartlead", "leads", "remove",
                "--email", email,
                "--apiKey", settings.smartlead_api_key,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            logger.info("smartlead_suppression_synced", email=email)
            return True
        else:
            logger.warning("smartlead_sync_failed", email=email, stderr=result.stderr)
            return False
    except Exception as e:
        logger.error("smartlead_sync_error", email=email, error=str(e))
        return False
