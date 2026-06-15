from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "benchworks-api"
    debug: bool = False

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # Redis
    redis_url: str = "redis://:changeme@redis:6379"
    redis_password: str = "changeme"

    # Auth
    nextauth_secret: str = "change-me-to-random-64-char-string"
    google_client_id: str = ""
    google_client_secret: str = ""

    # Service keys
    service_key_n8n: str = "change-me"
    larkin_service_key: str = ""

    # External APIs
    smartlead_api_key: str = ""
    smartlead_webhook_secret: str = ""
    apollo_api_key: str = ""
    anthropic_api_key: str = ""
    calcom_webhook_secret: str = ""
    resend_api_key: str = ""

    # Slack
    slack_webhook_alerts: str = ""
    slack_webhook_replies: str = ""
    slack_webhook_bookings: str = ""

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Fleet monitor — shared nginx container reachable on hosthampton_hampton_net.
    # Origin checks --resolve each public host to this target's IP.
    portfolio_nginx_host: str = "hampton_nginx"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
