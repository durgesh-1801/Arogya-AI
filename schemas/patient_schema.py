"""Pydantic schemas for patients and persisted reports."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class PatientResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportParameterResponse(BaseModel):
    id: int
    parameter_name: str
    value: float
    unit: str
    status: str
    normal_min: float
    normal_max: float

    model_config = {"from_attributes": True}


class MedicalReportResponse(BaseModel):
    id: int
    patient_id: int
    filename: str
    report_date: date
    uploaded_at: datetime
    summary: str | None
    urgency_level: str
    parameters: list[ReportParameterResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
