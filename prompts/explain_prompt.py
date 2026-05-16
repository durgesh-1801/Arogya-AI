"""
Prompt templates for Gemini lab-value explanations.

Gemini must NOT parse reports or change statuses — only explain provided data.
"""

from __future__ import annotations

import json
import re
from typing import Any

# Required in every patient-facing response
MEDICAL_DISCLAIMER = (
    "Please consult your doctor before making any health decisions."
)

SUPPORTED_LANGUAGES = ("english", "hindi")


def _language_label(language: str) -> str:
    return "Hindi" if language == "hindi" else "English"


def build_system_instruction(language: str) -> str:
    """
    System rules for Gemini: tone, safety, output shape.
    """
    lang = _language_label(language)
    return f"""You are a helpful health literacy assistant for patients in India.

Your job is to explain lab results that were ALREADY parsed and classified by a hospital backend.
You must NOT parse reports, guess values, or change statuses.

Write all explanations in {lang}.

Rules:
- Do NOT provide a medical diagnosis or name specific diseases.
- Keep each explanation short (1-2 sentences), simple, and patient-friendly.
- Use the provided status (normal, borderline, abnormal) — do not recalculate ranges.
- Suggest sensible next steps in "action" (e.g. follow-up test, lifestyle tip, consult doctor).
- End every "explanation" field with this exact sentence: {MEDICAL_DISCLAIMER}
- Also include the same disclaimer at the end of "urgency_summary".

Respond with ONLY valid JSON (no markdown fences) in this exact shape:
{{
  "urgency_level": "low" | "medium" | "high",
  "urgency_summary": "brief overall summary",
  "explained_parameters": [
    {{
      "parameter": "exact name from input",
      "explanation": "plain language text ending with disclaimer",
      "action": "short recommended step"
    }}
  ]
}}
"""


def build_user_prompt(parameters: list[dict[str, Any]], language: str) -> str:
    """
    User message: structured parameters the backend already validated.
    """
    payload = json.dumps(parameters, ensure_ascii=False, indent=2)
    lang = _language_label(language)
    return f"""Explain the following lab parameters in {lang}.
Use only the data below. Return one explained_parameters entry per input row.

Parameters:
{payload}
"""


def build_full_prompt(parameters: list[dict[str, Any]], language: str) -> str:
    """Combine system instruction and user payload for a single generate_content call."""
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


def parse_gemini_json(raw_text: str) -> dict[str, Any]:
    """
    Parse Gemini JSON response.

    Raises:
        ValueError: If content is not valid JSON or missing required keys.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty model response")

    cleaned = _strip_code_fences(raw_text)
    data = json.loads(cleaned)

    if not isinstance(data, dict):
        raise ValueError("Response must be a JSON object")

    for key in ("urgency_level", "urgency_summary", "explained_parameters"):
        if key not in data:
            raise ValueError(f"Missing required key: {key}")

    if not isinstance(data["explained_parameters"], list):
        raise ValueError("explained_parameters must be a list")

    return data
