"""
Request/response models for the /api/explain endpoint.

Gemini explains values already parsed by the backend — it does not parse reports.
"""

from typing import Literal

from pydantic import BaseModel, Field


class ParameterExplainInput(BaseModel):
    """One lab parameter to explain (backend is source of truth for status)."""

    parameter: str = Field(..., min_length=1)
    value: float
    unit: str = Field(..., min_length=1)
    status: Literal["normal", "borderline", "abnormal"]
    # Optional context for richer explanations (not re-computed by Gemini)
    normal_min: float | None = None
    normal_max: float | None = None


class ExplainRequest(BaseModel):
    """POST body for /api/explain."""

    parameters: list[ParameterExplainInput] = Field(..., min_length=1)
    language: Literal["english", "hindi"] = "english"


class ExplainedParameter(BaseModel):
    """Plain-language explanation for a single parameter."""

    parameter: str
    explanation: str
    action: str


class ExplainResponse(BaseModel):
    """Combined urgency overview and per-parameter explanations."""

    urgency_level: Literal["low", "medium", "high"]
    urgency_summary: str
    explained_parameters: list[ExplainedParameter]
    used_fallback: bool = Field(
        default=False,
        description="True when template fallback was used instead of Gemini",
    )
