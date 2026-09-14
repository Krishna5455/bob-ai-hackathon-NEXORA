// ── Enums ──────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'
export type SessionStatus = 'completed' | 'missed' | 'incomplete'
export type InsightType = 'patient_summary' | 'dashboard_summary' | 'alert'

// ── Risk ───────────────────────────────────────────────────────────────────────

export interface RiskFlag {
  flag_type: string
  severity: 'warning' | 'critical'
  detail: string
}

// ── Adherence ─────────────────────────────────────────────────────────────────

export interface AdherenceSummary {
  patient_id: string
  planned_sessions: number
  completed_sessions: number
  missed_sessions: number
  adherence_pct: number
  week_over_week_trend: number
}

export interface WeeklyAdherencePoint {
  week_label: string
  week_start: string
  planned: number
  completed: number
  missed: number
  adherence_pct: number
}

export interface AdherenceWeeklySeries {
  patient_id: string
  weeks: WeeklyAdherencePoint[]
  overall_summary: AdherenceSummary
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface TreatmentSession {
  id: string
  patient_id: string
  session_date: string
  duration_minutes: number
  status: SessionStatus
  compression_level: string
  nmes_pattern: string
  patient_reported_pain: number
  patient_reported_comfort: number
  notes: string
  is_simulated: boolean
}

export interface TreatmentSessionCreate {
  patient_id: string
  session_date: string
  duration_minutes: number
  status: SessionStatus
  compression_level?: string
  nmes_pattern?: string
  patient_reported_pain: number
  patient_reported_comfort: number
  notes?: string
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export interface AIInsight {
  id: string
  patient_id: string | null
  generated_at: string
  insight_text: string
  insight_type: InsightType
  model_used: string
}

export interface PatientAIInsight {
  provider: string
  model_used: string
  patient_id: string
  patient_name: string
  risk_level: RiskLevel
  status: string
  key_trends: string[]
  attention_factors: string[]
  suggested_review: string
  disclaimer: string
}

export interface AssistantResponse {
  provider: string
  model_used: string
  response: string
  text: string
  disclaimer: string
  suggested_questions?: string[]
}

export interface DashboardAIInsight {
  provider: string
  model_used: string
  cohort_summary: string
  risk_overview: string
  key_observations: string[]
  suggested_clinical_actions: string[]
  disclaimer: string
}

// ── Outcome ───────────────────────────────────────────────────────────────────

export interface OutcomePoint {
  session_date: string
  pain: number
  comfort: number
}

// ── Patients ──────────────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string
  name: string
  age: number
  diagnosis: string
  start_date: string
  planned_sessions_per_week: number
  risk_level: RiskLevel
  risk_flags: RiskFlag[]
  adherence: AdherenceSummary | null
  is_demo: boolean
  notes: string
}

export interface PatientDetail extends PatientSummary {
  sessions: TreatmentSession[]
  insights: AIInsight[]
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_patients: number
  active_patients: number
  completed_sessions_total: number
  avg_adherence_pct: number
  attention_count: number
  risk_distribution: Record<RiskLevel, number>
  attention_patients: PatientSummary[]
  recent_insights: AIInsight[]
}
