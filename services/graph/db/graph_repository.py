from __future__ import annotations

import logging
from typing import Any

from services.graph.db.falkor_client import FalkorDBClient
from services.graph.db.graph_models import CrawlRun, StateNode, StateTransition

logger = logging.getLogger(__name__)


def _node_props(node: Any) -> dict[str, Any]:
    """Extract a plain property dict from a FalkorDB Node or mapping."""
    if node is None:
        return {}
    if isinstance(node, dict):
        return dict(node)
    props = getattr(node, "properties", None)
    if isinstance(props, dict):
        return dict(props)
    return {}


def _rel_props(rel: Any) -> dict[str, Any]:
    if rel is None:
        return {}
    if isinstance(rel, dict):
        return dict(rel)
    props = getattr(rel, "properties", None)
    if isinstance(props, dict):
        return dict(props)
    return {}


class GraphRepository:
    """Parameterized Cypher access for one FalkorDB graph key."""

    def __init__(self, graph_key: str) -> None:
        if not graph_key:
            raise ValueError("graph_key is required")
        self.graph_key = graph_key
        self._client = FalkorDBClient.get()
        self.graph = self._client.select_graph(graph_key)

    def ensure_schema(self) -> None:
        from services.graph.utils.falkor_utils import ensure_schema

        ensure_schema(self.graph)

    def create_crawl(self, crawl: CrawlRun) -> None:
        self.graph.query(
            "CREATE (c:Crawl) SET c = $props",
            {"props": crawl.to_properties()},
        )

    def link_root(self, root_node_id: str) -> None:
        self.graph.query(
            """
            MATCH (c:Crawl {graph_key: $graph_key})
            MATCH (s:State {node_id: $node_id})
            CREATE (c)-[:ROOT]->(s)
            """,
            {"graph_key": self.graph_key, "node_id": root_node_id},
        )

    def merge_state(self, state: StateNode) -> None:
        props = state.to_properties()
        self.graph.query(
            """
            MERGE (s:State {node_id: $node_id})
            SET s = $props
            """,
            {"node_id": state.node_id, "props": props},
        )

    def add_transitions(self, transitions: list[StateTransition]) -> None:
        if not transitions:
            return
        rows = [
            {
                "parent_id": t.parent_id,
                "child_id": t.child_id,
                "props": t.to_properties(),
            }
            for t in transitions
        ]
        self.graph.query(
            """
            UNWIND $rows AS row
            MATCH (parent:State {node_id: row.parent_id})
            MATCH (child:State {node_id: row.child_id})
            CREATE (parent)-[t:TRANSITIONS_TO]->(child)
            SET t = row.props
            """,
            {"rows": rows},
        )

    def add_network_logs(self, transitions: list[StateTransition]) -> None:
        logs: list[dict[str, Any]] = []
        for transition in transitions:
            logs.extend(transition.log_properties())
        if not logs:
            return
        self.graph.query(
            """
            UNWIND $logs AS log
            MATCH (s:State {node_id: log.parent_id})
            CREATE (s)-[:CAPTURED {edge_id: log.props.edge_id}]->(n:NetworkLog)
            SET n = log.props
            """,
            {"logs": logs},
        )

    def finalize_crawl(self, report: dict[str, Any]) -> None:
        self.graph.query(
            """
            MATCH (c:Crawl {graph_key: $graph_key})
            SET c.finished_at = $finished_at,
                c.cycles_detected = $cycles_detected,
                c.max_depth_traversed = $max_depth_traversed,
                c.min_depth_traversed = $min_depth_traversed,
                c.total_nodes = $total_nodes,
                c.total_edges = $total_edges,
                c.leaf_nodes = $leaf_nodes
            """,
            {
                "graph_key": self.graph_key,
                "finished_at": report.get("finished_at"),
                "cycles_detected": int(report.get("cycles_detected", 0)),
                "max_depth_traversed": int(report.get("max_depth_traversed", 0)),
                "min_depth_traversed": int(report.get("min_depth_traversed", 0)),
                "total_nodes": int(report.get("total_nodes", 0)),
                "total_edges": int(report.get("total_edges", 0)),
                "leaf_nodes": int(report.get("leaf_nodes", 0)),
            },
        )

    def crawl_report(self) -> dict[str, Any] | None:
        result = self.graph.ro_query(
            "MATCH (c:Crawl {graph_key: $graph_key}) RETURN c LIMIT 1",
            {"graph_key": self.graph_key},
        )
        if not result.result_set:
            return None
        return _node_props(result.result_set[0][0])

    def list_states(self) -> list[dict[str, Any]]:
        result = self.graph.ro_query(
            "MATCH (s:State) RETURN s ORDER BY s.node_id"
        )
        return [_node_props(row[0]) for row in result.result_set]

    def list_transitions(self) -> list[dict[str, Any]]:
        result = self.graph.ro_query(
            """
            MATCH (a:State)-[r:TRANSITIONS_TO]->(b:State)
            RETURN a.node_id AS from_id, b.node_id AS to_id, r
            ORDER BY a.node_id, r.element_index
            """
        )
        edges: list[dict[str, Any]] = []
        for from_id, to_id, rel in result.result_set:
            edge = _rel_props(rel)
            edge["from"] = from_id
            edge["to"] = to_id
            edges.append(edge)
        return edges

    def get_state(self, node_id: str) -> dict[str, Any] | None:
        result = self.graph.ro_query(
            "MATCH (s:State {node_id: $node_id}) RETURN s LIMIT 1",
            {"node_id": node_id},
        )
        if not result.result_set:
            return None
        return _node_props(result.result_set[0][0])

    def shortest_click_path(
        self,
        from_id: str,
        to_id: str,
    ) -> dict[str, list[dict[str, Any]]]:
        if from_id == to_id:
            state = self.get_state(from_id)
            return {"nodes": [state] if state else [], "edges": []}

        #executes a read-only query against the graph
        result = self.graph.ro_query(
            """
            MATCH (a:State {node_id: $from_id}), (b:State {node_id: $to_id})
            MATCH p = shortestPath((a)-[:TRANSITIONS_TO*]->(b))
            RETURN nodes(p) AS path_nodes, relationships(p) AS path_rels
            LIMIT 1
            """,
            {"from_id": from_id, "to_id": to_id},
        )
        if not result.result_set:
            return {"nodes": [], "edges": []}

        path_nodes, path_rels = result.result_set[0]
        nodes = [_node_props(n) for n in (path_nodes or [])]
        edges: list[dict[str, Any]] = []
        for index, rel in enumerate(path_rels or []):
            edge = _rel_props(rel)
            if index < len(nodes):
                edge["from"] = nodes[index].get("node_id")
            if index + 1 < len(nodes):
                edge["to"] = nodes[index + 1].get("node_id")
            edges.append(edge)
        return {"nodes": nodes, "edges": edges}

    def drop_graph(self) -> None:
        """Explicit destructive helper — never call implicitly."""
        logger.warning("Deleting FalkorDB graph key %s", self.graph_key)
        self.graph.delete()
