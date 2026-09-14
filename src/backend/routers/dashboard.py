"""
Dashboard router — GET /api/v1/dashboard/summary
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import datetime, timedelta, timezone
import json

from database import get_session
from models import (
    Patient,
    TreatmentSession,
    AIInsight,
    PatientSummary,
    AIInsightRead,
    DashboardSummary,
    RiskFlag,
)
from risk_engine import compute_risk_flags, compute_risk_level
from adherence import compute_adherence

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_session)):
    patients = db.exec(select(Patient)).all()
    now = _utcnow()
    active_cutoff = now - timedelta(days=14)

    total_patients = len(patients)
    active_patients = 0
    completed_sessions_total = 0
    adherence_values = []
    risk_distribution = {"low": 0, "medium": 0, "high": 0}
    attention_patients = []

    for patient in patients:
        sessions = list(db.exec(
            select(TreatmentSession).where(TreatmentSession.patient_id == patient.id)
        ).all())

        flags = compute_risk_flags(sessions, patient.planned_sessions_per_week)
        risk_level = compute_risk_level(flags)
        adherence = compute_adherence(patient.id, sessions, patient.planned_sessions_per_week)

        # Persist
        patient.risk_level = risk_level
        patient.risk_flags_json = json.dumps([f.model_dump() for f in flags])
        db.add(patient)

        # Active: at least one session in last 14 days
        recent = [s for s in sessions if s.session_date >= active_cutoff]
        if recent:
            active_patients += 1

        completed_sessions_total += sum(1 for s in sessions if s.status == "completed")
        adherence_values.append(adherence.adherence_pct)
        risk_distribution[risk_level.value] += 1

        summary = PatientSummary(
            id=patient.id,
            name=patient.name,
            age=patient.age,
            diagnosis=patient.diagnosis,
            start_date=patient.start_date,
            planned_sessions_per_week=patient.planned_sessions_per_week,
            risk_level=risk_level,
            risk_flags=flags,
            adherence=adherence,
            is_demo=patient.is_demo,
            notes=patient.notes,
        )
        if risk_level.value in ("high", "medium"):
            attention_patients.append(summary)

    db.commit()

    avg_adherence = round(sum(adherence_values) / len(adherence_values), 1) if adherence_values else 0.0

    # Sort attention list: high risk first
    risk_order = {"high": 0, "medium": 1, "low": 2}
    attention_patients.sort(key=lambda p: (risk_order.get(p.risk_level.value, 3), p.name))

    # Recent AI insights (last 5)
    recent_insights_raw = db.exec(
        select(AIInsight).order_by(AIInsight.generated_at.desc()).limit(5)  # type: ignore
    ).all()
    recent_insights = [AIInsightRead.model_validate(i) for i in recent_insights_raw]

    return DashboardSummary(
        total_patients=total_patients,
        active_patients=active_patients,
        completed_sessions_total=completed_sessions_total,
        avg_adherence_pct=avg_adherence,
        attention_count=len(attention_patients),
        risk_distribution=risk_distribution,
        attention_patients=attention_patients[:5],  # top 5 for dashboard widget
        recent_insights=recent_insights,
    )
