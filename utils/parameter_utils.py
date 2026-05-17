"""
Canonical parameter keys for trend storage and lookup.
"""

from constants.normal_ranges import NORMAL_RANGES

# Aliases and display names → stable keys used in trends APIs
_EXTRA_ALIASES: dict[str, str] = {
    "fasting glucose": "glucose",
    "blood glucose": "glucose",
    "blood sugar": "glucose",
    "total cholesterol": "cholesterol",
    "ldl cholesterol": "ldl",
    "hdl cholesterol": "hdl",
    "glycated hemoglobin": "hba1c",
    "a1c": "hba1c",
}

_NAME_TO_KEY: dict[str, str] = {}
for key, meta in NORMAL_RANGES.items():
    _NAME_TO_KEY[key] = key
    display = meta.get("display_name", "")
    if display:
        _NAME_TO_KEY[display.lower()] = key
for alias, key in _EXTRA_ALIASES.items():
    _NAME_TO_KEY[alias.lower()] = key

# Parameters with explicit trend rules in the trend engine
TRACKED_TREND_PARAMETERS: tuple[str, ...] = (
    "glucose",
    "hba1c",
    "cholesterol",
    "ldl",
    "hemoglobin",
    "hdl",
    "triglycerides",
    "creatinine",
    "wbc",
    "rbc",
    "platelets",
)


def normalize_parameter_name(name: str) -> str:
    """Map parser display names or slugs to a canonical parameter key."""
    cleaned = name.strip().lower().replace("-", " ").replace("_", " ")
    slug = cleaned.replace(" ", "_")

    if slug in NORMAL_RANGES:
        return slug
    if cleaned in _NAME_TO_KEY:
        return _NAME_TO_KEY[cleaned]
    if slug in _NAME_TO_KEY:
        return _NAME_TO_KEY[slug]

    return slug
