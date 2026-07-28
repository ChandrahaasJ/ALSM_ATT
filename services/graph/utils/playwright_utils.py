from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Sequence, Tuple

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, Request, Response, sync_playwright

from services.config import Config

logger = logging.getLogger(__name__)

Point = Tuple[float, float]
NetworkLogEntry = Dict[str, Any]

# Runs inside the page. Finds every candidate interactive element, applies the
# interaction policy (allow/deny rules + dedupe), and groups form controls so
# the crawler can drive forms as combinations instead of blind clicks.
# Every rejected candidate is returned in `skipped` with the reason, so the
# policy stays auditable.
_DOM_COLLECTOR_JS = """
(args) => {
    const sameOriginOnly = !!args.sameOriginOnly;
    const maxSiblingGroup = args.maxSiblingGroup || 5;
    const denyPatterns = (args.denyTextPatterns || [])
        .map((pattern) => String(pattern).toLowerCase())
        .filter(Boolean);

    const TEXTUAL_INPUT_TYPES = [
        "text", "email", "password", "number", "search", "tel", "url",
        "date", "datetime-local", "time", "month", "week",
    ];
    const SUBMIT_TEXT_RE = /(submit|save|send|search|login|log in|sign in|sign up|register|continue|apply|next|go)/i;
    const CANDIDATE_SELECTOR =
        'a[href], button, input, select, textarea, summary, ' +
        '[role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick]';

    // Structural selector that survives a page reload (used for replay).
    const cssPath = (el) => {
        const parts = [];
        let node = el;
        while (node && node.nodeType === 1) {
            const tag = node.tagName.toLowerCase();
            if (tag === "html") {
                parts.unshift("html");
                break;
            }
            if (node.id && document.querySelectorAll("#" + CSS.escape(node.id)).length === 1) {
                parts.unshift("#" + CSS.escape(node.id));
                return parts.join(" > ");
            }
            let index = 1;
            let sibling = node.previousElementSibling;
            while (sibling) {
                if (sibling.tagName === node.tagName) index += 1;
                sibling = sibling.previousElementSibling;
            }
            parts.unshift(tag + ":nth-of-type(" + index + ")");
            node = node.parentElement;
        }
        return parts.join(" > ");
    };

    const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (parseFloat(style.opacity || "1") === 0) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        if (el.closest('[aria-hidden="true"]')) return false;
        return true;
    };

    // bbox in full-page coordinates so it matches the full-page screenshot.
    const pageBBox = (el) => {
        const rect = el.getBoundingClientRect();
        const sx = window.scrollX || 0;
        const sy = window.scrollY || 0;
        return [
            Math.round(rect.left + sx),
            Math.round(rect.top + sy),
            Math.round(rect.right + sx),
            Math.round(rect.bottom + sy),
        ];
    };

    const textOf = (el) => {
        const text = (el.innerText || el.value || "").trim().replace(/\\s+/g, " ");
        if (text) return text.slice(0, 80);
        return (el.getAttribute("aria-label") || el.getAttribute("title") || "").trim().slice(0, 80);
    };

    const labelFor = (el) => {
        if (el.id) {
            const label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (label && label.innerText.trim()) return label.innerText.trim().slice(0, 60);
        }
        const wrapping = el.closest("label");
        if (wrapping && wrapping.innerText.trim()) return wrapping.innerText.trim().slice(0, 60);
        return (
            el.getAttribute("aria-label") ||
            el.getAttribute("placeholder") ||
            el.name ||
            el.id ||
            ""
        ).slice(0, 60);
    };

    const classify = (el) => {
        const tag = el.tagName.toLowerCase();
        const role = (el.getAttribute("role") || "").toLowerCase();
        const type = (el.getAttribute("type") || "").toLowerCase();
        if (tag === "select") return "select";
        if (tag === "textarea") return "textarea";
        if (tag === "input") {
            if (["button", "submit", "reset", "image"].includes(type)) return "button";
            if (type === "radio") return "radio";
            if (type === "checkbox") return "checkbox";
            if (type === "hidden") return "hidden_input";
            return "text_input";
        }
        if (tag === "button" || role === "button") return "button";
        if (tag === "a" || role === "link") return "link";
        if (tag === "summary") return "summary";
        if (role === "tab") return "tab";
        if (role === "menuitem") return "menuitem";
        return "custom_click";
    };

    // ------------------------------------------------------------------
    // Form discovery: controls grouped by enclosing <form>, with a
    // pseudo-form fallback for form-less SPAs.
    // ------------------------------------------------------------------
    const formControlEls = new Set();

    const describeForm = (root, formIndex) => {
        const localControls = [];
        const textFields = [];
        root.querySelectorAll("input, textarea").forEach((el) => {
            const tag = el.tagName.toLowerCase();
            const type = (el.getAttribute("type") || "text").toLowerCase();
            const textual = tag === "textarea" || TEXTUAL_INPUT_TYPES.includes(type);
            if (!textual || !isVisible(el) || el.disabled) return;
            localControls.push(el);
            textFields.push({
                selector: cssPath(el),
                name: el.name || el.id || "",
                input_type: tag === "textarea" ? "textarea" : type,
                label: labelFor(el),
            });
        });

        const selects = [];
        root.querySelectorAll("select").forEach((el) => {
            if (!isVisible(el) || el.disabled) return;
            localControls.push(el);
            const options = Array.from(el.options)
                .filter((option) => !option.disabled)
                .map((option) => ({
                    value: option.value,
                    label: (option.label || option.text || "").trim().slice(0, 60),
                }));
            selects.push({
                selector: cssPath(el),
                name: el.name || el.id || "",
                label: labelFor(el),
                options,
            });
        });

        const radioGroups = {};
        root.querySelectorAll('input[type="radio"]').forEach((el) => {
            if (!isVisible(el) || el.disabled) return;
            localControls.push(el);
            const group = el.name || "radio_group_" + formIndex;
            if (!radioGroups[group]) radioGroups[group] = [];
            radioGroups[group].push({
                selector: cssPath(el),
                value: el.value,
                label: labelFor(el),
            });
        });

        const checkboxes = [];
        root.querySelectorAll('input[type="checkbox"]').forEach((el) => {
            if (!isVisible(el) || el.disabled) return;
            localControls.push(el);
            checkboxes.push({
                selector: cssPath(el),
                name: el.name || el.id || "",
                label: labelFor(el),
            });
        });

        let submitEl = root.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitEl && root.tagName.toLowerCase() === "form") {
            // A <button> without an explicit type submits its form.
            submitEl = Array.from(root.querySelectorAll("button")).find(
                (button) => !button.getAttribute("type")
            );
        }
        if (!submitEl) {
            submitEl = Array.from(root.querySelectorAll('button, [role="button"]')).find(
                (button) => isVisible(button) && SUBMIT_TEXT_RE.test(textOf(button))
            );
        }
        let submit = null;
        if (submitEl && isVisible(submitEl) && !submitEl.disabled) {
            localControls.push(submitEl);
            submit = { selector: cssPath(submitEl), text: textOf(submitEl), bbox: pageBBox(submitEl) };
        }

        return {
            form: {
                form_index: formIndex,
                selector: cssPath(root),
                text_fields: textFields,
                selects,
                radio_groups: Object.entries(radioGroups).map(([name, choices]) => ({ name, choices })),
                checkboxes,
                submit,
            },
            controls: localControls,
        };
    };

    const forms = [];
    document.querySelectorAll("form").forEach((formEl) => {
        if (!isVisible(formEl)) return;
        const described = describeForm(formEl, forms.length);
        const form = described.form;
        if (form.text_fields.length || form.selects.length || form.radio_groups.length) {
            forms.push(form);
            described.controls.forEach((el) => formControlEls.add(el));
        }
    });

    if (forms.length === 0) {
        const freeControls = Array.from(
            document.querySelectorAll("input, textarea, select")
        ).filter((el) => !el.closest("form") && isVisible(el) && !el.disabled);
        const hasSelectable = freeControls.some((el) => {
            const tag = el.tagName.toLowerCase();
            const type = (el.getAttribute("type") || "").toLowerCase();
            return tag === "select" || type === "radio";
        });
        const hasText = freeControls.some((el) => {
            const tag = el.tagName.toLowerCase();
            const type = (el.getAttribute("type") || "text").toLowerCase();
            return tag === "textarea" || (tag === "input" && TEXTUAL_INPUT_TYPES.includes(type));
        });
        const submitCandidate = Array.from(
            document.querySelectorAll('button, [role="button"], input[type="submit"]')
        ).find((button) => isVisible(button) && SUBMIT_TEXT_RE.test(textOf(button)));
        if (hasSelectable || (hasText && submitCandidate)) {
            const described = describeForm(document.body, 0);
            const form = described.form;
            if (form.text_fields.length || form.selects.length || form.radio_groups.length) {
                forms.push(form);
                described.controls.forEach((el) => formControlEls.add(el));
            }
        }
    }

    // ------------------------------------------------------------------
    // Candidate gathering for generic clicks
    // ------------------------------------------------------------------
    const candidates = [];
    const candidateSet = new Set();
    document.querySelectorAll(CANDIDATE_SELECTOR).forEach((el) => {
        if (!candidateSet.has(el)) {
            candidateSet.add(el);
            candidates.push({ el, heuristic: false });
        }
    });
    // cursor:pointer heuristic for custom widgets, but never inside a real
    // interactive element (children inherit the pointer cursor).
    document.querySelectorAll("div, span, li, img, svg").forEach((el) => {
        if (candidateSet.has(el)) return;
        if (el.closest(CANDIDATE_SELECTOR)) return;
        try {
            if (window.getComputedStyle(el).cursor === "pointer") {
                candidateSet.add(el);
                candidates.push({ el, heuristic: true });
            }
        } catch (error) {
            /* detached element */
        }
    });

    const elements = [];
    const skipped = [];
    const seenHrefs = new Set();
    const currentUrlNoHash = location.href.split("#")[0];

    const recordSkip = (el, elementType, reason) => {
        skipped.push({
            selector: cssPath(el),
            tag: el.tagName.toLowerCase(),
            element_type: elementType,
            text: textOf(el),
            reason,
        });
    };

    const kept = [];
    for (const candidate of candidates) {
        const el = candidate.el;
        const elementType = classify(el);
        if (elementType === "hidden_input") continue;
        if (formControlEls.has(el)) {
            recordSkip(el, elementType, "form_control");
            continue;
        }
        if (!isVisible(el)) {
            recordSkip(el, elementType, "invisible");
            continue;
        }
        if (el.disabled || el.getAttribute("aria-disabled") === "true") {
            recordSkip(el, elementType, "disabled");
            continue;
        }
        const text = textOf(el);
        const lowered = text.toLowerCase();
        if (denyPatterns.some((pattern) => lowered.includes(pattern))) {
            recordSkip(el, elementType, "deny_text");
            continue;
        }

        let href = null;
        if (elementType === "link") {
            const rawHref = el.getAttribute("href") || "";
            if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) {
                recordSkip(el, elementType, "non_http_scheme");
                continue;
            }
            if (el.hasAttribute("download")) {
                recordSkip(el, elementType, "download_link");
                continue;
            }
            let resolved = null;
            if (rawHref) {
                try {
                    resolved = new URL(rawHref, location.href);
                } catch (error) {
                    recordSkip(el, elementType, "bad_href");
                    continue;
                }
            }
            if (resolved) {
                if (sameOriginOnly && resolved.origin !== location.origin) {
                    recordSkip(el, elementType, "external_link");
                    continue;
                }
                const isSamePage = resolved.href.split("#")[0] === currentUrlNoHash;
                const hasHandler = el.hasAttribute("onclick") || el.getAttribute("role");
                if (isSamePage && rawHref.startsWith("#") && !hasHandler) {
                    recordSkip(el, elementType, "self_link");
                    continue;
                }
                href = resolved.href;
                if (seenHrefs.has(href) && href.split("#")[0] !== currentUrlNoHash) {
                    recordSkip(el, elementType, "duplicate_href");
                    continue;
                }
                seenHrefs.add(href);
            }
        }

        // Free-standing form-ish controls with no form/pseudo-form to drive them.
        if (elementType === "text_input" || elementType === "textarea") {
            recordSkip(el, elementType, "orphan_text_input");
            continue;
        }
        if (elementType === "select") {
            recordSkip(el, elementType, "orphan_select");
            continue;
        }

        if (candidate.heuristic) {
            if (!text) {
                recordSkip(el, elementType, "decorative");
                continue;
            }
            if (el.querySelector(CANDIDATE_SELECTOR)) {
                recordSkip(el, elementType, "wraps_interactive");
                continue;
            }
        } else if (el.querySelector(CANDIDATE_SELECTOR)) {
            // Semantic element wrapping another semantic element: keep the inner one.
            recordSkip(el, elementType, "wraps_interactive");
            continue;
        }

        kept.push({ el, elementType, text, href });
    }

    // Innermost-wins among heuristic custom clicks that nest each other.
    const keptEls = kept.map((item) => item.el);
    const finalKept = kept.filter((item) => {
        const isAncestorOfKept = keptEls.some(
            (other) => other !== item.el && item.el.contains(other)
        );
        if (isAncestorOfKept) {
            recordSkip(item.el, item.elementType, "wraps_interactive");
            return false;
        }
        return true;
    });

    // Structurally identical repeated siblings: keep the first
    // maxSiblingGroup of each shape, skip the rest (anti-explosion).
    const siblingCounts = {};
    const results = [];
    for (const item of finalKept) {
        const el = item.el;
        const parentPath = el.parentElement ? cssPath(el.parentElement) : "";
        const signature =
            parentPath + "|" + el.tagName.toLowerCase() + "|" +
            (el.getAttribute("class") || "") + "|" + item.elementType;
        siblingCounts[signature] = (siblingCounts[signature] || 0) + 1;
        if (siblingCounts[signature] > maxSiblingGroup) {
            recordSkip(el, item.elementType, "duplicate_sibling");
            continue;
        }
        results.push({
            selector: cssPath(el),
            tag: el.tagName.toLowerCase(),
            element_type: item.elementType,
            text: item.text,
            href: item.href,
            bbox: pageBBox(el),
        });
    }

    return { elements: results, forms, skipped };
}
"""


