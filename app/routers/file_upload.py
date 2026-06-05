from fastapi import APIRouter
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Depends, Form  # noqa: E402, F401
from fastapi.responses import FileResponse  # noqa: E402
from uuid import uuid4
from app.models.file_upload import FileUpload
from app.config import settings
from app.security.security import get_current_admin
from mimetypes import guess_type
import os
import shutil


# Tạo router cho người dùng
router = APIRouter(prefix="/upload-file", tags=["file-upload"])


@router.post("/upload/", response_model=FileUpload)
async def upload_file(
    file: UploadFile = File(...),  # Tệp được upload
):
    try:
        # Ngăn chặn Path Traversal bằng os.path.basename
        safe_filename = os.path.basename(file.filename or "file")
        file_extension = os.path.splitext(safe_filename)[1]
        unique_filename = f"{uuid4()}{file_extension}"
        folder_path = os.path.join(settings.DIR_ROOT, "utils", "download")
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        download_url = f"{router.prefix}/download/{unique_filename}"
        
        return FileUpload(filename=unique_filename, download_url=download_url)
    except Exception:
        raise HTTPException(status_code=404, detail="upload errors")


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    # Validate MIME type
    if file.content_type != "video/mp4":
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ video định dạng .mp4"
        )
    
    # Validate extension
    safe_filename = os.path.basename(file.filename or "video.mp4")
    file_extension = os.path.splitext(safe_filename)[1].lower()
    if file_extension != ".mp4":
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ video định dạng .mp4"
        )

    # Validate size (500MB = 500 * 1024 * 1024 bytes)
    MAX_SIZE = 500 * 1024 * 1024
    try:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
    except Exception:
        size = 0
            
    if size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Video vượt quá dung lượng cho phép (tối đa 500MB)"
        )

    try:
        unique_filename = f"zodiac-guide-{uuid4().hex}.mp4"
        folder_path = os.path.join(settings.DIR_ROOT, "utils", "download", "videos")
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        view_url = f"/api/v1/upload-file/view/videos/{unique_filename}"
        return {
            "url": view_url,
            "filename": unique_filename,
            "content_type": "video/mp4"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải lên video: {str(e)}")


@router.post("/report-evidence")
async def upload_report_evidence(
    file: UploadFile = File(...)
):
    # Validate MIME type
    allowed_content_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP."
        )

    # Validate file extension
    safe_filename = os.path.basename(file.filename or "evidence.png")
    file_extension = os.path.splitext(safe_filename)[1].lower()
    if file_extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP."
        )

    # Validate size (5MB limit)
    MAX_SIZE = 5 * 1024 * 1024
    try:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
    except Exception:
        size = 0

    if size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Ảnh minh chứng không được vượt quá 5MB."
        )

    try:
        unique_filename = f"{uuid4().hex}{file_extension}"
        folder_path = os.path.abspath(os.path.join(settings.DIR_ROOT, "..", "uploads", "report_evidence"))
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        view_url = f"/api/v1/upload-file/view/report_evidence/{unique_filename}"
        return {
            "url": view_url,
            "filename": unique_filename,
            "content_type": file.content_type,
            "size": size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải lên ảnh minh chứng: {str(e)}")


@router.get("/download/{filename:path}")
async def download_file(filename: str):
    """
    API để tải xuống tệp.

    Tham số:
    - `filename`: Tên tệp cần tải xuống.

    Trả về:
    - Nếu tệp tồn tại, trả về tệp dưới dạng phản hồi tải xuống.
    - Nếu tệp không tồn tại, trả về lỗi 404 với thông báo "File not found".
    """
    file_path = os.path.join(os.path.join(settings.DIR_ROOT, "utils", "download"), filename)
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")
    raise HTTPException(status_code=404, detail="File not found")


@router.get("/view/{filename:path}")
async def view_file(filename: str):
    """
    API để xem trước file (hình ảnh, video, audio, v.v.)

    Tham số:
    - `filename`: Tên file cần xem.

    Trả về:
    - File với media type phù hợp nếu tồn tại.
    - 404 nếu không tìm thấy file.
    """
    # Ngăn chặn Path Traversal bằng os.path.basename
    safe_filename = os.path.basename(filename)

    if filename.startswith("report_evidence/"):
        file_path = os.path.abspath(os.path.join(settings.DIR_ROOT, "..", "uploads", "report_evidence", safe_filename))
    elif filename.startswith("videos/"):
        file_path = os.path.abspath(os.path.join(settings.DIR_ROOT, "utils", "download", "videos", safe_filename))
    else:
        file_path = os.path.abspath(os.path.join(settings.DIR_ROOT, "utils", "download", safe_filename))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    media_type, _ = guess_type(file_path)
    media_type = media_type or "application/octet-stream"  # fallback nếu không đoán được

    return FileResponse(
        path=file_path, media_type=media_type, filename=safe_filename, headers={"Content-Disposition": f"inline; filename={safe_filename}"}
    )
