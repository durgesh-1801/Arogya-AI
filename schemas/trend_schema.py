"""Pydantic schemas for trends and summary analytics."""

from typing import Literal

from pydantic import BaseModel, Field

TrendState = Literal["improving", "worsening", "stable"]


class TrendDataPoint(BaseModel):
    date: str = Field(..., description="ISO date (YYYY-MM-DD)")
    value: float


class ParameterTrend(BaseModel):
    parameter: str
    display_name: str
    unit: str
    trend: TrendState
    data: list[TrendDataPoint]


class PatientTrendsResponse(BaseModel):
    patient_id: int
    trends: list[ParameterTrend]


class SummaryAnalytics(BaseModel):
    most_abnormal_parameter: str | None = None
    improving_metrics: list[str] = Field(default_factory=list)
    worsening_metrics: list[str] = Field(default_factory=list)
    recurring_abnormalities: list[str] = Field(default_factory=list)


class PatientTrendsWithAnalyticsResponse(BaseModel):
    patient_id: int
    trends: list[ParameterTrend]
    analytics: SummaryAnalytics
