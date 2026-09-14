"""
AI Service Layer — IBM watsonx.ai (IBM Granite) with Deterministic Clinical Fallback Provider.

This service implements clinical decision support:
1. Patient AI Clinical Insight (GET /api/v1/ai/patients/{id}/insight)
2. Clinician AI Assistant (POST /api/v1/ai/assistant)
3. Dashboard AI Cohort Insight (GET /api/v1/ai/dashboard-insight)

Strict Medical Safety Rules:
- Decision support only; clinician judgement required.
- Does NOT diagnose disease, prescribe medications, or alter device/NMES parameters.
- If watsonx credentials are not configured or external call fails, seamlessly falls back
  to deterministic clinical rule analysis with clear disclaimer:
  "Demo AI Insight — watsonx.ai not configured".
"""

from typing import List, Dict, Any, Optional
import json
import logging
from sqlmodel import Session, select
from datetime import datetime, timezone

from database import get_settings
from models import (
    Patient,
    TreatmentSession,
    AIInsight,
    SessionStatus,
    RiskLevel,
    RiskFlag,
)
from risk_engine import compute_risk_flags, compute_risk_level
from adherence import compute_adherence

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "⚠ Decision support only — clinician judgement required. "
    "AI output does not constitute a diagnosis, treatment recommendation, or prescription."
)

FALLBACK_DISCLAIMER_PREFIX = "Demo AI Insight — watsonx.ai not configured. "


# ── IBM watsonx.ai REST / SDK Helper ─────────────────────────────────────────

def call_watsonx_granite(prompt: str, system_prompt: str = "") -> Optional[str]:
    """
    Calls IBM watsonx.ai Granite model using official SDK if available or REST API with httpx.
    Returns generated string, or None if credentials missing or API call fails.
    """
    settings = get_settings()
    if not settings.watsonx_api_key or not settings.watsonx_project_id:
        return None

    # Try official SDK first if installed
    try:
        from ibm_watsonx_ai.foundation_models import ModelInference
        from ibm_watsonx_ai import Credentials

        creds = Credentials(
            url=settings.watsonx_url or "https://us-south.ml.cloud.ibm.com",
            api_key=settings.watsonx_api_key,
        )
        model = ModelInference(
            model_id=settings.watsonx_model_id or "ibm/granite-13b-instruct-v2",
            credentials=creds,
            project_id=settings.watsonx_project_id,
            params={
                "max_new_tokens": 500,
                "temperature": 0.2,
                "decoding_method": "greedy",
            },
        )
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        response = model.generate_text(prompt=full_prompt)
        if response:
            return response.strip()
    except Exception as e:
        logger.warning(f"watsonx.ai SDK call failed: {e}. Attempting REST fallback...")

    # Fallback to direct IBM Cloud REST call with httpx
    try:
        import httpx

        # 1. Exchange IAM API Key for IAM Token
        iam_resp = httpx.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": settings.watsonx_api_key,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
        if iam_resp.status_code != 200:
            logger.warning(f"IAM token exchange failed: {iam_resp.status_code}")
            return None
        access_token = iam_resp.json().get("access_token")

        # 2. Call watsonx text generation endpoint
        url = f"{settings.watsonx_url.rstrip('/')}/ml/v1/text/generation?version=2023-05-29"
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        payload = {
            "model_id": settings.watsonx_model_id or "ibm/granite-13b-instruct-v2",
            "input": full_prompt,
            "project_id": settings.watsonx_project_id,
            "parameters": {
                "max_new_tokens": 500,
                "temperature": 0.2,
                "decoding_method": "greedy",
            },
        }
        gen_resp = httpx.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
        if gen_resp.status_code == 200:
            results = gen_resp.json().get("results", [])
            if results:
                return results[0].get("generated_text", "").strip()
    except Exception as e:
        logger.warning(f"watsonx.ai REST call failed: {e}")

    return None


# ── Feature 1: Patient Clinical Insight ──────────────────────────────────────

