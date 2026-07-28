from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _env_bool(key: str, default: str = "false") -> bool:
    return os.getenv(key, default).lower() in ("1", "true", "yes")


def _env_opt(key: str) -> str | None:
    value = os.getenv(key, "").strip()
    return value or None


def _env_list(key: str, default: str) -> tuple[str, ...]:
    raw = os.getenv(key, default)
    return tuple(item.strip() for item in raw.split(",") if item.strip())


class Config:
    """Application settings loaded from environment / ``.env`` at import time."""

    recursive_limit: int = int(os.getenv("RECURSIVE_LIMIT", "3"))
    headless: bool = _env_bool("HEADLESS")
    slow_mo_ms: int = int(os.getenv("SLOW_MO_MS", "400"))
    nav_timeout_ms: int = int(os.getenv("NAV_TIMEOUT_MS", "15000"))
    network_idle_timeout_ms: int = int(os.getenv("NETWORK_IDLE_TIMEOUT_MS", "5000"))
    action_timeout_ms: int = int(os.getenv("ACTION_TIMEOUT_MS", "5000"))

    # DOM-based detection / interaction policy
    max_elements_per_state: int = int(os.getenv("MAX_ELEMENTS_PER_STATE", "15"))
    max_sibling_group: int = int(os.getenv("MAX_SIBLING_GROUP", "5"))
    same_origin_only: bool = _env_bool("SAME_ORIGIN_ONLY", "true")
    vision_fallback: bool = _env_bool("VISION_FALLBACK", "true")
    deny_text_patterns: tuple[str, ...] = _env_list(
        "DENY_TEXT_PATTERNS", "logout,log out,sign out,delete account"
    )

    # Form handling
    form_dummy_text: str = os.getenv("FORM_DUMMY_TEXT", "Automated crawler input")
    form_dummy_email: str = os.getenv("FORM_DUMMY_EMAIL", "qa.crawler@example.com")
    form_dummy_number: str = os.getenv("FORM_DUMMY_NUMBER", "42")
    form_dummy_phone: str = os.getenv("FORM_DUMMY_PHONE", "5551234567")
    form_dummy_date: str = os.getenv("FORM_DUMMY_DATE", "2026-01-15")
    max_form_combinations: int = int(os.getenv("MAX_FORM_COMBINATIONS", "24"))

    falkordb_url: str | None = _env_opt("FALKORDB_URL")
    falkordb_host: str = os.getenv("FALKORDB_HOST", "localhost")
    falkordb_port: int = int(os.getenv("FALKORDB_PORT", "6379"))
    falkordb_username: str | None = _env_opt("FALKORDB_USERNAME")
    falkordb_password: str | None = _env_opt("FALKORDB_PASSWORD")
    falkordb_tls: bool = _env_bool("FALKORDB_TLS")
    falkordb_ca_cert: str | None = _env_opt("FALKORDB_CA_CERT")
    falkordb_socket_timeout: float = float(os.getenv("FALKORDB_SOCKET_TIMEOUT", "30"))
    falkordb_connect_timeout: float = float(os.getenv("FALKORDB_CONNECT_TIMEOUT", "5"))
    falkordb_max_connections: int = int(os.getenv("FALKORDB_MAX_CONNECTIONS", "10"))
    falkordb_health_check_interval: int = int(
        os.getenv("FALKORDB_HEALTH_CHECK_INTERVAL", "30")
    )

    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket: str = os.getenv("S3_BUCKET", "")
    s3_prefix: str = os.getenv("S3_PREFIX", "ui-screenshots").strip().strip("/")
    s3_presign_ttl_seconds: int = int(os.getenv("S3_PRESIGN_TTL_SECONDS", "3600"))
