from __future__ import annotations

import hmac
import hashlib
import json
import time
from typing import Any

from fastapi import Depends, HTTPException, Request, status

from app.config import settings


def _decode_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a HS256 JWT manually (matching other ERP services)."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT structure")

    header_b64, payload_b64, signature_b64 = parts

    # Verify signature
    expected_sig = hmac.new(
        settings.jwt_secret.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256,
    ).digest()

    # base64url encode the expected signature
    import base64

    expected_b64 = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
    if not hmac.compare_digest(signature_b64, expected_b64):
        raise ValueError("Invalid JWT signature")

    # Decode payload
    padded = payload_b64 + "=" * (4 - len(payload_b64) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded))

    # Check expiry
    if payload.get("exp") and payload["exp"] < time.time():
        raise ValueError("Token expired")

    # Check issuer
    if payload.get("iss") and payload["iss"] != settings.jwt_issuer:
        raise ValueError("Invalid issuer")

    if not payload.get("tenant_id"):
        raise ValueError("Missing tenant_id in JWT")

    return payload


def get_current_user(request: Request) -> dict[str, Any]:
    """Extract the authenticated user from the request (set by JWTMiddleware)."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def get_tenant_id(user: dict[str, Any] = Depends(get_current_user)) -> str:
    """Extract tenant_id from the authenticated user."""
    tenant_id = user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing tenant_id")
    return tenant_id
