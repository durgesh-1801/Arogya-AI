"""
Gemini LLM service for plain-language lab explanations.

The backend parser remains the source of truth; Gemini only explains given parameters.
"""

from __future__ import annotations

import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any, Literal

from pydantic import ValidationError

from prompts.explain_prompt import (
    MEDICAL_DISCLAIMER,
    build_full_prompt,
    parse_gemini_json,
)
from schemas.explain_schema import ExplainResponse, ExplainedParameter, ParameterExplainInput

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-1.5-flash"
DEFAULT_TIMEOUT_SECONDS = 30

UrgencyLevel = Literal["low", "medium", "high"]

# ---------------------------------------------------------------------------
# Reusable Gemini client
# ---------------------------------------------------------------------------


class GeminiClient:
    """
    Thin wrapper around google-generativeai for a single model.

    Configured once per process; safe to reuse across requests.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str = DEFAULT_MODEL,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self._model: Any = None
        self._executor = ThreadPoolExecutor(max_workers=4)

        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set; Gemini calls will use fallback only")

    def _get_model(self) -> Any:
        if self._model is None:
            if not self.api_key:
                raise RuntimeError("GEMINI_API_KEY is not configured")
            try:
                import google.generativeai as genai
            except ImportError as exc:
                raise RuntimeError(
                    "google-generativeai is not installed. Run: pip install google-generativeai"
                ) from exc
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
        return self._model

    def generate(self, prompt: str) -> str:
        """
        Call Gemini with a timeout.

        Returns:
            Raw text response from the model.

        Raises:
            RuntimeError: On API errors or timeout.
        """
        model = self._get_model()

        def _call() -> str:
            response = model.generate_content(prompt)
            if not response or not response.text:
                raise RuntimeError("Gemini returned an empty response")
            return response.text

        try:
            future = self._executor.submit(_call)
            return future.result(timeout=self.timeout_seconds)
        except FuturesTimeoutError as exc:
            logger.error("Gemini request timed out after %ss", self.timeout_seconds)
            raise RuntimeError(f"Gemini request timed out after {self.timeout_seconds}s") from exc
        except Exception as exc:
            logger.exception("Gemini generate_content failed")
            raise RuntimeError(f"Gemini API error: {exc}") from exc


# Module-level client (lazy)
_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Return a shared GeminiClient instance."""
    global _client
    if _client is None:
        timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS)))
        model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
        _client = GeminiClient(
            api_key=os.getenv("GEMINI_API_KEY"),
            model_name=model,
            timeout_seconds=timeout,
        )
    return _client


# ---------------------------------------------------------------------------
# Fallback templates (no Gemini)
# ---------------------------------------------------------------------------

_FALLBACK_EN: dict[str, dict[str, str]] = {
    "normal": {
        "explanation": "Your {name} result ({value} {unit}) is within the usual reference range.",
        "action": "Continue routine check-ups as advised by your doctor.",
    },
    "borderline": {
        "explanation": "Your {name} result ({value} {unit}) is slightly outside the usual range.",
        "action": "Discuss this result with your doctor at your next visit.",
    },
    "abnormal": {
        "explanation": "Your {name} result ({value} {unit}) is outside the usual reference range.",
        "action": "Consult a doctor to review this result.",
    },
}

_FALLBACK_HI: dict[str, dict[str, str]] = {
    "normal": {
        "explanation": "आपका {name} परिणाम ({value} {unit}) सामान्य सीमा के अंदर है।",
        "action": "अपने डॉक्टर की सलाह के अनुसार नियमित जांच जारी रखें।",
    },
    "borderline": {
        "explanation": "आपका {name} परिणाम ({value} {unit}) सामान्य सीमा के थोड़ा बाहर है।",
        "action": "अगली मुलाकात में डॉक्टर से इस परिणाम पर चर्चा करें।",
    },
    "abnormal": {
        "explanation": "आपका {name} परिणाम ({value} {unit}) सामान्य सीमा से बाहर है।",
        "action": "इस परिणाम की समीक्षा के लिए डॉक्टर से परामर्श करें।",
    },
}


def _ensure_disclaimer(text: str) -> str:
    if MEDICAL_DISCLAIMER not in text:
        return f"{text.rstrip()} {MEDICAL_DISCLAIMER}"
    return text


def _derive_urgency_level(statuses: list[str]) -> UrgencyLevel:
    if any(s == "abnormal" for s in statuses):
        return "high"
    if any(s == "borderline" for s in statuses):
        return "medium"
    return "low"


def _fallback_urgency_summary(level: UrgencyLevel, language: str) -> str:
    if language == "hindi":
        summaries = {
            "low": "आपके परिणाम ज्यादातर सामान्य सीमा में हैं।",
            "medium": "कुछ परिणाम सीमा के करीब या थोड़े बाहर हैं।",
            "high": "एक या अधिक परिणाम सामान्य सीमा से बाहर हैं।",
        }
    else:
        summaries = {
            "low": "Most of your results appear within the usual ranges.",
            "medium": "Some results are near or slightly outside the usual ranges.",
            "high": "One or more results are outside the usual reference ranges.",
        }
    return _ensure_disclaimer(summaries[level])


