"""
Reference ranges for common OPD / lab parameters.

Each entry defines clinical bounds and the canonical unit used in parsed output.
Optional fields support one-sided interpretation (e.g. LDL upper limit only).

Trend tracking: use the dict key (e.g. "hemoglobin") as a stable parameter_key.
"""

from typing import Literal, TypedDict


class NormalRange(TypedDict, total=False):
    """Reference range metadata for a single lab parameter."""

    display_name: str
    normal_min: float
    normal_max: float
    unit: str
    # How status is derived: both bounds, only high is bad, only low is bad
    status_mode: Literal["bounded", "upper_only", "lower_only"]
    # Optional explicit borderline thresholds (override ratio-based borderline)
    borderline_high_max: float
    borderline_low_min: float


# Keys are stable snake_case identifiers for trend storage and APIs.
NORMAL_RANGES: dict[str, NormalRange] = {
    "hemoglobin": {
        "display_name": "Hemoglobin",
        "normal_min": 13.0,
        "normal_max": 17.0,
        "unit": "g/dL",
        "status_mode": "bounded",
    },
    "wbc": {
        "display_name": "WBC",
        "normal_min": 4.5,
        "normal_max": 11.0,
        "unit": "10^3/µL",
        "status_mode": "bounded",
    },
    "rbc": {
        "display_name": "RBC",
        "normal_min": 4.5,
        "normal_max": 5.5,
        "unit": "10^6/µL",
        "status_mode": "bounded",
    },
    "platelets": {
        "display_name": "Platelets",
        "normal_min": 150.0,
        "normal_max": 400.0,
        "unit": "10^3/µL",
        "status_mode": "bounded",
    },
    "glucose": {
        "display_name": "Glucose",
        "normal_min": 70.0,
        "normal_max": 100.0,
        "unit": "mg/dL",
        "status_mode": "bounded",
        "borderline_high_max": 125.0,
    },
    "hba1c": {
        "display_name": "HbA1c",
        "normal_min": 4.0,
        "normal_max": 5.6,
        "unit": "%",
        "status_mode": "bounded",
        "borderline_high_max": 6.4,
    },
    "creatinine": {
        "display_name": "Creatinine",
        "normal_min": 0.7,
        "normal_max": 1.3,
        "unit": "mg/dL",
        "status_mode": "bounded",
    },
    "cholesterol": {
        "display_name": "Cholesterol",
        "normal_min": 0.0,
        "normal_max": 200.0,
        "unit": "mg/dL",
        "status_mode": "upper_only",
        "borderline_high_max": 239.0,
    },
    "hdl": {
        "display_name": "HDL",
        "normal_min": 40.0,
        "normal_max": 60.0,
        "unit": "mg/dL",
        "status_mode": "lower_only",
        "borderline_low_min": 35.0,
    },
    "ldl": {
        "display_name": "LDL",
        "normal_min": 0.0,
        "normal_max": 100.0,
        "unit": "mg/dL",
        "status_mode": "upper_only",
        "borderline_high_max": 129.0,
    },
    "triglycerides": {
        "display_name": "Triglycerides",
        "normal_min": 0.0,
        "normal_max": 150.0,
        "unit": "mg/dL",
        "status_mode": "upper_only",
        "borderline_high_max": 199.0,
    },
}
