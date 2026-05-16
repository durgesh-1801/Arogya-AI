"""
Regex-based parser: convert raw OCR/PDF text into structured lab parameters.

Designed for modular extension (new parameters, alternate patterns) and
future trend tracking via stable parameter_key slugs.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Literal

from constants.normal_ranges import NORMAL_RANGES, NormalRange

Status = Literal["normal", "borderline", "abnormal"]

# Default band outside normal range treated as borderline (not yet abnormal)
_BORDERLINE_RATIO = 0.08

# Numeric capture: integers, decimals, and OCR-friendly forms like "10 . 2"
_VALUE_PATTERN = r"(\d+(?:\s*\.\s*\d+)?)"

# ---------------------------------------------------------------------------
# Parameter definitions: aliases used to build tolerant regex patterns
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ParameterPattern:
    """One lab parameter and how to find it in noisy text."""

    key: str  # stable id for trends, matches NORMAL_RANGES key
    aliases: tuple[str, ...]
    # Optional unit hints in source text (not required for a match)
    unit_hints: tuple[str, ...] = ()


PARAMETER_PATTERNS: tuple[ParameterPattern, ...] = (
    ParameterPattern(
        "hemoglobin",
        ("hemoglobin", "haemoglobin", "hgb", r"\bhb\b"),
        ("g/dl", "g/ dl", "gm/dl"),
    ),
    ParameterPattern(
        "wbc",
        ("wbc", "white blood cell", "white blood cells", "total wbc", "leucocyte count", "leukocyte count"),
        ("10^3/ul", "10^3/µl", "/ul", "/µl", "x10^3"),
    ),
    ParameterPattern(
        "rbc",
        ("rbc", "red blood cell", "red blood cells", "erythrocyte count"),
        ("10^6/ul", "10^6/µl", "million/ul"),
    ),
    ParameterPattern(
        "platelets",
        ("platelets", "platelet count", "plt", "thrombocyte"),
        ("10^3/ul", "10^3/µl", "/ul"),
    ),
    ParameterPattern(
        "glucose",
        ("glucose", "blood glucose", "fasting glucose", "fbs", "fbg", "random blood sugar", "rbs", "blood sugar"),
        ("mg/dl", "mg/ dl"),
    ),
    ParameterPattern(
        "hba1c",
        (r"hba1c", r"hb\s*a1c", "glycated hemoglobin", "glycated haemoglobin", "a1c"),
        ("%", "percent"),
    ),
    ParameterPattern(
        "creatinine",
        ("creatinine", "serum creatinine", "s. creatinine"),
        ("mg/dl",),
    ),
    ParameterPattern(
        "cholesterol",
        ("total cholesterol", "cholesterol", r"\btc\b", "serum cholesterol"),
        ("mg/dl",),
    ),
    ParameterPattern(
        "hdl",
        ("hdl", "hdl cholesterol", "hdl-c", "hdl c"),
        ("mg/dl",),
    ),
    ParameterPattern(
        "ldl",
        ("ldl", "ldl cholesterol", "ldl-c", "ldl c"),
        ("mg/dl",),
    ),
    ParameterPattern(
        "triglycerides",
        ("triglycerides", "triglyceride", r"\btg\b", "serum triglycerides"),
        ("mg/dl",),
    ),
)


@dataclass
class ParseResult:
    """Structured outcome of a parse run (safe for APIs and trend pipelines)."""

    parameters: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_list(self) -> list[dict[str, Any]]:
        """Return only the parameter list (matches expected JSON array shape)."""
        return self.parameters


# ---------------------------------------------------------------------------
# Text normalization (OCR spacing / line-break issues)
# ---------------------------------------------------------------------------

def normalize_text(raw_text: str) -> str:
    """
    Clean OCR/PDF text before regex matching.

    - Unifies whitespace and line breaks
    - Fixes split decimals (``10 . 2`` -> ``10.2``)
    - Normalizes common unit spacing (``g / dL`` -> ``g/dL``)
    """
    if not raw_text:
        return ""

    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    # Join hyphenated line breaks: "hemo-\nglobin" -> "hemoglobin"
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)

    # Split decimals: "10 . 2" or "10. 2" -> "10.2"
    text = re.sub(r"(\d)\s*\.\s*(\d)", r"\1.\2", text)

    # Collapse spaces around slashes in units
    text = re.sub(r"\s*/\s*", "/", text)
    text = re.sub(r"g\s*/\s*d\s*l", "g/dL", text, flags=re.IGNORECASE)
    text = re.sub(r"mg\s*/\s*d\s*l", "mg/dL", text, flags=re.IGNORECASE)

    return text.strip()


def _alias_to_regex_fragment(alias: str) -> str:
    """Turn a human alias into a regex fragment (word boundaries where needed)."""
    if alias.startswith(r"\b") or alias.startswith("("):
        return alias
    escaped = re.escape(alias)
    return rf"\b{escaped}\b"


def _unit_alternation(unit_hints: tuple[str, ...]) -> str:
    """Build a regex alternation for optional unit fragments after a value."""
    if unit_hints:
        return "|".join(re.escape(u) for u in unit_hints)
    return r"mg/dL|g/dL|%"


def _build_patterns(param: ParameterPattern) -> list[re.Pattern[str]]:
    """
    Build regex patterns for one parameter.

    Tries: ``Name : value unit``, ``Name value``, and value-before-unit forms.
    """
    alias_group = "|".join(_alias_to_regex_fragment(a) for a in param.aliases)
    alias_group = f"(?:{alias_group})"
    units = _unit_alternation(param.unit_hints)
    patterns: list[str] = []

    # Name ... separator ... value ... optional unit
    patterns.append(
        rf"{alias_group}\s*[:=\-]?\s*{_VALUE_PATTERN}(?:\s*(?:{units}))?"
    )
    # Name on one segment, value nearby (within ~40 chars)
    patterns.append(
        rf"{alias_group}.{{0,40}}?{_VALUE_PATTERN}"
    )
    # Value then unit then name (some lab layouts)
    patterns.append(
        rf"{_VALUE_PATTERN}\s*(?:{units})?\.?\s*{alias_group}"
    )

    flags = re.IGNORECASE | re.DOTALL
    return [re.compile(p, flags) for p in patterns]


def _parse_numeric_value(match: re.Match[str]) -> float | None:
    """Extract and normalize a float from the first capture group."""
    raw = match.group(1)
    if raw is None:
        return None
    cleaned = re.sub(r"\s+", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_value_for_parameter(
    text: str,
    param: ParameterPattern,
    compiled: list[re.Pattern[str]] | None = None,
) -> float | None:
    """
    Find the first plausible numeric value for a parameter in normalized text.

    Returns None if no match or value is non-physical (negative, etc.).
    """
    patterns = compiled if compiled is not None else _build_patterns(param)

    for pattern in patterns:
        match = pattern.search(text)
        if not match:
            continue
        value = _parse_numeric_value(match)
        if value is None or value < 0:
            continue
        # Sanity caps to reduce false positives from dates/IDs
        if param.key == "hba1c" and value > 20:
            continue
        if param.key in ("wbc", "rbc") and value > 1000:
            continue
        return value

    return None


# ---------------------------------------------------------------------------
# Status vs reference ranges
# ---------------------------------------------------------------------------

def calculate_status(value: float, range_config: NormalRange) -> Status:
    """
    Compare a numeric value to reference range and return clinical status.

    Uses status_mode:
    - bounded: both low and high matter
    - upper_only: only high values are concerning (LDL, cholesterol, TG)
    - lower_only: only low values are concerning (HDL)
    """
    normal_min = range_config["normal_min"]
    normal_max = range_config["normal_max"]
    mode = range_config.get("status_mode", "bounded")

    if mode == "upper_only":
        if value <= normal_max:
            return "normal"
        borderline_max = range_config.get("borderline_high_max", normal_max * 1.15)
        if value <= borderline_max:
            return "borderline"
        return "abnormal"

    if mode == "lower_only":
        if value >= normal_min:
            return "normal"
        borderline_min = range_config.get("borderline_low_min", normal_min * (1 - _BORDERLINE_RATIO))
        if value >= borderline_min:
            return "borderline"
        return "abnormal"

    # bounded — both directions
    if normal_min <= value <= normal_max:
        return "normal"

    low_border = range_config.get("borderline_low_min", normal_min * (1 - _BORDERLINE_RATIO))
    high_border = range_config.get("borderline_high_max", normal_max * (1 + _BORDERLINE_RATIO))

    if value < normal_min:
        return "borderline" if value >= low_border else "abnormal"
    # value > normal_max
    return "borderline" if value <= high_border else "abnormal"


def build_parameter_record(
    parameter_key: str,
    value: float,
    range_config: NormalRange,
) -> dict[str, Any]:
    """
    Assemble one output dict (API / trend-store friendly).

    Includes parameter_key for stable time-series joins across reports.
    """
    status = calculate_status(value, range_config)
    return {
        "parameter": range_config.get("display_name", parameter_key.replace("_", " ").title()),
        "parameter_key": parameter_key,
        "value": round(value, 2) if value != int(value) else value,
        "unit": range_config["unit"],
        "normal_min": range_config["normal_min"],
        "normal_max": range_config["normal_max"],
        "status": status,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_lab_report(raw_text: str) -> ParseResult:
    """
    Parse extracted report text into structured parameters.

    Args:
        raw_text: Plain text from PDF extraction or OCR.

    Returns:
        ParseResult with parameters list, errors, and warnings.
        On success, parameters matches the expected JSON array shape.
    """
    result = ParseResult()

    if raw_text is None:
        result.errors.append("Input text is None.")
        return result

    if not str(raw_text).strip():
        result.errors.append("Input text is empty.")
        return result

    try:
        normalized = normalize_text(raw_text)
    except Exception as exc:
        result.errors.append(f"Text normalization failed: {exc}")
        return result

    seen_keys: set[str] = set()

    for param in PARAMETER_PATTERNS:
        range_config = NORMAL_RANGES.get(param.key)
        if not range_config:
            result.warnings.append(f"No reference range defined for '{param.key}'; skipped.")
            continue

        try:
            compiled = _build_patterns(param)
            value = extract_value_for_parameter(normalized, param, compiled)
        except re.error as exc:
            result.warnings.append(f"Regex error for '{param.key}': {exc}")
            continue
        except Exception as exc:
            result.warnings.append(f"Extraction failed for '{param.key}': {exc}")
            continue

        if value is None:
            continue

        if param.key in seen_keys:
            continue

        try:
            record = build_parameter_record(param.key, value, range_config)
        except Exception as exc:
            result.warnings.append(f"Could not build record for '{param.key}': {exc}")
            continue

        result.parameters.append(record)
        seen_keys.add(param.key)

    if not result.parameters:
        result.warnings.append(
            "No supported parameters were detected. Check report format or OCR quality."
        )

    return result


def parse_lab_report_list(raw_text: str) -> list[dict[str, Any]]:
    """
    Convenience wrapper returning only the parameter array.

    Raises ValueError only when input is invalid (None/empty), not when no params found.
    """
    outcome = parse_lab_report(raw_text)
    if outcome.errors:
        raise ValueError("; ".join(outcome.errors))
    return outcome.parameters
