"""Orchestrates graph parsing and retrieval."""

from __future__ import annotations

from typing import Any

from services.graph.DOM_index_service.dom_parser import DOMParser
from services.graph.exceptions import GraphNotFoundError, GraphParseError
from services.graph.graph_store import detect_cycles, list_graphs, load_graph


class GraphService:
    def parse_url(self, url: str, *, recursive_limit: int | None = None) -> dict[str, Any]:
        parser_kwargs: dict[str, Any] = {}
        if recursive_limit is not None:
            parser_kwargs["recursive_limit"] = recursive_limit

        parser = DOMParser(**parser_kwargs)
        try:
            output_path = parser.parse(url)
        except Exception as exc:
            raise GraphParseError(str(exc)) from exc

        graph_id = parser.last_graph_id
        if graph_id is None:
            raise GraphParseError("Graph was saved but id could not be determined")

        end_states = sum(1 for node in parser.nodes if node.get("is_end_state"))
        return {
            "graph_id": graph_id,
            "output_path": output_path,
            "node_count": len(parser.nodes),
            "cycles_detected": parser.cycles_detected,
            "end_states": end_states,
        }

    def list_graphs(self) -> list[dict[str, Any]]:
        return [
            {"id": item["id"], "filename": item["filename"], "node_count": item["node_count"]}
            for item in list_graphs()
        ]

    def get_graph(self, graph_id: int) -> dict[str, Any]:
        try:
            nodes = load_graph(graph_id)
        except GraphNotFoundError:
            raise
        except OSError as exc:
            raise GraphNotFoundError(str(exc)) from exc

        return {
            "id": graph_id,
            "nodes": nodes,
            "cycles": detect_cycles(nodes),
        }
