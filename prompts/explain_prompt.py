"""
Prompt templates for LLM lab-value explanations.

The LLM must NOT parse reports or change statuses — only explain provided data.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

_trace_logger = logging.getLogger(__name__)

# Appended once on urgency_summary by the backend (not per-parameter)
MEDICAL_DISCLAIMER = (
    "Please consult your doctor before making any health decisions."
)

SUPPORTED_LANGUAGES = ("english", "hindi")

_PLACEHOLDER_PARAMETER_NAMES = frozenset(
    {
        "string",
        "parameter",
        "parameter name",
        "name",
        "test name",
        "lab parameter",
        "example",
        "n/a",
        "na",
        "null",
        "undefined",
        "text",
    }
)


def _language_label(language: str) -> str:
    return "Hindi" if language == "hindi" else "English"


def normalize_language(language: str) -> str:
    """Normalize request language to a supported value."""
    normalized = (language or "english").strip().lower()
    return normalized if normalized in SUPPORTED_LANGUAGES else "english"


def _build_schema_example(parameters: list[dict[str, Any]], language: str) -> str:
    """Concrete JSON example in the target language (avoids 'string' placeholders)."""
    lang = normalize_language(language)

    if parameters:
        sample_name = str(parameters[0].get("parameter", "Hemoglobin"))
        sample_value = parameters[0].get("value", 14.2)
        sample_unit = str(parameters[0].get("unit", "g/dL"))
        sample_status = str(parameters[0].get("status", "normal"))
    else:
        sample_name, sample_value, sample_unit, sample_status = "Hemoglobin", 14.2, "g/dL", "normal"

    if lang == "hindi":
        example = {
            "urgency_level": "low",
            "urgency_summary": (
                "आपके अधिकांश परिणाम सामान्य सीमा में हैं। "
                "नियमित फॉलो-अप के लिए अपने डॉक्टर से मिलें।"
            ),
            "explained_parameters": [
                {
                    "parameter": sample_name,
                    "explanation": (
                        f"आपका {sample_name} {sample_value} {sample_unit} है, "
                        f"जो दिए गए स्थिति ({sample_status}) के अनुसार है।"
                    ),
                    "action": "नियमित जांच और डॉक्टर की सलाह जारी रखें।",
                }
            ],
        }
    else:
        example = {
            "urgency_level": "low",
            "urgency_summary": (
                "Your results are mostly within expected ranges. "
                "Follow up with your doctor as needed."
            ),
            "explained_parameters": [
                {
                    "parameter": sample_name,
                    "explanation": (
                        f"Your {sample_name} is {sample_value} {sample_unit}, "
                        f"which is {sample_status} based on the provided status."
                    ),
                    "action": "Continue routine follow-up with your doctor.",
                }
            ],
        }

    return json.dumps(example, ensure_ascii=False, indent=2)


def build_system_instruction(language: str) -> str:
    """
    System rules: tone, safety, strict JSON output shape.
    """
    lang = normalize_language(language)
    label = _language_label(lang)

    return f"""You are a helpful health literacy assistant for patients.

Your job is to explain lab results that were ALREADY parsed and classified by a hospital backend.
You must NOT parse reports, guess values, or change statuses.

LANGUAGE:
- You MUST respond entirely in {lang}.

Content rules:
- Do NOT provide a medical diagnosis or name specific diseases.
- Be specific: reference the exact parameter name, value, unit, and status from the input.
- Keep each explanation concise (1-2 sentences), patient-friendly, and non-generic.
- Use the provided status (normal, borderline, abnormal) — do not recalculate ranges.
- Give a practical, short "action" for each parameter (follow-up, lifestyle, consult doctor).
- You MUST preserve the original parameter names from input exactly (same spelling/casing).
- Do not use placeholder values like "string", "parameter", "example", or schema type names.
- Do NOT include the medical disclaimer in explanation or action fields (the backend adds it once).

