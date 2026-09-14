"""
Patients router — GET /api/v1/patients, GET /api/v1/patients/{id}, etc.
"""

import json
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel

from database import get_session
from models import (
    Patient,
    TreatmentSession,
    PatientSummary,
    PatientDetail,
    TreatmentSessionRead,
    AIInsightRead,
    AdherenceSummary,
    OutcomePoint,
    RiskFlag,
    SessionStatus,
)
from risk_engine import compute_risk_flags, compute_risk_level
from adherence import compute_adherence


class WeeklyAdherencePoint(SQLModel):
    week_label: str          # e.g. "Week 4", "Week 3", ...
    week_start: str          # ISO date string
    planned: int
    completed: int
    missed: int
    adherence_pct: float


class AdherenceWeeklySeries(SQLModel):
    patient_id: str
    weeks: List[WeeklyAdherencePoint]
    overall_summary: AdherenceSummary

router = APIRouter(prefix="/patients", tags=["patients"])


def _enrich_patient(patient: Patient, sessions: List[TreatmentSession]) -> tuple:
    """Compute and persist risk flags + adherence for a patient. Returns (flags, risk_level, adherence)."""
    flags = compute_risk_flags(sessions, patient.planned_sessions_per_week)
    risk_level = compute_risk_level(flags)
    adherence = compute_adherence(patient.id, sessions, patient.planned_sessions_per_week)
    return flags, risk_level, adherence


