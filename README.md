# ALSM ATT

A Python 3.12 project managed with [uv](https://docs.astral.sh/uv/). Dependencies are declared in `pyproject.toml` and pinned in `uv.lock` for reproducible installs.

The codebase includes:

- **`app/`** — FastAPI HTTP server
- **`services/graph/`** — vision utilities (ONNX inference, overlays) for UI element detection
- **`services/agent_connector/`** — planned integration layer for coding agents (Codex, Cursor, Copilot) driven by PRD input

## Prerequisites

- **Python 3.12** (see `.python-version`)
- **uv** — install from the [uv docs](https://docs.astral.sh/uv/getting-started/installation/)

On Linux/macOS, if `uv` is not found after install, add it to your `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Setup

### 1. Clone the repository

Clone the project to get all source files, including the lockfile:

```bash
git clone <repository-url>
cd ALSM_ATT
```

`uv.lock` is committed to the repo. You do not need to download or generate it separately — cloning gives you the exact dependency versions the project was built with.

### 2. Install dependencies

From the project root, run:

```bash
uv sync
```

This reads `pyproject.toml` and `uv.lock`, creates a virtual environment (`.venv`), and installs all pinned dependencies.

## Run the server

```bash
uv run python main.py
```

Or:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API starts at **http://localhost:8000**.

| URL | Description |
|-----|-------------|
| http://localhost:8000/api/hello | Sample endpoint |
| http://localhost:8000/docs | Interactive API docs |

## Project layout

```
ALSM_ATT/
├── app/                  # FastAPI application
├── services/
│   ├── graph/            # Vision / ONNX inference
│   └── agent_connector/  # Agent integration (planned)
├── main.py               # Server entry point
├── pyproject.toml        # Dependency declarations
└── uv.lock               # Pinned dependency versions
```
