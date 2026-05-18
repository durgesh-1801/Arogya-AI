"""
Upload endpoint: extract text, parse lab parameters, return structured JSON.

Pipeline:
  Upload File → Extract Text → Parse Parameters → Calculate Status → JSON Response
"""

import logging
import os
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.report_schema import ExtractionResponse, FileType
from services.report_pipeline import (
    ExtractionError,
    ParseError,
    extract_report_text,
    parse_report_parameters,
)
from utils.validators import (
    detect_file_type,
    save_upload_temporarily,
    validate_upload_size,
)

logger = logging.getLogger(__name__)
router = APIRouter()

NO_PARAMETERS_MESSAGE = "No medical parameters detected"


@router.post("/upload", response_model=ExtractionResponse)
async def upload_report(file: UploadFile = File(...)):
    """
    Upload an OPD lab report (PDF or image).

    1. Validate and store the file temporarily
    2. Extract raw text (PyMuPDF or Tesseract OCR)
    3. Parse structured parameters and clinical status
    4. Return combined extraction + parameters payload
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    contents = await file.read()
    validate_upload_size(len(contents))

    file_type = detect_file_type(file.filename, file.content_type)
    if file_type is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use PDF or a common image format.",
        )

    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    temp_path = save_upload_temporarily(
        contents,
        upload_dir,
        suffix=Path(file.filename).suffix
        or (".pdf" if file_type == FileType.PDF else ".png"),
    )

    raw_text = ""
    page_count = 0

    try:
        # --- Step 1: Extract text (PDF or OCR) ---
        raw_text, page_count = extract_report_text(temp_path, file_type)

        # --- Step 2: Parse parameters and assign status vs normal ranges ---
        try:
            parameters = parse_report_parameters(raw_text)
        except ParseError as exc:
            logger.warning("Parse failed for %s: %s", file.filename, exc)
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # --- Step 3: Build response ---
        if not parameters:
            return ExtractionResponse(
                success=False,
                filename=file.filename,
                file_type=file_type,
                raw_text=raw_text,
                page_count=page_count,
                parameters=[],
                message=NO_PARAMETERS_MESSAGE,
            )

        return ExtractionResponse(
            success=True,
            filename=file.filename,
            file_type=file_type,
            raw_text=raw_text,
            page_count=page_count,
            parameters=parameters,
            message=f"Extracted {len(parameters)} medical parameter(s)",
        )

    except ExtractionError as exc:
        logger.warning("Extraction failed for %s: %s", file.filename, exc.message)
        raise HTTPException(status_code=422, detail=exc.message) from exc

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Upload processing failed for %s", file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {exc}",
        ) from exc

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass
