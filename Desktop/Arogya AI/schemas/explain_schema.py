"""
Request/response models for the /api/explain endpoint.

Values are already parsed by the backend upload pipeline — the LLM only explains them.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# ---------------------------------------------------------------------------
# OpenAPI examples (Swagger UI — avoid generic "string" / 0 placeholders)
# ---------------------------------------------------------------------------

PARAMETER_INPUT_EXAMPLE: dict[str, Any] = {
    "parameter": "Hemoglobin",
    "value": 10.2,
    "unit": "g/dL",
    "status": "abnormal",
    "normal_min": 13.0,
    "normal_max": 17.0,
}

# Default Swagger "Example Value" — English (avoids accidental Hindi in Try-it-out)
EXPLAIN_REQUEST_EXAMPLE: dict[str, Any] = {
    "parameters": [
        {
            "parameter": "Hemoglobin",
            "value": 10.2,
            "unit": "g/dL",
            "status": "abnormal",
            "normal_min": 13.0,
            "normal_max": 17.0,
        },
        {
            "parameter": "Glucose",
            "value": 132,
            "unit": "mg/dL",
            "status": "abnormal",
            "normal_min": 70.0,
            "normal_max": 100.0,
        },
    ],
    "language": "english",
}

EXPLAIN_REQUEST_EXAMPLE_HI: dict[str, Any] = {
    "parameters": [
        {
            "parameter": "Hemoglobin",
            "value": 10.2,
            "unit": "g/dL",
            "status": "abnormal",
            "normal_min": 13.0,
            "normal_max": 17.0,
        },
        {
            "parameter": "Glucose",
            "value": 132,
            "unit": "mg/dL",
            "status": "abnormal",
            "normal_min": 70.0,
            "normal_max": 100.0,
        },
    ],
    "language": "hindi",
}

EXPLAIN_REQUEST_EXAMPLE_EN: dict[str, Any] = {
    "parameters": [
        {
            "parameter": "WBC",
            "value": 11.8,
            "unit": "10^3/µL",
            "status": "borderline",
            "normal_min": 4.5,
            "normal_max": 11.0,
        },
        {
            "parameter": "HbA1c",
            "value": 6.2,
            "unit": "%",
            "status": "borderline",
            "normal_min": 4.0,
            "normal_max": 5.6,
        },
    ],
    "language": "english",
}

EXPLAINED_PARAMETER_EXAMPLE_EN: dict[str, Any] = {
    "parameter": "Hemoglobin",
    "explanation": (
        "Your hemoglobin is 10.2 g/dL, which is below the usual range (13–17 g/dL)."
    ),
    "action": "Discuss this result with your doctor and follow their advice.",
}

EXPLAINED_PARAMETER_EXAMPLE_HI: dict[str, Any] = {
    "parameter": "Hemoglobin",
    "explanation": (
        "आपका हीमोग्लोबिन 10.2 g/dL है, जो सामान्य सीमा (13–17 g/dL) से कम है।"
    ),
    "action": "अपने डॉक्टर से इस परिणाम पर चर्चा करें और आगे की जांच करवाएं।",
}

EXPLAIN_RESPONSE_EXAMPLE: dict[str, Any] = {
    "urgency_level": "high",
    "urgency_summary": (
        "Some of your results are outside the usual ranges, especially hemoglobin and glucose. "
        "Please consult your doctor before making any health decisions."
    ),
    "explained_parameters": [
        EXPLAINED_PARAMETER_EXAMPLE_EN,
        {
            "parameter": "Glucose",
            "explanation": (
                "Your glucose is 132 mg/dL, which is above the usual range (70–100 mg/dL)."
            ),
            "action": "Discuss diet and follow-up testing with your doctor.",
        },
    ],
    "used_fallback": False,
}

EXPLAIN_RESPONSE_EXAMPLE_HI: dict[str, Any] = {
    "urgency_level": "high",
    "urgency_summary": (
        "आपके कुछ परिणाम सामान्य सीमा से बाहर हैं, विशेषकर हीमोग्लोबिन और ग्लूकोज़। "
        "कोई भी स्वास्थ्य निर्णय लेने से पहले कृपया अपने डॉक्टर से परामर्श करें。"
    ),
    "explained_parameters": [
        EXPLAINED_PARAMETER_EXAMPLE_HI,
        {
            "parameter": "Glucose",
            "explanation": (
                "आपकी फास्टिंग ग्लूकोज़ 132 mg/dL है, जो सामान्य सीमा (70–100 mg/dL) से अधिक है।"
            ),
            "action": "डॉक्टर से मिलकर आहार और जीवनशैली पर सलाह लें।",
        },
    ],
    "used_fallback": False,
}


class ParameterExplainInput(BaseModel):
    """One lab parameter to explain (backend is source of truth for status)."""

    model_config = ConfigDict(
        title="Lab parameter input",
        description="A single parsed lab value ready for patient-friendly explanation.",
        json_schema_extra={"example": PARAMETER_INPUT_EXAMPLE},
    )

    parameter: str = Field(
        ...,
        min_length=1,
        description="Name of the lab test",
        examples=["Hemoglobin", "Glucose", "WBC", "HbA1c"],
    )
    value: float = Field(
        ...,
        description="Patient result",
        examples=[10.2, 132, 11.8, 6.2],
    )
    unit: str = Field(
        ...,
        min_length=1,
        description="Measurement unit",
        examples=["g/dL", "mg/dL", "10^3/µL", "%"],
    )
    status: Literal["normal", "borderline", "abnormal"] = Field(
        ...,
        description="Clinical status: normal, borderline, or abnormal (set by backend parser)",
        examples=["normal", "borderline", "abnormal"],
    )
    normal_min: float | None = Field(
        default=None,
        description="Optional reference range lower bound (for context in explanations)",
        examples=[13.0, 70.0, 4.5],
    )
    normal_max: float | None = Field(
        default=None,
        description="Optional reference range upper bound (for context in explanations)",
        examples=[17.0, 100.0, 11.0],
    )


class ExplainRequest(BaseModel):
    """POST body for /api/explain."""

    model_config = ConfigDict(
        title="Explain lab parameters request",
        description=(
            "Structured lab parameters from the upload/parser pipeline, "
            "plus the desired explanation language."
        ),
        json_schema_extra={
            "examples": [
                EXPLAIN_REQUEST_EXAMPLE,
                EXPLAIN_REQUEST_EXAMPLE_HI,
                EXPLAIN_REQUEST_EXAMPLE_EN,
            ],
            "example": EXPLAIN_REQUEST_EXAMPLE,
        },
    )

    parameters: list[ParameterExplainInput] = Field(
        ...,
        min_length=1,
        description="One or more parsed lab parameters to explain",
    )
    language: str = Field(
        default="english",
        description="Language for patient-friendly explanations: 'english' or 'hindi'",
        examples=["english", "hindi"],
    )

    @field_validator("language", mode="before")
    @classmethod
    def _normalize_language(cls, v: object) -> str:
        """
        Accept any casing of 'english' / 'hindi' and normalize to lowercase.

        Examples accepted: 'Hindi', 'ENGLISH', 'English', 'hindi', 'english'.
        Rejects anything else with a clear validation error.
        """
        raw = str(v).strip().lower() if v is not None else "english"
        print("Incoming language (raw):", repr(v), "-> normalized:", raw)
        if raw not in ("english", "hindi"):
            raise ValueError(
                f"language must be 'english' or 'hindi', got {v!r}. "
                "Check for typos or unsupported locale strings."
            )
        return raw


class ExplainedParameter(BaseModel):
    """Plain-language explanation for a single parameter."""

    model_config = ConfigDict(
        title="Explained lab parameter",
        description="Patient-friendly explanation and recommended action for one test.",
        json_schema_extra={"example": EXPLAINED_PARAMETER_EXAMPLE_EN},
    )

    parameter: str = Field(
        ...,
        description="Name of the lab test (matches input parameter name)",
        examples=["Hemoglobin", "Glucose"],
    )
    explanation: str = Field(
        ...,
        description="Short, patient-friendly explanation of the result",
        examples=[
            "आपका हीमोग्लोबिन 10.2 g/dL है, जो सामान्य सीमा से कम है।",
            "Your hemoglobin is 10.2 g/dL, which is below the usual range.",
        ],
    )
    action: str = Field(
        ...,
        description="Practical next step for the patient",
        examples=[
            "अपने डॉक्टर से इस परिणाम पर चर्चा करें।",
            "Discuss this result with your doctor at your next visit.",
        ],
    )


class ExplainResponse(BaseModel):
    """Combined urgency overview and per-parameter explanations."""

    model_config = ConfigDict(
        title="Explain lab parameters response",
        description=(
            "Overall urgency assessment and per-parameter explanations. "
            "The medical disclaimer appears once in urgency_summary."
        ),
        json_schema_extra={
            "example": EXPLAIN_RESPONSE_EXAMPLE,
            "examples": [
                {
                    "summary": "High urgency — abnormal results (English)",
                    "value": EXPLAIN_RESPONSE_EXAMPLE,
                },
                {
                    "summary": "High urgency — abnormal results (Hindi)",
                    "value": EXPLAIN_RESPONSE_EXAMPLE_HI,
                },
            ],
        },
    )

    urgency_level: Literal["low", "medium", "high"] = Field(
        ...,
        description="Overall urgency based on the pattern of parameter statuses",
        examples=["low", "medium", "high"],
    )
    urgency_summary: str = Field(
        ...,
        description="Brief overall summary; includes the medical disclaimer once",
        examples=[
            EXPLAIN_RESPONSE_EXAMPLE["urgency_summary"],
        ],
    )
    explained_parameters: list[ExplainedParameter] = Field(
        ...,
        description="One explanation per input parameter",
    )
    used_fallback: bool = Field(
        default=False,
        description="True when template fallback was used instead of the LLM",
        examples=[False, True],
    )
