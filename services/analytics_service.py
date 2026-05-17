"""
Summary analytics across a patient's report history.
"""

from __future__ import annotations

from collections import Counter, defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from constants.normal_ranges import NORMAL_RANGES
from models.medical_report import MedicalReport
from schemas.trend_schema import SummaryAnalytics
from services.trend_service import get_patient_trends
from utils.parameter_utils import normalize_parameter_name


def _display_name(key: str) -> str:
    meta = NORMAL_RANGES.get(key)
    if meta and meta.get("display_name"):
        return meta["display_name"]
    return key.replace("_", " ").title()

_STATUS_WEIGHT = {"abnormal": 3, "borderline": 2, "normal": 0}


def build_summary_analytics(db: Session, patient_id: int) -> SummaryAnalytics:
    """
    Compute concise insights: worst parameter, trend buckets, recurring issues.
    """
    trends = get_patient_trends(db, patient_id)
    improving = [t.display_name for t in trends if t.trend == "improving"]
    worsening = [t.display_name for t in trends if t.trend == "worsening"]

    stmt = (
        select(MedicalReport)
        .where(MedicalReport.patient_id == patient_id)
        .options(joinedload(MedicalReport.parameters))
        .order_by(MedicalReport.report_date)
    )
    reports = db.scalars(stmt).unique().all()

    severity: Counter[str] = Counter()
    abnormal_report_counts: defaultdict[str, int] = defaultdict(int)

    for report in reports:
        seen_abnormal: set[str] = set()
        for param in report.parameters:
            key = normalize_parameter_name(param.parameter_name)
            severity[key] += _STATUS_WEIGHT.get(param.status, 0)
            if param.status == "abnormal":
                seen_abnormal.add(key)
        for key in seen_abnormal:
            abnormal_report_counts[key] += 1

    most_abnormal: str | None = None
    if severity:
        top_key = severity.most_common(1)[0][0]
        most_abnormal = _display_name(top_key)

    recurring = [
        _display_name(k)
        for k, count in abnormal_report_counts.items()
        if count >= 2
    ]

    return SummaryAnalytics(
        most_abnormal_parameter=most_abnormal,
        improving_metrics=improving,
        worsening_metrics=worsening,
        recurring_abnormalities=sorted(recurring),
    )
