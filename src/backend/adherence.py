"""
Adherence calculator — computes planned vs completed session metrics.
"""

from datetime import datetime, timedelta, timezone
from typing import List
from models import TreatmentSession, SessionStatus, AdherenceSummary


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def compute_adherence(
    patient_id: str,
    sessions: List[TreatmentSession],
    planned_per_week: int,
    window_days: int = 28,
) -> AdherenceSummary:
    """
    Compute adherence summary for the most recent `window_days` days.
    Also computes week-over-week trend (last 7 days vs prior 7 days).
    """
    now = _utcnow()
    cutoff = now - timedelta(days=window_days)
    window_sessions = [s for s in sessions if s.session_date >= cutoff]

    planned = round(planned_per_week * (window_days / 7))
    completed = sum(1 for s in window_sessions if s.status == SessionStatus.completed)
    missed = sum(1 for s in window_sessions if s.status == SessionStatus.missed)
    adherence_pct = round(min(100.0, (completed / planned) * 100), 1) if planned > 0 else 100.0

    # Week-over-week trend
    last_7 = [s for s in sessions if s.session_date >= now - timedelta(days=7)]
    prior_7 = [s for s in sessions if now - timedelta(days=14) <= s.session_date < now - timedelta(days=7)]

    last_7_planned = planned_per_week
    prior_7_planned = planned_per_week

    last_7_adh = (
        min(100.0, (sum(1 for s in last_7 if s.status == SessionStatus.completed) / last_7_planned) * 100)
        if last_7_planned > 0 else 100.0
    )
    prior_7_adh = (
        min(100.0, (sum(1 for s in prior_7 if s.status == SessionStatus.completed) / prior_7_planned) * 100)
        if prior_7_planned > 0 else 100.0
    )
    wow_trend = round(last_7_adh - prior_7_adh, 1)

    return AdherenceSummary(
        patient_id=patient_id,
        planned_sessions=planned,
        completed_sessions=completed,
        missed_sessions=missed,
        adherence_pct=adherence_pct,
        week_over_week_trend=wow_trend,
    )
