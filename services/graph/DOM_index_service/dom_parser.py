from __future__ import annotations

import base64
import json
import os
import tempfile
from typing import Any, Dict, List, Sequence, Tuple

from services.config import GRAPH_FILE_PREFIX, RECURSIVE_LIMIT
from services.graph.utils.playwright_utils import PlaywrightUtils, Point
from services.graph.vision import YOLODetector

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

    def parse(self, base_url: str) -> str:
        self.nodes = []
        self._node_counter = 0
        self._temp_dir = tempfile.TemporaryDirectory(prefix="dom_parser_")

        try:
            self.pw.start()
            self.pw.open_url(base_url)
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
    def _encode_screenshot(path: str) -> str:
        with open(path, "rb") as screenshot_file:
            return base64.b64encode(screenshot_file.read()).decode("ascii")

    def _build_node(self, depth: int, source: str) -> str:
        node_id = self._next_id()
        screenshot_path = self._screenshot_path(node_id)
        overlay_path = self._screenshot_path(node_id, overlay=True)
        self.pw.take_screenshot(screenshot_path)

        predictions = self.detector.predict_with_log(
            screenshot_path,
            output_path=overlay_path,
        )

        node: Dict[str, Any] = {
            "node_id": node_id,
            "node_description": f"depth {depth} state via {source}",
            "state_screenshot": self._encode_screenshot(screenshot_path),
            "state_screenshot_with_bounding_boxes": self._encode_screenshot(overlay_path),
            "child_nodes": [],
        }
        self.nodes.append(node)

        if depth >= self.recursive_limit:
            return node_id

        for index, prediction in enumerate(predictions):
            corners = self._bbox_to_corners(prediction["bounding_box_coordinates"])
            self.pw.click_at_coordinates(corners)
            child_id = self._build_node(
                depth=depth + 1,
                source=f"{node_id} element {index + 1}",
            )
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
