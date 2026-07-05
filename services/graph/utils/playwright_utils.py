from __future__ import annotations

from typing import Sequence, Tuple

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright

from services.config import HEADLESS, NAV_TIMEOUT_MS

Point = Tuple[float, float]


class PlaywrightUtils:
    """Playwright browser utilities for DOM indexing."""

    def __init__(self, headless: bool = HEADLESS, nav_timeout_ms: int = NAV_TIMEOUT_MS) -> None:
        self._headless = headless
        self._nav_timeout_ms = nav_timeout_ms
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None

    def __enter__(self) -> "PlaywrightUtils":
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def _launch_firefox(self) -> Browser:
        if self._playwright is None:
            raise RuntimeError("Playwright has not been started")
        return self._playwright.firefox.launch(headless=self._headless)

    def start(self) -> None:
        if self._page is not None:
            return
        self._playwright = sync_playwright().start()
        self._browser = self._launch_firefox()
        self._context = self._browser.new_context()
        self._page = self._context.new_page()
        self._page.set_default_navigation_timeout(self._nav_timeout_ms)

    def close(self) -> None:
        if self._context is not None:
            self._context.close()
            self._context = None
        if self._browser is not None:
            self._browser.close()
            self._browser = None
        if self._playwright is not None:
            self._playwright.stop()
            self._playwright = None
        self._page = None

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

    def go_back(self) -> None:
        self.page.go_back(wait_until="domcontentloaded")

    def take_screenshot(self, path: str) -> str:
        self.page.screenshot(path=path, full_page=True)
        return path
