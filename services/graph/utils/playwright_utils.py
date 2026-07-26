from __future__ import annotations

import time
from typing import Any, Dict, List, Sequence, Tuple

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, Request, Response, sync_playwright

from services.config import Config

Point = Tuple[float, float]
NetworkLogEntry = Dict[str, Any]


class PlaywrightUtils:
    """Playwright browser utilities for DOM indexing."""

    def __init__(
        self,
        headless: bool = Config.headless,
        slow_mo_ms: int = Config.slow_mo_ms,
        nav_timeout_ms: int = Config.nav_timeout_ms,
        network_idle_timeout_ms: int = Config.network_idle_timeout_ms,
    ) -> None:
        self._headless = headless
        self._slow_mo_ms = slow_mo_ms
        self._nav_timeout_ms = nav_timeout_ms
        self._network_idle_timeout_ms = network_idle_timeout_ms
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None
        self._network_logs: List[NetworkLogEntry] = []
        self._pending_requests: Dict[int, NetworkLogEntry] = {}
        self._trace_path: str | None = None

    def __enter__(self) -> "PlaywrightUtils":
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def _launch_firefox(self) -> Browser:
        if self._playwright is None:
            raise RuntimeError("Playwright has not been started")
        return self._playwright.firefox.launch(
            headless=self._headless,
            slow_mo=self._slow_mo_ms,
        )

    def _on_request(self, request: Request) -> None:
        entry: NetworkLogEntry = {
            "url": request.url,
            "method": request.method,
            "status": None,
            "resource_type": request.resource_type,
            "timestamp_ms": int(time.time() * 1000),
        }
        self._pending_requests[id(request)] = entry
        self._network_logs.append(entry)

    def _on_response(self, response: Response) -> None:
        request = response.request
        entry = self._pending_requests.get(id(request))
        if entry is not None:
            entry["status"] = response.status

    def _register_network_listeners(self) -> None:
        self.page.on("request", self._on_request)
        self.page.on("response", self._on_response)

    def start(self, *, trace_path: str | None = None) -> None:
        if self._page is not None:
            return
        self._playwright = sync_playwright().start()
        self._browser = self._launch_firefox()
        self._context = self._browser.new_context()
        self._trace_path = trace_path
        if self._trace_path is not None:
            self._context.tracing.start(screenshots=True, snapshots=True, sources=True)
        self._page = self._context.new_page()
        self._page.set_default_navigation_timeout(self._nav_timeout_ms)
        self._register_network_listeners()

    def close(self) -> None:
        if self._context is not None:
            try:
                if self._trace_path is not None:
                    self._context.tracing.stop(path=self._trace_path)
            finally:
                self._context.close()
            self._context = None
        if self._browser is not None:
            self._browser.close()
            self._browser = None
        if self._playwright is not None:
            self._playwright.stop()
            self._playwright = None
        self._page = None
        self._trace_path = None
        self._network_logs = []
        self._pending_requests = {}

    @property
    def page(self) -> Page:
        if self._page is None:
            raise RuntimeError("PlaywrightUtils has not been started. Call start() first.")
        return self._page

    def open_url(self, url: str) -> None:
        self.page.goto(url, wait_until="domcontentloaded")

    def click_at_coordinates(
        self,
        coords: Sequence[Point],
    ) -> None:
        if len(coords) != 4:
            raise ValueError("click_at_coordinates expects exactly four corner points")

        xs = [point[0] for point in coords]
        ys = [point[1] for point in coords]
        center_x = (min(xs) + max(xs)) / 2.0
        center_y = (min(ys) + max(ys)) / 2.0
        self.page.mouse.click(center_x, center_y)

    def clear_network_logs(self) -> None:
        self._network_logs = []
        self._pending_requests = {}

    def drain_network_logs(self) -> List[NetworkLogEntry]:
        logs = [dict(entry) for entry in self._network_logs]
        self.clear_network_logs()
        return logs

    def click_and_capture_network(
        self,
        coords: Sequence[Point],
    ) -> List[NetworkLogEntry]:
        self.clear_network_logs()
        self.click_at_coordinates(coords)
        try:
            self.page.wait_for_load_state(
                "networkidle",
                timeout=self._network_idle_timeout_ms,
            )
        except Exception:
            pass
        return self.drain_network_logs()

    def go_back(self) -> None:
        self.page.go_back(wait_until="domcontentloaded")

    def take_screenshot(self, path: str) -> str:
        self.page.screenshot(path=path, full_page=True)
        return path
