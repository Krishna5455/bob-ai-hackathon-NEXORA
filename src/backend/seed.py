"""
Deterministic seed data for the Veno-Pump demo.

All dates are relative to TODAY so risk/adherence calculations remain
meaningful on any redeploy. Patient IDs and profiles are fixed.

Run:  python seed.py
Re-running is safe — it clears and re-creates all demo data.

⚠ All patients, sessions and data are SYNTHETIC DEMO DATA only.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, date, timezone
from sqlmodel import Session, select
from database import get_engine, init_db
from models import Patient, TreatmentSession, SessionStatus, RiskLevel


def _today() -> datetime:
    """Midnight UTC today — anchor for all relative dates."""
    t = datetime.now(timezone.utc).replace(tzinfo=None)
    return t.replace(hour=12, minute=0, second=0, microsecond=0)


def _ago(days: int) -> datetime:
    return _today() - timedelta(days=days)


def _session(
    patient_id: str,
    days_ago: int,
    status: SessionStatus,
    pain: int = 2,
    comfort: int = 7,
    duration: int = 20,
    notes: str = "",
) -> TreatmentSession:
    return TreatmentSession(
        patient_id=patient_id,
        session_date=_ago(days_ago),
        duration_minutes=duration,
        status=status,
        compression_level="moderate",
        nmes_pattern="standard-calf",
        patient_reported_pain=pain,
        patient_reported_comfort=comfort,
        notes=notes,
        is_simulated=True,
    )


C = SessionStatus.completed
M = SessionStatus.missed
I = SessionStatus.incomplete


def build_seed_data():
    patients = []
    sessions = []

    # ── P-001: Stable/good adherence — LOW RISK, improving outcomes ──────────
    # Sessions are evenly spaced ~3 days apart across 28 days.
    # All within both adherence windows — no decline, no missed, no pain increase.
    # Expected flags: none. Expected risk: LOW.
    p = Patient(
        id="P-001",
        name="Margaret O'Sullivan",
        age=62,
        diagnosis="Post-DVT rehabilitation — left lower limb",
        start_date=_ago(56).date(),
        planned_sessions_per_week=3,
        notes="Strong engagement. No reported concerns. Consistent attendance and improving outcomes.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # Recent 2 weeks (days 1–13): 4 sessions — above planned (6 planned, 4 completed = 67%)
        # Prior 2 weeks (days 14–27): 4 sessions — also 67%
        # No drop between windows → no declining_adherence flag
        # Pain scores decreasing over time (improving) → no increasing_discomfort flag
        # Regular every-3-day spacing → stdev ~0 → no irregular_attendance flag
        _session("P-001", 2,  C, pain=1, comfort=9),
        _session("P-001", 5,  C, pain=1, comfort=9),
        _session("P-001", 8,  C, pain=2, comfort=8),
        _session("P-001", 11, C, pain=2, comfort=8),
        _session("P-001", 15, C, pain=3, comfort=7),
        _session("P-001", 18, C, pain=3, comfort=7),
        _session("P-001", 21, C, pain=4, comfort=6),
        _session("P-001", 24, C, pain=4, comfort=6),
        _session("P-001", 27, C, pain=5, comfort=5),
        _session("P-001", 30, C, pain=5, comfort=5),
    ]

    # ── P-002: Declining adherence — HIGH RISK ────────────────────────────────
    # Prior 2 weeks (15–28): 5 of 6 planned = 83%
    # Recent 2 weeks (1–13): 1 of 6 planned = 17%
    # Drop: 83% → 17% = 66pp → CRITICAL declining_adherence flag
    # Expected flags: declining_adherence (critical) + missed_sessions (critical)
    # Expected risk: HIGH
    p = Patient(
        id="P-002",
        name="James Thornton",
        age=54,
        diagnosis="Chronic venous insufficiency — bilateral",
        start_date=_ago(42).date(),
        planned_sessions_per_week=3,
        notes="Was completing almost all sessions. Attendance has collapsed in the past two weeks.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # Prior 2 weeks (days 15–27) — strong adherence
        _session("P-002", 16, C, pain=3, comfort=7),
        _session("P-002", 19, C, pain=3, comfort=7),
        _session("P-002", 22, C, pain=2, comfort=7),
        _session("P-002", 25, C, pain=2, comfort=8),
        _session("P-002", 27, C, pain=2, comfort=8),
        # Recent 2 weeks (days 1–13) — near-complete collapse
        _session("P-002", 11, M),
        _session("P-002", 8,  M),
        _session("P-002", 5,  M),
        _session("P-002", 3,  C, pain=4, comfort=6),
        _session("P-002", 1,  M),
    ]

    # ── P-003: Complete dropout after perfect attendance — HIGH RISK ──────────
    # Prior 2 weeks (15–28): 5 completed = 83%
    # Recent 2 weeks (1–13): 0 completed, 4 missed = 0%
    # Drop: 83% → 0% = 83pp → CRITICAL declining_adherence flag
    # Also 4 consecutive missed sessions → CRITICAL missed_sessions flag
    # Expected flags: declining_adherence (critical) + missed_sessions (critical)
    # Expected risk: HIGH
    p = Patient(
        id="P-003",
        name="Anita Bhattacharya",
        age=48,
        diagnosis="Varicose vein post-surgical rehabilitation",
        start_date=_ago(49).date(),
        planned_sessions_per_week=3,
        notes="Previously perfect attendance. Complete withdrawal in the last 13 days. Urgent follow-up required.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # Prior 2 weeks (days 15–27) — perfect
        _session("P-003", 16, C, pain=2, comfort=9),
        _session("P-003", 18, C, pain=2, comfort=9),
        _session("P-003", 21, C, pain=2, comfort=8),
        _session("P-003", 24, C, pain=3, comfort=8),
        _session("P-003", 27, C, pain=3, comfort=7),
        # Recent 2 weeks (days 1–13) — total dropout
        _session("P-003", 11, M),
        _session("P-003", 8,  M),
        _session("P-003", 5,  M),
        _session("P-003", 2,  M),
    ]

    # ── P-004: Consistent attendance but rising pain — HIGH RISK ─────────────
    # Exactly 6 completed sessions to make the pain-trend comparison clear.
    # Prior 3 (oldest-of-6): avg pain 2.3  |  Recent 3 (newest-of-6): avg pain 7.3
    # Increase: +5.0 pts → CRITICAL increasing_discomfort flag
    # Adherence: 3 sessions each 2-week window → 50% — but no DECLINE (both windows same)
    # Expected flags: increasing_discomfort (critical)
    # Expected risk: HIGH
    p = Patient(
        id="P-004",
        name="Robert Chen",
        age=71,
        diagnosis="Lymphoedema management — right leg",
        start_date=_ago(35).date(),
        planned_sessions_per_week=3,
        notes="Completing sessions consistently but pain scores are significantly elevated. Clinician review recommended.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # Prior 3 completed sessions (oldest, days 22–29): avg pain 2.3
        _session("P-004", 29, C, pain=2, comfort=8),
        _session("P-004", 26, C, pain=2, comfort=8),
        _session("P-004", 22, C, pain=3, comfort=7),
        # Recent 3 completed sessions (newest, days 4–10): avg pain 7.3
        # Also ensures both recent and prior adherence windows are equal (no decline flag)
        _session("P-004", 10, C, pain=7, comfort=4),
        _session("P-004", 7,  C, pain=7, comfort=3),
        _session("P-004", 4,  C, pain=8, comfort=3),
    ]

    # ── P-005: Chronically irregular, multiple missed — HIGH RISK ────────────
    # Many missed sessions throughout; consecutive misses in last 14 days
    # Expected flags: missed_sessions (critical) + irregular_attendance (warning)
    # Expected risk: HIGH
    p = Patient(
        id="P-005",
        name="Declan Murphy",
        age=66,
        diagnosis="Post-thrombotic syndrome — left calf",
        start_date=_ago(42).date(),
        planned_sessions_per_week=3,
        notes="Highly irregular attendance throughout the programme. Consecutive missed sessions in last 14 days.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        _session("P-005", 40, C, pain=4, comfort=5),
        _session("P-005", 35, M),
        _session("P-005", 32, M),
        _session("P-005", 30, M),
        _session("P-005", 25, C, pain=4, comfort=5),
        _session("P-005", 22, M),
        _session("P-005", 19, M),
        _session("P-005", 16, C, pain=5, comfort=4),
        _session("P-005", 11, M),
        _session("P-005", 8,  M),
        _session("P-005", 5,  M),
        _session("P-005", 3,  C, pain=5, comfort=4),
    ]

    # ── P-006: New patient — LOW RISK (insufficient history) ─────────────────
    # Only 3 sessions — risk engine suppresses all flags (< 3 sessions guard +
    # no prior window data). Expected risk: LOW.
    p = Patient(
        id="P-006",
        name="Sophie Larsson",
        age=35,
        diagnosis="Post-surgical DVT prophylaxis — right leg",
        start_date=_ago(10).date(),
        planned_sessions_per_week=3,
        notes="New patient. Insufficient session history for risk assessment. Monitor closely.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        _session("P-006", 9,  C, pain=3, comfort=7),
        _session("P-006", 6,  C, pain=2, comfort=7),
        _session("P-006", 3,  C, pain=2, comfort=8),
    ]

    # ── P-007: Completed programme — LOW RISK ────────────────────────────────
    # All sessions completed and finished 38+ days ago (programme_active=False).
    # Adherence-decline and irregular-attendance flags suppressed for completed patients.
    # Expected flags: none. Expected risk: LOW.
    p = Patient(
        id="P-007",
        name="Yusuf Al-Rashid",
        age=58,
        diagnosis="Chronic oedema management — bilateral ankles",
        start_date=_ago(80).date(),
        planned_sessions_per_week=3,
        notes="Programme completed successfully 5+ weeks ago. Strong adherence throughout. Stable outcomes.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # All sessions 38–80 days ago — programme is complete, not active
        _session("P-007", 80, C, pain=5, comfort=5),
        _session("P-007", 77, C, pain=5, comfort=5),
        _session("P-007", 74, C, pain=4, comfort=6),
        _session("P-007", 71, C, pain=4, comfort=6),
        _session("P-007", 68, C, pain=3, comfort=7),
        _session("P-007", 65, C, pain=3, comfort=7),
        _session("P-007", 62, C, pain=3, comfort=7),
        _session("P-007", 59, C, pain=2, comfort=8),
        _session("P-007", 56, C, pain=2, comfort=8),
        _session("P-007", 53, C, pain=2, comfort=8),
        _session("P-007", 50, C, pain=2, comfort=9),
        _session("P-007", 47, C, pain=2, comfort=9),
        _session("P-007", 44, C, pain=1, comfort=9),
        _session("P-007", 41, C, pain=1, comfort=9),
        _session("P-007", 38, C, pain=1, comfort=9),
    ]

    # ── P-008: Combined high-risk — declining adherence AND rising discomfort ─
    # Prior 2 weeks (15–27): 5 completed = 83%
    # Recent 2 weeks (1–13): 1 completed, 3 missed = 17%
    # Drop: 83% → 17% = 66pp → CRITICAL declining_adherence
    # Pain: prior 3 avg 3.3, recent 3 avg 7.0 → +3.7 → CRITICAL increasing_discomfort
    # Expected flags: declining_adherence (critical) + increasing_discomfort (critical)
    # Expected risk: HIGH
    p = Patient(
        id="P-008",
        name="Lucia Fernandez",
        age=59,
        diagnosis="Venous leg ulcer rehabilitation",
        start_date=_ago(56).date(),
        planned_sessions_per_week=3,
        notes="Multiple concurrent risk signals: attendance collapsing and reported pain increasing sharply.",
        is_demo=True,
    )
    patients.append(p)
    sessions += [
        # Earlier sessions — low pain, good attendance
        _session("P-008", 50, C, pain=2, comfort=8),
        _session("P-008", 47, C, pain=2, comfort=8),
        _session("P-008", 44, C, pain=2, comfort=7),
        _session("P-008", 41, C, pain=3, comfort=7),
        _session("P-008", 38, C, pain=3, comfort=7),
        _session("P-008", 35, C, pain=3, comfort=6),
        # Prior 2 weeks (days 15–27) — still attending, pain mild
        _session("P-008", 16, C, pain=3, comfort=6),
        _session("P-008", 19, C, pain=4, comfort=6),
        _session("P-008", 22, C, pain=4, comfort=5),
        _session("P-008", 25, C, pain=4, comfort=5),
        _session("P-008", 27, C, pain=4, comfort=5),
        # Recent 2 weeks (days 1–13) — collapsing attendance + sharply elevated pain
        _session("P-008", 11, M),
        _session("P-008", 8,  M),
        _session("P-008", 5,  C, pain=7, comfort=3),
        _session("P-008", 3,  M),
        _session("P-008", 1,  M),
    ]

    return patients, sessions


def run_seed():
    init_db()
    engine = get_engine()

    with Session(engine) as session:
        # Clear existing demo data
        existing_sessions = session.exec(select(TreatmentSession)).all()
        for s in existing_sessions:
            session.delete(s)
        existing_patients = session.exec(select(Patient)).all()
        for p in existing_patients:
            session.delete(p)
        session.commit()

        patients, treatment_sessions = build_seed_data()

        for p in patients:
            session.add(p)
        session.commit()

        for s in treatment_sessions:
            session.add(s)
        session.commit()

        # Capture values while session is open
        summary = [(p.id, p.name, p.diagnosis) for p in patients]

    print(f"[OK] Seeded {len(summary)} patients and {len(treatment_sessions)} sessions.")
    for pid, name, diag in summary:
        print(f"   {pid}: {name} - {diag}")


if __name__ == "__main__":
    run_seed()
