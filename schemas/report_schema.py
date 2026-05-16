"""
Response models for report upload, extraction, and structured lab parameters.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class FileType(str, Enum):
    """Supported upload file categories."""

    PDF = "pdf"
    IMAGE = "image"


class LabParameter(BaseModel):
    """One parsed lab value with reference range and clinical status."""

    parameter: str = Field(..., min_length=1)
    value: float = Field(..., description="Numeric result")
    unit: str = Field(..., min_length=1)
    normal_min: float
    normal_max: float
    status: Literal["normal", "borderline", "abnormal"]

    @field_validator("value")
    @classmethod
    def value_must_be_finite(cls, v: float) -> float:
        if v != v or v in (float("inf"), float("-inf")):  # NaN / inf
            raise ValueError("value must be a finite number")
        if v < 0:
            raise ValueError("value must be non-negative")
        return v


class ExtractionResponse(BaseModel):
    """
    Full upload pipeline result: extraction + parsed parameters.

    When success is False, message explains the failure; other fields may
    still be present (e.g. raw_text) to aid debugging.
    """

    success: bool = Field(..., description="Whether parameters were parsed successfully")
    filename: str = Field(default="", description="Original uploaded filename")
    file_type: FileType | None = Field(default=None, description="Detected file category")
    raw_text: str = Field(default="", description="Extracted plain text from the document")
    page_count: int = Field(default=0, ge=0, description="Pages processed (1 for images)")
    parameters: list[LabParameter] = Field(
        default_factory=list,
        description="Structured lab parameters with status",
    )
    message: str = Field(default="", description="Human-readable status or error message")
