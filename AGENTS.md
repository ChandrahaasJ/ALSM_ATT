# AGENTS.md

## Cursor Cloud specific instructions

- This is a Python 3.12 project managed by [`uv`](https://docs.astral.sh/uv/). Dependencies are declared in `pyproject.toml` and pinned in `uv.lock`.
- `uv` installs to `~/.local/bin`, which may not be on `PATH` in a fresh shell. If `uv` is not found, run `export PATH="$HOME/.local/bin:$PATH"`.
- Install deps: `uv sync`.
- Copy `.env.example` to `.env` and fill in FalkorDB + AWS S3 settings (`.env` is gitignored).

### FalkorDB

- UI state graphs are persisted to a **deployed FalkorDB** instance (not JSON files).
- Connection via `FALKORDB_URL` (preferred, e.g. `falkors://user:pass@host:port`) or discrete `FALKORDB_HOST` / `PORT` / `USERNAME` / `PASSWORD` / `TLS` vars.
- Optional local fallback: `docker compose up -d` then `FALKORDB_URL=falkor://localhost:6379`.
- Graph keys are `{sanitized_name}_{uuid}` — name is required when starting a crawl.
- Preflight: `uv run python -c "from services.graph.utils.falkor_utils import preflight; preflight()"`.

### Crawler

```bash
uv run python -m services.graph.DOM_index_service.dom_parser <url> <graph_name>
```

Screenshots are uploaded to S3 (`S3_BUCKET` / `S3_PREFIX`); FalkorDB stores only `s3://` URIs.

### Read helpers

```python
from services.graph.utils.falkor_utils import fetch_all_graphs, fetch_graph, fetch_path
```

### FastAPI

- `fastapi` / `uvicorn` are declared; `app/main.py` has a stub `/api/hello` only.
- Run stub server: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`.
- No test suite or lint tooling is configured in this repo yet.
