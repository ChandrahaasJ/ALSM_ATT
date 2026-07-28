"""
State memory for the DOM crawler.

The crawl is a DFS over UI states, and DFS needs reliable backtracking.
``page.go_back()`` is not reliable for that: SPA clicks often do not push a
history entry, so "back" can land on the wrong page or leave modals open.

Instead, every state remembers the exact ``ActionRecord`` sequence (from the
base URL) that produced it. Reverting to a state means reloading the base URL
and replaying that sequence — deterministic time travel that does not depend
on browser history. Arrival is verified by comparing the freshly captured
screenshot hash with the hash remembered for the state; states that cannot be
reproduced are marked unstable instead of corrupting the graph.
"""

from __future__ import annotations

import logging
from typing import Callable, Dict, List, Set

from services.graph.utils.playwright_utils import ActionRecord, PlaywrightUtils

logger = logging.getLogger(__name__)


class StateMemory:
    """Records how every state was reached and replays those paths on demand."""

    def __init__(self, base_url: str) -> None:
        if not base_url:
            raise ValueError("base_url is required")
        self.base_url = base_url
        self._paths: Dict[str, List[ActionRecord]] = {}
        self._hashes: Dict[str, str] = {}
        self._unstable: Set[str] = set()

    def remember(
        self,
        node_id: str,
        action_path: List[ActionRecord],
        state_hash: str,
    ) -> None:
        """Store the action sequence that produced ``node_id`` and its hash."""
        self._paths[node_id] = list(action_path)
        self._hashes[node_id] = state_hash

    def path_to(self, node_id: str) -> List[ActionRecord]:
        if node_id not in self._paths:
            raise KeyError(f"No recorded path for state {node_id}")
        return list(self._paths[node_id])

    def state_hash_of(self, node_id: str) -> str | None:
        return self._hashes.get(node_id)

    def mark_unstable(self, node_id: str) -> None:
        self._unstable.add(node_id)

    def is_unstable(self, node_id: str) -> bool:
        return node_id in self._unstable

    def replay(self, node_id: str, pw: PlaywrightUtils) -> None:
        """Reload the base URL and re-execute the recorded path to ``node_id``."""
        path = self.path_to(node_id)
        logger.info("Replaying %s actions to restore state %s", len(path), node_id)
        pw.open_url(self.base_url)
        pw.settle()
        for action in path:
            logger.debug("Replay action: %s", action.describe())
            pw.perform_action(action)
            pw.settle()

    def revert_to(
        self,
        node_id: str,
        pw: PlaywrightUtils,
        verify_hash: Callable[[], str],
        retries: int = 1,
    ) -> bool:
        """
        Revert the browser to ``node_id`` and verify arrival by state hash.

        Returns True when the replayed state's hash matches the remembered
        one. After ``retries`` failed attempts the state is marked unstable
        and False is returned.
        """
        if self.is_unstable(node_id):
            logger.warning("State %s is already marked unstable; not reverting", node_id)
            return False

        expected = self._hashes.get(node_id)
        for attempt in range(retries + 1):
            self.replay(node_id, pw)
            current = verify_hash()
            if expected is not None and current == expected:
                logger.info("Reverted to state %s (hash verified)", node_id)
                return True
            logger.warning(
                "Replay of state %s produced hash %s (expected %s), attempt %s/%s",
                node_id,
                current[:12],
                (expected or "?")[:12],
                attempt + 1,
                retries + 1,
            )

        self.mark_unstable(node_id)
        logger.warning("State %s could not be reproduced; marked unstable", node_id)
        return False