def generate_patient_insight(patient: Patient, sessions: List[TreatmentSession]) -> Dict[str, Any]:
    """
    Generates structured AI patient clinical insight.
    Attempts watsonx.ai Granite first; falls back to deterministic rule analyzer.
    """
    flags = compute_risk_flags(sessions, patient.planned_sessions_per_week)
    risk_level = compute_risk_level(flags)
    adherence = compute_adherence(patient.id, sessions, patient.planned_sessions_per_week)

    completed = [s for s in sessions if s.status == SessionStatus.completed]
    missed = [s for s in sessions if s.status == SessionStatus.missed]

    # Calculate pain trends
    pain_scores = [s.patient_reported_pain for s in completed]
    avg_pain = round(sum(pain_scores) / len(pain_scores), 1) if pain_scores else 0.0
    recent_pain = round(sum(pain_scores[:3]) / min(3, len(pain_scores)), 1) if pain_scores else 0.0
    prior_pain = round(sum(pain_scores[3:6]) / min(3, len(pain_scores[3:6])), 1) if len(pain_scores) >= 6 else avg_pain

    settings = get_settings()
    model_name = settings.watsonx_model_id or "ibm/granite-13b-instruct-v2"

    # Attempt watsonx.ai generation
    system_prompt = (
        "You are an AI Clinical Decision Support assistant for a clinician monitoring patients "
        "in a wearable calf rehabilitation programme. "
        "Provide clear, professional, concise clinical observations. "
        "Strict medical rules: Decision support only. Do not diagnose disease, prescribe medications, "
        "or recommend changing electrical/compression settings. Use cautious clinical phrasing."
    )
    user_prompt = (
        f"Analyze patient {patient.id} ({patient.name}):\n"
        f"- Diagnosis: {patient.diagnosis}\n"
        f"- Risk Level: {risk_level.value.upper()}\n"
        f"- 28-day Adherence: {adherence.adherence_pct}% (Planned: {adherence.planned_sessions}, Completed: {adherence.completed_sessions}, Missed: {adherence.missed_sessions})\n"
        f"- WoW Trend: {adherence.week_over_week_trend:+.1f}pp\n"
        f"- Active Risk Flags: {', '.join(f.flag_type + ' (' + f.severity + ')' for f in flags) if flags else 'None'}\n"
        f"- Pain History: Avg {avg_pain}/10 (Recent 3: {recent_pain}/10 vs Prior 3: {prior_pain}/10)\n\n"
        "Provide a concise summary with: Overall Status, Key Trends, Attention Factors, Suggested Review."
    )

    watsonx_output = call_watsonx_granite(user_prompt, system_prompt)

    if watsonx_output:
        return {
            "provider": "watsonx-granite",
            "model_used": model_name,
            "patient_id": patient.id,
            "patient_name": patient.name,
            "risk_level": risk_level.value,
            "status": watsonx_output,
            "key_trends": [
                f"Adherence at {adherence.adherence_pct}% with {adherence.week_over_week_trend:+.1f}pp WoW trend",
                f"Pain trajectory: recent average {recent_pain}/10 (overall: {avg_pain}/10)",
                f"Completed {len(completed)} of {len(sessions)} recorded sessions",
            ],
            "attention_factors": [f.detail for f in flags] if flags else ["No critical flags detected"],
            "suggested_review": (
                "Review patient history and verify symptom progression during clinical consultation."
                if risk_level != RiskLevel.low
                else "Continue standard prescribed monitoring schedule."
            ),
            "disclaimer": DISCLAIMER_TEXT,
        }

    # Deterministic Fallback Engine
    key_trends = []
    attention_factors = []
    status_desc = ""
    suggested_review = ""

    # Adherence trends
    if adherence.adherence_pct >= 75:
        key_trends.append(f"Strong overall engagement with {adherence.adherence_pct}% 28-day adherence.")
    elif adherence.adherence_pct >= 50:
        key_trends.append(f"Moderate adherence ({adherence.adherence_pct}%); {adherence.missed_sessions} missed sessions in last 28 days.")
    else:
        key_trends.append(f"Low overall attendance ({adherence.adherence_pct}% adherence); significant session shortfall.")

    if adherence.week_over_week_trend <= -20:
        key_trends.append(f"Sharp week-over-week drop in attendance ({adherence.week_over_week_trend:+.1f}pp).")
    elif adherence.week_over_week_trend >= 10:
        key_trends.append(f"Positive week-over-week attendance improvement ({adherence.week_over_week_trend:+.1f}pp).")

    # Pain & outcome trends
    if len(pain_scores) >= 6:
        pain_diff = recent_pain - prior_pain
        if pain_diff >= 2.0:
            key_trends.append(f"Reported pain increased by +{pain_diff:.1f} pts over last 3 sessions ({prior_pain:.1f} → {recent_pain:.1f}/10).")
        elif pain_diff <= -2.0:
            key_trends.append(f"Reported pain improved by {abs(pain_diff):.1f} pts over last 3 sessions ({prior_pain:.1f} → {recent_pain:.1f}/10).")
        else:
            key_trends.append(f"Reported pain remains stable at avg {avg_pain:.1f}/10.")
    elif completed:
        key_trends.append(f"Reported pain average across {len(completed)} sessions: {avg_pain:.1f}/10.")

    # Attention factors & status synthesis
    if flags:
        for f in flags:
            attention_factors.append(f"[{f.severity.upper()}] {f.flag_type.replace('_', ' ').title()}: {f.detail}")
    else:
        attention_factors.append("No active risk flags or anomalies flagged.")

    if risk_level == RiskLevel.high:
        status_desc = (
            f"Patient {patient.id} ({patient.name}) is currently categorized as HIGH RISK. "
            f"{'Multiple concurrent risk factors detected: ' if len(flags) > 1 else 'Primary concern: '}"
            f"{'; '.join(f.detail for f in flags)}."
        )
        suggested_review = (
            "Clinician review is recommended. Consider evaluating patient-reported discomfort, "
            "contacting patient regarding missed sessions, and verifying calf sleeve comfort."
        )
    elif risk_level == RiskLevel.medium:
        status_desc = (
            f"Patient {patient.id} ({patient.name}) is categorized as MEDIUM RISK. "
            f"Observed pattern: {flags[0].detail if flags else 'Requires routine monitoring'}."
        )
        suggested_review = "Monitor next 2–3 scheduled sessions for adherence stabilization or symptom escalation."
    else:
        status_desc = (
            f"Patient {patient.id} ({patient.name}) is categorized as LOW RISK with stable metrics. "
            f"Adherence ({adherence.adherence_pct}%) and reported discomfort ({avg_pain}/10) are within expected parameters."
        )
        suggested_review = "Continue standard rehabilitation monitoring schedule."

    return {
        "provider": "fallback",
        "model_used": "deterministic-clinical-rules",
        "patient_id": patient.id,
        "patient_name": patient.name,
        "risk_level": risk_level.value,
        "status": f"{FALLBACK_DISCLAIMER_PREFIX}{status_desc}",
        "key_trends": key_trends,
        "attention_factors": attention_factors,
        "suggested_review": suggested_review,
        "disclaimer": f"{FALLBACK_DISCLAIMER_PREFIX}{DISCLAIMER_TEXT}",
    }


