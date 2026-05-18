"""
LLM service for plain-language lab explanations (Groq provider).

The backend parser remains the source of truth; the LLM only explains given parameters.
Provider logic is isolated in ``GroqClient`` for reuse by /api/explain and future /api/chat.
"""

from __future__ import annotations

import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any, Literal

from pydantic import ValidationError

from prompts.explain_prompt import (
    apply_global_disclaimer,
    build_strict_retry_user_prompt,
    build_system_instruction,
    build_user_prompt,
    cleanup_explanation_text,
    is_placeholder_parameter,
    normalize_language,
    parse_gemini_json,
)
from schemas.explain_schema import ExplainResponse, ExplainedParameter, ParameterExplainInput

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_TIMEOUT_SECONDS = 30

# Low temperature for concise, deterministic medical copy
DEFAULT_TEMPERATURE = 0.1
DEFAULT_MAX_TOKENS = 2048

UrgencyLevel = Literal["low", "medium", "high"]

# ---------------------------------------------------------------------------
# Groq client (provider-isolated)
# ---------------------------------------------------------------------------


class GroqClient:
    """
    Thin wrapper around the Groq Python SDK for chat completions.

    Configured once per process; safe to reuse across requests.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str = DEFAULT_MODEL,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client: Any = None
        self._executor = ThreadPoolExecutor(max_workers=4)

        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set; LLM calls will use fallback templates only")

    def _get_client(self) -> Any:
        if self._client is None:
            if not self.api_key:
                raise RuntimeError("GROQ_API_KEY is not configured")
            try:
                from groq import Groq
            except ImportError as exc:
                raise RuntimeError(
                    "groq is not installed. Run: pip install groq"
                ) from exc
            self._client = Groq(
                api_key=self.api_key,
                timeout=float(self.timeout_seconds),
            )
        return self._client

    def complete_chat(self, messages: list[dict[str, str]]) -> str:
        """
        Run a chat completion with timeout enforcement.

        Args:
            messages: OpenAI-style role/content dicts (system, user, assistant).

        Returns:
            Assistant message text.

        Raises:
            RuntimeError: On API errors, empty response, or timeout.
        """
        client = self._get_client()

        def _call() -> str:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            if not response.choices:
                raise RuntimeError("Groq returned no choices")
            content = response.choices[0].message.content
            if not content or not content.strip():
                raise RuntimeError("Groq returned an empty response")
            return content.strip()

        try:
            future = self._executor.submit(_call)
            return future.result(timeout=self.timeout_seconds)
        except FuturesTimeoutError as exc:
            logger.error(
                "Groq request timed out after %ss (model=%s)",
                self.timeout_seconds,
                self.model_name,
            )
            raise RuntimeError(
                f"Groq request timed out after {self.timeout_seconds}s"
            ) from exc
        except Exception as exc:
            logger.exception(
                "Groq chat completion failed (model=%s): %s",
                self.model_name,
                exc,
            )
            raise RuntimeError(f"Groq API error: {exc}") from exc

    def generate(self, prompt: str, *, system: str | None = None) -> str:
        """
        Single-turn completion (explain flow and simple chat wrappers).

        Args:
            prompt: User message / full instruction prompt.
            system: Optional system instruction.
        """
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self.complete_chat(messages)


# Module-level client (lazy singleton)
_client: GroqClient | None = None


def get_groq_client() -> GroqClient:
    """Return a shared GroqClient instance."""
    global _client
    if _client is None:
        timeout = int(os.getenv("GROQ_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS)))
        model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
        api_key = os.getenv("GROQ_API_KEY")
        logger.debug("Groq API key configured: %s", bool(api_key))
        _client = GroqClient(
            api_key=api_key,
            model_name=model,
            timeout_seconds=timeout,
        )
    return _client


def get_llm_client() -> GroqClient:
    """Alias for provider-agnostic access (e.g. future /api/chat)."""
    return get_groq_client()


# ---------------------------------------------------------------------------
# Fallback templates (no LLM)
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


def _derive_urgency_level(statuses: list[str]) -> UrgencyLevel:
    if any(s == "abnormal" for s in statuses):
        return "high"
    if any(s == "borderline" for s in statuses):
        return "medium"
    return "low"


def _fallback_urgency_summary(level: UrgencyLevel, language: str) -> str:
    language = normalize_language(language)
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
    return apply_global_disclaimer(summaries[level], language=language)


def generate_fallback_explanations(
    parameters: list[ParameterExplainInput],
    language: str,
) -> ExplainResponse:
    """
    Template-based explanations when the LLM is unavailable or fails.
    """
    language = normalize_language(language)
    templates = _FALLBACK_HI if language == "hindi" else _FALLBACK_EN
    print(f"  -> fallback template set: {'Hindi' if language == 'hindi' else 'English'}")
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
                explanation=explanation,
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


def _normalize_parameter_name(
    raw_name: str,
    index: int,
    expected_parameters: list[ParameterExplainInput],
) -> str:
    """Map placeholder or missing names back to authoritative input names."""
    if index < len(expected_parameters):
        expected = expected_parameters[index].parameter
        if is_placeholder_parameter(raw_name) or not raw_name.strip():
            return expected
        # Case-insensitive match to input
        for param in expected_parameters:
            if param.parameter.lower() == raw_name.strip().lower():
                return param.parameter
        return expected
    return raw_name.strip() or "Unknown"


def _validate_llm_response(
    data: dict[str, Any],
    expected_parameters: list[ParameterExplainInput],
    language: str = "english",
) -> ExplainResponse:
    """Map parsed JSON to Pydantic models; disclaimer only on urgency_summary."""
    language = normalize_language(language)
    urgency = data.get("urgency_level", "medium")
    if urgency not in ("low", "medium", "high"):
        urgency = _derive_urgency_level([p.status for p in expected_parameters])

    summary = apply_global_disclaimer(str(data.get("urgency_summary", "")), language=language)

    explained_raw = data.get("explained_parameters", [])
    explained: list[ExplainedParameter] = []

    for index, item in enumerate(explained_raw):
        if not isinstance(item, dict):
            continue
        param_name = _normalize_parameter_name(
            str(item.get("parameter", "")),
            index,
            expected_parameters,
        )
        explanation = cleanup_explanation_text(str(item.get("explanation", "")))
        action = cleanup_explanation_text(str(item.get("action", "Consult your doctor")))
        if not explanation:
            explanation = f"Your {param_name} result should be reviewed with your doctor."
        if not action:
            action = "Consult your doctor"
        explained.append(
            ExplainedParameter(
                parameter=param_name,
                explanation=explanation,
                action=action,
            )
        )

    if len(explained) < len(expected_parameters):
        logger.warning(
            "LLM returned %d explanations for %d parameters; padding with fallback",
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
                        explanation=f"Your {param.parameter} result needs review.",
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


def _log_prompt_snippet(system: str, user: str, *, stage: str, language: str) -> None:
    """Log key language lines and a short prompt preview for debugging."""
    for label, text in (("system", system), ("user", user)):
        for line in text.splitlines():
            if "REQUESTED OUTPUT LANGUAGE" in line or "MUST respond entirely" in line:
                print(f"Explain prompt [{stage}] {label} language line:", line.strip())
                logger.info("Explain prompt %s %s: %s", stage, label, line.strip())
    snippet = user[:500].replace("\n", " ")
    print(f"Explain Groq prompt snippet [{stage}] (user, first 500 chars):", snippet)
    logger.debug(
        "Groq prompt snippet stage=%s language=%s len_system=%d len_user=%d preview=%s",
        stage,
        language,
        len(system),
        len(user),
        snippet,
    )


def _request_llm_explanation(
    client: GroqClient,
    parameters: list[ParameterExplainInput],
    language: str,
    *,
    strict: bool = False,
) -> dict[str, Any]:
    """Call Groq and parse JSON (raises on invalid response)."""
    lang = normalize_language(language)
    stage = "strict_retry" if strict else "initial"

    payload = _parameters_to_payload(parameters)
    system = build_system_instruction(lang)
    if strict:
        user = build_strict_retry_user_prompt(payload, lang)
    else:
        user = build_user_prompt(payload, lang)

    _log_prompt_snippet(system, user, stage=stage, language=lang)

    raw = client.generate(user, system=system)
    print(
        f"Explain Groq raw response [{stage}]:"
        f" requested_language={lang!r}"
        f" len={len(raw)}"
    )
    logger.info(
        "Groq response stage=%s requested_language=%s len=%d strict=%s",
        stage,
        lang,
        len(raw),
        strict,
    )
    return parse_gemini_json(raw)


def explain_parameters(
    parameters: list[ParameterExplainInput],
    language: str = "english",
) -> ExplainResponse:
    """
    Generate patient-friendly explanations via Groq, with template fallback.

    Args:
        parameters: Backend-parsed lab values (status is authoritative).
        language: ``english`` or ``hindi``.

    Returns:
        ExplainResponse always returned; ``used_fallback`` indicates the LLM was not used.
    """
    language = normalize_language(language)
    print("Final language used:", language)

    client = get_groq_client()

    if not client.api_key:
        logger.warning("Skipping Groq: GROQ_API_KEY is missing")
        return generate_fallback_explanations(parameters, language)

    # Preserve requested language for all retries
    requested_language = language

    try:
        logger.info(
            "Calling Groq for %d parameter(s), language=%s, model=%s",
            len(parameters),
            requested_language,
            client.model_name,
        )
        try:
            parsed = _request_llm_explanation(
                client, parameters, requested_language, strict=False
            )
        except (json.JSONDecodeError, ValueError) as first_exc:
            logger.warning(
                "Groq returned invalid JSON or schema (language=%s), retrying once: %s",
                requested_language,
                first_exc,
            )
            parsed = _request_llm_explanation(
                client,
                parameters,
                requested_language,
                strict=True,
            )

        result = _validate_llm_response(parsed, parameters, requested_language)
        return result
    except json.JSONDecodeError as exc:
        logger.warning(
            "Groq returned invalid JSON after retry (language=%s), using fallback: %s",
            requested_language,
            exc,
        )
        return generate_fallback_explanations(parameters, requested_language)
    except (RuntimeError, ValueError, ValidationError) as exc:
        logger.warning(
            "Groq explanation failed (language=%s), using fallback: %s",
            requested_language,
            exc,
        )
        return generate_fallback_explanations(parameters, requested_language)
