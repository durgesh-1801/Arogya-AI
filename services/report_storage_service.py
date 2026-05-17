"""
Persist parsed upload results: patient, report, and parameters.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.orm import Session

from models.medical_report import MedicalReport
from models.patient import Patient
from models.report_parameter import ReportParameter
from schemas.report_schema import LabParameter
from utils.parameter_utils import normalize_parameter_name


class PatientNotFoundError(Exception):
    """Raised when a patient_id does not exist."""


def get_or_create_patient(
    db: Session,
    *,
    patient_id: int | None = None,
    patient_name: str | None = None,
) -> Patient:
    """Resolve patient by id or create a new one when a name is provided."""
    if patient_id is not None:
        patient = db.get(Patient, patient_id)
        if patient is None:
            raise PatientNotFoundError(f"Patient {patient_id} not found")
        return patient

    name = (patient_name or "Unknown Patient").strip()
    if not name:
        name = "Unknown Patient"

    patient = Patient(name=name)
    db.add(patient)
    db.flush()
    return patient


def _derive_urgency(parameters: list[LabParameter]) -> str:
    abnormal = sum(1 for p in parameters if p.status == "abnormal")
    borderline = sum(1 for p in parameters if p.status == "borderline")

    if abnormal >= 3:
        return "high"
    if abnormal >= 1:
        return "medium"
    if borderline >= 2:
        return "medium"
    return "low"


def _build_summary(parameters: list[LabParameter]) -> str:
    if not parameters:
        return "No parameters extracted"
    abnormal = [p for p in parameters if p.status == "abnormal"]
    borderline = [p for p in parameters if p.status == "borderline"]
    parts = [f"{len(parameters)} parameter(s) recorded"]
    if abnormal:
        names = ", ".join(p.parameter for p in abnormal[:5])
        suffix = "…" if len(abnormal) > 5 else ""
        parts.append(f"{len(abnormal)} abnormal: {names}{suffix}")
    if borderline:
        parts.append(f"{len(borderline)} borderline")
    return ". ".join(parts)


def save_parsed_report(
    db: Session,
    *,
    filename: str,
    parameters: list[LabParameter],
    patient_id: int | None = None,
    patient_name: str | None = None,
    report_date: date | None = None,
) -> tuple[Patient, MedicalReport]:
    """
    Store a successfully parsed report and its parameters.

    Returns:
        Tuple of (patient, medical_report).
    """
    patient = get_or_create_patient(
        db, patient_id=patient_id, patient_name=patient_name
    )

    report = MedicalReport(
        patient_id=patient.id,
        filename=filename,
        report_date=report_date or date.today(),
        uploaded_at=datetime.utcnow(),
        summary=_build_summary(parameters),
        urgency_level=_derive_urgency(parameters),
    )
    db.add(report)
    db.flush()

    for param in parameters:
        key = normalize_parameter_name(param.parameter)
        db.add(
            ReportParameter(
                report_id=report.id,
                parameter_name=key,
                value=param.value,
                unit=param.unit,
                status=param.status,
                normal_min=param.normal_min,
                normal_max=param.normal_max,
            )
        )

    db.commit()
    db.refresh(patient)
    db.refresh(report)
    return patient, report
