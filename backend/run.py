import uvicorn
import sys
import os
import asyncio

import warnings

# Prevent Windows ProactorEventLoop WinError 64 socket disconnect crashes
if sys.platform == "win32":
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    reload_flag = os.getenv("UVICORN_RELOAD", "false").lower() in ("true", "1")
    # Windows does not support Uvicorn multi-worker socket sharing (workers > 1)
    # Spawning child processes causes WinError 10022 (WSAEINVAL) on sock.listen()
    if sys.platform == "win32" or reload_flag:
        workers_count = 1
    else:
        workers_count = int(os.getenv("WEB_CONCURRENCY", "4"))

    port = int(os.getenv("PORT", "8001"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload_flag, workers=workers_count)
