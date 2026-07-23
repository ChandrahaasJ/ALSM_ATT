from __future__ import annotations

import base64
import hashlib
import json
import os
from platform import node
from platform import node
import tempfile
from typing import Any, Dict, List, Sequence, Tuple

from services.config import GRAPH_FILE_PREFIX, RECURSIVE_LIMIT
from services.graph.utils.playwright_utils import NetworkLogEntry, PlaywrightUtils, Point
from services.graph.vision import YOLODetector
from services.graph.edge_semantics import build_edge_metadata

PointTuple = Tuple[float, float]

_GRAPH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPDB_DIR = os.path.join(_GRAPH_DIR, "temp_db")


class DOMParser:
    """Build a depth-limited UI state graph from a base URL."""

    def __init__(
        self,
        playwright_utils: PlaywrightUtils | None = None,
        detector: YOLODetector | None = None,
        recursive_limit: int = RECURSIVE_LIMIT,
        tempdb_dir: str | None = None,
    ) -> None:
        self.pw = playwright_utils or PlaywrightUtils()
        self.detector = detector or YOLODetector()
        self.recursive_limit = recursive_limit
        self.tempdb_dir = tempdb_dir or TEMPDB_DIR
        self.nodes: List[Dict[str, Any]] = []
        self._node_counter = 0
        self._temp_dir: tempfile.TemporaryDirectory[str] | None = None
        self._seen_state_hashes: set[str] = set()
        self._hash_to_node_id: Dict[str, str] = {}
        self._cycles_detected = 0
        self._depths_seen: List[int] = []

    def parse(self, base_url: str) -> str:
        self.nodes = []
        self._node_counter = 0
        self._seen_state_hashes = set()
        self._hash_to_node_id = {}
        self._cycles_detected = 0
        self._depths_seen = []
        self._temp_dir = tempfile.TemporaryDirectory(prefix="dom_parser_")

        try:
            self.pw.start()
            self.pw.open_url(base_url)
            self._build_node(
                depth=1,
                source="root",
                network_logs=[],
                edge_action=None,
                edge_click=None,
                network_logs_raw_count=0,
            )
            return self._save_graph()
        finally:
            if self._temp_dir is not None:
                self._temp_dir.cleanup()
                self._temp_dir = None
            self.pw.close()

    def _next_id(self) -> str:
        self._node_counter += 1
        return f"node_{self._node_counter}"

    def _screenshot_path(self, node_id: str, *, overlay: bool = False) -> str:
        if self._temp_dir is None:
            raise RuntimeError("Temporary directory is not initialized")
        filename = f"{node_id}_overlay.jpg" if overlay else f"{node_id}.png"
        return os.path.join(self._temp_dir.name, filename)

    @staticmethod
    def _bbox_to_corners(bbox: Sequence[int]) -> List[PointTuple]:
        x1, y1, x2, y2 = bbox
        return [
            (float(x1), float(y1)),
            (float(x1), float(y2)),
            (float(x2), float(y1)),
            (float(x2), float(y2)),
        ]

    @staticmethod
    def _encode_screenshot(path: str) -> str:
        with open(path, "rb") as screenshot_file:
            return base64.b64encode(screenshot_file.read()).decode("ascii")

    @staticmethod
    def _compute_state_hash(screenshot_path: str) -> tuple[str, str]:
        b64 = DOMParser._encode_screenshot(screenshot_path)
        state_hash = hashlib.sha256(b64.encode("ascii")).hexdigest()
        return b64, state_hash

    def _build_report(self) -> Dict[str, Any]:
        total_edges = sum(len(node["child_nodes"]) for node in self.nodes)
        leaf_nodes = sum(1 for node in self.nodes if not node["child_nodes"])
        return {
            "cycles_detected": self._cycles_detected,
            "max_depth_traversed": max(self._depths_seen) if self._depths_seen else 0,
            "min_depth_traversed": min(self._depths_seen) if self._depths_seen else 0,
            "total_nodes": len(self.nodes),
            "total_edges": total_edges,
            "leaf_nodes": leaf_nodes,
        }

    def _probe_screenshot_path(self) -> str:
        if self._temp_dir is None:
            raise RuntimeError("Temporary directory is not initialized")
        return os.path.join(self._temp_dir.name, f"probe_{self._node_counter + 1}.png")

    def _build_node(
        self,
        depth: int,
        source: str,
        network_logs: List[NetworkLogEntry],
        edge_action: dict[str, Any] | None = None,
        edge_click: dict[str, Any] | None = None,
        network_logs_raw_count: int = 0,
    ) -> str:
        probe_path = self._probe_screenshot_path()
        self.pw.take_screenshot(probe_path)

        b64_screenshot, state_hash = self._compute_state_hash(probe_path)
        if state_hash in self._seen_state_hashes:
            self._cycles_detected += 1
            return self._hash_to_node_id[state_hash]

        node_id = self._next_id()
        screenshot_path = self._screenshot_path(node_id)
        os.replace(probe_path, screenshot_path)

        self._seen_state_hashes.add(state_hash)
        self._hash_to_node_id[state_hash] = node_id
        self._depths_seen.append(depth)

        overlay_path = self._screenshot_path(node_id, overlay=True)
        predictions = self.detector.predict_with_log(
            screenshot_path,
            output_path=overlay_path,
        )

        node: Dict[str, Any] = {
            "node_id": node_id,
            "node_description": f"depth {depth} state via {source}",
            "state_screenshot": b64_screenshot,
            "state_screenshot_with_bounding_boxes": self._encode_screenshot(overlay_path),
            "state_hash": state_hash,
            "network_logs": network_logs,
            "network_logs_raw_count": network_logs_raw_count,
            "edge_action": edge_action,
            "edge_click": edge_click,
            "child_nodes": [],
        }
        self.nodes.append(node)

        if depth >= self.recursive_limit:
            return node_id

        for index, prediction in enumerate(predictions):
            corners = self._bbox_to_corners(prediction["bounding_box_coordinates"])
            raw_logs = self.pw.click_and_capture_network(corners)

            edge_meta = build_edge_metadata(
                parent_id=node_id,
                click_index=index + 1,
                bbox=list(prediction["bounding_box_coordinates"]),
                confidence=float(prediction.get("confidence", 0.0)),
                raw_network_logs=raw_logs,
            )

            child_id = self._build_node(
                depth=depth + 1,
                source=f"{node_id} element {index + 1}",
                network_logs=edge_meta["network_logs"],
                edge_action=edge_meta["edge_action"],
                edge_click=edge_meta["edge_click"],
                network_logs_raw_count=edge_meta["network_logs_raw_count"],
            )

            if child_id not in node["child_nodes"]:
                node["child_nodes"].append(child_id)

            self.pw.go_back()

        return node_id

    def _next_graph_count(self) -> int:
        os.makedirs(self.tempdb_dir, exist_ok=True)
        highest = 0
        for filename in os.listdir(self.tempdb_dir):
            if not filename.startswith(GRAPH_FILE_PREFIX) or not filename.endswith(".json"):
                continue
            count_part = filename[len(GRAPH_FILE_PREFIX) : -len(".json")]
            if count_part.isdigit():
                highest = max(highest, int(count_part))
        return highest + 1

    def _save_graph(self) -> str:
        graph_count = self._next_graph_count()
        output_path = os.path.join(
            self.tempdb_dir,
            f"{GRAPH_FILE_PREFIX}{graph_count}.json",
        )
        os.makedirs(self.tempdb_dir, exist_ok=True)
        payload = {
            "nodes": self.nodes,
            "report": self._build_report(),
        }
        with open(output_path, "w", encoding="utf-8") as graph_file:
            json.dump(payload, graph_file, indent=2)
        return output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        raise SystemExit("Usage: uv run python -m services.graph.DOM_index_service.dom_parser <url>")

    parser = DOMParser()
    output = parser.parse(sys.argv[1])
    with open(output, encoding="utf-8") as graph_file:
        report = json.load(graph_file)["report"]
    print(f"Graph saved to: {output}")
    print(
        "Report: "
        f"cycles={report['cycles_detected']}, "
        f"depth={report['min_depth_traversed']}-{report['max_depth_traversed']}, "
        f"nodes={report['total_nodes']}, "
        f"edges={report['total_edges']}, "
        f"leaves={report['leaf_nodes']}"
    )
