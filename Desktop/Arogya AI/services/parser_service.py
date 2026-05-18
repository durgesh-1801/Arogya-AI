"""
Regex-based parser: convert raw OCR/PDF text into structured lab parameters.

Designed for modular extension (new parameters, alternate patterns) and
future trend tracking via stable parameter_key slugs.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Literal

from constants.normal_ranges import NORMAL_RANGES, NormalRange

logger = logging.getLogger(__name__)

Status = Literal["normal", "borderline", "abnormal"]

# Default band outside normal range treated as borderline (not yet abnormal)
_BORDERLINE_RATIO = 0.08

# Longest-match numeric token: comma-grouped thousands OR plain int/decimal
_VALUE_PATTERN = (
    r"(\d{1,3}(?:,\d{3})+(?:\.\d+)?"  # 11,800 or 1,234.56
    r"|\d+\.\d+"  # 11.8
    r"|\d+)"  # 11800
)

# Reference interval literals: "4.5 - 11.0", "13–17", "4000 to 11000"
_REFERENCE_RANGE_RE = re.compile(
    r"(?P<low>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\d+)"
    r"\s*(?:[-–—~]|to)\s*"
    r"(?P<high>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\d+)",
    re.IGNORECASE,
)

_REF_LINE_KEYWORDS = re.compile(
    r"\b(?:reference|ref\.?|normal\s*range|biological\s*ref|expected\s*range|"
    r"desirable\s*range|therapeutic\s*range)\b",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# OCR typo / alias normalization (applied before structural normalize_text)
# ---------------------------------------------------------------------------

# (regex pattern, replacement) — case-insensitive unless noted
_OCR_TYPO_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    (r"\bhbate\b", "hba1c"),
    (r"\bhb\s*ate\b", "hba1c"),
    (r"\bhb\s*a\s*1\s*c\b", "hba1c"),
    (r"\bcholesteral\b", "cholesterol"),
    (r"\bcholestrol\b", "cholesterol"),
    (r"\bhemoglobln\b", "hemoglobin"),
    (r"\btriglycerrides\b", "triglycerides"),
    (r"\btriglyceridees\b", "triglycerides"),
    (r"\bcreatinin\b", "creatinine"),
    (r"\bglucosse\b", "glucose"),
    (r"\bplatelets?\s*count\b", "platelet count"),
    (r"\bmilion/uL\b", "million/uL"),
    (r"\bmilion/µl\b", "million/µL"),
    (r"\bmillion/ul\b", "million/µL"),
    (r"\b10\s*\^\s*3\s*/\s*u\s*l\b", "10^3/µL"),
    (r"\b10\s*\^\s*6\s*/\s*u\s*l\b", "10^6/µL"),
)

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
        (
            "wbc",
            "white blood cell",
            "white blood cells",
            "total wbc",
            "leucocyte count",
            "leukocyte count",
            "tlc",
            "total leucocyte count",
        ),
        ("10^3/ul", "10^3/µl", "/ul", "/µl", "x10^3", "cells/ul", "cells/µl"),
    ),
    ParameterPattern(
        "rbc",
        ("rbc", "red blood cell", "red blood cells", "erythrocyte count"),
        ("10^6/ul", "10^6/µl", "million/ul", "million/µl"),
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
        (r"hba1c", r"hb\s*a1c", "glycated hemoglobin", "glycated haemoglobin", "a1c", "hbate"),
        ("%", "percent"),
    ),
    ParameterPattern(
        "creatinine",
        ("creatinine", "serum creatinine", "s. creatinine"),
        ("mg/dl",),
    ),
    ParameterPattern(
        "cholesterol",
        ("total cholesterol", "cholesterol", "cholesteral", r"\btc\b", "serum cholesterol"),
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
class ValueCandidate:
    """A numeric candidate extracted near a parameter mention."""

    value: float
    source_line: str
    source_snippet: str
    score: float


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
# Text normalization
# ---------------------------------------------------------------------------


def normalize_ocr_text(raw_text: str) -> str:
    """
    Fix common OCR misreads before regex parsing.

    - Unicode normalization (NFKC) and symbol cleanup
    - Known parameter/unit spelling corrections (HbAte → HbA1c, etc.)
    - Weird punctuation → ASCII equivalents
    - Repeated spaces collapsed
    """
    if not raw_text:
        return ""

    text = unicodedata.normalize("NFKC", raw_text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Common OCR punctuation / symbols
    text = text.replace("—", "-").replace("–", "-").replace("−", "-")
    text = text.replace(""", '"').replace(""", '"')
    text = text.replace("'", "'").replace("'", "'")
    text = text.replace("µ", "µ")  # keep micro sign; also map OCR 'u' via unit patterns
    text = re.sub(r"[°º]", "", text)

    for pattern, replacement in _OCR_TYPO_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def normalize_text(raw_text: str) -> str:
    """
    Clean OCR/PDF text before regex matching (after normalize_ocr_text).

    - Unifies whitespace and line breaks
    - Fixes split decimals (``10 . 2`` -> ``10.2``)
    - Normalizes common unit spacing (``g / dL`` -> ``g/dL``)
    - Removes thousands separators for easier numeric parsing
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


def _compile_alias_pattern(param: ParameterPattern) -> re.Pattern[str]:
    alias_group = "|".join(_alias_to_regex_fragment(a) for a in param.aliases)
    return re.compile(rf"(?:{alias_group})", re.IGNORECASE)


def _unit_alternation(unit_hints: tuple[str, ...]) -> str:
    """Build a regex alternation for optional unit fragments after a value."""
    if unit_hints:
        return "|".join(re.escape(u) for u in unit_hints)
    return r"mg/dL|g/dL|%"


def _build_patterns(param: ParameterPattern) -> list[re.Pattern[str]]:
    """
    Build regex patterns for one parameter (fallback when line-based match fails).

    Prefers explicit separators and short windows to avoid reference-range bleed.
    """
    alias_group = "|".join(_alias_to_regex_fragment(a) for a in param.aliases)
    alias_group = f"(?:{alias_group})"
    units = _unit_alternation(param.unit_hints)
    patterns: list[str] = []

    # Table / label: "WBC : 11800" or "WBC  11.8"
    patterns.append(
        rf"{alias_group}\s*[:=\-|]\s*{_VALUE_PATTERN}(?:\s*(?:{units}))?"
    )
    # Tight proximity after name (avoid grabbing distant Hb 13-17 on another field)
    patterns.append(
        rf"{alias_group}\s+{_VALUE_PATTERN}(?:\s*(?:{units}))?"
    )
    patterns.append(
        rf"{alias_group}.{{0,20}}?{_VALUE_PATTERN}(?:\s*(?:{units}))?"
    )

    flags = re.IGNORECASE | re.DOTALL
    return [re.compile(p, flags) for p in patterns]


def _parse_numeric_token(raw: str) -> float | None:
    """Parse a numeric token, stripping thousands separators and spaces."""
    if raw is None:
        return None
    cleaned = re.sub(r"[\s,]", "", raw)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_numeric_value(match: re.Match[str]) -> float | None:
    """Extract and normalize a float from the first capture group."""
    return _parse_numeric_token(match.group(1))


def _range_bound_spans(text: str) -> list[tuple[int, int]]:
    """Return character spans of numbers that are part of reference-range literals."""
    spans: list[tuple[int, int]] = []
    for match in _REFERENCE_RANGE_RE.finditer(text):
        spans.append((match.start("low"), match.end("low")))
        spans.append((match.start("high"), match.end("high")))
    return spans


def _number_in_range_literal(text: str, start: int, end: int) -> bool:
    """True if the number at [start, end) is a bound in a range literal like 4.5-11.0."""
    for span_start, span_end in _range_bound_spans(text):
        if start >= span_start and end <= span_end:
            return True
    return False


def _find_numbers(text: str) -> list[tuple[float, int, int]]:
    """Return (value, start, end) for all numbers in text."""
    found: list[tuple[float, int, int]] = []
    for match in re.finditer(_VALUE_PATTERN, text):
        value = _parse_numeric_token(match.group(1))
        if value is not None:
            found.append((value, match.start(1), match.end(1)))
    return found


def _scale_to_canonical_unit(param_key: str, value: float) -> float:
    """
    Convert absolute cell counts to canonical units used in NORMAL_RANGES.

    WBC/platelets reports often use cells/µL (e.g. 11800) while ranges use 10^3/µL.
    """
    if param_key == "wbc" and value >= 1000:
        return round(value / 1000.0, 2)
    if param_key == "platelets" and value >= 10000:
        return round(value / 1000.0, 2)
    return value


def _is_plausible_value(param_key: str, value: float, range_config: NormalRange) -> bool:
    """Reject physically impossible or clearly wrong-scale values."""
    if value < 0:
        return False

    ceilings: dict[str, float] = {
        "hemoglobin": 25.0,
        "wbc": 100.0,
        "rbc": 10.0,
        "platelets": 2000.0,
        "glucose": 600.0,
        "hba1c": 20.0,
        "creatinine": 20.0,
        "cholesterol": 500.0,
        "hdl": 150.0,
        "ldl": 400.0,
        "triglycerides": 2000.0,
    }
    floor = 0.0
    if param_key == "hba1c":
        floor = 3.0

    cap = ceilings.get(param_key, 1e9)
    if value < floor or value > cap:
        return False

    # After scaling, WBC should sit in a sensible clinical band
    if param_key == "wbc" and not (0.1 <= value <= 50):
        return False

    return True


def _looks_like_ref_only_line(line: str) -> bool:
    """Lines that only describe reference intervals, not patient results."""
    if _REF_LINE_KEYWORDS.search(line):
        return True
    lowered = line.lower()
    if "reference" in lowered and _REFERENCE_RANGE_RE.search(line):
        return True
    return False


def _line_mentions_parameter(line: str, alias_pattern: re.Pattern[str]) -> bool:
    return alias_pattern.search(line) is not None


def _score_candidate(
    *,
    value: float,
    param_key: str,
    range_config: NormalRange,
    position_after_alias: int,
    in_ref_line: bool,
    in_range_literal: bool,
    all_values_on_line: list[float],
) -> float:
    """
    Rank candidates: prefer first value after parameter name, penalize ref-range numbers.
    """
    score = 100.0 - min(position_after_alias, 80)

    if in_range_literal:
        score -= 60
    if in_ref_line:
        score -= 40

    normal_min = range_config["normal_min"]
    normal_max = range_config["normal_max"]

    # If line has a clear patient value and a ref bound, deprioritize exact ref bounds
    ref_bounds = {normal_min, normal_max}
    if value in ref_bounds and len(all_values_on_line) > 1:
        larger = [v for v in all_values_on_line if v not in ref_bounds or v > normal_max * 2]
        if larger:
            score -= 35

    # Prefer larger WBC absolute counts over small range endpoints (4.5, 11, 17 bleed)
    if param_key == "wbc":
        scaled = _scale_to_canonical_unit("wbc", value)
        if value >= 1000:
            score += 25
        elif 4 <= value <= 12 and any(v >= 1000 for v in all_values_on_line):
            score -= 50
        elif scaled >= normal_min and scaled <= normal_max * 3:
            score += 5

    if param_key == "hba1c" and value > 20:
        score -= 100

    return score


def _extract_candidates_from_line(
    line: str,
    param: ParameterPattern,
    alias_pattern: re.Pattern[str],
    range_config: NormalRange,
) -> list[ValueCandidate]:
    """Extract and score numeric candidates from a single line mentioning the parameter."""
    alias_match = alias_pattern.search(line)
    if not alias_match:
        return []

    in_ref_line = _looks_like_ref_only_line(line)
    alias_end = alias_match.end()
    segment = line[alias_end:] if alias_end < len(line) else line

    numbers = _find_numbers(line)
    if not numbers:
        return []

    all_values = [v for v, _, _ in numbers]
    candidates: list[ValueCandidate] = []

    for value, start, end in numbers:
        if _number_in_range_literal(line, start, end):
            continue

        scaled = _scale_to_canonical_unit(param.key, value)
        if not _is_plausible_value(param.key, scaled, range_config):
            continue

        pos_after_alias = max(0, start - alias_end)
        score = _score_candidate(
            value=scaled,
            param_key=param.key,
            range_config=range_config,
            position_after_alias=pos_after_alias,
            in_ref_line=in_ref_line,
            in_range_literal=False,
            all_values_on_line=[_scale_to_canonical_unit(param.key, v) for v in all_values],
        )

        snippet_start = max(0, start - 15)
        snippet_end = min(len(line), end + 25)
        snippet = line[snippet_start:snippet_end].strip()

        candidates.append(
            ValueCandidate(
                value=scaled,
                source_line=line.strip(),
                source_snippet=snippet,
                score=score,
            )
        )

    # Also scan segment right after alias (prioritize first number there)
    seg_numbers = _find_numbers(segment)
    if seg_numbers:
        first_val, first_start, first_end = seg_numbers[0]
        if not _number_in_range_literal(segment, first_start, first_end):
            scaled_first = _scale_to_canonical_unit(param.key, first_val)
            if _is_plausible_value(param.key, scaled_first, range_config):
                for cand in candidates:
                    if cand.value == scaled_first:
                        cand.score += 15
                        break

    return candidates


def _select_best_candidate(candidates: list[ValueCandidate]) -> ValueCandidate | None:
    if not candidates:
        return None
    return max(candidates, key=lambda c: c.score)


def extract_value_for_parameter(
    text: str,
    param: ParameterPattern,
    compiled: list[re.Pattern[str]] | None = None,
    range_config: NormalRange | None = None,
) -> tuple[float | None, str | None, str | None]:
    """
    Find the best numeric patient value for a parameter in normalized text.

    Returns:
        (value, matched_line, source_snippet) — line/snippet are None if not found.

    Strategy:
        1. Line-based: only numbers on lines mentioning the parameter
        2. Skip numbers inside reference-range literals (4.5-11.0)
        3. Scale absolute WBC/platelet counts to 10^3/µL
        4. Regex fallback with tight windows if line-based fails
    """
    patterns = compiled if compiled is not None else _build_patterns(param)
    alias_pattern = _compile_alias_pattern(param)
    config = range_config or NORMAL_RANGES.get(param.key)
    if not config:
        return None, None, None

    all_candidates: list[ValueCandidate] = []
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    for index, line in enumerate(lines):
        if not _line_mentions_parameter(line, alias_pattern):
            continue
        all_candidates.extend(
            _extract_candidates_from_line(line, param, alias_pattern, config)
        )
        # Value on the next line: "WBC\n11800 cells/uL"
        if index + 1 < len(lines) and not _find_numbers(line):
            next_line = lines[index + 1]
            if not _line_mentions_parameter(next_line, alias_pattern):
                combined = f"{line} {next_line}"
                all_candidates.extend(
                    _extract_candidates_from_line(
                        combined, param, alias_pattern, config
                    )
                )

    best = _select_best_candidate(all_candidates)
    if best is not None:
        logger.debug(
            "Parser [%s] line match — value=%s snippet=%r",
            param.key,
            best.value,
            best.source_snippet,
        )
        return best.value, best.source_line, best.source_snippet

    # Fallback: regex on full text, still filter range literals
    for pattern in patterns:
        match = pattern.search(text)
        if not match:
            continue
        raw_value = _parse_numeric_value(match)
        if raw_value is None:
            continue

        start = match.start(1)
        end = match.end(1)
        if _number_in_range_literal(text, start, end):
            continue

        scaled = _scale_to_canonical_unit(param.key, raw_value)
        if not _is_plausible_value(param.key, scaled, config):
            continue

        line_start = text.rfind("\n", 0, match.start()) + 1
        line_end = text.find("\n", match.start())
        if line_end == -1:
            line_end = len(text)
        matched_line = text[line_start:line_end].strip()
        snippet = matched_line[:80]

        logger.debug(
            "Parser [%s] regex fallback — value=%s snippet=%r",
            param.key,
            scaled,
            snippet,
        )
        return scaled, matched_line, snippet

    return None, None, None


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
        ocr_normalized = normalize_ocr_text(raw_text)
        normalized = normalize_text(ocr_normalized)
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
            value, matched_line, source_snippet = extract_value_for_parameter(
                normalized,
                param,
                compiled,
                range_config,
            )
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

        logger.debug(
            "Parser extracted %s=%s from line=%r source=%r",
            param.key,
            value,
            matched_line,
            source_snippet,
        )

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
