# AGENTS.md

## Cursor Cloud specific instructions

- This is a minimal Python 3.12 project managed by [`uv`](https://docs.astral.sh/uv/). Dependencies are declared in `pyproject.toml` and pinned in `uv.lock`.
- `uv` installs to `~/.local/bin`, which may not be on `PATH` in a fresh shell. If `uv` is not found, run `export PATH="$HOME/.local/bin:$PATH"`.
- Run the app: `uv run main.py` (prints `Hello from alsm-att!`).
- `fastapi` is a declared dependency but is not yet used by `main.py` (no server/app is defined). There is currently no HTTP server to start.
- No test suite or lint tooling is configured in this repo yet.
