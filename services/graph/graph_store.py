"""Read and list persisted graph JSON files."""

from __future__ import annotations

import json
import os
from typing import Any

from services.config import GRAPH_FILE_PREFIX
from services.graph.DOM_index_service.dom_parser import TEMPDB_DIR
from services.graph.exceptions import GraphNotFoundError


def _graph_id_from_filename(filename: str) -> int | None:
    if not filename.startswith(GRAPH_FILE_PREFIX) or not filename.endswith(".json"):
        return None
    count_part = filename[len(GRAPH_FILE_PREFIX) : -len(".json")]
    return int(count_part) if count_part.isdigit() else None


def list_graphs(tempdb_dir: str = TEMPDB_DIR) -> list[dict[str, Any]]:
    """Return metadata for all persisted graphs, sorted by id."""
    if not os.path.isdir(tempdb_dir):
        return []

    graphs: list[dict[str, Any]] = []
    for filename in os.listdir(tempdb_dir):
        graph_id = _graph_id_from_filename(filename)
        if graph_id is None:
            continue
        path = os.path.join(tempdb_dir, filename)
        graphs.append(
            {
                "id": graph_id,
                "filename": filename,
                "path": path,
                "node_count": _count_nodes(path),
            }
        )
    graphs.sort(key=lambda item: item["id"])
    return graphs


def _count_nodes(path: str) -> int:
    with open(path, encoding="utf-8") as graph_file:
        data = json.load(graph_file)
    return len(data) if isinstance(data, list) else 0


def load_graph(graph_id: int, tempdb_dir: str = TEMPDB_DIR) -> list[dict[str, Any]]:
    """Load a graph by numeric id."""
    filename = f"{GRAPH_FILE_PREFIX}{graph_id}.json"
    path = os.path.join(tempdb_dir, filename)
    if not os.path.isfile(path):
        raise GraphNotFoundError(f"Graph {graph_id} not found at {path}")

    with open(path, encoding="utf-8") as graph_file:
        data = json.load(graph_file)
    if not isinstance(data, list):
        raise GraphNotFoundError(f"Graph {graph_id} has invalid format")
    return data


def detect_cycles(nodes: list[dict[str, Any]]) -> list[list[str]]:
    """Detect directed cycles in a persisted graph by node_id adjacency."""
    node_ids = {node["node_id"] for node in nodes}
    adjacency = {
        node["node_id"]: [child for child in node.get("child_nodes", []) if child in node_ids]
        for node in nodes
    }

    cycles: list[list[str]] = []
    visited: set[str] = set()
    stack: set[str] = set()
    path: list[str] = []

    def dfs(node_id: str) -> None:
        if node_id in stack:
            cycle_start = path.index(node_id)
            cycle = path[cycle_start:] + [node_id]
            if cycle not in cycles:
                cycles.append(cycle)
            return
        if node_id in visited:
            return

        visited.add(node_id)
        stack.add(node_id)
        path.append(node_id)

        for child_id in adjacency.get(node_id, []):
            dfs(child_id)

        path.pop()
        stack.remove(node_id)

    for node in nodes:
        dfs(node["node_id"])

    return cycles