Output rules (critical):
- Return ONLY valid JSON. No markdown. No code fences. No extra text before or after the JSON.
- Do not wrap the JSON in ```json blocks.
- Do not add comments inside the JSON.
- Every patient-facing string must be in {label} only.
"""


def build_user_prompt(parameters: list[dict[str, Any]], language: str) -> str:
    """
    User message: structured parameters the backend already validated.
    """
    lang = normalize_language(language)
    label = _language_label(lang)
    payload = json.dumps(parameters, ensure_ascii=False, indent=2)
    schema_example = _build_schema_example(parameters, lang)
    param_names = [str(p.get("parameter", "")) for p in parameters if p.get("parameter")]

    return f"""Explain the following lab parameters.

REQUESTED OUTPUT LANGUAGE: {label}
You MUST respond entirely in {lang}.

Required parameter names (use exactly as written, in English): {", ".join(param_names)}

Input data (authoritative — do not change values or statuses):
{payload}

Return JSON matching this structure and field types. Replace example text with real explanations for EVERY input row:

{schema_example}

Requirements:
- One explained_parameters entry per input row, in the same order.
- "parameter" must be the exact English name from input (not "string" or placeholders).
- "urgency_level" must be "low", "medium", or "high" based on the overall pattern of statuses.
- "urgency_summary" is a brief overall summary (2-3 sentences max) in {label} only, without the disclaimer.
- All explanation and action text must be in {label} only.
"""


def build_strict_retry_user_prompt(
    parameters: list[dict[str, Any]],
    language: str,
) -> str:
    """Stricter instruction after invalid JSON or schema violations."""
    lang = normalize_language(language)
    label = _language_label(lang)
    payload = json.dumps(parameters, ensure_ascii=False, indent=2)
    schema_example = _build_schema_example(parameters, lang)

    return f"""Your previous response was invalid or incomplete.
Return ONLY a single JSON object. No markdown. No code blocks. No extra text.

REQUESTED OUTPUT LANGUAGE: {label}
You MUST respond entirely in {lang}.

Input parameters:
{payload}

Exact JSON schema (fill with real content for all {len(parameters)} parameters, in {label}):

{schema_example}

You MUST preserve original parameter names from input. Do not use "string" or placeholders.
"""


def build_full_prompt(parameters: list[dict[str, Any]], language: str) -> str:
    """Combine system instruction and user payload (legacy single-string callers)."""
    system = build_system_instruction(language)
    user = build_user_prompt(parameters, language)
    return f"{system}\n\n---\n\n{user}"


def _strip_code_fences(text: str) -> str:
    """Remove optional ```json ... ``` wrappers from model output."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


def _extract_json_object(text: str) -> str:
    """Find the outermost JSON object in noisy model output."""
    text = _strip_code_fences(text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def is_placeholder_parameter(name: str) -> bool:
    """True if the model returned a schema placeholder instead of a real name."""
    normalized = (name or "").strip().lower()
    if not normalized:
        return True
    return normalized in _PLACEHOLDER_PARAMETER_NAMES


def strip_disclaimer(text: str) -> str:
    """Remove disclaimer text so it can be applied once globally."""
    if not text:
        return ""
    cleaned = text.replace(MEDICAL_DISCLAIMER, " ")
    cleaned = re.sub(
        r"please\s+consult\s+your\s+doctor[^.]*\.",
        " ",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def collapse_repeated_phrases(text: str) -> str:
    """Remove consecutive duplicate sentences/phrases from model output."""
    if not text:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    seen: set[str] = set()
    unique: list[str] = []
    for part in parts:
        key = part.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(part.strip())
    return " ".join(unique)


def cleanup_explanation_text(text: str) -> str:
    """Normalize a single explanation field."""
    cleaned = strip_disclaimer(str(text))
    cleaned = collapse_repeated_phrases(cleaned)
    return cleaned.strip()


# Hindi translation of the medical disclaimer (appended to urgency_summary for Hindi responses).
MEDICAL_DISCLAIMER_HI = (
    "कोई भी स्वास्थ्य निर्णय लेने से पहले कृपया अपने डॉक्टर से परामर्श करें।"
)


def apply_global_disclaimer(summary: str, language: str = "english") -> str:
    """
    Append the medical disclaimer exactly once to urgency_summary.

    Uses the Hindi disclaimer for Hindi responses so no English sentence leaks
    into an otherwise all-Devanagari urgency_summary.
    """
    lang = normalize_language(language)
    cleaned = strip_disclaimer(summary)
    if not cleaned:
        cleaned = (
            "इन परिणामों की समीक्षा अपने डॉक्टर से करें।"
            if lang == "hindi"
            else "Review these results with your doctor."
        )
    disclaimer = MEDICAL_DISCLAIMER_HI if lang == "hindi" else MEDICAL_DISCLAIMER
    return f"{cleaned.rstrip()} {disclaimer}"


def parse_gemini_json(raw_text: str) -> dict[str, Any]:
    """
    Parse LLM JSON response.

    Raises:
        ValueError: If content is not valid JSON or missing required keys.
        json.JSONDecodeError: If JSON syntax is invalid.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty model response")

    cleaned = _extract_json_object(raw_text)
    data = json.loads(cleaned)

    if not isinstance(data, dict):
        raise ValueError("Response must be a JSON object")

    for key in ("urgency_level", "urgency_summary", "explained_parameters"):
        if key not in data:
            raise ValueError(f"Missing required key: {key}")

    if not isinstance(data["explained_parameters"], list):
        raise ValueError("explained_parameters must be a list")

    urgency = data.get("urgency_level")
    if urgency not in ("low", "medium", "high"):
        raise ValueError(f"Invalid urgency_level: {urgency!r}")

    return data
