import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Activity, TrendingUp, AlertTriangle, TrendingDown, Minus } from 'lucide-react'
import { getDashboardSummary } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { LoadingState, ErrorState } from '@/components/ui/States'
import type { PatientSummary } from '@/types/api'

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

        {/* Recent AI Insights */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900">AI Clinical Insights</h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Phase 4:</strong> IBM watsonx.ai-powered clinical insights will appear here.
            They will be generated from patient adherence, session, and outcome data and presented
            as decision support only — not as diagnosis or treatment recommendations.
          </div>
          {data.recent_insights.length > 0 && (
            <ul className="mt-4 space-y-3">
              {data.recent_insights.map((insight) => (
                <li key={insight.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="mb-1 text-xs text-slate-400">
                    {new Date(insight.generated_at).toLocaleString()}
                  </p>
                  {insight.insight_text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Demo data notice */}
      <p className="mt-8 text-center text-xs text-slate-400">
        ⚠ All patient data shown is synthetic demo data. Not a real patient record.
      </p>
    </div>
  )
}
