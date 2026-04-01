from __future__ import annotations

import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.api.dependencies import _decode_jwt

logger = logging.getLogger(__name__)

# Paths that skip JWT validation
_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}


class JWTMiddleware(BaseHTTPMiddleware):
    """Validate JWT on every request, extract tenant_id and user info."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in _PUBLIC_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth_header[7:]
        try:
            payload = _decode_jwt(token)
            tenant_id = payload.get("tenant_id") or payload.get("tenantId", "")
            # org_id falls back to tenant_id for backward compatibility
            org_id = payload.get("org_id") or payload.get("orgId") or tenant_id
            request.state.user = {
                "user_id": payload.get("sub", ""),
                "tenant_id": tenant_id,
                "org_id": org_id,
                "org_role": payload.get("org_role") or payload.get("orgRole"),
                "roles": payload.get("roles", []),
                "email": payload.get("email", ""),
            }
        except Exception as exc:
            logger.warning("JWT validation failed: %s", exc)
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        return await call_next(request)
