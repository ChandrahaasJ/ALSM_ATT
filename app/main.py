from fastapi import FastAPI

from app.routes.graph import router as graph_router

app = FastAPI()

app.include_router(graph_router)


@app.get("/api/hello")
def hello() -> str:
    return "hello"
