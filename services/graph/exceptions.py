"""Graph service exceptions."""


class GraphError(Exception):
    """Base exception for graph operations."""


class GraphNotFoundError(GraphError):
    """Raised when a requested graph file does not exist."""


class GraphParseError(GraphError):
    """Raised when graph parsing fails."""


class NavigationError(GraphError):
    """Raised when browser navigation fails during graph building."""