def _patient_to_summary(patient: Patient, sessions: List[TreatmentSession], db: Session) -> PatientSummary:
    flags, risk_level, adherence = _enrich_patient(patient, sessions)

    # Persist computed risk level and flags back to DB
    patient.risk_level = risk_level
    patient.risk_flags_json = json.dumps([f.model_dump() for f in flags])
    db.add(patient)
    db.commit()

    return PatientSummary(
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


@router.get("", response_model=List[PatientSummary])
def list_patients(
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_session),
):
    """Return all patients with computed risk and adherence. Optionally filter by name/diagnosis."""
    query = select(Patient)
    patients = db.exec(query).all()

    summaries = []
    for patient in patients:
        sessions = db.exec(select(TreatmentSession).where(TreatmentSession.patient_id == patient.id)).all()
        summary = _patient_to_summary(patient, list(sessions), db)
        summaries.append(summary)

    if search:
        term = search.lower()
        summaries = [
            s for s in summaries
            if term in s.name.lower() or term in s.diagnosis.lower() or term in s.id.lower()
        ]

    # Sort: high risk first, then medium, then low; within each group alphabetically
    risk_order = {"high": 0, "medium": 1, "low": 2}
    summaries.sort(key=lambda s: (risk_order.get(s.risk_level.value, 3), s.name))

    return summaries


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(patient_id: str, db: Session = Depends(get_session)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    sessions = db.exec(
        select(TreatmentSession)
        .where(TreatmentSession.patient_id == patient_id)
        .order_by(TreatmentSession.session_date.desc())  # type: ignore
    ).all()

    flags, risk_level, adherence = _enrich_patient(patient, list(sessions))
    patient.risk_level = risk_level
    patient.risk_flags_json = json.dumps([f.model_dump() for f in flags])
    db.add(patient)
    db.commit()

    insights_raw = db.exec(
        select(__import__("models").AIInsight)
        .where(__import__("models").AIInsight.patient_id == patient_id)
        .order_by(__import__("models").AIInsight.generated_at.desc())  # type: ignore
        .limit(5)
    ).all()

    return PatientDetail(
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
        sessions=[TreatmentSessionRead.model_validate(s) for s in sessions],
        insights=[AIInsightRead.model_validate(i) for i in insights_raw],
    )


@router.get("/{patient_id}/sessions", response_model=List[TreatmentSessionRead])
def get_patient_sessions(patient_id: str, db: Session = Depends(get_session)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    sessions = db.exec(
        select(TreatmentSession)
        .where(TreatmentSession.patient_id == patient_id)
        .order_by(TreatmentSession.session_date.desc())  # type: ignore
    ).all()
    return [TreatmentSessionRead.model_validate(s) for s in sessions]


@router.get("/{patient_id}/adherence", response_model=AdherenceSummary)
def get_patient_adherence(patient_id: str, db: Session = Depends(get_session)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    sessions = db.exec(select(TreatmentSession).where(TreatmentSession.patient_id == patient_id)).all()
    return compute_adherence(patient_id, list(sessions), patient.planned_sessions_per_week)


@router.get("/{patient_id}/adherence/weekly", response_model=AdherenceWeeklySeries)
def get_patient_adherence_weekly(
    patient_id: str,
    weeks: int = Query(default=6, ge=2, le=12),
    db: Session = Depends(get_session),
):
    """Return per-week adherence breakdown for the last N weeks."""
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    all_sessions = list(db.exec(
        select(TreatmentSession).where(TreatmentSession.patient_id == patient_id)
    ).all())

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    planned_per_week = patient.planned_sessions_per_week
    week_points: List[WeeklyAdherencePoint] = []

    for week_idx in range(weeks - 1, -1, -1):  # oldest first
        week_end = now - timedelta(days=week_idx * 7)
        week_start = week_end - timedelta(days=7)
        week_sessions = [
            s for s in all_sessions
            if week_start <= s.session_date < week_end
        ]
        completed = sum(1 for s in week_sessions if s.status == SessionStatus.completed)
        missed = sum(1 for s in week_sessions if s.status == SessionStatus.missed)
        adherence_pct = round(min(100.0, (completed / planned_per_week) * 100), 1)

        label_offset = weeks - 1 - week_idx
        week_label = "This week" if label_offset == 0 else f"{label_offset}w ago"

        week_points.append(WeeklyAdherencePoint(
            week_label=week_label,
            week_start=week_start.date().isoformat(),
            planned=planned_per_week,
            completed=completed,
            missed=missed,
            adherence_pct=adherence_pct,
        ))

    overall = compute_adherence(patient_id, all_sessions, planned_per_week)
    return AdherenceWeeklySeries(
        patient_id=patient_id,
        weeks=week_points,
        overall_summary=overall,
    )


@router.get("/{patient_id}/outcomes", response_model=List[OutcomePoint])
def get_patient_outcomes(patient_id: str, db: Session = Depends(get_session)):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    sessions = db.exec(
        select(TreatmentSession)
        .where(
            TreatmentSession.patient_id == patient_id,
            TreatmentSession.status == "completed",
        )
        .order_by(TreatmentSession.session_date)  # type: ignore
    ).all()
    return [
        OutcomePoint(
            session_date=s.session_date,
            pain=s.patient_reported_pain,
            comfort=s.patient_reported_comfort,
        )
        for s in sessions
    ]


@router.get("/{patient_id}/report")
def get_patient_report(patient_id: str, db: Session = Depends(get_session)):
    """Return a structured text report for clinician review."""
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    sessions = db.exec(
        select(TreatmentSession)
        .where(TreatmentSession.patient_id == patient_id)
        .order_by(TreatmentSession.session_date.desc())  # type: ignore
    ).all()
    sessions_list = list(sessions)
    flags, risk_level, adherence = _enrich_patient(patient, sessions_list)

    completed = [s for s in sessions_list if s.status == "completed"]
    avg_pain = round(sum(s.patient_reported_pain for s in completed) / len(completed), 1) if completed else "N/A"
    avg_comfort = round(sum(s.patient_reported_comfort for s in completed) / len(completed), 1) if completed else "N/A"

    flag_lines = "\n".join(f"  • [{f.severity.upper()}] {f.flag_type}: {f.detail}" for f in flags) or "  None"

    report_text = f"""VENO-PUMP CLINICAL MONITORING — PATIENT REPORT
⚠ SYNTHETIC DEMO DATA — Not a real patient record

───────────────────────────────────────────────
Patient:        {patient.name} (ID: {patient.id})
Age:            {patient.age}
Diagnosis:      {patient.diagnosis}
Start Date:     {patient.start_date}
Sessions/Week:  {patient.planned_sessions_per_week} planned
Notes:          {patient.notes or "None"}

ADHERENCE (last 28 days)
  Planned:      {adherence.planned_sessions}
  Completed:    {adherence.completed_sessions}
  Missed:       {adherence.missed_sessions}
  Rate:         {adherence.adherence_pct}%
  WoW Trend:    {adherence.week_over_week_trend:+.1f}pp

OUTCOMES (completed sessions)
  Avg Pain Score:     {avg_pain}/10
  Avg Comfort Score:  {avg_comfort}/10
  Total Sessions:     {len(sessions_list)}
  Completed:          {len(completed)}

RISK ASSESSMENT
  Level:     {risk_level.value.upper()}
  Flags:
{flag_lines}

───────────────────────────────────────────────
Generated by Veno-Pump Clinical Monitoring Platform (prototype)
⚠ AI-assisted output — clinician review and judgement required
"""
    return {"patient_id": patient_id, "report": report_text}
