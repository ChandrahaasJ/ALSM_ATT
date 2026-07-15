from __future__ import annotations

import base64
import json
import logging
import os
import tempfile
from typing import Any, Dict, List, Sequence, Tuple

from services.config import (
    DEDUP_BBOX_OVERLAP_THRESHOLD,
    GRAPH_FILE_PREFIX,
    MIN_PREDICTION_CONFIDENCE,
    RECURSIVE_LIMIT,
    USE_SCREENSHOT_IN_FINGERPRINT,
)
from services.graph.exceptions import NavigationError
from services.graph.state_fingerprint import build_state_signature
from services.graph.utils.playwright_utils import PlaywrightUtils
from services.graph.vision import YOLODetector

PointTuple = Tuple[float, float]

_GRAPH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPDB_DIR = os.path.join(_GRAPH_DIR, "temp_db")

logger = logging.getLogger(__name__)


class DOMParser:
    """Build a UI state graph from a base URL with cycle and end-state detection."""

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
        self._visited_signatures: Dict[str, str] = {}
        self.cycles_detected = 0
        self.last_graph_id: int | None = None

    def parse(self, base_url: str) -> str:
        self.nodes = []
        self._node_counter = 0
        self._visited_signatures = {}
        self.cycles_detected = 0
        self.last_graph_id = None
        self._temp_dir = tempfile.TemporaryDirectory(prefix="dom_parser_")

        try:
            self.pw.start()
            try:
                self.pw.open_url(base_url)
            except Exception as exc:
                raise NavigationError(f"Failed to open URL {base_url}: {exc}") from exc
            self._build_node(depth=1, source="root")
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
    def _bbox_area(bbox: Sequence[int]) -> float:
        x1, y1, x2, y2 = bbox
        return max(0.0, float(x2 - x1)) * max(0.0, float(y2 - y1))

    @classmethod
    def _bbox_overlap_ratio(cls, left: Sequence[int], right: Sequence[int]) -> float:
        lx1, ly1, lx2, ly2 = left
        rx1, ry1, rx2, ry2 = right
        overlap_x = max(0.0, min(lx2, rx2) - max(lx1, rx1))
        overlap_y = max(0.0, min(ly2, ry2) - max(ly1, ry1))
        overlap_area = overlap_x * overlap_y
        smaller_area = min(cls._bbox_area(left), cls._bbox_area(right))
        if smaller_area <= 0:
            return 0.0
        return overlap_area / smaller_area

    def _deduplicate_predictions(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        filtered = [
            prediction
            for prediction in predictions
            if prediction.get("confidence", 0.0) >= MIN_PREDICTION_CONFIDENCE
        ]
        unique: List[Dict[str, Any]] = []
        for prediction in filtered:
            bbox = prediction["bounding_box_coordinates"]
            if any(
                self._bbox_overlap_ratio(bbox, existing["bounding_box_coordinates"])
                >= DEDUP_BBOX_OVERLAP_THRESHOLD
                for existing in unique
            ):
                continue
            unique.append(prediction)
        return unique

    @staticmethod
    def _encode_screenshot(path: str) -> str:
        with open(path, "rb") as screenshot_file:
            return base64.b64encode(screenshot_file.read()).decode("ascii")

    def _current_signature(self, screenshot_path: str) -> str:
        url, title = self.pw.capture_state_snapshot()
        screenshot_for_hash = screenshot_path if USE_SCREENSHOT_IN_FINGERPRINT else None
        return build_state_signature(url, title, screenshot_path=screenshot_for_hash)

    def _register_or_resolve_cycle(self, signature: str, node_id: str) -> str | None:
        """Return an existing node_id when the signature was already visited."""
        existing_id = self._visited_signatures.get(signature)
        if existing_id is not None:
            self.cycles_detected += 1
            logger.info("Cycle detected: %s matches existing %s", node_id, existing_id)
            for node in self.nodes:
                if node["node_id"] == existing_id:
                    node["is_cycle_reference"] = True
                    break
            return existing_id
        self._visited_signatures[signature] = node_id
        return None

    def _build_node(self, depth: int, source: str) -> str:
        node_id = self._next_id()
        screenshot_path = self._screenshot_path(node_id)
        overlay_path = self._screenshot_path(node_id, overlay=True)
        self.pw.take_screenshot(screenshot_path)

        signature = self._current_signature(screenshot_path)
        existing_id = self._register_or_resolve_cycle(signature, node_id)
        if existing_id is not None:
            return existing_id

        predictions = self.detector.predict_with_log(
            screenshot_path,
            output_path=overlay_path,
        )
        deduped_predictions = self._deduplicate_predictions(predictions)
        is_end_state = len(deduped_predictions) == 0

        node: Dict[str, Any] = {
            "node_id": node_id,
            "node_description": f"depth {depth} state via {source}",
            "state_signature": signature,
            "state_url": self.pw.get_current_url(),
            "state_title": self.pw.get_page_title(),
            "state_screenshot": self._encode_screenshot(screenshot_path),
            "state_screenshot_with_bounding_boxes": self._encode_screenshot(overlay_path),
            "child_nodes": [],
            "is_end_state": is_end_state,
            "is_cycle_reference": False,
        }
        self.nodes.append(node)

        if is_end_state or depth >= self.recursive_limit:
            return node_id

        for index, prediction in enumerate(deduped_predictions):
            before_url, before_title = self.pw.capture_state_snapshot()
            corners = self._bbox_to_corners(prediction["bounding_box_coordinates"])
            clicked = self.pw.click_at_coordinates(corners)
            if not clicked:
                continue

            after_url, after_title = self.pw.capture_state_snapshot()
            if after_url == before_url and after_title == before_title:
                logger.info("No navigation change after clicking %s element %d", node_id, index + 1)
                continue

            child_id = self._build_node(
                depth=depth + 1,
                source=f"{node_id} element {index + 1}",
            )

            if child_id != node_id and child_id not in node["child_nodes"]:
                node["child_nodes"].append(child_id)

            if not self.pw.go_back():
                logger.warning("Could not go back after exploring %s; stopping sibling exploration", node_id)
                break

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
        self.last_graph_id = graph_count
        output_path = os.path.join(
            self.tempdb_dir,
            f"{GRAPH_FILE_PREFIX}{graph_count}.json",
        )
        os.makedirs(self.tempdb_dir, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as graph_file:
            json.dump(self.nodes, graph_file, indent=2)
        return output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        raise SystemExit("Usage: uv run python -m services.graph.DOM_index_service.dom_parser <url>")

    parser = DOMParser()
    output = parser.parse(sys.argv[1])
    print(f"Graph saved to: {output}")
    print(f"Nodes: {len(parser.nodes)}, cycles detected: {parser.cycles_detected}")
