"""Patient management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.patient import Patient
from schemas.patient_schema import PatientCreate, PatientResponse

router = APIRouter()


@router.post("/patients", response_model=PatientResponse, status_code=201)
def create_patient(body: PatientCreate, db: Session = Depends(get_db)):
    """Create a patient record for longitudinal tracking."""
    patient = Patient(name=body.name.strip())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/patients", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    """List all patients."""
    patients = db.scalars(select(Patient).order_by(Patient.created_at.desc())).all()
    return patients


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Fetch a single patient by id."""
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
