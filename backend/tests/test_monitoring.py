"""Error reports never carry student answers, passwords or API keys."""
from app import monitoring


def test_request_bodies_cookies_and_keys_are_removed():
    event = {
        "request": {"url": "https://x/api", "data": {"password": "Asha2026x"}, "cookies": {"s": "1"}, "query_string": "a=1"},
        "exception": {"values": [{"value": "HTTP 500 for https://generativelanguage.googleapis.com/v1beta/m:gen?key=AIzaSECRET"}]},
        "message": "failed ?access_token=abc&x=1",
    }
    out = monitoring._before_send(event, {})
    assert "data" not in out["request"] and "cookies" not in out["request"] and "query_string" not in out["request"]
    assert "AIzaSECRET" not in out["exception"]["values"][0]["value"]
    assert "abc" not in out["message"]


def test_outbound_call_breadcrumbs_lose_their_query_string():
    crumb = {"category": "httplib", "data": {"url": "https://generativelanguage.googleapis.com/v1beta/m:gen?key=AIzaSECRET",
                                             "http.query": "key=AIzaSECRET"}}
    out = monitoring._before_breadcrumb(crumb, {})
    assert out["data"]["url"].endswith(":gen") and "http.query" not in out["data"]


def test_monitoring_is_off_without_a_dsn():
    assert monitoring.init_sentry() is False
