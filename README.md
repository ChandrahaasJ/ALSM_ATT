# ALSM ATT

A Python 3.12 project managed with [uv](https://docs.astral.sh/uv/). Dependencies are declared in `pyproject.toml` and pinned in `uv.lock` for reproducible installs.

The codebase includes:

- **`app/`** — FastAPI HTTP server (stub)
- **`services/graph/`** — UI state graph crawler (Playwright + YOLO), FalkorDB persistence, vision utilities
- **`services/storage/`** — S3 screenshot store
- **`services/agent_connector/`** — planned integration layer for coding agents

## Prerequisites

- **Python 3.12** (see `.python-version`)
- **uv** — install from the [uv docs](https://docs.astral.sh/uv/getting-started/installation/)
- A **FalkorDB** instance (deployed, or local via Docker)
- An **AWS S3** bucket for screenshots (credentials via env or `~/.aws/credentials`)

On Linux/macOS, if `uv` is not found after install, add it to your `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd ALSM_ATT
uv sync
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in at least:

| Variable | Purpose |
|----------|---------|
| `FALKORDB_URL` | Connection string, e.g. `falkors://user:pass@host:6379` (or use discrete host/port/user/pass/TLS vars) |
| `S3_BUCKET` | Bucket for screenshot uploads |
| `AWS_REGION` | S3 region |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Or configure `~/.aws/credentials` |

### 3. Optional local FalkorDB

```bash
docker compose up -d
# then in .env:
# FALKORDB_URL=falkor://localhost:6379
```

Browser UI (local image): http://localhost:3000

## Crawl a UI into FalkorDB

```bash
uv run python -m services.graph.DOM_index_service.dom_parser https://localhost:5173 test_fe2
```

Returns a graph key like `test_fe2_550e8400-e29b-41d4-a716-446655440000`.

Each run:

1. Takes screenshots via Playwright
2. Records each state's DOM — HTML into `State.skeleton`, CSS into `State.styles` (set `CAPTURE_DOM=false` to skip)
3. Detects clickable elements (YOLO/ONNX)
4. Uploads screenshots to S3 (content-addressed `s3://` URIs)
5. Writes `:State` nodes and `:TRANSITIONS_TO` relationships (click + network summary on the edge; full logs as `:NetworkLog` nodes)

## Read helpers

```python
from services.graph.utils.falkor_utils import fetch_all_graphs, fetch_graph, fetch_path

keys = fetch_all_graphs()
graph = fetch_graph(keys[0])          # {"nodes": [...], "edges": [...]}
path = fetch_path(keys[0], "node_1", "node_3")
```

## Run the stub API

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

| URL | Description |
|-----|-------------|
| http://localhost:8000/api/hello | Sample endpoint |
| http://localhost:8000/docs | Interactive API docs |

## Project layout

```
ALSM_ATT/
├── app/                      # FastAPI application (stub)
├── services/
│   ├── config.py             # Env-driven settings
│   ├── storage/              # S3 screenshot store
│   ├── graph/
│   │   ├── db/               # FalkorDB client, models, repository
│   │   ├── DOM_index_service/# DOMParser crawler
│   │   ├── utils/            # Playwright + falkor_utils
│   │   └── edge_semantics.py # Click → StateTransition builder
│   └── agent_connector/      # Agent integration (planned)
├── docker-compose.yml        # Optional local FalkorDB
├── .env.example
├── main.py
├── pyproject.toml
└── uv.lock
```
