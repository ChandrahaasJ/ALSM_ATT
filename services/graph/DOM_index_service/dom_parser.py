from __future__ import annotations

import logging
import os
import tempfile
from datetime import datetime, timezone
from typing import Dict, List, Sequence, Tuple
from uuid import uuid4

from services.config import Config
from services.graph.utils.falkor_utils import build_graph_key, preflight
from services.graph.db.graph_models import CrawlRun, StateNode, StateTransition
from services.graph.db.graph_repository import GraphRepository
from services.graph.edge_semantics import build_edge_metadata
from services.graph.utils.playwright_utils import PlaywrightUtils
from services.graph.vision import YOLODetector
from services.storage.s3_service import ScreenshotStore, sha256_of

PointTuple = Tuple[float, float]

_GRAPH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPDB_DIR = os.path.join(_GRAPH_DIR, "temp_db")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DOMParser:
    """Build a depth-limited UI state graph from a base URL and persist it to FalkorDB."""

    def __init__(
        self,
        playwright_utils: PlaywrightUtils | None = None,
        detector: YOLODetector | None = None,
        recursive_limit: int = Config.recursive_limit,
        tempdb_dir: str | None = None,
        screenshot_store: ScreenshotStore | None = None,
        repository: GraphRepository | None = None,
    ) -> None:
        self.pw = playwright_utils or PlaywrightUtils()
        self.detector = detector or YOLODetector()
        self.recursive_limit = recursive_limit
        self.tempdb_dir = tempdb_dir or TEMPDB_DIR
        self._screenshot_store = screenshot_store
        self._repository_override = repository
        self._repo: GraphRepository | None = None
        self._node_counter = 0
        self._temp_dir: tempfile.TemporaryDirectory[str] | None = None
        self._seen_state_hashes: set[str] = set()
        self._hash_to_node_id: Dict[str, str] = {}
        self._cycles_detected = 0
        self._depths_seen: List[int] = []
        self._total_edges = 0
        self._child_counts: Dict[str, int] = {}

    @property
    def screenshot_store(self) -> ScreenshotStore:
        if self._screenshot_store is None:
            self._screenshot_store = ScreenshotStore()
        return self._screenshot_store

    def parse(self, base_url: str, graph_name: str) -> str:
        """
        Crawl ``base_url`` and persist the UI state graph under a new FalkorDB key.

        ``graph_name`` is required. Returns the FalkorDB graph key
        ``{sanitized_name}_{uuid}``.
        """
        if not graph_name or not str(graph_name).strip():
            raise ValueError("graph_name is required")

        #check if the connection to the database is working
        preflight()
        #build the graph key
        logger.info("Building graph key for %s", graph_name)
        graph_key, sanitized_name, run_id = build_graph_key(graph_name)
        self._repo = self._repository_override or GraphRepository(graph_key)
        self._repo.ensure_schema()

        self._node_counter = 0
        self._seen_state_hashes = set()
        self._hash_to_node_id = {}
        self._cycles_detected = 0
        self._depths_seen = []
        self._total_edges = 0
        self._child_counts = {}
        self._temp_dir = tempfile.TemporaryDirectory(prefix="dom_parser_")
        os.makedirs(self.tempdb_dir, exist_ok=True)
        trace_path = os.path.join(self.tempdb_dir, f"trace_{uuid4().hex}.zip")
        started_at = datetime.now(timezone.utc).isoformat()

        try:
            logger.info("Starting parser for %s (graph_name=%s)", base_url, sanitized_name)
            logger.info("FalkorDB graph key: %s", graph_key)
            logger.info("Saving Playwright trace to %s", trace_path)

            crawl = CrawlRun(
                graph_name=sanitized_name,
                run_id=run_id,
                graph_key=graph_key,
                base_url=base_url,
                recursive_limit=self.recursive_limit,
                started_at=started_at,
            )
            self._repo.create_crawl(crawl)

            self.pw.start(trace_path=trace_path)
            logger.info("Opened browser")
            self.pw.open_url(base_url)

            root_id = self._build_node(depth=1, source="root")
            self._repo.link_root(root_id)

            report = self._build_report()
            report["finished_at"] = datetime.now(timezone.utc).isoformat()
            self._repo.finalize_crawl(report)

            logger.info(
                "Crawl complete: key=%s cycles=%s nodes=%s edges=%s leaves=%s",
                graph_key,
                report["cycles_detected"],
                report["total_nodes"],
                report["total_edges"],
                report["leaf_nodes"],
            )
            return graph_key
        finally:
            if self._temp_dir is not None:
                self._temp_dir.cleanup()
                self._temp_dir = None
            self.pw.close()
            self._repo = None

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

    def _build_report(self) -> dict:
        total_nodes = self._node_counter
        leaf_nodes = sum(
            1
            for node_id in (f"node_{i}" for i in range(1, total_nodes + 1))
            if self._child_counts.get(node_id, 0) == 0
        )
        return {
            "cycles_detected": self._cycles_detected,
            "max_depth_traversed": max(self._depths_seen) if self._depths_seen else 0,
            "min_depth_traversed": min(self._depths_seen) if self._depths_seen else 0,
            "total_nodes": total_nodes,
            "total_edges": self._total_edges,
            "leaf_nodes": leaf_nodes,
        }

    def _probe_screenshot_path(self) -> str:
        if self._temp_dir is None:
            raise RuntimeError("Temporary directory is not initialized")
        return os.path.join(self._temp_dir.name, f"probe_{self._node_counter + 1}.png")

    def _build_node(self, depth: int, source: str) -> str:
        if self._repo is None:
            raise RuntimeError("GraphRepository is not initialized")

        logger.info("Building node at depth %s from %s", depth, source)
        probe_path = self._probe_screenshot_path()
        logger.info("Taking screenshot at %s", probe_path)
        self.pw.take_screenshot(probe_path)

        state_hash = sha256_of(probe_path)
        logger.info("State hash: %s", state_hash)
        if state_hash in self._seen_state_hashes:
            logger.info("Cycle detected for state hash %s", state_hash)
            self._cycles_detected += 1
            logger.info("%s cycles detected", self._cycles_detected)
            return self._hash_to_node_id[state_hash]

        node_id = self._next_id()
        logger.info("Created a new Node with ID: %s", node_id)
        screenshot_path = self._screenshot_path(node_id)
        os.replace(probe_path, screenshot_path)

        self._seen_state_hashes.add(state_hash)
        self._hash_to_node_id[state_hash] = node_id
        self._depths_seen.append(depth)
        self._child_counts[node_id] = 0

        overlay_path = self._screenshot_path(node_id, overlay=True)
        predictions = self.detector.predict_with_log(
            screenshot_path,
            output_path=overlay_path,
        )

        screenshot_uri = self.screenshot_store.upload(
            screenshot_path,
            content_type="image/png",
        )
        overlay_uri = self.screenshot_store.upload(
            overlay_path,
            content_type="image/jpeg",
        )

        state = StateNode(
            node_id=node_id,
            node_description=f"depth {depth} state via {source}",
            state_hash=state_hash,
            depth=depth,
            screenshot_uri=screenshot_uri,
            overlay_uri=overlay_uri,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self._repo.merge_state(state)
        logger.info("Persisted state %s to FalkorDB", node_id)

        # if depth >= self.recursive_limit:
        #     return node_id

        pending_transitions: list[StateTransition] = []
        for index, prediction in enumerate(predictions):
            corners = self._bbox_to_corners(prediction["bounding_box_coordinates"])
            raw_logs = self.pw.click_and_capture_network(corners)

            child_id = self._build_node(
                depth=depth + 1,
                source=f"{node_id} element {index + 1}",
            )

            transition = build_edge_metadata(
                parent_id=node_id,
                child_id=child_id,
                click_index=index + 1,
                bbox=list(prediction["bounding_box_coordinates"]),
                confidence=float(prediction.get("confidence", 0.0)),
                raw_network_logs=raw_logs,
            )
            pending_transitions.append(transition)
            self._child_counts[node_id] = self._child_counts.get(node_id, 0) + 1

            self.pw.go_back()

        if pending_transitions:
            self._repo.add_transitions(pending_transitions)
            self._repo.add_network_logs(pending_transitions)
            self._total_edges += len(pending_transitions)
            logger.info(
                "Flushed %s transitions from %s",
                len(pending_transitions),
                node_id,
            )

        return node_id


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        raise SystemExit(
            "Usage: uv run python -m services.graph.DOM_index_service.dom_parser "
            "<url> <graph_name>"
        )

    parser = DOMParser()
    key = parser.parse(sys.argv[1], graph_name=sys.argv[2])
    from services.graph.db.graph_repository import GraphRepository

    report = GraphRepository(key).crawl_report() or {}
    print(f"Graph key: {key}")
    print(
        "Report: "
        f"cycles={report.get('cycles_detected')}, "
        f"depth={report.get('min_depth_traversed')}-{report.get('max_depth_traversed')}, "
        f"nodes={report.get('total_nodes')}, "
        f"edges={report.get('total_edges')}, "
        f"leaves={report.get('leaf_nodes')}"
    )