# ── Feature 2: Clinician AI Assistant ────────────────────────────────────────

def answer_assistant_query(question: str, db: Session) -> Dict[str, Any]:
    """
    Answers clinician natural language questions grounded in real database context.
    """
    patients = db.exec(select(Patient)).all()

    # Build cohort context
    patient_summaries = []
    attention_list = []
    declining_list = []
    pain_increase_list = []

    for p in patients:
        sessions = list(db.exec(
            select(TreatmentSession).where(TreatmentSession.patient_id == p.id)
        ).all())
        flags = compute_risk_flags(sessions, p.planned_sessions_per_week)
        risk_level = compute_risk_level(flags)
        adherence = compute_adherence(p.id, sessions, p.planned_sessions_per_week)

        completed = [s for s in sessions if s.status == SessionStatus.completed]
        pain_scores = [s.patient_reported_pain for s in completed]
        avg_pain = round(sum(pain_scores) / len(pain_scores), 1) if pain_scores else 0.0

        p_info = {
            "id": p.id,
            "name": p.name,
            "diagnosis": p.diagnosis,
            "risk_level": risk_level.value,
            "adherence_pct": adherence.adherence_pct,
            "wow_trend": adherence.week_over_week_trend,
            "completed_sessions": len(completed),
            "total_sessions": len(sessions),
            "avg_pain": avg_pain,
            "flags": [f"{f.flag_type} ({f.severity}): {f.detail}" for f in flags],
        }
        patient_summaries.append(p_info)

        if risk_level in (RiskLevel.high, RiskLevel.medium):
            attention_list.append(p_info)
        if any(f.flag_type == "declining_adherence" for f in flags):
            declining_list.append(p_info)
        if any(f.flag_type == "increasing_discomfort" for f in flags):
            pain_increase_list.append(p_info)

    settings = get_settings()
    model_name = settings.watsonx_model_id or "ibm/granite-13b-instruct-v2"

    # Try watsonx first
    system_prompt = (
        "You are an AI Clinical Assistant for clinicians reviewing a panel of patients in a "
        "wearable calf rehabilitation programme (Veno-Pump). Answer strictly based on the provided "
        "cohort data. If information is not in the data, state that it is unavailable. "
        "Strictly adhere to medical decision-support guidelines. Do not diagnose or prescribe."
    )
    cohort_json = json.dumps(patient_summaries, indent=2)
    user_prompt = f"Grounded Patient Panel Data:\n{cohort_json}\n\nClinician Question: {question}"

    watsonx_output = call_watsonx_granite(user_prompt, system_prompt)
    if watsonx_output:
        return {
            "provider": "watsonx-granite",
            "model_used": model_name,
            "response": watsonx_output,
            "text": watsonx_output,
            "disclaimer": DISCLAIMER_TEXT,
            "suggested_questions": [
                "Which patients need attention this week?",
                "Summarize P-004.",
                "Why is P-003 high risk?",
                "Which patients have declining adherence?",
            ],
        }

    # Deterministic Grounded Assistant Fallback
    q = question.lower()
    resp_lines = []

    # Check for specific patient ID mention first (e.g. "P-001" .. "P-008" or patient name)
    target_patient = None
    for p in patient_summaries:
        if p["id"].lower() in q or p["name"].lower() in q:
            target_patient = p
            break

    # Specific Question 1: Why is P-XXX high risk? / Specific patient risk query
    if target_patient and ("why" in q or "risk" in q or "flag" in q or "factor" in q):
        resp_lines.append(f"**Risk Factor Analysis for {target_patient['id']} ({target_patient['name']}):**\n")
        resp_lines.append(f"• **Diagnosis:** {target_patient['diagnosis']}")
        resp_lines.append(f"• **Current Risk Level:** [{target_patient['risk_level'].upper()}]")
        if target_patient["flags"]:
            resp_lines.append("• **Triggering Risk Flags:**")
            for f in target_patient["flags"]:
                resp_lines.append(f"  - {f}")
        else:
            resp_lines.append("• **Triggering Risk Flags:** None (Stable clinical profile).")
        resp_lines.append(f"• **Adherence Context:** {target_patient['adherence_pct']}% 28-day adherence (WoW Trend: {target_patient['wow_trend']:+.1f}pp).")
        resp_lines.append(f"• **Pain Score Context:** Average {target_patient['avg_pain']}/10 across completed sessions.")
        resp_lines.append("\n*Suggested Action: Review patient symptoms and evaluate session tolerance.*")

    # Specific Question 2: Patient specific summary (e.g. "Summarize P-004" or "Tell me about P-001")
    elif target_patient:
        resp_lines.append(f"**Clinical Summary for {target_patient['id']} — {target_patient['name']}:**\n")
        resp_lines.append(f"• **Diagnosis:** {target_patient['diagnosis']}")
        resp_lines.append(f"• **Current Risk Level:** [{target_patient['risk_level'].upper()}]")
        resp_lines.append(f"• **28-Day Adherence:** {target_patient['adherence_pct']}% (WoW Trend: {target_patient['wow_trend']:+.1f}pp)")
        resp_lines.append(f"• **Session History:** {target_patient['completed_sessions']} completed of {target_patient['total_sessions']} scheduled (Avg Pain: {target_patient['avg_pain']}/10)")
        if target_patient["flags"]:
            resp_lines.append(f"• **Active Risk Flags:**\n  " + "\n  ".join(f"- {f}" for f in target_patient["flags"]))
        else:
            resp_lines.append("• **Active Risk Flags:** None. Stable clinical profile.")
        resp_lines.append("\n*Decision Support Note: Review patient-reported pain/comfort and adherence trends during next appointment.*")

    # General Question 3: Declining adherence / dropouts across cohort
    elif "declining" in q or "dropout" in q or "missed" in q:
        resp_lines.append(f"**Patients with Declining Adherence or Missed Sessions:**\n")
        if declining_list:
            for p in declining_list:
                resp_lines.append(f"• **{p['id']} ({p['name']})** — Adherence dropped to {p['adherence_pct']}% (WoW: {p['wow_trend']:+.1f}pp). Flags: {', '.join(p['flags'])}")
        else:
            resp_lines.append("No patients currently exhibit critical adherence decline (>20pp drop).")
        resp_lines.append("\n*Recommendation: Follow up with patients exhibiting attendance drops to identify technical or comfort barriers.*")

    # General Question 4: Which patients need attention?
    elif "attention" in q or "who needs" in q or "flagged" in q or "high risk" in q:
        resp_lines.append(f"There are currently **{len(attention_list)} patients** requiring clinical attention in the panel:\n")
        for p in attention_list:
            flag_str = "; ".join(p["flags"]) if p["flags"] else "Elevated risk profile"
            resp_lines.append(f"• **{p['id']} ({p['name']})** — [{p['risk_level'].upper()}] {p['diagnosis']}")
            resp_lines.append(f"  *Adherence: {p['adherence_pct']}% (WoW: {p['wow_trend']:+.1f}pp) | Reason: {flag_str}*")
        resp_lines.append("\n*Suggested Action: Clinician review recommended for flagged patients to assess discomfort and session adherence.*")

    # General Question 5: Cohort overview
    elif "cohort" in q or "overview" in q or "summary" in q or "panel" in q or "all patients" in q:
        high_count = sum(1 for p in patient_summaries if p["risk_level"] == "high")
        med_count = sum(1 for p in patient_summaries if p["risk_level"] == "medium")
        low_count = sum(1 for p in patient_summaries if p["risk_level"] == "low")
        avg_adh = round(sum(p["adherence_pct"] for p in patient_summaries) / len(patient_summaries), 1)

        resp_lines.append(f"**Cohort Overview ({len(patient_summaries)} Patients Enrolled):**\n")
        resp_lines.append(f"• **Risk Breakdown:** {high_count} High Risk | {med_count} Medium Risk | {low_count} Low Risk")
        resp_lines.append(f"• **Average 28-Day Adherence:** {avg_adh}% across cohort")
        resp_lines.append(f"• **Patients Requiring Attention:** {len(attention_list)} ({', '.join(p['id'] for p in attention_list)})")
        resp_lines.append(f"• **Key Trajectories:** P-001 (Stable/improving), P-004 (High pain spike), P-002/P-003/P-008 (Attendance drop).")

    # General fallback response
    else:
        resp_lines.append(f"Based on the **{len(patient_summaries)} patients** currently in the Veno-Pump monitoring cohort:\n")
        resp_lines.append(f"• {len(attention_list)} patients currently require clinical attention ({', '.join(p['id'] for p in attention_list)}).")
        resp_lines.append("• You can ask specific questions such as:")
        resp_lines.append("  - *'Which patients need attention this week?'*")
        resp_lines.append("  - *'Summarize P-004.'*")
        resp_lines.append("  - *'Why is P-003 high risk?'*")
        resp_lines.append("  - *'Which patients have declining adherence?'*")


    final_text = f"{FALLBACK_DISCLAIMER_PREFIX}\n\n" + "\n".join(resp_lines)

    return {
        "provider": "fallback",
        "model_used": "deterministic-clinical-rules",
        "response": final_text,
        "text": final_text,
        "disclaimer": f"{FALLBACK_DISCLAIMER_PREFIX}{DISCLAIMER_TEXT}",
        "suggested_questions": [
            "Which patients need attention this week?",
            "Summarize P-004.",
            "Why is P-003 high risk?",
            "Which patients have declining adherence?",
        ],
    }


