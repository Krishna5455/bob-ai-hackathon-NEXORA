"""
Risk engine — computes risk flags and risk level for a patient
based on their treatment session history.

All logic is pure/deterministic given a list of TreatmentSession records.
Rules are intentionally conservative to avoid false positives on
patients who have completed a programme or have insufficient history.
"""

from datetime import datetime, timedelta, timezone
from typing import List
from models import TreatmentSession, SessionStatus, RiskLevel, RiskFlag
import statistics


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _adherence_pct_for_window(sessions: List[TreatmentSession], planned_per_week: int, days: int) -> float:
    """Adherence % for a list of sessions already filtered to a specific window."""
    completed = sum(1 for s in sessions if s.status == SessionStatus.completed)
    planned = planned_per_week * (days / 7)
    if planned == 0:
        return 100.0
    return round(min(100.0, (completed / planned) * 100), 1)


def _has_recent_activity(sessions: List[TreatmentSession], days: int = 21) -> bool:
    """True if any session (any status) exists within the given window."""
    now = _utcnow()
    return any(s.session_date >= now - timedelta(days=days) for s in sessions)


def compute_risk_flags(
    sessions: List[TreatmentSession],
    planned_per_week: int,
) -> List[RiskFlag]:
    flags: List[RiskFlag] = []
    now = _utcnow()

    # Guard: not enough history to make meaningful risk assessments
    if len(sessions) < 3:
        return flags

    # If no sessions at all in the last 35 days, the patient has likely completed
    # or left the programme — suppress adherence-decline flags to avoid false positives
    # on patients who have simply finished (e.g. P-007 completed programme).
    programme_active = _has_recent_activity(sessions, days=35)

    # Sort sessions newest-first
    sorted_sessions = sorted(sessions, key=lambda s: s.session_date, reverse=True)

    # ── Flag 1: Declining adherence ────────────────────────────────────────────
    # Only meaningful when the patient is actively in the programme.
    # Compare sessions strictly within each window using EXCLUSIVE boundaries
    # to avoid double-counting sessions that land exactly on the cutoff.
    if programme_active:
        recent_2w = [
            s for s in sessions
            if now - timedelta(days=14) <= s.session_date < now
        ]
        prior_2w = [
            s for s in sessions
            if now - timedelta(days=28) <= s.session_date < now - timedelta(days=14)
        ]
        if prior_2w:  # only flag if there is enough prior history
            recent_adh = _adherence_pct_for_window(recent_2w, planned_per_week, 14)
            prior_adh = _adherence_pct_for_window(prior_2w, planned_per_week, 14)
            drop = prior_adh - recent_adh
            if drop >= 25:
                flags.append(RiskFlag(
                    flag_type="declining_adherence",
                    severity="critical",
                    detail=f"Adherence dropped {drop:.0f}pp in the last 2 weeks ({prior_adh:.0f}% to {recent_adh:.0f}%)",
                ))
            elif drop >= 20:
                flags.append(RiskFlag(
                    flag_type="declining_adherence",
                    severity="warning",
                    detail=f"Adherence declined {drop:.0f}pp in the last 2 weeks ({prior_adh:.0f}% to {recent_adh:.0f}%)",
                ))

    # ── Flag 2: Consecutive missed sessions ────────────────────────────────────
    # Only flag within the last 14 days to avoid stale data driving alerts.
    recent_14d = sorted(
        [s for s in sessions if now - timedelta(days=14) <= s.session_date < now],
        key=lambda s: s.session_date,
    )
    consecutive_missed = 0
    max_consecutive_missed = 0
    for s in recent_14d:
        if s.status == SessionStatus.missed:
            consecutive_missed += 1
            max_consecutive_missed = max(max_consecutive_missed, consecutive_missed)
        else:
            consecutive_missed = 0
    if max_consecutive_missed >= 3:
        flags.append(RiskFlag(
            flag_type="missed_sessions",
            severity="critical",
            detail=f"{max_consecutive_missed} consecutive missed sessions in the last 14 days",
        ))
    elif max_consecutive_missed >= 2:
        flags.append(RiskFlag(
            flag_type="missed_sessions",
            severity="warning",
            detail=f"{max_consecutive_missed} consecutive missed sessions in the last 14 days",
        ))

    # ── Flag 3: Increasing discomfort ─────────────────────────────────────────
    # Compare avg pain of 3 most recent completed sessions vs 3 prior completed.
    completed_sessions = [s for s in sorted_sessions if s.status == SessionStatus.completed]
    if len(completed_sessions) >= 6:
        recent_3 = completed_sessions[:3]
        prior_3 = completed_sessions[3:6]
        recent_avg_pain = sum(s.patient_reported_pain for s in recent_3) / 3
        prior_avg_pain = sum(s.patient_reported_pain for s in prior_3) / 3
        pain_increase = recent_avg_pain - prior_avg_pain
        if pain_increase >= 3:
            flags.append(RiskFlag(
                flag_type="increasing_discomfort",
                severity="critical",
                detail=f"Avg pain score increased {pain_increase:.1f} pts over last 3 vs prior 3 sessions ({prior_avg_pain:.1f} to {recent_avg_pain:.1f}/10)",
            ))
        elif pain_increase >= 2:
            flags.append(RiskFlag(
                flag_type="increasing_discomfort",
                severity="warning",
                detail=f"Avg pain score increased {pain_increase:.1f} pts over last 3 vs prior 3 sessions ({prior_avg_pain:.1f} to {recent_avg_pain:.1f}/10)",
            ))

    # ── Flag 4: Irregular attendance ──────────────────────────────────────────
    # Require at least 6 completed sessions for a meaningful stdev calculation.
    # Threshold of 6+ days stdev catches genuinely erratic patterns while
    # ignoring the natural ±1 day variation of every-2-3-day attendance.
    completed_with_dates = sorted(
        [s for s in sessions if s.status == SessionStatus.completed],
        key=lambda s: s.session_date,
    )
    if programme_active and len(completed_with_dates) >= 6:
        gaps = [
            (completed_with_dates[i + 1].session_date - completed_with_dates[i].session_date).days
            for i in range(len(completed_with_dates) - 1)
        ]
        if len(gaps) >= 5:
            stdev = statistics.stdev(gaps)
            if stdev > 6:
                flags.append(RiskFlag(
                    flag_type="irregular_attendance",
                    severity="warning",
                    detail=f"Session timing is inconsistent (gap std dev {stdev:.1f} days — expected ~{7 // planned_per_week})",
                ))

    return flags


def compute_risk_level(flags: List[RiskFlag]) -> RiskLevel:
    if not flags:
        return RiskLevel.low
    critical_count = sum(1 for f in flags if f.severity == "critical")
    warning_count = sum(1 for f in flags if f.severity == "warning")
    if critical_count >= 1 or warning_count >= 2:
        return RiskLevel.high
    if warning_count >= 1:
        return RiskLevel.medium
    return RiskLevel.low
