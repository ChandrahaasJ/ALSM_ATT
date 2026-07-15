"""FastAPI routes for graph parsing and retrieval."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from services.graph.exceptions import GraphNotFoundError, GraphParseError
from services.graph.graph_service import GraphService

router = APIRouter(prefix="/api/graph", tags=["graph"])
_service = GraphService()


class ParseGraphRequest(BaseModel):
    url: HttpUrl
    recursive_limit: int | None = Field(default=None, ge=1, le=10)


class ParseGraphResponse(BaseModel):
    graph_id: int
    output_path: str
    node_count: int
    cycles_detected: int
    end_states: int


class GraphSummary(BaseModel):
    id: int
    filename: str
    node_count: int


class GraphDetailResponse(BaseModel):
    id: int
    nodes: list[dict[str, Any]]
    cycles: list[list[str]]


@router.post("/parse", response_model=ParseGraphResponse)
def parse_graph(request: ParseGraphRequest) -> ParseGraphResponse:
    try:
        result = _service.parse_url(str(request.url), recursive_limit=request.recursive_limit)
    except GraphParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ParseGraphResponse(**result)


@router.get("", response_model=list[GraphSummary])
def list_graphs() -> list[GraphSummary]:
    return [GraphSummary(**item) for item in _service.list_graphs()]


@router.get("/{graph_id}", response_model=GraphDetailResponse)
def get_graph(graph_id: int) -> GraphDetailResponse:
    try:
        detail = _service.get_graph(graph_id)
    except GraphNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return GraphDetailResponse(**detail)