@dataclass(frozen=True)
class ActionRecord:
    """One replayable browser action (the unit stored by StateMemory)."""

    kind: str  # "click" | "fill" | "select" | "check"
    selector: str | None = None
    value: str | None = None
    fallback_bbox: Tuple[float, float, float, float] | None = None
    description: str = ""

    def describe(self) -> str:
        if self.description:
            return self.description
        target = self.selector or f"bbox {self.fallback_bbox}"
        if self.value is not None:
            return f"{self.kind} {target} = {self.value!r}"
        return f"{self.kind} {target}"


class PlaywrightUtils:
    """Playwright browser utilities for DOM indexing."""

    def __init__(
        self,
        headless: bool = Config.headless,
        slow_mo_ms: int = Config.slow_mo_ms,
        nav_timeout_ms: int = Config.nav_timeout_ms,
        network_idle_timeout_ms: int = Config.network_idle_timeout_ms,
        action_timeout_ms: int = Config.action_timeout_ms,
    ) -> None:
        self._headless = headless
        self._slow_mo_ms = slow_mo_ms
        self._nav_timeout_ms = nav_timeout_ms
        self._network_idle_timeout_ms = network_idle_timeout_ms
        self._action_timeout_ms = action_timeout_ms
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

    def settle(self) -> None:
        """Best-effort wait for the page to go network-idle after an action."""
        try:
            self.page.wait_for_load_state(
                "networkidle",
                timeout=self._network_idle_timeout_ms,
            )
        except Exception:
            pass

    # ------------------------------------------------------------------
    # DOM-based detection
    # ------------------------------------------------------------------

    def detect_page(
        self,
        *,
        same_origin_only: bool = Config.same_origin_only,
        deny_text_patterns: Sequence[str] = Config.deny_text_patterns,
        max_sibling_group: int = Config.max_sibling_group,
    ) -> Dict[str, Any]:
        """
        Detect interactive elements and forms from the live DOM.

        Returns ``{"elements": [...], "forms": [...], "skipped": [...]}`` where
        each element carries a replay-stable ``selector``, ``tag``,
        ``element_type``, ``text``, ``href`` and a full-page ``bbox``
        ``[x1, y1, x2, y2]``. ``skipped`` lists every rejected candidate with
        the policy reason.
        """
        result = self.page.evaluate(
            _DOM_COLLECTOR_JS,
            {
                "sameOriginOnly": same_origin_only,
                "denyTextPatterns": list(deny_text_patterns),
                "maxSiblingGroup": max_sibling_group,
            },
        )
        return {
            "elements": result.get("elements", []),
            "forms": result.get("forms", []),
            "skipped": result.get("skipped", []),
        }

    # ------------------------------------------------------------------
    # Action primitives (selector-based, with coordinate-click fallback)
    # ------------------------------------------------------------------

    def _fallback_click(self, bbox: Sequence[float]) -> None:
        x1, y1, x2, y2 = bbox
        self.page.mouse.click((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    def perform_action(self, action: ActionRecord) -> None:
        """Execute one ActionRecord against the live page."""
        if action.selector is None:
            if action.kind == "click" and action.fallback_bbox is not None:
                self._fallback_click(action.fallback_bbox)
                return
            raise ValueError(f"ActionRecord without selector cannot be replayed: {action}")

        locator = self.page.locator(action.selector).first
        try:
            if action.kind == "click":
                locator.click(timeout=self._action_timeout_ms)
            elif action.kind == "fill":
                locator.fill(action.value or "", timeout=self._action_timeout_ms)
            elif action.kind == "select":
                locator.select_option(value=action.value, timeout=self._action_timeout_ms)
            elif action.kind == "check":
                locator.check(timeout=self._action_timeout_ms)
            else:
                raise ValueError(f"Unknown action kind: {action.kind}")
        except Exception:
            if action.kind == "click" and action.fallback_bbox is not None:
                logger.warning(
                    "Selector click failed (%s); falling back to coordinate click",
                    action.selector,
                    exc_info=True,
                )
                self._fallback_click(action.fallback_bbox)
            else:
                raise

    def clear_network_logs(self) -> None:
        self._network_logs = []
        self._pending_requests = {}

    def drain_network_logs(self) -> List[NetworkLogEntry]:
        logs = [dict(entry) for entry in self._network_logs]
        self.clear_network_logs()
        return logs

    def act_and_capture_network(
        self,
        actions: Sequence[ActionRecord],
    ) -> List[NetworkLogEntry]:
        """Perform a sequence of actions and return the network logs they caused."""
        self.clear_network_logs()
        for action in actions:
            self.perform_action(action)
        self.settle()
        return self.drain_network_logs()

    # ------------------------------------------------------------------
    # Legacy coordinate helpers (kept for the vision fallback path)
    # ------------------------------------------------------------------

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

    def click_and_capture_network(
        self,
        coords: Sequence[Point],
    ) -> List[NetworkLogEntry]:
        self.clear_network_logs()
        self.click_at_coordinates(coords)
        self.settle()
        return self.drain_network_logs()

    def go_back(self) -> None:
        """History back. Not used by the crawl loop — StateMemory replay is."""
        self.page.go_back(wait_until="domcontentloaded")

    def take_screenshot(self, path: str) -> str:
        self.page.screenshot(path=path, full_page=True)
        return path
