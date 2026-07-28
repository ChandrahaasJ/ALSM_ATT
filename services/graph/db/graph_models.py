from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, ClassVar


def _drop_none(props: dict[str, Any]) -> dict[str, Any]:
    """FalkorDB cannot store null property values — omit None keys entirely."""
    return {key: value for key, value in props.items() if value is not None}


@dataclass(frozen=True)
class NetworkLog:
    url: str
    method: str
    status: int | None
    resource_type: str
    timestamp_ms: int

    def to_properties(self, *, edge_id: str) -> dict[str, Any]:
        return _drop_none(
            {
                "edge_id": edge_id,
                "url": self.url,
                "method": self.method,
                "status": self.status,
                "resource_type": self.resource_type,
                "timestamp_ms": self.timestamp_ms,
            }
        )


@dataclass(frozen=True)
class EdgeAction:
    kind: str
    method: str
    path: str
    url: str
    status: int | None
    resource_type: str

    def to_flat_properties(self) -> dict[str, Any]:
        return _drop_none(
            {
                "action_kind": self.kind,
                "action_method": self.method,
                "action_path": self.path,
                "action_url": self.url,
                "action_status": self.status,
                "action_resource_type": self.resource_type,
            }
        )


@dataclass
class StateTransition:
    """One parent → child UI state transition; persisted as :TRANSITIONS_TO."""

    RELATIONSHIP_TYPE: ClassVar[str] = "TRANSITIONS_TO"

    edge_id: str
    parent_id: str
    child_id: str
    element_index: int
    bbox: list[int]
    confidence: float
    action: EdgeAction | None
    network_logs: list[NetworkLog] = field(default_factory=list)
    network_logs_raw_count: int = 0
    created_at: str = ""
    # DOM-based interaction metadata
    selector: str | None = None
    element_tag: str | None = None
    element_text: str | None = None
    element_type: str | None = None
    href: str | None = None
    action_kind: str = "click"  # "click" | "form_submit"
    form_values: str | None = None  # JSON map of field label -> submitted value
    detection_source: str = "dom"  # "dom" | "vision"

    @property
    def network_logs_count(self) -> int:
        return len(self.network_logs)

    def to_properties(self) -> dict[str, Any]:
        props: dict[str, Any] = {
            "edge_id": self.edge_id,
            "parent_id": self.parent_id,
            "element_index": self.element_index,
            "bbox": list(self.bbox),
            "confidence": float(self.confidence),
            "network_logs_raw_count": int(self.network_logs_raw_count),
            "network_logs_count": self.network_logs_count,
            "created_at": self.created_at,
            "selector": self.selector,
            "element_tag": self.element_tag,
            "element_text": self.element_text,
            "element_type": self.element_type,
            "href": self.href,
            "action_kind": self.action_kind,
            "form_values": self.form_values,
            "detection_source": self.detection_source,
        }
        if self.action is not None:
            props.update(self.action.to_flat_properties())
        return _drop_none(props)

    def log_properties(self) -> list[dict[str, Any]]:
        """Rows for UNWIND: parent_id + NetworkLog props (no nulls)."""
        return [
            {
                "parent_id": self.parent_id,
                "props": log.to_properties(edge_id=self.edge_id),
            }
            for log in self.network_logs
        ]


@dataclass
class StateNode:
    node_id: str
    node_description: str
    state_hash: str
    depth: int
    screenshot_uri: str
    overlay_uri: str
    created_at: str
    # Set when replay-based backtracking could not reproduce this state.
    unstable: bool | None = None

    def to_properties(self) -> dict[str, Any]:
        return _drop_none(
            {
                "node_id": self.node_id,
                "node_description": self.node_description,
                "state_hash": self.state_hash,
                "depth": int(self.depth),
                "screenshot_uri": self.screenshot_uri,
                "overlay_uri": self.overlay_uri,
                "created_at": self.created_at,
                "unstable": self.unstable,
            }
        )


@dataclass
class CrawlRun:
    graph_name: str
    run_id: str
    graph_key: str
    base_url: str
    recursive_limit: int
    started_at: str
    finished_at: str | None = None
    cycles_detected: int = 0
    max_depth_traversed: int = 0
    min_depth_traversed: int = 0
    total_nodes: int = 0
    total_edges: int = 0
    leaf_nodes: int = 0

    def to_properties(self) -> dict[str, Any]:
        return _drop_none(
            {
                "graph_name": self.graph_name,
                "run_id": self.run_id,
                "graph_key": self.graph_key,
                "base_url": self.base_url,
                "recursive_limit": int(self.recursive_limit),
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                "cycles_detected": int(self.cycles_detected),
                "max_depth_traversed": int(self.max_depth_traversed),
                "min_depth_traversed": int(self.min_depth_traversed),
                "total_nodes": int(self.total_nodes),
                "total_edges": int(self.total_edges),
                "leaf_nodes": int(self.leaf_nodes),
            }
        )
