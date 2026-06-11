"""Authentication utilities."""

import httpx
from fastapi import Request, HTTPException

from app.config import get_settings

settings = get_settings()
_auth_cache: dict[str, dict] = {}


async def verify_token(request: Request) -> dict:
    """Verify Bearer token by calling Go backend GET /api/auth/me."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header[7:]
    if token in _auth_cache:
        return _auth_cache[token]

    resp = httpx.get(
        f"{settings.backend_url}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = resp.json().get("data", {})
    _auth_cache[token] = user
    return user


def get_token_from_request(request: Request) -> str:
    """Extract raw token from request."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return ""
