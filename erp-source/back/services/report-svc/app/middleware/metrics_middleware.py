from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Simple in-memory counters — in production, expose via prometheus_client.
_request_count: dict[str, int] = {}
_request_duration: dict[str, float] = {}


class MetricsMiddleware(BaseHTTPMiddleware):
    """Track request count and duration for Prometheus-style metrics."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start

        method = request.method
        path = request.url.path
        status = response.status_code
        key = f"{method} {path} {status}"

        _request_count[key] = _request_count.get(key, 0) + 1
        _request_duration[key] = _request_duration.get(key, 0.0) + duration

        logger.debug("%s %s → %d (%.3fs)", method, path, status, duration)
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        return response


def get_metrics() -> dict[str, dict[str, float | int]]:
    """Return current metrics snapshot (for a /metrics endpoint if needed)."""
    return {
        key: {"count": _request_count[key], "total_duration": _request_duration[key]}
        for key in _request_count
    }
