"""Small in-process TTL cache for read-mostly data.

Each Vercel instance keeps its own copy, so clear() only reaches the instance that handled the
write; every entry therefore needs a TTL that is acceptable as the worst-case staleness.
"""
import copy
import threading
import time
from typing import Any, Callable, Dict, Tuple

_entries: Dict[str, Tuple[float, Any]] = {}
_lock = threading.Lock()


def get_or_set(key: str, ttl_seconds: float, compute: Callable[[], Any]) -> Any:
    """Returns a copy of the cached value, computing and storing it when missing or expired."""
    now = time.monotonic()
    with _lock:
        hit = _entries.get(key)
    if hit and hit[0] > now:
        return copy.deepcopy(hit[1])
    value = compute()
    with _lock:
        _entries[key] = (now + ttl_seconds, copy.deepcopy(value))
    return value


def clear(prefix: str = "") -> None:
    """Drops every entry whose key starts with prefix (all entries when prefix is empty)."""
    with _lock:
        for key in [k for k in _entries if k.startswith(prefix)]:
            del _entries[key]
