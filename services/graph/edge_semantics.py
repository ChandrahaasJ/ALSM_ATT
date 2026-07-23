"""Pure helpers for turning raw Playwright network logs into edge semantics."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

NetworkLogEntry = dict[str, Any]
EdgeAction = dict[str, Any]
EdgeMetadata = dict[str, Any]

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


def derive_edge_action(filtered_logs: list[NetworkLogEntry]) -> EdgeAction | None:
    """Pick the single best representative action from filtered network logs."""
    if not filtered_logs:
        return None

    best = max(filtered_logs, key=_score_log)
    method = (best.get("method") or "GET").upper()
    url = best.get("url") or ""
    resource_type = (best.get("resource_type") or "").lower()

    return {
        "kind": "api_call",
        "method": method,
        "path": normalize_url(url),
        "url": url,
        "status": best.get("status"),
        "resource_type": resource_type,
    }


def build_edge_metadata(
    *,
    parent_id: str,
    click_index: int,
    bbox: list[int],
    confidence: float,
    raw_network_logs: list[NetworkLogEntry],
) -> EdgeMetadata:
    """Build the structured edge payload for one parent→child transition."""
    filtered_logs = filter_network_logs(raw_network_logs)
    edge_action = derive_edge_action(filtered_logs)

    return {
        "edge_click": {
            "parent_id": parent_id,
            "element_index": click_index,
            "bbox": bbox,
            "confidence": confidence,
        },
        "network_logs": filtered_logs,
        "network_logs_raw_count": len(raw_network_logs),
        "edge_action": edge_action,
    }