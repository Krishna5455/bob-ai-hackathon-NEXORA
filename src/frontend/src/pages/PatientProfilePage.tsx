import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Play, Calendar, User, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getPatient, getPatientOutcomes, getPatientAdherenceWeekly } from '@/lib/api'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States'
import { AdherenceBarChart, OutcomeTrendChart } from '@/components/charts/ClinicalCharts'
import type { PatientDetail, OutcomePoint, AdherenceWeeklySeries } from '@/types/api'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'sessions' | 'adherence' | 'outcomes' | 'ai-summary'

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ patient }: { patient: PatientDetail }) {
  const adh = patient.adherence
  const trendIcon =
    adh && adh.week_over_week_trend > 5
      ? <TrendingUp className="h-4 w-4 text-green-600" />
      : adh && adh.week_over_week_trend < -5
        ? <TrendingDown className="h-4 w-4 text-red-600" />
        : <Minus className="h-4 w-4 text-slate-400" />

  return (
    <div className="space-y-5">
      {/* Top row: demographics + adherence snapshot */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Patient Information
          </p>
          <dl className="space-y-2 text-sm">
            {[
              ['Patient ID', patient.id],
              ['Age', `${patient.age} years`],
              ['Diagnosis', patient.diagnosis],
              ['Programme Start', new Date(patient.start_date).toLocaleDateString()],
              ['Planned Sessions', `${patient.planned_sessions_per_week} per week`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-4">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Adherence Snapshot (28 Days)
          </p>
          {adh ? (
            <>
              {/* Big adherence number */}
              <div className="mb-3 flex items-end gap-3">
                <span className={`text-4xl font-bold ${
                  adh.adherence_pct >= 80 ? 'text-green-600'
                  : adh.adherence_pct >= 60 ? 'text-amber-600'
                  : 'text-red-600'
                }`}>
                  {adh.adherence_pct}%
                </span>
                <div className="flex items-center gap-1 mb-1 text-xs text-slate-500">
                  {trendIcon}
                  <span className={
                    adh.week_over_week_trend > 0 ? 'text-green-600'
                    : adh.week_over_week_trend < 0 ? 'text-red-600'
                    : 'text-slate-400'
                  }>
                    {adh.week_over_week_trend > 0 ? '+' : ''}{adh.week_over_week_trend}pp WoW
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    adh.adherence_pct >= 80 ? 'bg-green-500'
                    : adh.adherence_pct >= 60 ? 'bg-amber-400'
                    : 'bg-red-500'
                  }`}
                  style={{ width: `${adh.adherence_pct}%` }}
                />
              </div>
              <dl className="space-y-1 text-sm">
                {[
                  ['Planned', adh.planned_sessions],
                  ['Completed', adh.completed_sessions],
                  ['Missed', adh.missed_sessions],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-400">No sessions recorded yet.</p>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {patient.risk_flags.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              Risk Flags ({patient.risk_level.toUpperCase()})
            </p>
          </div>
          <ul className="space-y-2">
            {patient.risk_flags.map((f, i) => (
              <li key={i} className="text-sm text-amber-700">
                <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                  f.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {f.severity}
                </span>
                <span className="font-medium capitalize">{f.flag_type.replace(/_/g, ' ')}:</span>{' '}
                {f.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent sessions mini-list */}
      {patient.sessions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Activity (Last 5 Sessions)
          </p>
          <div className="space-y-2">
            {[...patient.sessions]
              .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
              .slice(0, 5)
              .map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {new Date(s.session_date).toLocaleDateString()}
                  </span>
                  <SessionStatusBadge status={s.status} />
                  {s.status === 'completed' && (
                    <span className={`text-xs ${s.patient_reported_pain >= 7 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      Pain: {s.patient_reported_pain}/10
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {patient.notes && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Clinical Notes
          </p>
          <p className="text-sm text-slate-700">{patient.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Sessions tab ──────────────────────────────────────────────────────────────
function SessionsTab({ patient }: { patient: PatientDetail }) {
  const sessions = [...patient.sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
  )
  if (sessions.length === 0) return <EmptyState message="No sessions recorded yet." />
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">⚠ All session data is synthetic demo data.</p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {['Date', 'Status', 'Duration', 'Pain (0–10)', 'Comfort (0–10)', 'Notes'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">
                  {new Date(s.session_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <SessionStatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{s.status === 'completed' ? `${s.duration_minutes}m` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={s.status !== 'completed' ? 'text-slate-300' :
                    s.patient_reported_pain >= 7 ? 'font-semibold text-red-600'
                    : s.patient_reported_pain >= 4 ? 'text-amber-600'
                    : 'text-green-600'
                  }>
                    {s.status === 'completed' ? `${s.patient_reported_pain}/10` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.status === 'completed' ? `${s.patient_reported_comfort}/10` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-48 truncate">
                  {s.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Adherence tab ─────────────────────────────────────────────────────────────
function AdherenceTab({ patientId, plannedPerWeek }: { patientId: string; plannedPerWeek: number }) {
  const { data, isLoading } = useQuery<AdherenceWeeklySeries>({
    queryKey: ['adherence-weekly', patientId],
    queryFn: () => getPatientAdherenceWeekly(patientId, 6),
  })

  if (isLoading) return <LoadingState message="Loading adherence data…" />
  if (!data) return <EmptyState message="No adherence data available." />

  const adh = data.overall_summary
  const trendColor = adh.week_over_week_trend > 0 ? 'text-green-600' : adh.week_over_week_trend < 0 ? 'text-red-600' : 'text-slate-600'

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Adherence Rate', value: `${adh.adherence_pct}%`, sub: 'last 28 days' },
          { label: 'Completed', value: adh.completed_sessions, sub: `of ${adh.planned_sessions} planned` },
          { label: 'Missed', value: adh.missed_sessions, sub: 'last 28 days' },
          { label: 'WoW Trend', value: `${adh.week_over_week_trend > 0 ? '+' : ''}${adh.week_over_week_trend}pp`, sub: adh.week_over_week_trend >= 0 ? 'Stable/improving' : 'Declining' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${label === 'WoW Trend' ? trendColor : 'text-slate-900'}`}>{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Weekly Adherence (Last 6 Weeks)</p>
        <AdherenceBarChart data={data.weeks} plannedPerWeek={plannedPerWeek} />
      </div>

      {/* Weekly breakdown table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {['Week', 'Planned', 'Completed', 'Missed', 'Rate'].map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data.weeks].reverse().map((w) => (
              <tr key={w.week_start} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{w.week_label}</td>
                <td className="px-4 py-2 text-slate-600">{w.planned}</td>
                <td className="px-4 py-2 text-green-700 font-medium">{w.completed}</td>
                <td className="px-4 py-2 text-red-600">{w.missed}</td>
                <td className="px-4 py-2">
                  <span className={`font-medium ${
                    w.adherence_pct >= 80 ? 'text-green-600'
                    : w.adherence_pct >= 60 ? 'text-amber-600'
                    : 'text-red-600'
                  }`}>{w.adherence_pct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Outcomes tab ──────────────────────────────────────────────────────────────
function OutcomesTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery<OutcomePoint[]>({
    queryKey: ['outcomes', patientId],
    queryFn: () => getPatientOutcomes(patientId),
  })

  if (isLoading) return <LoadingState message="Loading outcomes…" />
  if (!data || data.length === 0) return <EmptyState message="No completed sessions with outcome data." />

  const pains = data.map((d) => d.pain)
  const comforts = data.map((d) => d.comfort)
  const avgPain = (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1)
  const avgComfort = (comforts.reduce((a, b) => a + b, 0) / comforts.length).toFixed(1)
  const painTrend = pains[pains.length - 1] - pains[0]
  const comfortTrend = comforts[comforts.length - 1] - comforts[0]

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">Avg Pain Score</p>
          <p className={`mt-1 text-3xl font-bold ${Number(avgPain) >= 7 ? 'text-red-600' : Number(avgPain) >= 4 ? 'text-amber-600' : 'text-green-600'}`}>
            {avgPain}<span className="text-sm font-normal text-slate-400">/10</span>
          </p>
          <p className="text-xs text-slate-400">across {data.length} sessions</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">Avg Comfort Score</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {avgComfort}<span className="text-sm font-normal text-slate-400">/10</span>
          </p>
          <p className="text-xs text-slate-400">across {data.length} sessions</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">Pain Trend</p>
          <p className={`mt-1 text-3xl font-bold ${painTrend < 0 ? 'text-green-600' : painTrend > 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {painTrend > 0 ? '+' : ''}{painTrend.toFixed(1)}
          </p>
          <p className={`text-xs ${painTrend < 0 ? 'text-green-600' : painTrend > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {painTrend < -1 ? 'Improving' : painTrend > 1 ? 'Worsening' : 'Stable'}
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Pain &amp; Comfort Trend</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-red-400" /> Pain</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-green-500 opacity-60" style={{borderTop: '2px dashed #16a34a', background: 'none'}} /> Comfort</span>
          </div>
        </div>
        <OutcomeTrendChart data={data} showComfort={true} />
      </div>

      {/* Data table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {['Session Date', 'Pain (0–10)', 'Comfort (0–10)'].map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((row) => (
              <tr key={row.session_date} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{new Date(row.session_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={row.pain >= 7 ? 'font-semibold text-red-600' : row.pain >= 4 ? 'text-amber-600' : 'text-green-600'}>
                    {row.pain}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">{row.comfort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comfortTrend !== 0 && (
        <p className="text-xs text-slate-500">
          Comfort trend: {comfortTrend > 0 ? '+' : ''}{comfortTrend.toFixed(1)} pts (first vs last session).
          {comfortTrend > 1 ? ' Comfort improving.' : comfortTrend < -1 ? ' Comfort declining — review recommended.' : ''}
        </p>
      )}
    </div>
  )
}

// ── AI Summary tab ────────────────────────────────────────────────────────────
function AISummaryTab() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <p className="mb-2 font-semibold">IBM watsonx.ai Clinical Summary — Phase 4</p>
      <p className="mb-3">
        AI-generated patient summaries powered by IBM watsonx.ai Granite will be available in Phase 4.
        Summaries will be generated from session, adherence, and outcome data and presented as{' '}
        <strong>decision support only</strong> — not as diagnosis or treatment recommendations.
        The clinician remains the decision maker at all times.
      </p>
      <p className="text-xs text-amber-600">
        ⚠ AI output will never diagnose medical conditions, prescribe treatment, or recommend
        changing device parameters.
      </p>
    </div>
  )
}

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'adherence', label: 'Adherence' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'ai-summary', label: 'AI Summary' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: patient, isLoading, error } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState message="Loading patient profile…" />
  if (error || !patient)
    return <ErrorState message={`Patient ${id ?? ''} not found or backend unavailable.`} />

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/patients" className="flex items-center gap-1 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Patients
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{patient.name}</span>
      </div>

      {/* Patient header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{patient.name}</h1>
              <RiskBadge level={patient.risk_level} />
              {patient.is_demo && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  Demo Patient
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{patient.diagnosis}</p>
            <p className="text-xs text-slate-400">
              {patient.id} · Age {patient.age} · Programme started{' '}
              {new Date(patient.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Link
          to={`/patients/${patient.id}/session`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <Play className="h-4 w-4" />
          Start Session
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-5 border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tabId
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {label}
              {tabId === 'ai-summary' && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                  Phase 4
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab patient={patient} />}
      {activeTab === 'sessions' && <SessionsTab patient={patient} />}
      {activeTab === 'adherence' && <AdherenceTab patientId={patient.id} plannedPerWeek={patient.planned_sessions_per_week} />}
      {activeTab === 'outcomes' && <OutcomesTab patientId={patient.id} />}
      {activeTab === 'ai-summary' && <AISummaryTab />}

      <p className="mt-8 text-xs text-slate-400">
        <Calendar className="mr-1 inline h-3 w-3" />
        ⚠ All data shown is synthetic demo data. Not a real patient record.
      </p>
    </div>
  )
}
