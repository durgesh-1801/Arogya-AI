"""
Upload validation helpers: file type detection, size limits, temp storage.
"""

import os
import uuid
from pathlib import Path

from fastapi import HTTPException

from schemas.report_schema import FileType

# Extension and MIME mappings for allowed uploads
PDF_EXTENSIONS = {".pdf"}
PDF_MIMES = {"application/pdf"}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp"}
IMAGE_MIMES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
    "image/bmp",
}


def _max_upload_bytes() -> int:
    """Read max upload size from env (default 10 MB)."""
    return int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))


def validate_upload_size(size_bytes: int) -> None:
    """
    Reject uploads that exceed MAX_UPLOAD_BYTES.

    Raises:
        HTTPException: 413 if file is too large.
    """
    limit = _max_upload_bytes()
    if size_bytes > limit:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {limit} bytes.",
        )
    if size_bytes == 0:
        raise HTTPException(status_code=400, detail="Empty file is not allowed.")


def detect_file_type(filename: str, content_type: str | None) -> FileType | None:
    """
    Infer file category from filename extension and optional Content-Type.

    Returns:
        FileType.PDF, FileType.IMAGE, or None if unsupported.
    """
    ext = Path(filename).suffix.lower()
    mime = (content_type or "").lower().split(";")[0].strip()

    if ext in PDF_EXTENSIONS or mime in PDF_MIMES:
        return FileType.PDF
    if ext in IMAGE_EXTENSIONS or mime in IMAGE_MIMES:
        return FileType.IMAGE
    return None


def save_upload_temporarily(contents: bytes, upload_dir: str, suffix: str = "") -> str:
    """
    Write upload bytes to a unique temp file under upload_dir.

    Returns:
        Absolute path to the saved file.
    """
    os.makedirs(upload_dir, exist_ok=True)
    safe_suffix = suffix if suffix.startswith(".") else f".{suffix}" if suffix else ""
    name = f"{uuid.uuid4().hex}{safe_suffix}"
    path = os.path.join(upload_dir, name)
    with open(path, "wb") as f:
        f.write(contents)
    return os.path.abspath(path)
