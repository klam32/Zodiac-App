from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse

from app.main import app


FRONTEND_DIST = Path(__file__).resolve().parent / "frontend" / "dist"


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    if full_path.startswith(("api/", "ws/")):
        raise HTTPException(status_code=404, detail="Not found")

    if not FRONTEND_DIST.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    requested_file = (FRONTEND_DIST / full_path).resolve()
    if requested_file.is_file() and FRONTEND_DIST in requested_file.parents:
        return FileResponse(requested_file)

    return FileResponse(FRONTEND_DIST / "index.html")
