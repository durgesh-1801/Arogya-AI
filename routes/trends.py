"""Trend and analytics endpoints for longitudinal health tracking."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.session import get_db
from models.patient import Patient
from schemas.trend_schema import (
    PatientTrendsWithAnalyticsResponse,
    SummaryAnalytics,
    TrendDataPoint,
)
from services.analytics_service import build_summary_analytics
from services.trend_service import get_parameter_trend_series, get_patient_trends

router = APIRouter()


def _require_patient(db: Session, patient_id: int) -> None:
    if db.get(Patient, patient_id) is None:
        raise HTTPException(status_code=404, detail="Patient not found")


@router.get(
    "/trends/{patient_id}",
    response_model=PatientTrendsWithAnalyticsResponse,
)
def patient_trends(patient_id: int, db: Session = Depends(get_db)):
    """
    All parameter trends for a patient plus summary analytics.

    Each trend includes chronological data points and a state:
    improving | worsening | stable.
    """
    _require_patient(db, patient_id)
    trends = get_patient_trends(db, patient_id)
    analytics = build_summary_analytics(db, patient_id)
    return PatientTrendsWithAnalyticsResponse(
        patient_id=patient_id,
        trends=trends,
        analytics=analytics,
    )


@router.get(
    "/trends/{patient_id}/{parameter}",
    response_model=list[TrendDataPoint],
)
def parameter_trend(
    patient_id: int,
    parameter: str,
    db: Session = Depends(get_db),
):
    """
    Time series for a single parameter (frontend-ready).

    Example: [{"date": "2026-05-01", "value": 145}, ...]
    """
    _require_patient(db, patient_id)
    return get_parameter_trend_series(db, patient_id, parameter)


@router.get(
    "/analytics/{patient_id}",
    response_model=SummaryAnalytics,
)
def patient_analytics(patient_id: int, db: Session = Depends(get_db)):
    """Summary insights: abnormal focus, improving/worsening, recurring issues."""
    _require_patient(db, patient_id)
    return build_summary_analytics(db, patient_id)
