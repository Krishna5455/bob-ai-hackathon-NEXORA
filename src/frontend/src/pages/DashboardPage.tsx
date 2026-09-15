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
  ArrowRight,
  ChevronRight,
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
      <div className="rounded-2xl bg-[#0a1426]/80 border border-slate-800 p-8 text-center space-y-3 animate-pulse">
        <RotateCw className="h-6 w-6 animate-spin mx-auto text-cyan-400" />
        <p className="text-xs font-semibold text-slate-200">Synthesizing Cohort Intelligence...</p>
        <p className="text-[11px] text-slate-400">
          Evaluating panel adherence, symptom trajectories, and risk signals across all patients.
        </p>
      </div>
    )
  }

  if (isError || !insight) {
    return (
      <div className="rounded-2xl bg-[#0a1426]/80 border border-slate-800 p-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <span>Generate updated panel-wide clinical intelligence with Granite AI.</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:brightness-110 shadow-md shadow-cyan-500/20 cursor-pointer"
        >
          Synthesize Cohort
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-cs-fade-in">
      {/* Provider badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-2 text-xs">
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
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <RotateCw className="h-3 w-3" />
          Re-Synthesize
        </button>
      </div>

      {/* Cohort Summary Text */}
      <div className="text-xs leading-relaxed text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-cyan-500/20 shadow-inner">
        <p>{insight.cohort_summary}</p>
      </div>

      {/* Key Observations & Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Key Cohort Observations
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {insight.key_observations.map((obs, i) => (
              <li
                key={i}
                className="flex items-start gap-2 bg-[#091322] p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <span className="text-emerald-400 font-bold">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-cyan-400" />
            Recommended Clinical Actions
          </h4>
          <ul className="space-y-2 text-xs text-slate-200">
            {insight.suggested_clinical_actions.map((act, i) => (
              <li
                key={i}
                className="flex items-start gap-2 bg-cyan-950/30 p-3 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
              >
                <span className="text-cyan-400 font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-slate-400 italic flex items-center gap-1.5 pt-1">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
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
    <div className="space-y-3.5 pt-2">
      {[
        { key: 'high', label: 'High Risk', color: 'bg-rose-500', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.6)]' },
        { key: 'medium', label: 'Medium Risk', color: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]' },
        { key: 'low', label: 'Low Risk', color: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' },
      ].map(({ key, label, color, glow }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-24 text-xs font-semibold text-slate-300">{label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-900 border border-slate-800/80">
            <div
              className={`h-full rounded-full ${color} ${glow} transition-all duration-700 ease-out`}
              style={{ width: pct(distribution[key] ?? 0) }}
            />
          </div>
          <span className="w-8 text-right text-xs font-mono font-bold text-white">
            {distribution[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  )
}

function WoWTrendIcon({ trend }: { trend: number }) {
  if (trend > 5) return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
  if (trend < -5) return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
  return <Minus className="h-3.5 w-3.5 text-slate-400" />
}

function AttentionRow({ patient, index }: { patient: PatientSummary; index: number }) {
  const adh = patient.adherence

  return (
    <Link
      to={`/patients/${patient.id}`}
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
      className={`animate-cs-fade-in-up flex items-center gap-3 rounded-xl p-3 bg-slate-950/50 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all duration-200 group cs-card ${
        patient.risk_level === 'high' ? 'cs-card-high' : 'cs-card-medium'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
            {patient.name}
          </p>
          <span className="text-[10px] font-mono text-slate-400">({patient.id})</span>
        </div>
        <p className="truncate text-[11px] text-slate-400 mt-0.5">{patient.diagnosis}</p>
        {patient.risk_flags.length > 0 && (
          <p className="mt-1 truncate text-[10px] font-mono text-amber-400">
            ● {patient.risk_flags[0].flag_type.replace(/_/g, ' ')}
            {patient.risk_flags.length > 1 ? ` (+${patient.risk_flags.length - 1} more)` : ''}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <RiskBadge level={patient.risk_level} compact />
        {adh && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
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

  if (isLoading) return <LoadingState message="Loading clinician dashboard…" />
  if (error || !data)
    return <ErrorState message="Could not load dashboard. Is the backend running?" />

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Page Header with entrance reveal */}
      <div className="animate-cs-fade-in-up flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Clinician Dashboard
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Live Panel
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Longitudinal overview of active rehabilitation patients — Veno-Pump monitoring platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 border border-cyan-500/30 hover:border-cyan-500 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI Assistant</span>
          </Link>
          <Link
            to="/patients"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 shadow-md shadow-cyan-500/20 transition-all"
          >
            <span>Patient Roster</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Key Cohort Metrics (KPI Row) — Sequential Stagger */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={data.total_patients}
          sub={`${data.active_patients} active in last 14 days`}
          icon={<Users className="h-5 w-5 text-cyan-400" />}
          accent="default"
          className="animate-cs-fade-in-up cs-stagger-1"
        />
        <StatCard
          label="Avg Adherence"
          value={`${data.avg_adherence_pct}%`}
          sub="Last 28 days across all patients"
          accent={
            data.avg_adherence_pct >= 80
              ? 'success'
              : data.avg_adherence_pct >= 60
              ? 'cyan'
              : 'warning'
          }
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
          className="animate-cs-fade-in-up cs-stagger-2"
        />
        <StatCard
          label="Sessions Completed"
          value={data.completed_sessions_total}
          sub="All time across active cohort"
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          accent="default"
          className="animate-cs-fade-in-up cs-stagger-3"
        />
        <StatCard
          label="Requiring Attention"
          value={data.attention_count}
          sub="Patients with medium or high risk"
          accent={data.attention_count > 0 ? 'danger' : 'success'}
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          className="animate-cs-fade-in-up cs-stagger-4"
        />
      </div>

      {/* 3 & 4. Main Panels Grid: Risk Distribution & Attention Patients */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Risk Distribution Card */}
        <div className="lg:col-span-5 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 animate-cs-fade-in-up cs-stagger-3 cs-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Risk Distribution
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Cohort Roster</span>
          </div>
          <RiskBar distribution={data.risk_distribution} />
          <p className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80">
            Evaluates multi-factor adherence consistency, consecutive missed sessions, and patient-reported discomfort trends.
          </p>
        </div>

        {/* Patients Requiring Attention */}
        <div className="lg:col-span-7 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 animate-cs-fade-in-up cs-stagger-4 cs-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Patients Requiring Attention ({data.attention_patients.length})
            </h2>
            <Link
              to="/patients"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View Roster</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {data.attention_patients.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No patients currently flagged for clinical attention.
            </p>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {data.attention_patients.map((p, idx) => (
                <AttentionRow key={p.id} patient={p} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* 5. AI Cohort Intelligence Card */}
        <div className="lg:col-span-12 rounded-3xl glass-panel p-6 sm:p-8 border border-cyan-500/25 space-y-6 animate-cs-fade-in-up cs-stagger-5 cs-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  AI Clinical Cohort Intelligence
                </h2>
                <p className="text-xs text-slate-400">
                  Panel-wide longitudinal synthesis & risk anomaly detection powered by IBM Granite
                </p>
              </div>
            </div>

            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Open Clinician Assistant</span>
            </Link>
          </div>

          <AICohortInsightWidget />
        </div>
      </div>

      {/* Demo data notice */}
      <p className="text-center text-xs text-slate-400 pt-4">
        ⚠ All patient data shown is synthetic demo data. Decision support only — not a validated medical diagnosis.
      </p>
    </div>
  )
}
