"""Utilities for identifying unique UI states during graph traversal."""

from __future__ import annotations

import hashlib
from typing import Any


def build_state_signature(url: str, title: str, *, screenshot_path: str | None = None) -> str:
    """Build a stable fingerprint for the current browser state.

    URL and page title catch most SPA route changes. An optional screenshot
    hash helps distinguish visually identical URLs with different content.
    """
    parts = [url.strip(), title.strip()]
    if screenshot_path:
        with open(screenshot_path, "rb") as image_file:
            digest = hashlib.sha256(image_file.read()).hexdigest()[:16]
        parts.append(digest)
    return "|".join(parts)


def find_node_by_signature(nodes: list[dict[str, Any]], signature: str) -> str | None:
    """Return the node_id of an existing node with the given state signature."""
    for node in nodes:
        if node.get("state_signature") == signature:
            return node["node_id"]
    return None
