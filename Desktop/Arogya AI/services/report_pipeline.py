"""
Upload pipeline helpers: text extraction and lab-parameter parsing.

Keeps routes/upload.py thin — orchestration only, logic lives here.
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from schemas.report_schema import FileType, LabParameter
from services.ocr_service import extract_text_from_image
from services.pdf_service import extract_text_from_pdf
from services.parser_service import ParseResult, parse_lab_report

logger = logging.getLogger(__name__)

# Fields returned to the client (parser may include extra internal keys)
_API_PARAMETER_FIELDS = (
    "parameter",
    "value",
    "unit",
    "normal_min",
    "normal_max",
    "status",
)


class ExtractionError(Exception):
    """Raised when text cannot be extracted from the uploaded file."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ParseError(Exception):
    """Raised when parser output is invalid or cannot be normalized."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def extract_report_text(file_path: str | Path, file_type: FileType) -> tuple[str, int]:
    """
    Step 1 — Extract plain text from a saved upload (PDF or image).

    Returns:
        Tuple of (raw_text, page_count).

    Raises:
        ExtractionError: On empty text or underlying extraction failure.
    """
    path = Path(file_path)

    try:
        if file_type == FileType.PDF:
            raw_text, page_count = extract_text_from_pdf(path)
        else:
            raw_text = extract_text_from_image(path)
            page_count = 1
    except Exception as exc:
        logger.exception("Text extraction failed for %s", path)
        raise ExtractionError(f"Text extraction failed: {exc}") from exc

    logger.debug("Extracted text length: %d characters", len(raw_text or ""))
    print(f"[upload] extracted text length: {len(raw_text or '')}")

    if not raw_text or not raw_text.strip():
        raise ExtractionError("No text could be extracted from the file.")

    return raw_text, page_count


def _sanitize_parameter_record(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Pick API-facing fields and reject malformed parser rows early.
    """
    missing = [f for f in _API_PARAMETER_FIELDS if f not in raw]
    if missing:
        raise ParseError(f"Parser record missing fields: {', '.join(missing)}")

    value = raw["value"]
    if not isinstance(value, (int, float)):
        raise ParseError(f"Non-numeric value for {raw.get('parameter', 'unknown')}")
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        raise ParseError(f"Invalid numeric value for {raw.get('parameter', 'unknown')}")

    return {field: raw[field] for field in _API_PARAMETER_FIELDS}


def parse_report_parameters(raw_text: str) -> list[LabParameter]:
    """
    Step 2 — Parse extracted text into validated lab parameters.

    Flow: parse_lab_report → validate each record → LabParameter models.

    Returns:
        List of validated LabParameter instances.

    Raises:
        ParseError: On parser errors or invalid/malformed parameter records.
    """
    parse_result: ParseResult = parse_lab_report(raw_text)

    if parse_result.errors:
        raise ParseError("; ".join(parse_result.errors))

    if parse_result.warnings:
        for warning in parse_result.warnings:
            logger.debug("Parser warning: %s", warning)

    if not parse_result.parameters:
        return []

    validated: list[LabParameter] = []

    for index, raw in enumerate(parse_result.parameters):
        if not isinstance(raw, dict):
            raise ParseError(f"Invalid parser output at index {index}: expected object")

        try:
            cleaned = _sanitize_parameter_record(raw)
            validated.append(LabParameter.model_validate(cleaned))
        except (ParseError, ValidationError) as exc:
            name = raw.get("parameter", f"index {index}")
            raise ParseError(f"Malformed parameter '{name}': {exc}") from exc

    logger.debug("Parameters parsed: %d", len(validated))
    print(f"[upload] parameters parsed: {len(validated)}")

    return validated
