from __future__ import annotations

import itertools
import json
import logging
import os
import tempfile
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from services.config import Config
from services.graph.utils.falkor_utils import build_graph_key, preflight
from services.graph.db.graph_models import CrawlRun, StateNode, StateTransition
from services.graph.db.graph_repository import GraphRepository
from services.graph.edge_semantics import build_edge_metadata
from services.graph.DOM_index_service.state_memory import StateMemory
from services.graph.utils.playwright_utils import ActionRecord, PlaywrightUtils
from services.graph.vision import Overlays, YOLODetector
from services.storage.s3_service import ScreenshotStore, sha256_of

_GRAPH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPDB_DIR = os.path.join(_GRAPH_DIR, "temp_db")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DOMParser:
    """Build a depth-limited UI state graph from a base URL and persist it to FalkorDB.

    Interactive elements are detected from the live DOM and driven through
    replay-stable selectors. Backtracking between states uses ``StateMemory``
    (base-URL reload + action replay) instead of browser history. The ONNX
    vision detector remains available as an optional backup for pages where
    DOM detection finds nothing (e.g. canvas-rendered UIs).
    """

    def __init__(
        self,
        playwright_utils: PlaywrightUtils | None = None,
        detector: YOLODetector | None = None,
        recursive_limit: int = Config.recursive_limit,
        tempdb_dir: str | None = None,
        screenshot_store: ScreenshotStore | None = None,
        repository: GraphRepository | None = None,
        max_elements_per_state: int = Config.max_elements_per_state,
        same_origin_only: bool = Config.same_origin_only,
        vision_fallback: bool = Config.vision_fallback,
        max_form_combinations: int = Config.max_form_combinations,
    ) -> None:
        self.pw = playwright_utils or PlaywrightUtils()
        self.recursive_limit = recursive_limit
        self.max_elements_per_state = max_elements_per_state
        self.same_origin_only = same_origin_only
        self.vision_fallback = vision_fallback
        self.max_form_combinations = max_form_combinations
        self.tempdb_dir = tempdb_dir or TEMPDB_DIR
        self._overlays = Overlays()
        self._detector = detector
        self._detector_unavailable = False
        self._screenshot_store = screenshot_store
        self._repository_override = repository
        self._repo: GraphRepository | None = None
        self._memory: StateMemory | None = None
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

    @property
    def detector(self) -> YOLODetector | None:
        """Lazy ONNX detector; None when disabled or the model file is absent."""
        if not self.vision_fallback or self._detector_unavailable:
            return self._detector
        if self._detector is None:
            try:
                self._detector = YOLODetector()
            except Exception as exc:
                logger.info("Vision fallback unavailable (%s); DOM detection only", exc)
                self._detector_unavailable = True
        return self._detector

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
        self._memory = StateMemory(base_url)
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
            self.pw.settle()

            root_id = self._build_node(depth=1, source="root", action_path=[])
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
            self._memory = None

    def _next_id(self) -> str:
        self._node_counter += 1
        return f"node_{self._node_counter}"

    def _screenshot_path(self, node_id: str, *, overlay: bool = False) -> str:
        if self._temp_dir is None:
            raise RuntimeError("Temporary directory is not initialized")
        filename = f"{node_id}_overlay.jpg" if overlay else f"{node_id}.png"
        return os.path.join(self._temp_dir.name, filename)

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

    def _current_state_hash(self) -> str:
        """Screenshot the live page and return its SHA-256 (for replay checks)."""
        if self._temp_dir is None:
            raise RuntimeError("Temporary directory is not initialized")
        probe = os.path.join(self._temp_dir.name, "verify_probe.png")
        self.pw.take_screenshot(probe)
        digest = sha256_of(probe)
        os.remove(probe)
        return digest

    def _restore_state(self, node_id: str) -> bool:
        """Time-travel back to ``node_id`` via StateMemory replay."""
        if self._memory is None or self._repo is None:
            raise RuntimeError("Parser is not initialized")
        restored = self._memory.revert_to(node_id, self.pw, self._current_state_hash)
        if not restored:
            self._repo.set_state_unstable(node_id)
        return restored

    # ------------------------------------------------------------------
    # Detection
    # ------------------------------------------------------------------

    def _detect_interactions(self, screenshot_path: str) -> tuple[list[dict], list[dict], str]:
        """Return (elements, forms, detection_source) for the current page."""
        detection = self.pw.detect_page(
            same_origin_only=self.same_origin_only,
            deny_text_patterns=Config.deny_text_patterns,
            max_sibling_group=Config.max_sibling_group,
        )
        elements: list[dict] = detection["elements"]
        forms: list[dict] = detection["forms"]

        skipped = detection["skipped"]
        if skipped:
            reasons = Counter(item["reason"] for item in skipped)
            logger.info("Policy skipped %s candidates: %s", len(skipped), dict(reasons))
            for item in skipped:
                logger.debug(
                    "Skipped <%s> %r (%s): %s",
                    item.get("tag"),
                    (item.get("text") or "")[:40],
                    item.get("element_type"),
                    item.get("reason"),
                )

        if len(elements) > self.max_elements_per_state:
            logger.info(
                "Capping elements per state: %s -> %s",
                len(elements),
                self.max_elements_per_state,
            )
            elements = elements[: self.max_elements_per_state]

        if elements or forms:
            return elements, forms, "dom"

        detector = self.detector
        if detector is None:
            return [], [], "dom"

        logger.info("DOM detection found nothing; trying vision fallback")
        return self._vision_elements(detector, screenshot_path)

    def _vision_elements(
        self,
        detector: YOLODetector,
        screenshot: str,
    ) -> tuple[list[dict], list[dict], str]:
        """Backup path: detect elements with the ONNX model (coordinate clicks)."""
        predictions = detector.predict(screenshot)
        elements = [
            {
                "selector": None,
                "tag": None,
                "element_type": "vision_detection",
                "text": "",
                "href": None,
                "bbox": list(prediction["bounding_box_coordinates"]),
                "confidence": float(prediction.get("confidence", 0.0)),
            }
            for prediction in predictions
        ]
        return elements, [], "vision"

    # ------------------------------------------------------------------
    # Form handling
    # ------------------------------------------------------------------

    @staticmethod
    def _dummy_value(input_type: str, name: str) -> str:
        name_lower = (name or "").lower()
        if input_type == "email" or "email" in name_lower:
            return Config.form_dummy_email
        if input_type == "number":
            return Config.form_dummy_number
        if input_type == "tel" or "phone" in name_lower:
            return Config.form_dummy_phone
        if input_type in ("date", "datetime-local", "month", "week"):
            return Config.form_dummy_date
        return Config.form_dummy_text

    def _form_combinations(
        self,
        form: dict,
    ) -> list[tuple[list[ActionRecord], dict[str, str]]]:
        """
        Expand one detected form into per-combination action sequences.

        Text fields get dummy values from config; every dropdown/radio-group
        choice combination becomes its own fill-select-submit sequence, capped
        at ``max_form_combinations``.
        """
        fills: list[tuple[ActionRecord, str, str]] = []
        for field in form.get("text_fields", []):
            value = self._dummy_value(field.get("input_type", "text"), field.get("name", ""))
            label = field.get("label") or field.get("name") or field["selector"]
            fills.append(
                (
                    ActionRecord(
                        kind="fill",
                        selector=field["selector"],
                        value=value,
                        description=f"fill {label!r}",
                    ),
                    label,
                    value,
                )
            )

        checks: list[tuple[ActionRecord, str]] = []
        for checkbox in form.get("checkboxes", []):
            label = checkbox.get("label") or checkbox.get("name") or checkbox["selector"]
            checks.append(
                (
                    ActionRecord(
                        kind="check",
                        selector=checkbox["selector"],
                        description=f"check {label!r}",
                    ),
                    label,
                )
            )

        dimensions: list[list[tuple[ActionRecord, str, str]]] = []
        for select in form.get("selects", []):
            options = [
                option
                for option in select.get("options", [])
                if option.get("value") or option.get("label")
            ]
            if not options:
                continue
            label = select.get("label") or select.get("name") or select["selector"]
            dimensions.append(
                [
                    (
                        ActionRecord(
                            kind="select",
                            selector=select["selector"],
                            value=option["value"],
                            description=f"select {label!r} = {option.get('label') or option['value']!r}",
                        ),
                        label,
                        option.get("label") or option.get("value") or "",
                    )
                    for option in options
                ]
            )
        for group in form.get("radio_groups", []):
            choices = group.get("choices", [])
            if not choices:
                continue
            label = group.get("name") or "radio"
            dimensions.append(
                [
                    (
                        ActionRecord(
                            kind="check",
                            selector=choice["selector"],
                            description=f"choose {label!r} = {choice.get('label') or choice.get('value')!r}",
                        ),
                        label,
                        choice.get("label") or choice.get("value") or "",
                    )
                    for choice in choices
                ]
            )

        submit = form.get("submit")
        if not dimensions and not fills:
            return []
        if not dimensions and submit is None:
            # Text-only form with nothing to submit: no state change to record.
            return []

        combos = list(itertools.product(*dimensions)) if dimensions else [()]
        total = len(combos)
        if total > self.max_form_combinations:
            logger.warning(
                "Form %s: %s combinations exceed MAX_FORM_COMBINATIONS=%s; truncating",
                form.get("selector"),
                total,
                self.max_form_combinations,
            )
            combos = combos[: self.max_form_combinations]

        results: list[tuple[list[ActionRecord], dict[str, str]]] = []
        for combo in combos:
            records: list[ActionRecord] = [record for record, _, _ in fills]
            values: dict[str, str] = {label: value for _, label, value in fills}
            for record, label in checks:
                records.append(record)
                values[label] = "checked"
            for record, label, value in combo:
                records.append(record)
                values[label] = value
            if submit is not None:
                records.append(
                    ActionRecord(
                        kind="click",
                        selector=submit["selector"],
                        fallback_bbox=tuple(submit["bbox"]) if submit.get("bbox") else None,
                        description=f"submit {submit.get('text', '')!r}",
                    )
                )
            results.append((records, values))
        return results

    # ------------------------------------------------------------------
    # Interaction plan (generic clicks + form combinations)
    # ------------------------------------------------------------------

    def _plan_interactions(
        self,
        elements: list[dict],
        forms: list[dict],
        detection_source: str,
    ) -> list[dict[str, Any]]:
        interactions: list[dict[str, Any]] = []
        for element in elements:
            bbox = element.get("bbox") or [0, 0, 0, 0]
            record = ActionRecord(
                kind="click",
                selector=element.get("selector"),
                fallback_bbox=tuple(bbox),
                description=f"click <{element.get('tag')}> {element.get('text') or ''!r}",
            )
            interactions.append(
                {
                    "records": [record],
                    "bbox": [int(v) for v in bbox],
                    "confidence": float(element.get("confidence", 1.0)),
                    "meta": {
                        "selector": element.get("selector"),
                        "element_tag": element.get("tag"),
                        "element_text": element.get("text") or None,
                        "element_type": element.get("element_type"),
                        "href": element.get("href"),
                        "action_kind": "click",
                        "form_values": None,
                        "detection_source": detection_source,
                    },
                }
            )

        for form in forms:
            combinations = self._form_combinations(form)
            if combinations:
                logger.info(
                    "Form %s: driving %s combination(s)",
                    form.get("selector"),
                    len(combinations),
                )
            submit = form.get("submit") or {}
            for records, values in combinations:
                interactions.append(
                    {
                        "records": records,
                        "bbox": [int(v) for v in (submit.get("bbox") or [0, 0, 0, 0])],
                        "confidence": 1.0,
                        "meta": {
                            "selector": form.get("selector"),
                            "element_tag": "form",
                            "element_text": submit.get("text") or None,
                            "element_type": "form",
                            "href": None,
                            "action_kind": "form_submit",
                            "form_values": json.dumps(values, ensure_ascii=False),
                            "detection_source": detection_source,
                        },
                    }
                )
        return interactions

    # ------------------------------------------------------------------
    # DFS over UI states
    # ------------------------------------------------------------------

    def _build_node(
        self,
        depth: int,
        source: str,
        action_path: list[ActionRecord],
    ) -> str:
        if self._repo is None or self._memory is None:
            raise RuntimeError("Parser is not initialized")

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
            os.remove(probe_path)
            return self._hash_to_node_id[state_hash]

        node_id = self._next_id()
        logger.info("Created a new Node with ID: %s", node_id)
        screenshot_path = self._screenshot_path(node_id)
        os.replace(probe_path, screenshot_path)

        self._seen_state_hashes.add(state_hash)
        self._hash_to_node_id[state_hash] = node_id
        self._depths_seen.append(depth)
        self._child_counts[node_id] = 0
        self._memory.remember(node_id, action_path, state_hash)

        elements, forms, detection_source = self._detect_interactions(screenshot_path)
        logger.info(
            "Detected %s element(s) and %s form(s) via %s",
            len(elements),
            len(forms),
            detection_source,
        )

        overlay_path = self._screenshot_path(node_id, overlay=True)
        overlay_predictions = [
            {
                "bounding_box_coordinates": element.get("bbox") or [0, 0, 0, 0],
                "confidence": float(element.get("confidence", 1.0)),
            }
            for element in elements
        ]
        self._overlays.save_predicted_image(
            screenshot_path,
            overlay_predictions,
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

        if depth >= self.recursive_limit:
            logger.info(
                "Depth %s reached recursive limit %s; not expanding %s",
                depth,
                self.recursive_limit,
                node_id,
            )
            return node_id

        interactions = self._plan_interactions(elements, forms, detection_source)

        pending_transitions: list[StateTransition] = []
        for index, interaction in enumerate(interactions):
            # We are already at this node's state right after arriving; every
            # later interaction first travels back via StateMemory replay.
            if index > 0 and not self._restore_state(node_id):
                logger.warning(
                    "Stopping expansion of %s: state could not be restored",
                    node_id,
                )
                break

            records: list[ActionRecord] = interaction["records"]
            logger.info(
                "Interaction %s/%s on %s: %s",
                index + 1,
                len(interactions),
                node_id,
                "; ".join(record.describe() for record in records),
            )
            try:
                raw_logs = self.pw.act_and_capture_network(records)
            except Exception:
                logger.warning(
                    "Interaction failed on %s; skipping element",
                    node_id,
                    exc_info=True,
                )
                continue

            child_id = self._build_node(
                depth=depth + 1,
                source=f"{node_id} interaction {index + 1}",
                action_path=action_path + records,
            )

            meta = interaction["meta"]
            transition = build_edge_metadata(
                parent_id=node_id,
                child_id=child_id,
                click_index=index + 1,
                bbox=interaction["bbox"],
                confidence=interaction["confidence"],
                raw_network_logs=raw_logs,
                **meta,
            )
            pending_transitions.append(transition)
            self._child_counts[node_id] = self._child_counts.get(node_id, 0) + 1

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