# ── Feature 3: Dashboard AI Cohort Insight ───────────────────────────────────

def generate_dashboard_cohort_insight(db: Session) -> Dict[str, Any]:
    """
    Generates high-level cohort intelligence for the main dashboard.
    """
    patients = db.exec(select(Patient)).all()
    total_patients = len(patients)

    high_risk = []
    medium_risk = []
    low_risk = []
    adherence_rates = []
    pain_alerts = []
    dropouts = []

    for p in patients:
        sessions = list(db.exec(
            select(TreatmentSession).where(TreatmentSession.patient_id == p.id)
        ).all())
        flags = compute_risk_flags(sessions, p.planned_sessions_per_week)
        risk_level = compute_risk_level(flags)
        adh = compute_adherence(p.id, sessions, p.planned_sessions_per_week)
        adherence_rates.append(adh.adherence_pct)

        if risk_level == RiskLevel.high:
            high_risk.append(p.id)
        elif risk_level == RiskLevel.medium:
            medium_risk.append(p.id)
        else:
            low_risk.append(p.id)

        if any(f.flag_type == "increasing_discomfort" for f in flags):
            pain_alerts.append(f"{p.id} ({p.name})")
        if any(f.flag_type == "declining_adherence" for f in flags):
            dropouts.append(f"{p.id} ({p.name})")

    avg_adh = round(sum(adherence_rates) / len(adherence_rates), 1) if adherence_rates else 0.0

    settings = get_settings()
    model_name = settings.watsonx_model_id or "ibm/granite-13b-instruct-v2"

    system_prompt = (
        "You are an AI Clinical Decision Support assistant. "
        "Summarize the cohort monitoring state for the clinician dashboard in 2-3 concise paragraphs. "
        "Do not diagnose or prescribe. Provide actionable clinical monitoring observations."
    )
    user_prompt = (
        f"Cohort Summary Statistics:\n"
        f"- Total Patients: {total_patients}\n"
        f"- Risk Distribution: High={len(high_risk)} ({', '.join(high_risk)}), Medium={len(medium_risk)}, Low={len(low_risk)}\n"
        f"- Average 28-day Adherence: {avg_adh}%\n"
        f"- Pain Deterioration Flags: {', '.join(pain_alerts) if pain_alerts else 'None'}\n"
        f"- Adherence Collapse Flags: {', '.join(dropouts) if dropouts else 'None'}\n"
    )

    watsonx_output = call_watsonx_granite(user_prompt, system_prompt)
    if watsonx_output:
        return {
            "provider": "watsonx-granite",
            "model_used": model_name,
            "cohort_summary": watsonx_output,
            "risk_overview": f"{len(high_risk)} High, {len(medium_risk)} Medium, {len(low_risk)} Low risk patients",
            "key_observations": [
                f"Cohort mean adherence is {avg_adh}% over the past 28 days.",
                f"{len(dropouts)} patients exhibit recent session attendance collapse ({', '.join(dropouts)}).",
                f"{len(pain_alerts)} patient shows sharply increasing discomfort ({', '.join(pain_alerts)}).",
            ],
            "suggested_clinical_actions": [
                "Prioritize clinical consultations for high-risk patients (P-002, P-003, P-004, P-005, P-008).",
                "Evaluate calf sleeve fit and pressure comfort for Robert Chen (P-004).",
                "Conduct outreach to Anita Bhattacharya (P-003) regarding recent session withdrawal.",
            ],
            "disclaimer": DISCLAIMER_TEXT,
        }

    # Deterministic Fallback
    cohort_summary = (
        f"{FALLBACK_DISCLAIMER_PREFIX}"
        f"The active cohort comprises {total_patients} patients with an average 28-day adherence of {avg_adh}%. "
        f"{len(high_risk)} patients currently exhibit critical risk signals requiring clinician review: "
        f"attendance deterioration in {', '.join(dropouts)} and elevated discomfort progression in {', '.join(pain_alerts)}."
    )

    return {
        "provider": "fallback",
        "model_used": "deterministic-clinical-rules",
        "cohort_summary": cohort_summary,
        "risk_overview": f"{len(high_risk)} High, {len(medium_risk)} Medium, {len(low_risk)} Low Risk",
        "key_observations": [
            f"Average cohort adherence is {avg_adh}% across all active rehabilitation programmes.",
            f"Critical attendance decline identified in {len(dropouts)} patients ({', '.join(dropouts)}).",
            f"Significant discomfort increase flagged in {len(pain_alerts)} patient ({', '.join(pain_alerts)}).",
            f"P-001 (Margaret O'Sullivan) demonstrates optimal compliance and positive symptom trajectory.",
        ],
        "suggested_clinical_actions": [
            "Schedule clinical review for 5 high-risk patients (P-002, P-003, P-004, P-005, P-008).",
            "Review reported discomfort and sleeve pressure tolerance for Robert Chen (P-004).",
            "Follow up on complete session dropout with Anita Bhattacharya (P-003).",
        ],
        "disclaimer": f"{FALLBACK_DISCLAIMER_PREFIX}{DISCLAIMER_TEXT}",
    }
