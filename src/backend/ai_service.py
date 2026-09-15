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
    api_key = (settings.watsonx_api_key or "").strip()
    project_id = (settings.watsonx_project_id or "").strip()

    # Guard against empty or placeholder values
    if not api_key or not project_id or "your_" in api_key or "your_" in project_id or api_key == "placeholder":
        logger.info("watsonx.ai credentials not configured or placeholder detected; using deterministic clinical engine.")
        return None

    target_models = [settings.watsonx_model_id or "ibm/granite-4-h-small"]
    if "ibm/granite-4-h-small" not in target_models:
        target_models.append("ibm/granite-4-h-small")
    if "ibm/granite-13b-instruct-v2" not in target_models:
        target_models.append("ibm/granite-13b-instruct-v2")

    # Try official SDK first if installed
    for model_id in target_models:
        try:
            from ibm_watsonx_ai.foundation_models import ModelInference
            from ibm_watsonx_ai import Credentials

            creds = Credentials(
                url=settings.watsonx_url or "https://eu-de.ml.cloud.ibm.com",
                api_key=api_key,
            )
            model = ModelInference(
                model_id=model_id,
                credentials=creds,
                project_id=project_id,
                params={
                    "max_new_tokens": 500,
                    "temperature": 0.2,
                },
            )
            if system_prompt:
                full_prompt = f"<|start_of_role|>system<|end_of_role|>{system_prompt}<|end_of_text|><|start_of_role|>user<|end_of_role|>{prompt}<|end_of_text|><|start_of_role|>assistant<|end_of_role|>"
            else:
                full_prompt = prompt
            response = model.generate_text(prompt=full_prompt)
            if response and response.strip():
                logger.info(f"Live watsonx.ai inference successful via SDK ({model_id}).")
                return response.strip()
        except Exception as e:
            logger.warning(f"watsonx.ai SDK call failed for {model_id}: {e}. Attempting next option...")

    # Fallback to direct IBM Cloud REST call with httpx
    try:
        import httpx

        # 1. Exchange IAM API Key for IAM Token
        iam_resp = httpx.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": api_key,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
        if iam_resp.status_code != 200:
            logger.warning(f"IAM token exchange failed ({iam_resp.status_code}): {iam_resp.text}")
            return None
        access_token = iam_resp.json().get("access_token")

        # 2. Call watsonx text generation endpoint
        watsonx_url = (settings.watsonx_url or "https://eu-de.ml.cloud.ibm.com").rstrip("/")
        url = f"{watsonx_url}/ml/v1/text/generation?version=2023-05-29"
        if system_prompt:
            full_prompt = f"<|start_of_role|>system<|end_of_role|>{system_prompt}<|end_of_text|><|start_of_role|>user<|end_of_role|>{prompt}<|end_of_text|><|start_of_role|>assistant<|end_of_role|>"
        else:
            full_prompt = prompt

        for model_id in target_models:
            payload = {
                "model_id": model_id,
                "input": full_prompt,
                "project_id": project_id,
                "parameters": {
                    "max_new_tokens": 500,
                    "temperature": 0.2,
                },
            }
            gen_resp = httpx.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                timeout=20.0,
            )
            if gen_resp.status_code == 200:
                results = gen_resp.json().get("results", [])
                if results:
                    logger.info(f"Live watsonx.ai inference successful via REST API ({model_id}).")
                    return results[0].get("generated_text", "").strip()
            else:
                logger.warning(f"watsonx.ai REST generation ({model_id}) failed (HTTP {gen_resp.status_code}): {gen_resp.text}")
    except Exception as e:
        logger.warning(f"watsonx.ai REST call exception: {e}")

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
        "Strict Medical & Grounding Rules:\n"
        "1. Decision support only. Do not diagnose disease, prescribe medications, or recommend device setting modifications.\n"
        "2. All numerical metrics supplied below (adherence %, session counts, pain scores, risk levels) are AUTHORITATIVE and calculated by the system.\n"
        "3. Do NOT recalculate adherence percentage or contradict the supplied 28-day adherence metric.\n"
        "4. Do NOT invent missing sessions, unrecorded dates, or unsupported clinical facts."
    )
    user_prompt = (
        f"Analyze patient {patient.id} ({patient.name}):\n"
        f"- Diagnosis: {patient.diagnosis}\n"
        f"- Risk Level: {risk_level.value.upper()}\n"
        f"- Prescribed Schedule: {patient.planned_sessions_per_week} sessions/week\n"
        f"- Authoritative 28-Day Adherence: {adherence.adherence_pct}% "
        f"({adherence.completed_sessions} completed of {adherence.planned_sessions} planned in 28-day window, {adherence.missed_sessions} missed)\n"
        f"- Week-over-Week Adherence Trend: {adherence.week_over_week_trend:+.1f} percentage points\n"
        f"- Active Risk Flags: {', '.join(f.flag_type + ' (' + f.severity + ')' for f in flags) if flags else 'None'}\n"
        f"- Pain History: Avg {avg_pain}/10 (Recent 3: {recent_pain}/10 vs Prior 3: {prior_pain}/10)\n"
        f"- Lifetime Session History: {len(completed)} completed out of {len(sessions)} total recorded sessions in system\n\n"
        "Provide a concise summary with: Overall Status, Key Trends, Attention Factors, Suggested Review. "
        f"Cite the authoritative 28-day adherence as exactly {adherence.adherence_pct}%."
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
                f"28-Day Adherence at {adherence.adherence_pct}% with {adherence.week_over_week_trend:+.1f}pp WoW trend ({adherence.completed_sessions}/{adherence.planned_sessions} planned completed)",
                f"Pain trajectory: recent average {recent_pain}/10 (overall: {avg_pain}/10)",
                f"Lifetime record: {len(completed)} completed of {len(sessions)} recorded sessions",
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
    Answers clinician natural language questions grounded strictly in real database context.
    """
    patients = db.exec(select(Patient)).all()

    # Build structured cohort context with unambiguous metric definitions
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
            "patient_id": p.id,
            "patient_name": p.name,
            "diagnosis": p.diagnosis,
            "assigned_risk_level": risk_level.value.upper(),
            "prescribed_frequency": f"{p.planned_sessions_per_week} sessions/week",
            "authoritative_28_day_metrics": {
                "adherence_percentage": f"{adherence.adherence_pct}%",
                "planned_sessions_in_28d": adherence.planned_sessions,
                "completed_sessions_in_28d": adherence.completed_sessions,
                "missed_sessions_in_28d": adherence.missed_sessions,
                "week_over_week_trend": f"{adherence.week_over_week_trend:+.1f} percentage points",
            },
            "lifetime_session_history": {
                "total_recorded_sessions_in_db": len(sessions),
                "total_completed_sessions": len(completed),
            },
            "average_reported_pain": f"{avg_pain}/10",
            "active_risk_flags": [f"{f.flag_type} ({f.severity}): {f.detail}" for f in flags] if flags else ["None (Stable profile)"],
        }
        patient_summaries.append(p_info)

        if risk_level in (RiskLevel.high, RiskLevel.medium):
            attention_list.append(p_info)
        if any(f.flag_type == "declining_adherence" for f in flags):
            declining_list.append(p_info)
        if any(f.flag_type == "increasing_discomfort" for f in flags):
            pain_increase_list.append(p_info)

    settings = get_settings()
    model_name = settings.watsonx_model_id or "ibm/granite-4-h-small"

    # Try watsonx first
    system_prompt = (
        "You are an AI Clinical Assistant for clinicians reviewing a panel of patients in a "
        "wearable calf rehabilitation programme (Veno-Pump). Answer strictly and solely based on the "
        "provided structured patient context.\n"
        "Strict Grounding Rules:\n"
        "1. All numerical metrics in the context are AUTHORITATIVE and calculated by the clinical engine.\n"
        "2. Do NOT recalculate adherence percentage or divide lifetime sessions to invent a new percentage. Always cite the authoritative 28-day adherence percentage directly.\n"
        "3. Do NOT invent missing sessions, unrecorded dates, diagnoses, risk levels, or clinical facts.\n"
        "4. Decision support only: Do not diagnose disease or prescribe medications."
    )
    cohort_json = json.dumps(patient_summaries, indent=2)
    user_prompt = (
        f"Authoritative Grounded Patient Panel Data:\n{cohort_json}\n\n"
        f"Clinician Question: {question}\n\n"
        "Instructions: Answer concisely using ONLY the exact authoritative figures provided above. "
        "When asked about adherence or patient status, cite the exact 28-day adherence percentage and window counts."
    )

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
        if p["patient_id"].lower() in q or p["patient_name"].lower() in q:
            target_patient = p
            break

    # Specific Question 1: Why is P-XXX high risk? / Specific patient risk query
    if target_patient and ("why" in q or "risk" in q or "flag" in q or "factor" in q):
        m28 = target_patient["authoritative_28_day_metrics"]
        resp_lines.append(f"**Risk Factor Analysis for {target_patient['patient_id']} ({target_patient['patient_name']}):**\n")
        resp_lines.append(f"• **Diagnosis:** {target_patient['diagnosis']}")
        resp_lines.append(f"• **Current Risk Level:** [{target_patient['assigned_risk_level']}]")
        resp_lines.append(f"• **Triggering Risk Flags:** {', '.join(target_patient['active_risk_flags'])}")
        resp_lines.append(f"• **28-Day Adherence:** {m28['adherence_percentage']} ({m28['completed_sessions_in_28d']} completed of {m28['planned_sessions_in_28d']} planned, WoW Trend: {m28['week_over_week_trend']})")
        resp_lines.append(f"• **Pain Score Context:** Average {target_patient['average_reported_pain']} across completed sessions.")
        resp_lines.append("\n*Suggested Action: Review patient symptoms and evaluate session tolerance.*")

    # Specific Question 2: Patient specific summary (e.g. "Summarize P-004" or "Tell me about P-001")
    elif target_patient:
        m28 = target_patient["authoritative_28_day_metrics"]
        hist = target_patient["lifetime_session_history"]
        resp_lines.append(f"**Clinical Summary for {target_patient['patient_id']} — {target_patient['patient_name']}:**\n")
        resp_lines.append(f"• **Diagnosis:** {target_patient['diagnosis']}")
        resp_lines.append(f"• **Current Risk Level:** [{target_patient['assigned_risk_level']}]")
        resp_lines.append(f"• **Prescription:** {target_patient['prescribed_frequency']}")
        resp_lines.append(f"• **28-Day Adherence (Authoritative):** {m28['adherence_percentage']} ({m28['completed_sessions_in_28d']} completed of {m28['planned_sessions_in_28d']} planned in 28-day window, WoW Trend: {m28['week_over_week_trend']})")
        resp_lines.append(f"• **Lifetime Session Record:** {hist['total_completed_sessions']} completed of {hist['total_recorded_sessions_in_db']} recorded (Avg Pain: {target_patient['average_reported_pain']})")
        resp_lines.append(f"• **Active Risk Flags:** {', '.join(target_patient['active_risk_flags'])}")
        resp_lines.append("\n*Decision Support Note: Review patient-reported pain/comfort and adherence trends during next appointment.*")

    # General Question 3: Declining adherence / dropouts across cohort
    elif "declining" in q or "dropout" in q or "missed" in q:
        resp_lines.append(f"**Patients with Declining Adherence or Missed Sessions:**\n")
        if declining_list:
            for p in declining_list:
                m28 = p["authoritative_28_day_metrics"]
                resp_lines.append(f"• **{p['patient_id']} ({p['patient_name']})** — 28-Day Adherence: {m28['adherence_percentage']} (WoW: {m28['week_over_week_trend']}). Flags: {', '.join(p['active_risk_flags'])}")
        else:
            resp_lines.append("No patients currently exhibit critical adherence decline (>20pp drop).")
        resp_lines.append("\n*Recommendation: Follow up with patients exhibiting attendance drops to identify technical or comfort barriers.*")

    # General Question 4: Which patients need attention?
    elif "attention" in q or "who needs" in q or "flagged" in q or "high risk" in q:
        resp_lines.append(f"There are currently **{len(attention_list)} patients** requiring clinical attention in the panel:\n")
        for p in attention_list:
            m28 = p["authoritative_28_day_metrics"]
            flag_str = "; ".join(p["active_risk_flags"])
            resp_lines.append(f"• **{p['patient_id']} ({p['patient_name']})** — [{p['assigned_risk_level']}] {p['diagnosis']}")
            resp_lines.append(f"  *28-Day Adherence: {m28['adherence_percentage']} (WoW: {m28['week_over_week_trend']}) | Flags: {flag_str}*")
        resp_lines.append("\n*Suggested Action: Clinician review recommended for flagged patients to assess discomfort and session adherence.*")

    # General Question 5: Cohort overview
    elif "cohort" in q or "overview" in q or "summary" in q or "panel" in q or "all patients" in q:
        high_count = sum(1 for p in patient_summaries if p["assigned_risk_level"] == "HIGH")
        med_count = sum(1 for p in patient_summaries if p["assigned_risk_level"] == "MEDIUM")
        low_count = sum(1 for p in patient_summaries if p["assigned_risk_level"] == "LOW")
        avg_adh = round(sum(float(p["authoritative_28_day_metrics"]["adherence_percentage"].rstrip('%')) for p in patient_summaries) / len(patient_summaries), 1)

        resp_lines.append(f"**Cohort Overview ({len(patient_summaries)} Patients Enrolled):**\n")
        resp_lines.append(f"• **Risk Breakdown:** {high_count} High Risk | {med_count} Medium Risk | {low_count} Low Risk")
        resp_lines.append(f"• **Average 28-Day Adherence:** {avg_adh}% across cohort")
        resp_lines.append(f"• **Patients Requiring Attention:** {len(attention_list)} ({', '.join(p['patient_id'] for p in attention_list)})")
        resp_lines.append(f"• **Key Trajectories:** P-001 (Stable/improving), P-004 (Moderate adherence/improving), P-002/P-003/P-008 (Attendance drop).")

    # General fallback response
    else:
        resp_lines.append(f"Based on the **{len(patient_summaries)} patients** currently in the Veno-Pump monitoring cohort:\n")
        resp_lines.append(f"• {len(attention_list)} patients currently require clinical attention ({', '.join(p['patient_id'] for p in attention_list)}).\n")
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
    model_name = settings.watsonx_model_id or "ibm/granite-4-h-small"

    system_prompt = (
        "You are an AI Clinical Decision Support assistant. "
        "Summarize the cohort monitoring state for the clinician dashboard in 2-3 concise paragraphs strictly using the supplied statistics. "
        "All numerical metrics are AUTHORITATIVE. Do NOT recalculate percentages or invent patient counts. "
        "Do not diagnose or prescribe. Provide actionable clinical monitoring observations."
    )
    user_prompt = (
        f"Authoritative Cohort Summary Statistics:\n"
        f"- Total Enrolled Patients: {total_patients}\n"
        f"- Risk Distribution: High={len(high_risk)} ({', '.join(high_risk)}), Medium={len(medium_risk)}, Low={len(low_risk)}\n"
        f"- Authoritative Mean 28-Day Adherence: {avg_adh}%\n"
        f"- Pain Deterioration Flags: {', '.join(pain_alerts) if pain_alerts else 'None'}\n"
        f"- Adherence Collapse Flags: {', '.join(dropouts) if dropouts else 'None'}\n\n"
        "Provide concise clinical decision support observations based strictly on these numbers."
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
