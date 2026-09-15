import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Calendar,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Brain,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  FileText,
} from 'lucide-react'
import {
  getPatient,
  getPatientOutcomes,
  getPatientAdherenceWeekly,
  getPatientAIInsight,
  getPatientReport,
} from '@/lib/api'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States'
import { AdherenceBarChart, OutcomeTrendChart } from '@/components/charts/ClinicalCharts'
import { PatientReportModal } from '@/components/patient/PatientReportModal'
import type {
  PatientDetail,
  OutcomePoint,
  AdherenceWeeklySeries,
  PatientAIInsight,
} from '@/types/api'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'sessions' | 'adherence' | 'outcomes' | 'ai-summary'

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ patient }: { patient: PatientDetail }) {
  const adh = patient.adherence
  const trendIcon =
    adh && adh.week_over_week_trend > 5 ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : adh && adh.week_over_week_trend < -5 ? (
      <TrendingDown className="h-4 w-4 text-rose-400" />
    ) : (
      <Minus className="h-4 w-4 text-slate-400" />
    )

  return (
    <div className="space-y-6">
      {/* Top row: demographics + adherence snapshot */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Patient Demographics & Protocol
          </p>
          <dl className="space-y-3 text-xs">
            {[
              ['Patient ID', patient.id],
              ['Age', `${patient.age} years`],
              ['Diagnosis', patient.diagnosis],
              ['Programme Start', new Date(patient.start_date).toLocaleDateString()],
              ['Planned Sessions', `${patient.planned_sessions_per_week} per week`],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                className="flex justify-between items-center gap-4 py-1.5 border-b border-slate-800/60 last:border-0"
              >
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-mono font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Adherence Snapshot (28 Days)
          </p>
          {adh ? (
            <>
              {/* Big adherence number */}
              <div className="flex items-end justify-between">
                <div>
                  <span
                    className={`text-4xl font-extrabold font-mono tracking-tight ${
                      adh.adherence_pct >= 80
                        ? 'text-emerald-400'
                        : adh.adherence_pct >= 60
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {adh.adherence_pct}%
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Overall session completion rate</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                  {trendIcon}
                  <span
                    className={
                      adh.week_over_week_trend > 0
                        ? 'text-emerald-400'
                        : adh.week_over_week_trend < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }
                  >
                    {adh.week_over_week_trend > 0 ? '+' : ''}
                    {adh.week_over_week_trend}pp WoW
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    adh.adherence_pct >= 80
                      ? 'bg-emerald-400'
                      : adh.adherence_pct >= 60
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${adh.adherence_pct}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Planned</span>
                  <span className="font-mono font-bold text-white">{adh.planned_sessions}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Completed</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {adh.completed_sessions}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Missed</span>
                  <span className="font-mono font-bold text-rose-400">{adh.missed_sessions}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">No sessions recorded yet.</p>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {patient.risk_flags.length > 0 && (
        <div className="rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Active Clinical Risk Flags ({patient.risk_level.toUpperCase()})
            </h3>
          </div>
          <ul className="space-y-2">
            {patient.risk_flags.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 text-xs text-amber-200"
              >
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                    f.severity === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {f.severity}
                </span>
                <div>
                  <span className="font-bold text-white capitalize">
                    {f.flag_type.replace(/_/g, ' ')}:
                  </span>{' '}
                  <span>{f.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent sessions mini-list */}
      {patient.sessions.length > 0 && (
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Treatment Sessions
            </p>
            <span className="text-[11px] font-mono text-slate-400">Last 5 Sessions</span>
          </div>
          <div className="space-y-2">
            {[...patient.sessions]
              .sort(
                (a, b) =>
                  new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
              )
              .slice(0, 5)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <span className="font-mono text-slate-300">
                      {new Date(s.session_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SessionStatusBadge status={s.status} />
                    {s.status === 'completed' && (
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          s.patient_reported_pain >= 7
                            ? 'text-rose-400'
                            : s.patient_reported_pain >= 4
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        Pain: {s.patient_reported_pain}/10
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {patient.notes && (
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Clinical Notes & Observations
          </p>
          <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {patient.notes}
          </p>
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
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#08101e] text-slate-400 uppercase tracking-wider text-[11px]">
              {['Date', 'Status', 'Duration', 'Discomfort (0–10)', 'Comfort (0–10)', 'Notes'].map(
                (h) => (
                  <th key={h} className="px-5 py-4 font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sessions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="px-5 py-3.5 font-mono text-slate-300">
                  {new Date(s.session_date).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <SessionStatusBadge status={s.status} />
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-400">
                  {s.status === 'completed' ? `${s.duration_minutes}m` : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={
                      s.status !== 'completed'
                        ? 'text-slate-400'
                        : s.patient_reported_pain >= 7
                        ? 'font-mono font-bold text-rose-400'
                        : s.patient_reported_pain >= 4
                        ? 'font-mono font-bold text-amber-400'
                        : 'font-mono font-bold text-emerald-400'
                    }
                  >
                    {s.status === 'completed' ? `${s.patient_reported_pain}/10` : '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-cyan-300">
                  {s.status === 'completed' ? `${s.patient_reported_comfort}/10` : '—'}
                </td>
                <td className="px-5 py-3.5 text-slate-400 max-w-56 truncate">
                  {s.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 font-mono">⚠ All session data is synthetic demonstration telemetry.</p>
    </div>
  )
}

// ── Adherence tab ─────────────────────────────────────────────────────────────
function AdherenceTab({
  patientId,
  plannedPerWeek,
}: {
  patientId: string
  plannedPerWeek: number
}) {
  const { data, isLoading } = useQuery<AdherenceWeeklySeries>({
    queryKey: ['adherence-weekly', patientId],
    queryFn: () => getPatientAdherenceWeekly(patientId, 6),
  })

  if (isLoading) return <LoadingState message="Loading adherence longitudinal series…" />
  if (!data) return <EmptyState message="No adherence data available." />

  const adh = data.overall_summary
  const trendColor =
    adh.week_over_week_trend > 0
      ? 'text-emerald-400'
      : adh.week_over_week_trend < 0
      ? 'text-rose-400'
      : 'text-slate-300'

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Adherence Rate', value: `${adh.adherence_pct}%`, sub: 'last 28 days' },
          {
            label: 'Completed',
            value: adh.completed_sessions,
            sub: `of ${adh.planned_sessions} planned`,
          },
          { label: 'Missed', value: adh.missed_sessions, sub: 'last 28 days' },
          {
            label: 'WoW Trend',
            value: `${adh.week_over_week_trend > 0 ? '+' : ''}${adh.week_over_week_trend}pp`,
            sub: adh.week_over_week_trend >= 0 ? 'Stable / improving' : 'Declining alert',
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl glass-panel p-5 border border-slate-800 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p
              className={`mt-1.5 text-3xl font-extrabold font-mono ${
                label === 'WoW Trend' ? trendColor : 'text-white'
              }`}
            >
              {value}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Weekly Longitudinal Adherence (Last 6 Weeks)
        </p>
        <AdherenceBarChart data={data.weeks} plannedPerWeek={plannedPerWeek} />
      </div>

      {/* Weekly breakdown table */}
      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#08101e] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              {['Week Window', 'Planned', 'Completed', 'Missed', 'Adherence Rate'].map((h) => (
                <th key={h} className="px-5 py-3.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {[...data.weeks].reverse().map((w) => (
              <tr key={w.week_start} className="hover:bg-slate-900/60 transition-colors">
                <td className="px-5 py-3 font-mono text-slate-300">{w.week_label}</td>
                <td className="px-5 py-3 font-mono text-slate-400">{w.planned}</td>
                <td className="px-5 py-3 font-mono text-emerald-400 font-semibold">
                  {w.completed}
                </td>
                <td className="px-5 py-3 font-mono text-rose-400">{w.missed}</td>
                <td className="px-5 py-3">
                  <span
                    className={`font-mono font-bold ${
                      w.adherence_pct >= 80
                        ? 'text-emerald-400'
                        : w.adherence_pct >= 60
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {w.adherence_pct}%
                  </span>
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

  if (isLoading) return <LoadingState message="Loading patient outcomes trajectory…" />
  if (!data || data.length === 0)
    return <EmptyState message="No completed sessions with reported outcome data." />

  const pains = data.map((d) => d.pain)
  const comforts = data.map((d) => d.comfort)
  const avgPain = (pains.reduce((a, b) => a + b, 0) / pains.length).toFixed(1)
  const avgComfort = (comforts.reduce((a, b) => a + b, 0) / comforts.length).toFixed(1)
  const painTrend = pains[pains.length - 1] - pains[0]

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Discomfort Score
          </p>
          <p
            className={`mt-1.5 text-3xl font-extrabold font-mono ${
              Number(avgPain) >= 7
                ? 'text-rose-400'
                : Number(avgPain) >= 4
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {avgPain}
            <span className="text-xs font-normal text-slate-400">/10</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">across {data.length} sessions</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-slate-800 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Comfort Score
          </p>
          <p className="mt-1.5 text-3xl font-extrabold font-mono text-cyan-400">
            {avgComfort}
            <span className="text-xs font-normal text-slate-400">/10</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">patient-reported tolerance</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-slate-800 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pain Trajectory
          </p>
          <p
            className={`mt-1.5 text-3xl font-extrabold font-mono ${
              painTrend < 0 ? 'text-emerald-400' : painTrend > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {painTrend > 0 ? '+' : ''}
            {painTrend.toFixed(1)}
          </p>
          <p
            className={`text-[11px] mt-1 ${
              painTrend < -1 ? 'text-emerald-400' : painTrend > 1 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {painTrend < -1 ? 'Improving' : painTrend > 1 ? 'Worsening Alert' : 'Stable'}
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Discomfort & Comfort Longitudinal Trend
          </p>
          <div className="flex gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="inline-block h-2 w-3 rounded-full bg-rose-500" /> Discomfort
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="inline-block h-2 w-3 rounded-full bg-cyan-400" /> Comfort
            </span>
          </div>
        </div>
        <OutcomeTrendChart data={data} showComfort={true} />
      </div>
    </div>
  )
}

// ── AI Summary tab ────────────────────────────────────────────────────────────
function AISummaryTab({ patientId }: { patientId: string }) {
  const { data: insight, isLoading, isError, refetch, isFetching } = useQuery<PatientAIInsight>({
    queryKey: ['patient-ai-insight', patientId],
    queryFn: () => getPatientAIInsight(patientId),
    enabled: false,
  })

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="rounded-2xl glass-panel border border-cyan-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 shadow-md">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              IBM watsonx.ai Clinical Intelligence Synthesis
            </h2>
            <p className="text-xs text-slate-400">
              Automated pattern synthesis and decision support for rehabilitation triage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isLoading || isFetching ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin" />
              Synthesizing Patient Signals...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {insight ? 'Re-Generate AI Insight' : 'Generate AI Clinical Insight'}
            </>
          )}
        </button>
      </div>

      {/* Initial state */}
      {!insight && !isLoading && !isFetching && !isError && (
        <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#081224]/50 p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Ready to Generate Clinical Decision Support Summary
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Click <strong>"Generate AI Clinical Insight"</strong> above to trigger Granite model
            synthesis across adherence records, pain scores, session completion patterns, and active risk flags.
          </p>
        </div>
      )}

      {/* Loading state */}
      {(isLoading || isFetching) && (
        <div className="rounded-2xl glass-panel p-10 text-center space-y-4">
          <RotateCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
          <div>
            <p className="text-sm font-semibold text-white">Running Clinical Synthesis Model...</p>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating 28-day adherence trends, consecutive session gaps, and pain outcome trajectories.
            </p>
          </div>
        </div>
      )}

      {/* Generated Insight */}
      {insight && (
        <div className="space-y-6">
          {/* Provider Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Provider:</span>
              <span
                className={`font-mono font-bold px-2.5 py-0.5 rounded text-[11px] ${
                  insight.provider === 'watsonx-granite'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                }`}
              >
                {insight.provider === 'watsonx-granite'
                  ? 'IBM watsonx.ai / Granite (ibm/granite-13b-instruct-v2)'
                  : 'Demo AI Insight — watsonx.ai not configured'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Model: {insight.model_used}
            </span>
          </div>

          {/* Overall Status */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Overall Patient Clinical Status
              </h3>
              <RiskBadge level={insight.risk_level as any} compact />
            </div>
            <p className="text-xs leading-relaxed text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-cyan-500/20">
              {insight.status}
            </p>
          </div>

          {/* Grid: Trends & Factors */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Key Observed Trends
              </h3>
              <ul className="space-y-2">
                {insight.key_trends.map((trend, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{trend}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Factors Requiring Clinician Attention
              </h3>
              <ul className="space-y-2">
                {insight.attention_factors.map((factor, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Clinical Action */}
          <div className="rounded-2xl glass-panel border border-cyan-500/30 p-6 space-y-2 bg-gradient-to-r from-cyan-950/20 to-blue-950/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              Suggested Clinical Decision-Support Action
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">{insight.suggested_review}</p>
          </div>

          {/* Medical Safety Disclaimer */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-500 shrink-0" />
            <span>{insight.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'adherence', label: 'Adherence' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'ai-summary', label: 'AI Clinical Insight' },
]

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isReportOpen, setIsReportOpen] = useState(false)

  const { data: patient, isLoading, error } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  })

  // Report: only fetched once the modal is opened
  const {
    data: reportData,
    isFetching: isReportLoading,
    isError: isReportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ['patient-report', id],
    queryFn: () => getPatientReport(id!),
    enabled: isReportOpen && !!id,
    staleTime: 2 * 60 * 1000, // cache for 2 min so re-opens are instant
    retry: 1,
  })

  if (isLoading) return <LoadingState message="Loading patient clinical profile…" />
  if (error || !patient)
    return <ErrorState message={`Patient ${id ?? ''} not found or backend unavailable.`} />

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="animate-cs-fade-in-up flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/patients" className="hover:text-cyan-300 transition-colors">
          Patients
        </Link>
        <span>/</span>
        <span className="text-cyan-400 font-semibold">{patient.id}</span>
      </nav>

      {/* Patient Header Card */}
      <div className="animate-cs-fade-in-up cs-stagger-1 rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-wrap items-start justify-between gap-6 cs-card">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{patient.name}</h1>
              <RiskBadge level={patient.risk_level} />
              {patient.is_demo && (
                <span className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  Demo Synthetic Record
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-300">{patient.diagnosis}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {patient.id} · Age {patient.age} · Programme started{' '}
              {new Date(patient.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Patients</span>
          </Link>

          {/* Generate Report Button */}
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/60 hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            title="Generate clinical summary report"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span>Generate Report</span>
          </button>

          <Link
            to={`/patients/${patient.id}/session`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/25 hover:brightness-110 transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>Start Treatment Simulator</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="animate-cs-fade-in-up cs-stagger-2 border-b border-slate-800">
        <nav className="-mb-px flex gap-2 overflow-x-auto">
          {TABS.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`whitespace-nowrap px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === tabId
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 rounded-t-xl shadow-[0_-2px_10px_rgba(6,182,212,0.15)]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {label}
              {tabId === 'ai-summary' && (
                <span className="ml-2 rounded-full bg-cyan-950 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                  Granite AI
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2 animate-cs-fade-in">
        {activeTab === 'overview' && <OverviewTab patient={patient} />}
        {activeTab === 'sessions' && <SessionsTab patient={patient} />}
        {activeTab === 'adherence' && (
          <AdherenceTab
            patientId={patient.id}
            plannedPerWeek={patient.planned_sessions_per_week}
          />
        )}
        {activeTab === 'outcomes' && <OutcomesTab patientId={patient.id} />}
        {activeTab === 'ai-summary' && <AISummaryTab patientId={patient.id} />}
      </div>

      <p className="text-center text-xs text-slate-400 pt-4">
        ⚠ All data shown is synthetic demo data. Decision support only — not a validated medical diagnosis.
      </p>

      {/* Patient Report Modal */}
      <PatientReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={reportData}
        isLoading={isReportLoading}
        isError={isReportError}
        onRetry={() => refetchReport()}
      />
    </div>
  )
}
