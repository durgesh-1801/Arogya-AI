"""
Chronological trend analysis for lab parameters across stored reports.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from constants.normal_ranges import NORMAL_RANGES
from models.medical_report import MedicalReport
from models.report_parameter import ReportParameter
from schemas.trend_schema import ParameterTrend, TrendDataPoint, TrendState
from utils.parameter_utils import TRACKED_TREND_PARAMETERS, normalize_parameter_name

# Clinical direction: whether a decrease in value is desirable
_LOWER_IS_BETTER = frozenset(
    {
        "glucose",
        "hba1c",
        "cholesterol",
        "ldl",
        "triglycerides",
        "creatinine",
        "wbc",
    }
)
_HIGHER_IS_BETTER = frozenset({"hdl", "hemoglobin", "rbc", "platelets"})


def _display_name(parameter_key: str) -> str:
    meta = NORMAL_RANGES.get(parameter_key)
    if meta and meta.get("display_name"):
        return meta["display_name"]
    return parameter_key.replace("_", " ").title()


def _unit_for(parameter_key: str, fallback: str) -> str:
    meta = NORMAL_RANGES.get(parameter_key)
    if meta and meta.get("unit"):
        return meta["unit"]
    return fallback


def _trend_direction(parameter_key: str) -> str:
    if parameter_key in _LOWER_IS_BETTER:
        return "lower_better"
    if parameter_key in _HIGHER_IS_BETTER:
        return "higher_better"
    return "lower_better"


def classify_trend(
    points: list[tuple[date, float]], *, parameter_key: str
) -> TrendState:
    """
    Compare earliest vs latest chronological values.

    Uses a relative threshold (5%) with a small absolute floor.
    """
    if len(points) < 2:
        return "stable"

    points = sorted(points, key=lambda p: p[0])
    first_val = points[0][1]
    last_val = points[-1][1]
    delta = last_val - first_val
    threshold = max(abs(first_val) * 0.05, 0.5)

    if abs(delta) <= threshold:
        return "stable"

    direction = _trend_direction(parameter_key)
    if direction == "lower_better":
        return "improving" if delta < 0 else "worsening"
    return "improving" if delta > 0 else "worsening"


def _load_patient_parameter_series(
    db: Session, patient_id: int
) -> dict[str, list[tuple[date, float, str]]]:
    """
    Build {parameter_key: [(report_date, value, unit), ...]} for a patient.

    When multiple values exist on the same date, the latest upload wins.
    """
    stmt = (
        select(MedicalReport)
        .where(MedicalReport.patient_id == patient_id)
        .options(joinedload(MedicalReport.parameters))
        .order_by(MedicalReport.report_date, MedicalReport.uploaded_at)
    )
    reports = db.scalars(stmt).unique().all()

    by_key: dict[str, dict[date, tuple[float, str]]] = defaultdict(dict)

    for report in reports:
        for param in report.parameters:
            key = normalize_parameter_name(param.parameter_name)
            by_key[key][report.report_date] = (param.value, param.unit)

    series: dict[str, list[tuple[date, float, str]]] = {}
    for key, date_map in by_key.items():
        if len(date_map) < 1:
            continue
        series[key] = [
            (d, vals[0], vals[1]) for d, vals in sorted(date_map.items())
        ]
    return series


def get_parameter_trend_series(
    db: Session, patient_id: int, parameter: str
) -> list[TrendDataPoint]:
    """Return frontend-ready time series for one parameter."""
    key = normalize_parameter_name(parameter)
    all_series = _load_patient_parameter_series(db, patient_id)
    points = all_series.get(key, [])

    return [
        TrendDataPoint(date=d.isoformat(), value=round(v, 2))
        for d, v, _ in points
    ]


def get_patient_trends(
    db: Session,
    patient_id: int,
    *,
    parameters_filter: frozenset[str] | None = None,
) -> list[ParameterTrend]:
    """Build trend objects for all parameters with at least one stored value."""
    all_series = _load_patient_parameter_series(db, patient_id)
    keys = sorted(all_series.keys())

    if parameters_filter is not None:
        keys = [k for k in keys if k in parameters_filter]

    trends: list[ParameterTrend] = []
    for key in keys:
        points = all_series[key]
        date_value_pairs = [(d, v) for d, v, _ in points]
        unit = _unit_for(key, points[-1][2] if points else "")

        trends.append(
            ParameterTrend(
                parameter=key,
                display_name=_display_name(key),
                unit=unit,
                trend=classify_trend(date_value_pairs, parameter_key=key),
                data=[
                    TrendDataPoint(date=d.isoformat(), value=round(v, 2))
                    for d, v, _ in points
                ],
            )
        )

    return trends


def get_core_metric_trends(db: Session, patient_id: int) -> list[ParameterTrend]:
    """Trends for glucose, HbA1c, cholesterol, LDL and other tracked metrics."""
    return get_patient_trends(
        db, patient_id, parameters_filter=frozenset(TRACKED_TREND_PARAMETERS)
    )
