"""
Image OCR using Tesseract via pytesseract.

Pipeline: load image → preprocess → Tesseract OCR → text cleanup.
Designed for scanned pathology / lab report photos in demo uploads.
"""

from __future__ import annotations

import io
import logging
import os
import re
from pathlib import Path

import pytesseract
from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Windows default; override with TESSERACT_CMD in .env on other platforms
_DEFAULT_TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
_tesseract_cmd = os.getenv("TESSERACT_CMD", _DEFAULT_TESSERACT_CMD)
pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd

# Tesseract tuning: LSTM engine (oem 3), single uniform text block (psm 6)
TESSERACT_OCR_CONFIG = "--oem 3 --psm 6"
TESSERACT_LANG = "eng"

SUPPORTED_EXTENSIONS: frozenset[str] = frozenset(
    {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}
)
SUPPORTED_PIL_FORMATS: frozenset[str] = frozenset(
    {"PNG", "JPEG", "JPG", "WEBP", "BMP", "TIFF"}
)


class UnsupportedImageFormatError(ValueError):
    """Raised when the file extension or image format is not supported."""


class CorruptedImageError(ValueError):
    """Raised when the file cannot be decoded as a valid image."""


class OCRExtractionError(RuntimeError):
    """Raised when Tesseract fails or returns unusable output."""


def is_supported_image_path(path: Path) -> bool:
    """Return True if the path has a supported image extension."""
    return path.suffix.lower() in SUPPORTED_EXTENSIONS


def clean_ocr_text(text: str) -> str:
    """
    Normalize OCR output for downstream regex parsing.

    - Collapse runs of spaces/tabs
    - Trim trailing spaces on each line
    - Collapse 3+ blank lines to a single blank line
    - Strip leading/trailing whitespace from the full document
    """
    if not text:
        return ""

    # Normalize Windows/Mac line endings
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    lines: list[str] = []
    for line in normalized.split("\n"):
        # OCR often inserts extra spaces between characters on scanned tables
        collapsed = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(collapsed)

    joined = "\n".join(lines)
    # Keep paragraph breaks but remove large vertical gaps from page noise
    joined = re.sub(r"\n{3,}", "\n\n", joined)
    return joined.strip()


def preprocess_image_for_ocr(
    img: Image.Image,
    *,
    apply_threshold: bool = True,
    contrast_factor: float = 1.8,
    threshold_cutoff: int = 140,
) -> Image.Image:
    """
    Prepare a PIL image for Tesseract on scanned documents.

    1. Convert to grayscale (single channel, less noise for OCR)
    2. Auto-contrast + manual contrast boost (faded scans, uneven lighting)
    3. Optional binarization threshold (sharpens text vs background)
    """
    if img.mode != "L":
        gray = img.convert("L")
    else:
        gray = img.copy()

    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = ImageEnhance.Contrast(gray).enhance(contrast_factor)

    if apply_threshold:
        # Simple global threshold; helps faint printed values on white paper
        gray = gray.point(
            lambda pixel: 255 if pixel > threshold_cutoff else 0,
            mode="L",
        )

    return gray


def _load_image(path: Path) -> Image.Image:
    """
    Load and validate an image from disk using an in-memory buffer.

    Buffering catches truncated/corrupt files that PIL might otherwise misread.
    """
    try:
        raw_bytes = path.read_bytes()
    except OSError as exc:
        raise CorruptedImageError(f"Cannot read image file: {path}") from exc

    if not raw_bytes:
        raise CorruptedImageError(f"Image file is empty: {path}")

    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.load()  # force decode; raises on truncated/corrupt data
    except UnidentifiedImageError as exc:
        raise CorruptedImageError(f"Unrecognized or corrupt image: {path}") from exc
    except OSError as exc:
        raise CorruptedImageError(f"Cannot decode image: {path}") from exc

    pil_format = (img.format or "").upper()
    if pil_format and pil_format not in SUPPORTED_PIL_FORMATS:
        raise UnsupportedImageFormatError(
            f"Unsupported image format '{pil_format}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_PIL_FORMATS))}"
        )

    width, height = img.size
    if width < 1 or height < 1:
        raise CorruptedImageError(f"Invalid image dimensions: {width}x{height}")

    logger.debug("Loaded image %s — size %dx%d, mode=%s", path.name, width, height, img.mode)
    return img


def _run_tesseract_ocr(img: Image.Image) -> str:
    """Run Tesseract on a preprocessed PIL image and return raw string output."""
    try:
        return pytesseract.image_to_string(
            img,
            lang=TESSERACT_LANG,
            config=TESSERACT_OCR_CONFIG,
        )
    except pytesseract.TesseractNotFoundError as exc:
        raise OCRExtractionError(
            "Tesseract OCR is not installed or TESSERACT_CMD is incorrect. "
            f"Expected binary at: {_tesseract_cmd}"
        ) from exc
    except pytesseract.TesseractError as exc:
        raise OCRExtractionError(f"Tesseract OCR failed: {exc}") from exc
    except Exception as exc:
        raise OCRExtractionError(f"Unexpected OCR error: {exc}") from exc


def extract_text_from_image(
    file_path: str | Path,
    *,
    apply_threshold: bool = True,
) -> str:
    """
    Run the full OCR pipeline on an image file.

    Flow:
        validate path/format → load image → preprocess → Tesseract → clean_ocr_text

    Args:
        file_path: Path to JPG, PNG, JPEG, WEBP, BMP, or TIFF on disk.
        apply_threshold: When True, binarize after contrast enhancement.

    Returns:
        Cleaned plain text suitable for parser_service.

    Raises:
        UnsupportedImageFormatError: Bad extension or PIL format.
        CorruptedImageError: Missing, empty, or undecodable file.
        OCRExtractionError: Tesseract missing or runtime failure.
    """
    path = Path(file_path)

    if not path.is_file():
        raise CorruptedImageError(f"Image not found: {path}")

    if not is_supported_image_path(path):
        raise UnsupportedImageFormatError(
            f"Unsupported image extension '{path.suffix}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    logger.debug("Starting OCR for %s (threshold=%s)", path, apply_threshold)

    width, height = 0, 0
    try:
        with _load_image(path) as img:
            width, height = img.size
            # RGB/L modes both work; preprocessing always converts to grayscale
            if img.mode in ("RGBA", "P", "CMYK"):
                img = img.convert("RGB")

            processed = preprocess_image_for_ocr(img, apply_threshold=apply_threshold)
            raw_text = _run_tesseract_ocr(processed)
    except (UnsupportedImageFormatError, CorruptedImageError):
        logger.warning("OCR preprocessing failed for %s", path)
        raise
    except OCRExtractionError:
        logger.warning("OCR engine failed for %s", path)
        raise

    cleaned = clean_ocr_text(raw_text)
    text_len = len(cleaned)

    if text_len == 0:
        logger.warning(
            "OCR completed for %s (%dx%d) but no text detected",
            path.name,
            width,
            height,
        )
    else:
        logger.debug(
            "OCR success for %s (%dx%d) — text length %d characters",
            path.name,
            width,
            height,
            text_len,
        )

    return cleaned
