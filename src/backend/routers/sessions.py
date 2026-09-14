"""
Sessions router — POST /api/v1/sessions (submit completed simulator session)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from models import TreatmentSession, TreatmentSessionCreate, TreatmentSessionRead, Patient

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=TreatmentSessionRead, status_code=201)
def create_session(payload: TreatmentSessionCreate, db: Session = Depends(get_session)):
    """Submit a completed simulated treatment session."""
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {payload.patient_id} not found")

    session_obj = TreatmentSession(
        patient_id=payload.patient_id,
        session_date=payload.session_date,
        duration_minutes=payload.duration_minutes,
        status=payload.status,
        compression_level=payload.compression_level,
        nmes_pattern=payload.nmes_pattern,
        patient_reported_pain=payload.patient_reported_pain,
        patient_reported_comfort=payload.patient_reported_comfort,
        notes=payload.notes,
        is_simulated=True,
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return TreatmentSessionRead.model_validate(session_obj)


@router.get("/{session_id}", response_model=TreatmentSessionRead)
def get_session_detail(session_id: str, db: Session = Depends(get_session)):
    from sqlmodel import select
    from models import TreatmentSession as TS
    session_obj = db.get(TS, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return TreatmentSessionRead.model_validate(session_obj)
