import axios from 'axios'
import type {
  DashboardSummary,
  PatientSummary,
  PatientDetail,
  TreatmentSession,
  TreatmentSessionCreate,
  AdherenceSummary,
  AdherenceWeeklySeries,
  OutcomePoint,
  PatientAIInsight,
  DashboardAIInsight,
  AssistantResponse,
  PatientReportResponse,
} from '@/types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<DashboardSummary>('/dashboard/summary')
  return res.data
}

// ── Patients ──────────────────────────────────────────────────────────────────

export async function getPatients(search?: string): Promise<PatientSummary[]> {
  const res = await api.get<PatientSummary[]>('/patients', {
    params: search ? { search } : undefined,
  })
  return res.data
}

export async function getPatient(id: string): Promise<PatientDetail> {
  const res = await api.get<PatientDetail>(`/patients/${id}`)
  return res.data
}

export async function getPatientSessions(id: string): Promise<TreatmentSession[]> {
  const res = await api.get<TreatmentSession[]>(`/patients/${id}/sessions`)
  return res.data
}

export async function getPatientAdherence(id: string): Promise<AdherenceSummary> {
  const res = await api.get<AdherenceSummary>(`/patients/${id}/adherence`)
  return res.data
}

export async function getPatientAdherenceWeekly(
  id: string,
  weeks = 6,
): Promise<AdherenceWeeklySeries> {
  const res = await api.get<AdherenceWeeklySeries>(`/patients/${id}/adherence/weekly`, {
    params: { weeks },
  })
  return res.data
}

export async function getPatientOutcomes(id: string): Promise<OutcomePoint[]> {
  const res = await api.get<OutcomePoint[]>(`/patients/${id}/outcomes`)
  return res.data
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(payload: TreatmentSessionCreate): Promise<TreatmentSession> {
  const res = await api.post<TreatmentSession>('/sessions', payload)
  return res.data
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export async function getPatientAIInsight(id: string): Promise<PatientAIInsight> {
  const res = await api.get<PatientAIInsight>(`/ai/patients/${id}/insight`)
  return res.data
}

export async function getDashboardAIInsight(): Promise<DashboardAIInsight> {
  const res = await api.get<DashboardAIInsight>('/ai/dashboard-insight')
  return res.data
}

export async function askAIAssistant(message: string): Promise<AssistantResponse> {
  const res = await api.post<AssistantResponse>('/ai/assistant', { message })
  return res.data
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  const res = await api.get<{ status: string }>('/health')
  return res.data
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getPatientReport(id: string): Promise<PatientReportResponse> {
  const res = await api.get<PatientReportResponse>(`/patients/${id}/report`)
  return res.data
}

