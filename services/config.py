from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _env_bool(key: str, default: str = "false") -> bool:
    return os.getenv(key, default).lower() in ("1", "true", "yes")


def _env_opt(key: str) -> str | None:
    value = os.getenv(key, "").strip()
    return value or None


class Config:
    """Application settings loaded from environment / ``.env`` at import time."""

    recursive_limit: int = int(os.getenv("RECURSIVE_LIMIT", "3"))
    headless: bool = _env_bool("HEADLESS")
    slow_mo_ms: int = int(os.getenv("SLOW_MO_MS", "400"))
    nav_timeout_ms: int = int(os.getenv("NAV_TIMEOUT_MS", "15000"))
    network_idle_timeout_ms: int = int(os.getenv("NETWORK_IDLE_TIMEOUT_MS", "5000"))
    capture_dom: bool = _env_bool("CAPTURE_DOM", "true")
    dom_style_fetch_timeout_ms: int = int(os.getenv("DOM_STYLE_FETCH_TIMEOUT_MS", "5000"))

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
