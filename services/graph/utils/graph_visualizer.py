from __future__ import annotations

import json
import os
from typing import Any, Dict, List

_GRAPH_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPDB_DIR = os.path.join(_GRAPH_DIR, "temp_db")


class GraphVisualizer:
    """Render a temp_db graph JSON as a Mermaid diagram for in-editor preview."""

    def __init__(self, json_path: str) -> None:
        self.json_path = json_path
        self.nodes: List[Dict[str, Any]] = []

    def load(self) -> List[Dict[str, Any]]:
        with open(self.json_path, encoding="utf-8") as graph_file:
            data = json.load(graph_file)
        if isinstance(data, dict) and "nodes" in data:
            self.nodes = data["nodes"]
        elif isinstance(data, list):
            self.nodes = data
        else:
            raise ValueError("Graph JSON must be a list of nodes or an object with a 'nodes' key")
        return self.nodes

    @staticmethod
    def _escape_mermaid_label(label: str) -> str:
        return label.replace('"', "'").replace("\n", " ")

    def to_mermaid(self) -> str:
        if not self.nodes:
            self.load()

        lines = ["flowchart TD"]
        node_ids = {node["node_id"] for node in self.nodes}

        for node in self.nodes:
            node_id = node["node_id"]
            label = self._escape_mermaid_label(node.get("node_description", node_id))
            lines.append(f'    {node_id}["{label}"]')

        for node in self.nodes:
            for child_id in node.get("child_nodes", []):
                if child_id in node_ids:
                    lines.append(f"    {node['node_id']} --> {child_id}")

        return "\n".join(lines)

    def render(self, output_path: str | None = None) -> str:
        if output_path is None:
            base, _ = os.path.splitext(self.json_path)
            output_path = f"{base}.md"

        mermaid = self.to_mermaid()
        content = (
            "# UI State Graph\n\n"
            f"Source: `{os.path.basename(self.json_path)}`\n\n"
            f"```mermaid\n{mermaid}\n```\n"
        )

        with open(output_path, "w", encoding="utf-8") as output_file:
            output_file.write(content)
        return output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: uv run python -m services.graph.utils.graph_visualizer <graph.json>"
        )

    visualizer = GraphVisualizer(sys.argv[1])
    output = visualizer.render()
    print(f"Graph visualization saved to: {output}")
