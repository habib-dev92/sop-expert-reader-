from fastapi import Request, HTTPException
from typing import List


async def validate_file_size(request: Request):
    """Validate upload file size."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")


async def get_pagination_params(page: int = 1, limit: int = 20):
    """Get pagination parameters."""
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20
    return {"page": page, "limit": limit}
