from __future__ import annotations

import logging
import re
from typing import Any
from uuid import uuid4

from services.graph.db.falkor_client import FalkorDBClient

logger = logging.getLogger(__name__)

_NAME_SANITIZE_RE = re.compile(r"[^a-z0-9_]+")


def sanitize_graph_name(name: str) -> str:
    """Lowercase and reduce a display name to ``[a-z0-9_]``."""
    cleaned = name.strip().lower().replace("-", "_").replace(" ", "_")
    cleaned = _NAME_SANITIZE_RE.sub("_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if not cleaned:
        raise ValueError("graph_name must contain at least one alphanumeric character")
    return cleaned


def build_graph_key(name: str) -> tuple[str, str, str]:
    """
    Build ``(graph_key, graph_name, run_id)`` from a caller-supplied name.

    ``graph_key`` is ``{sanitized_name}_{uuid4}``.
    """
    if not name or not name.strip():
        raise ValueError("graph_name is required")
    graph_name = sanitize_graph_name(name)
    run_id = str(uuid4())
    graph_key = f"{graph_name}_{run_id}"
    return graph_key, graph_name, run_id


def preflight() -> None:
    """
    Fail fast if FalkorDB is unreachable or credentials are wrong.

    Runs ping, a trivial Cypher query, and list_graphs().
    """
    client = FalkorDBClient.get()
    connection = getattr(client, "connection", None) or getattr(client, "_client", None)
    if connection is not None and hasattr(connection, "ping"):
        connection.ping()

    probe = client.select_graph("__alsm_preflight__")
    try:
        probe.query("RETURN 1")
    finally:
        try:
            probe.delete()
        except Exception:
            logger.debug("Preflight cleanup delete failed", exc_info=True)

    graphs = client.list_graphs()
    logger.info(
        "FalkorDB preflight OK (existing graphs=%s)",
        len(graphs) if graphs is not None else 0,
    )


def _index_exists_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        token in message
        for token in (
            "already indexed",
            "already exists",
            "index already exists",
            "attribute already indexed",
        )
    )


def _run_index(graph: Any, query: str) -> None:
    try:
        graph.query(query)
    except Exception as exc:
        if _index_exists_error(exc):
            logger.info("Index already present: %s", query)
            return
        raise


def ensure_schema(graph: Any) -> None:
    """
    Create range indexes and a unique constraint on State.node_id.

    Idempotent: treats "already exists" as success. Degrades to indexes-only
    if GRAPH.CONSTRAINT CREATE is forbidden by ACL.
    """
    _run_index(graph, "CREATE INDEX FOR (s:State) ON (s.node_id)")
    _run_index(graph, "CREATE INDEX FOR (s:State) ON (s.state_hash)")
    _run_index(graph, "CREATE INDEX FOR (l:NetworkLog) ON (l.edge_id)")

    graph_name = getattr(graph, "name", None) or getattr(graph, "_name", None)
    client = FalkorDBClient.get()
    if not graph_name:
        logger.warning("Cannot determine graph name for UNIQUE constraint; indexes only")
        return

    try:
        # falkordb-py exposes execute_command on the client; constraint create is
        # not wrapped as a dedicated helper in this client version.
        client.execute_command(
            "GRAPH.CONSTRAINT",
            "CREATE",
            graph_name,
            "UNIQUE",
            "NODE",
            "State",
            "PROPERTIES",
            1,
            "node_id",
        )
        logger.info("UNIQUE constraint on State.node_id requested (PENDING)")
    except Exception as exc:
        message = str(exc).lower()
        if any(
            token in message
            for token in (
                "already exists",
                "constraint already exists",
                "nopererm",
                "unknown command",
                "not allowed",
                "permission",
            )
        ):
            logger.warning(
                "Skipping UNIQUE constraint on State.node_id (%s); indexes only",
                exc,
            )
            return
        raise


def fetch_all_graphs() -> list[str]:
    """Return all graph keys present on the FalkorDB instance."""
    graphs = FalkorDBClient.get().list_graphs()
    if not graphs:
        return []
    return [str(name) for name in graphs]


def fetch_graph(graph_key: str) -> dict[str, list[dict[str, Any]]]:
    """
    Return all states and transitions for ``graph_key``.

    Shape: ``{"nodes": [...], "edges": [...]}``.
    """
    from services.graph.db.graph_repository import GraphRepository

    repo = GraphRepository(graph_key)
    return {
        "nodes": repo.list_states(),
        "edges": repo.list_transitions(),
    }


def fetch_path(
    graph_key: str,
    from_id: str,
    to_id: str,
) -> dict[str, list[dict[str, Any]]]:
    """
    Return the shortest click path from ``from_id`` to ``to_id``.

    Shape: ``{"nodes": [...], "edges": [...]}``. Empty lists when no path exists.
    """
    from services.graph.db.graph_repository import GraphRepository

    repo = GraphRepository(graph_key)
    return repo.shortest_click_path(from_id, to_id)
