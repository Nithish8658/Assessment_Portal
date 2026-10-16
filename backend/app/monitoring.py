"""Error monitoring with Sentry. Off unless SENTRY_DSN is set.

What is sent is kept to what is needed to fix a crash: the stack trace, the endpoint and the
server environment. Request bodies (student answers, passwords) are never sent, nor cookies or
auth headers, and query strings are stripped from recorded outbound calls, since the Gemini API
key travels in one.
"""
import os
import re

SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
_SECRET_PARAM = re.compile(r"([?&](?:key|access_token|refresh_token|token|code)=)[^&\s'\"]+", re.I)


def _strip_secrets(text):
    return _SECRET_PARAM.sub(r"\1[removed]", text) if isinstance(text, str) else text


def _before_breadcrumb(crumb, hint):
    data = crumb.get("data") or {}
    if "url" in data:
        data["url"] = str(data["url"]).split("?", 1)[0]
    data.pop("http.query", None)
    crumb["message"] = _strip_secrets(crumb.get("message"))
    return crumb


def _before_send(event, hint):
    request = event.get("request") or {}
    request.pop("data", None)
    request.pop("cookies", None)
    request.pop("query_string", None)
    for exc in (event.get("exception") or {}).get("values") or []:
        exc["value"] = _strip_secrets(exc.get("value"))
    if "message" in event:
        event["message"] = _strip_secrets(event["message"])
    return event


def init_sentry() -> bool:
    if not SENTRY_DSN:
        return False
    import sentry_sdk
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.getenv("VERCEL_ENV") or os.getenv("SENTRY_ENVIRONMENT") or "development",
        release=os.getenv("VERCEL_GIT_COMMIT_SHA") or None,
        send_default_pii=False,
        max_request_body_size="never",
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0")),
        before_send=_before_send,
        before_breadcrumb=_before_breadcrumb,
    )
    return True


def flush() -> None:
    """Serverless instances can freeze right after a response; send queued events first."""
    if SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.flush(timeout=2)
