"""
AI router — IBM watsonx.ai (IBM Granite) and Deterministic Clinical Decision Support.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from database import get_session
from models import Patient, TreatmentSession
from ai_service import (
    generate_patient_insight,
    answer_assistant_query,
    generate_dashboard_cohort_insight,
)

router = APIRouter(prefix="/ai", tags=["ai"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class PatientAIInsightResponse(BaseModel):
    provider: str
    model_used: str
    patient_id: str
    patient_name: str
    risk_level: str
    status: str
    key_trends: List[str]
    attention_factors: List[str]
    suggested_review: str
    disclaimer: str


class AssistantRequest(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None  # alias support


class AssistantResponse(BaseModel):
    provider: str
    model_used: str
    response: str
    text: str  # alias for backwards compatibility
    disclaimer: str
    suggested_questions: Optional[List[str]] = None


class DashboardAIInsightResponse(BaseModel):
    provider: str
    model_used: str
    cohort_summary: str
    risk_overview: str
    key_observations: List[str]
    suggested_clinical_actions: List[str]
    disclaimer: str


class PatientSummaryRequest(BaseModel):
    patient_id: str


# ── Feature 1: Patient Clinical Insight ──────────────────────────────────────

@router.get("/patients/{patient_id}/insight", response_model=PatientAIInsightResponse)
def get_patient_ai_insight(patient_id: str, db: Session = Depends(get_session)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    sessions = list(db.exec(
        select(TreatmentSession)
        .where(TreatmentSession.patient_id == patient_id)
        .order_by(TreatmentSession.session_date.desc())  # type: ignore
    ).all())

    return generate_patient_insight(patient, sessions)


@router.post("/patient-summary", response_model=PatientAIInsightResponse)
def post_patient_ai_summary(payload: PatientSummaryRequest, db: Session = Depends(get_session)):
    return get_patient_ai_insight(payload.patient_id, db)


# ── Feature 2: Clinician AI Assistant ────────────────────────────────────────

@router.post("/assistant", response_model=AssistantResponse)
def ai_assistant_chat(payload: AssistantRequest, db: Session = Depends(get_session)):
    query_text = (payload.message or payload.question or "").strip()
    if not query_text:
        raise HTTPException(status_code=422, detail="Message or question is required")

    return answer_assistant_query(query_text, db)


# ── Feature 3: Dashboard AI Cohort Insight ───────────────────────────────────

@router.get("/dashboard-insight", response_model=DashboardAIInsightResponse)
def get_dashboard_cohort_insight_endpoint(db: Session = Depends(get_session)):
    return generate_dashboard_cohort_insight(db)


@router.post("/dashboard-insights", response_model=DashboardAIInsightResponse)
def post_dashboard_cohort_insights(db: Session = Depends(get_session)):
    return generate_dashboard_cohort_insight(db)