def generate_fallback_explanations(
    parameters: list[ParameterExplainInput],
    language: str,
) -> ExplainResponse:
    """
    Template-based explanations when Gemini is unavailable or fails.
    """
    templates = _FALLBACK_HI if language == "hindi" else _FALLBACK_EN
    explained: list[ExplainedParameter] = []

    for param in parameters:
        tpl = templates.get(param.status, templates["borderline"])
        explanation = tpl["explanation"].format(
            name=param.parameter,
            value=param.value,
            unit=param.unit,
        )
        explained.append(
            ExplainedParameter(
                parameter=param.parameter,
                explanation=_ensure_disclaimer(explanation),
                action=tpl["action"],
            )
        )

    statuses = [p.status for p in parameters]
    urgency = _derive_urgency_level(statuses)

    logger.info("Using fallback explanations for %d parameter(s)", len(parameters))

    return ExplainResponse(
        urgency_level=urgency,
        urgency_summary=_fallback_urgency_summary(urgency, language),
        explained_parameters=explained,
        used_fallback=True,
    )


def _parameters_to_payload(parameters: list[ParameterExplainInput]) -> list[dict[str, Any]]:
    """Serialize request models for the prompt (no extra inference fields)."""
    rows: list[dict[str, Any]] = []
    for p in parameters:
        row: dict[str, Any] = {
            "parameter": p.parameter,
            "value": p.value,
            "unit": p.unit,
            "status": p.status,
        }
        if p.normal_min is not None:
            row["normal_min"] = p.normal_min
        if p.normal_max is not None:
            row["normal_max"] = p.normal_max
        rows.append(row)
    return rows


def _validate_gemini_response(
    data: dict[str, Any],
    expected_parameters: list[ParameterExplainInput],
    language: str = "english",
) -> ExplainResponse:
    """Map parsed JSON to Pydantic models and ensure disclaimer presence."""
    urgency = data.get("urgency_level", "medium")
    if urgency not in ("low", "medium", "high"):
        urgency = _derive_urgency_level([p.status for p in expected_parameters])

    summary = _ensure_disclaimer(str(data.get("urgency_summary", "")))

    explained_raw = data.get("explained_parameters", [])
    explained: list[ExplainedParameter] = []

    for item in explained_raw:
        if not isinstance(item, dict):
            continue
        explained.append(
            ExplainedParameter(
                parameter=str(item.get("parameter", "")),
                explanation=_ensure_disclaimer(str(item.get("explanation", ""))),
                action=str(item.get("action", "Consult your doctor")),
            )
        )

    # Align count with input — pad missing entries from fallback templates if needed
    if len(explained) < len(expected_parameters):
        logger.warning(
            "Gemini returned %d explanations for %d parameters; padding with fallback",
            len(explained),
            len(expected_parameters),
        )
        fallback = generate_fallback_explanations(expected_parameters, language)
        explained_by_name = {e.parameter: e for e in explained}
        merged: list[ExplainedParameter] = []
        for param in expected_parameters:
            if param.parameter in explained_by_name:
                merged.append(explained_by_name[param.parameter])
            else:
                fb = next(
                    (e for e in fallback.explained_parameters if e.parameter == param.parameter),
                    None,
                )
                merged.append(
                    fb
                    or ExplainedParameter(
                        parameter=param.parameter,
                        explanation=_ensure_disclaimer(
                            f"Your {param.parameter} result needs review."
                        ),
                        action="Consult a doctor",
                    )
                )
        explained = merged

    return ExplainResponse(
        urgency_level=urgency,
        urgency_summary=summary,
        explained_parameters=explained,
        used_fallback=False,
    )


def explain_parameters(
    parameters: list[ParameterExplainInput],
    language: str = "english",
) -> ExplainResponse:
    """
    Generate patient-friendly explanations via Gemini, with template fallback.

    Args:
        parameters: Backend-parsed lab values (status is authoritative).
        language: ``english`` or ``hindi``.

    Returns:
        ExplainResponse always returned; ``used_fallback`` indicates Gemini was not used.
    """
    if language not in ("english", "hindi"):
        language = "english"

    payload = _parameters_to_payload(parameters)
    prompt = build_full_prompt(payload, language)

    client = get_gemini_client()

    if not client.api_key:
        logger.warning("Skipping Gemini: API key missing")
        return generate_fallback_explanations(parameters, language)

    try:
        logger.debug("Calling Gemini for %d parameter(s), language=%s", len(parameters), language)
        raw = client.generate(prompt)
        logger.debug("Gemini response length: %d", len(raw))
        parsed = parse_gemini_json(raw)
        return _validate_gemini_response(parsed, parameters, language)
    except (RuntimeError, ValueError, json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Gemini explanation failed, using fallback: %s", exc)
        return generate_fallback_explanations(parameters, language)
