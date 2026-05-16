"""
Image OCR using Tesseract via pytesseract.
"""

import os
from pathlib import Path

import pytesseract
from PIL import Image

# Optional: set Tesseract binary path from environment (common on Windows)
_tesseract_cmd = os.getenv("TESSERACT_CMD")
if _tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd


def extract_text_from_image(file_path: str | Path) -> str:
    """
    Run OCR on an image file and return extracted text.

    Args:
        file_path: Path to the image on disk.

    Returns:
        Extracted text string (may be empty if no text detected).

    Raises:
        ValueError: If the file cannot be opened as an image.
        RuntimeError: If Tesseract is not installed or not on PATH.
    """
    path = Path(file_path)
    if not path.is_file():
        raise ValueError(f"Image not found: {path}")

    try:
        with Image.open(path) as img:
            # Convert to RGB for consistent OCR across modes (RGBA, P, etc.)
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            text = pytesseract.image_to_string(img, lang="eng")
    except pytesseract.TesseractNotFoundError as exc:
        raise RuntimeError(
            "Tesseract OCR is not installed or not on PATH. "
            "Install Tesseract and/or set TESSERACT_CMD in .env"
        ) from exc
    except OSError as exc:
        raise ValueError(f"Cannot open image: {path}") from exc

    return text.strip()
