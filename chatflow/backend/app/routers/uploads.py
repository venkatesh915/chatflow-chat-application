import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from app.config import settings
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

ALLOWED_EXTENSIONS = {
    # Images
    "jpg", "jpeg", "png", "gif", "webp", "svg",
    # Audio
    "mp3", "wav", "ogg", "webm", "m4a", "aac", "opus", "mp4",
    # Documents
    "pdf", "doc", "docx", "txt", "zip", "csv", "xlsx"
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    original_name = file.filename or "file"
    ext = original_name.split(".")[-1].lower() if "." in original_name else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not allowed. Supported formats: images, pdf, doc, txt, zip."
        )

    # Generate unique safe filename
    unique_filename = f"{uuid.uuid4().hex}_{os.path.basename(original_name)}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    file_size = 0
    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File size exceeds maximum limit of 25MB."
                    )
                await buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    file_url = f"/api/uploads/{unique_filename}"
    return {
        "file_url": file_url,
        "file_name": original_name,
        "file_type": file.content_type or "application/octet-stream",
        "file_size": file_size
    }

@router.get("/{filename}")
async def get_uploaded_file(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")
    return FileResponse(file_path)
