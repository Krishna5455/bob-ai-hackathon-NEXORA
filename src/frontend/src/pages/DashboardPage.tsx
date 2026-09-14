import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Minus,
  Brain,
  Sparkles,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
} from 'lucide-react'
import { getDashboardSummary, getDashboardAIInsight } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { LoadingState, ErrorState } from '@/components/ui/States'
import type { PatientSummary, DashboardAIInsight } from '@/types/api'

function AICohortInsightWidget() {
  const { data: insight, isLoading, isError, refetch, isFetching } = useQuery<DashboardAIInsight>({
    queryKey: ['dashboard-ai-insight'],
    queryFn: getDashboardAIInsight,
    staleTime: 60_000,
  })

  if (isLoading || isFetching) {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 text-center space-y-2">
        <RotateCw className="h-5 w-5 animate-spin mx-auto text-purple-600" />
        <p className="text-xs font-semibold text-slate-700">Synthesizing Cohort Intelligence...</p>
        <p className="text-[11px] text-slate-400">Evaluating panel adherence and risk signals across all patients.</p>
      </div>
    )
  }

  if (isError || !insight) {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between text-xs text-slate-600">
        <span>Click below to generate cohort intelligence with Granite AI.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700"
        >
          Synthesize Cohort
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Provider badge */}
      <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Provider:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
              insight.provider === 'watsonx-granite'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {insight.provider === 'watsonx-granite'
              ? 'IBM watsonx.ai / Granite'
              : 'Demo AI Insight — watsonx.ai not configured'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900"
        >
          <RotateCw className="h-3 w-3" />
          Re-Synthesize
        </button>
      </div>

      {/* Cohort Summary Text */}
      <p className="text-xs leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-100">
        {insight.cohort_summary}
      </p>

      {/* Key Observations & Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Key Cohort Observations
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {insight.key_observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-1.5 bg-slate-50 p-2 rounded border border-slate-100">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            Recommended Clinical Actions
          </h4>
          <ul className="space-y-1.5 text-xs text-purple-950">
            {insight.suggested_clinical_actions.map((act, i) => (
              <li key={i} className="flex items-start gap-1.5 bg-purple-50/60 p-2 rounded border border-purple-100">
                <span className="text-purple-600 font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-slate-400 italic flex items-center gap-1 pt-1">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        <span>{insight.disclaimer}</span>
      </div>
    </div>
  )
}

function RiskBar({ distribution }: { distribution: Record<string, number> }) {
  const total = (distribution.low ?? 0) + (distribution.medium ?? 0) + (distribution.high ?? 0)
  if (total === 0) return null
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`
  return (
    <div className="space-y-2">
      {[
        { key: 'high', label: 'High', color: 'bg-red-500' },
        { key: 'medium', label: 'Medium', color: 'bg-amber-400' },
        { key: 'low', label: 'Low', color: 'bg-green-500' },
      ].map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-14 text-right text-xs text-slate-500">{label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: pct(distribution[key] ?? 0) }}
            />
          </div>
          <span className="w-6 text-right text-xs font-medium text-slate-700">
            {distribution[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  )
}

function WoWTrendIcon({ trend }: { trend: number }) {
  if (trend > 5) return <TrendingUp className="h-3 w-3 text-green-500" />
  if (trend < -5) return <TrendingDown className="h-3 w-3 text-red-500" />
  return <Minus className="h-3 w-3 text-slate-300" />
}

function AttentionRow({ patient }: { patient: PatientSummary }) {
  const adh = patient.adherence

  return (
    <Link
      to={`/patients/${patient.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-brand-700">{patient.name}</p>
        <p className="truncate text-xs text-slate-400">{patient.diagnosis}</p>
        {patient.risk_flags.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-amber-600">
            {patient.risk_flags[0].flag_type.replace(/_/g, ' ')}
            {patient.risk_flags.length > 1 ? ` +${patient.risk_flags.length - 1} more` : ''}
          </p>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <RiskBadge level={patient.risk_level} compact />
        {adh && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <WoWTrendIcon trend={adh.week_over_week_trend} />
            <span>{adh.adherence_pct}%</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    refetchInterval: 30_000,
  })

  if (isLoading) return <LoadingState message="Loading dashboard…" />
  if (error || !data)
    return <ErrorState message="Could not load dashboard. Is the backend running?" />

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Clinician Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your patient panel — Veno-Pump rehabilitation programme
        </p>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={data.total_patients}
          sub={`${data.active_patients} active in last 14 days`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Avg Adherence"
          value={`${data.avg_adherence_pct}%`}
          sub="Last 28 days across all patients"
          accent={
            data.avg_adherence_pct >= 80
              ? 'success'
              : data.avg_adherence_pct >= 60
                ? 'default'
                : 'warning'
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Sessions Completed"
          value={data.completed_sessions_total}
          sub="All time, across all patients"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Requiring Attention"
          value={data.attention_count}
          sub="Patients with medium or high risk"
          accent={data.attention_count > 0 ? 'warning' : 'success'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Lower panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Risk Distribution</h2>
          <RiskBar distribution={data.risk_distribution} />
          <p className="mt-4 text-xs text-slate-400">
            Based on adherence trends, missed sessions, and reported discomfort.
          </p>
        </div>

        {/* Attention list */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Patients Requiring Attention</h2>
            <Link to="/patients" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data.attention_patients.length === 0 ? (
            <p className="text-sm text-slate-400">No patients currently flagged for attention.</p>
          ) : (
            <div className="-mx-3 space-y-1">
              {data.attention_patients.map((p) => (
                <AttentionRow key={p.id} patient={p} />
              ))}
            </div>
          )}
        </div>

        {/* AI Cohort Insight Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  AI Clinical Cohort Intelligence
                </h2>
                <p className="text-xs text-slate-500">
                  Panel-wide adherence synthesis & anomaly detection powered by IBM Granite
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Assistant
              </Link>
            </div>
          </div>

          <AICohortInsightWidget />
        </div>
      </div>


      {/* Demo data notice */}
      <p className="mt-8 text-center text-xs text-slate-400">
        ⚠ All patient data shown is synthetic demo data. Not a real patient record.
      </p>
    </div>
  )
}
