"""
Simple in-memory per-user rate limiter for the chat endpoint.

Sliding window: counts requests in the last 3600s; returns (allowed, reset_in_seconds).
Good enough for a single backend instance. For multi-instance, swap for Redis.
"""

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict, Tuple

_WINDOW_SECONDS = 3600
_lock = Lock()
_history: Dict[str, Deque[float]] = defaultdict(deque)


def check_rate_limit(user_id: str, max_per_hour: int = 30) -> Tuple[bool, int]:
    """
    Returns (allowed, reset_in_seconds).
    If allowed=True, the request is recorded. If False, no record is added
    and `reset_in_seconds` is how long until the oldest event ages out.
    """
    now = time.time()
    with _lock:
        q = _history[user_id]
        # drop events older than the window
        while q and q[0] < now - _WINDOW_SECONDS:
            q.popleft()
        if len(q) >= max_per_hour:
            reset_in = int(_WINDOW_SECONDS - (now - q[0])) + 1
            return False, max(reset_in, 1)
        q.append(now)
        return True, 0
