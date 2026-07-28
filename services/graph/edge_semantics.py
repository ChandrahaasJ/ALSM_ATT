"""Pure helpers for turning raw Playwright network logs into edge semantics."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from services.graph.db.graph_models import EdgeAction, NetworkLog, StateTransition

NetworkLogEntry = dict[str, Any]

NOISE_RESOURCE_TYPES: frozenset[str] = frozenset({
    "script",
    "stylesheet",
    "image",
    "font",
    "media",
    "texttrack",
    "manifest",
    "other",
})

API_RESOURCE_TYPES: tuple[str, ...] = ("fetch", "xhr")

MUTATION_METHODS: frozenset[str] = frozenset({"POST", "PUT", "PATCH", "DELETE"})

NOISE_URL_SUBSTRINGS: tuple[str, ...] = (
    "google-analytics.com",
    "googletagmanager.com",
    "facebook.net",
    "hotjar.com",
    "segment.io",
    "sentry.io",
    "/favicon.ico",
)


def normalize_url(url: str) -> str:
    """Return path + query for comparison (host stripped)."""
    parsed = urlparse(url)
    path = parsed.path or "/"
    if parsed.query:
        return f"{path}?{parsed.query}"
    return path


def is_noise_log(entry: NetworkLogEntry) -> bool:
    """Return True if this log entry is unlikely to represent a user-triggered API action."""
    resource_type = (entry.get("resource_type") or "").lower()
    if resource_type in NOISE_RESOURCE_TYPES:
        return True

    url = (entry.get("url") or "").lower()
    return any(substr in url for substr in NOISE_URL_SUBSTRINGS)


def filter_network_logs(logs: list[NetworkLogEntry]) -> list[NetworkLogEntry]:
    """Drop static assets and known analytics/noise URLs."""
    return [entry for entry in logs if not is_noise_log(entry)]


def _method_rank(method: str | None) -> int:
    if method and method.upper() in MUTATION_METHODS:
        return 2
    return 1


def _resource_rank(resource_type: str | None) -> int:
    if resource_type and resource_type.lower() in API_RESOURCE_TYPES:
        return 2
    if resource_type and resource_type.lower() == "document":
        return 1
    return 0


def _score_log(entry: NetworkLogEntry) -> tuple[int, int, int]:
    return (
        _resource_rank(entry.get("resource_type")),
        _method_rank(entry.get("method")),
        int(entry.get("timestamp_ms") or 0),
    )


def _to_network_log(entry: NetworkLogEntry) -> NetworkLog:
    status = entry.get("status")
    return NetworkLog(
        url=str(entry.get("url") or ""),
        method=str(entry.get("method") or "GET").upper(),
        status=int(status) if status is not None else None,
        resource_type=str(entry.get("resource_type") or "").lower(),
        timestamp_ms=int(entry.get("timestamp_ms") or 0),
    )


def derive_edge_action(filtered_logs: list[NetworkLogEntry]) -> EdgeAction | None:
    """Pick the single best representative action from filtered network logs."""
    if not filtered_logs:
        return None

    best = max(filtered_logs, key=_score_log)
    method = (best.get("method") or "GET").upper()
    url = best.get("url") or ""
    resource_type = (best.get("resource_type") or "").lower()
    status = best.get("status")

    return EdgeAction(
        kind="api_call",
        method=method,
        path=normalize_url(url),
        url=url,
        status=int(status) if status is not None else None,
        resource_type=resource_type,
    )


def build_edge_metadata(
    *,
    parent_id: str,
    child_id: str,
    click_index: int,
    bbox: list[int],
    confidence: float,
    raw_network_logs: list[NetworkLogEntry],
) -> StateTransition:
    """Build a StateTransition for one parent→child click."""
    filtered_logs = filter_network_logs(raw_network_logs)
    action = derive_edge_action(filtered_logs)
    return StateTransition(
        edge_id=uuid4().hex,
        parent_id=parent_id,
        child_id=child_id,
        element_index=click_index,
        bbox=list(bbox),
        confidence=float(confidence),
        action=action,
        network_logs=[_to_network_log(entry) for entry in filtered_logs],
        network_logs_raw_count=len(raw_network_logs),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
