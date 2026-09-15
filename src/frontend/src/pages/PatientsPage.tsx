import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, Play } from 'lucide-react'
import { getPatients } from '@/lib/api'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States'
import type { PatientSummary } from '@/types/api'

function AdherenceBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-500'
  const glow =
    pct >= 80 ? 'shadow-[0_0_6px_rgba(16,185,129,0.5)]' : pct >= 60 ? 'shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'shadow-[0_0_6px_rgba(244,63,94,0.5)]'

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
        <div className={`h-full rounded-full ${color} ${glow} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-300">{pct}%</span>
    </div>
  )
}

function PatientRow({ patient, index }: { patient: PatientSummary; index: number }) {
  return (
    <tr
      style={{ animationDelay: `${0.05 + index * 0.04}s` }}
      className="animate-cs-fade-in-up group border-b border-slate-800/60 last:border-0 hover:bg-[#0c182c]/90 transition-colors"
    >
      <td className="px-5 py-4">
        <span className="text-xs font-mono font-bold text-cyan-400">{patient.id}</span>
      </td>
      <td className="px-5 py-4">
        <div>
          <Link
            to={`/patients/${patient.id}`}
            className="font-semibold text-white group-hover:text-cyan-300 transition-colors"
          >
            {patient.name}
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">{patient.diagnosis}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        {patient.adherence ? (
          <AdherenceBar pct={patient.adherence.adherence_pct} />
        ) : (
          <span className="text-xs text-slate-400">No data</span>
        )}
      </td>
      <td className="px-5 py-4">
        <RiskBadge level={patient.risk_level} compact />
      </td>
      <td className="px-5 py-4 text-xs text-slate-400">
        {patient.risk_flags.length > 0 ? (
          <ul className="space-y-1">
            {patient.risk_flags.map((f, i) => (
              <li key={i} className="truncate max-w-56 text-[11px] font-mono text-amber-300/90">
                ● {f.flag_type.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-400 font-mono">None</span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Link
            to={`/patients/${patient.id}/session`}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/20 transition-all shadow-sm"
          >
            <Play className="h-3 w-3 fill-cyan-300 text-cyan-300" />
            <span>Simulator</span>
          </Link>
          <Link
            to={`/patients/${patient.id}`}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 hover:shadow-md hover:shadow-cyan-500/25 transition-all shadow-sm"
          >
            <span>Profile</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </td>
    </tr>
  )
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => getPatients(search || undefined),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="animate-cs-fade-in-up flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-cyan-400 font-semibold">Patients</span>
      </nav>

      {/* Page Header */}
      <div className="animate-cs-fade-in-up cs-stagger-1 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Patient Cohort Roster
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {data ? `${data.length} Active` : 'Loading'}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Active cohort enrolled in the Veno-Pump graduated compression & rehabilitation programme
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, diagnosis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-[#0a1426]/90 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner transition-all"
          />
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="animate-cs-fade-in-up cs-stagger-2 rounded-3xl glass-panel border border-slate-800 shadow-2xl overflow-hidden cs-card">
        {isLoading ? (
          <LoadingState message="Loading patient roster…" />
        ) : error ? (
          <ErrorState message="Could not load patients. Is the backend server active?" />
        ) : !data || data.length === 0 ? (
          <EmptyState message="No patients match your search criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#08101e] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Patient Profile</th>
                  <th className="px-5 py-4">28-Day Adherence</th>
                  <th className="px-5 py-4">Risk Status</th>
                  <th className="px-5 py-4">Clinical Flags</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((patient, idx) => (
                  <PatientRow key={patient.id} patient={patient} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demo notice */}
      <p className="text-center text-xs text-slate-400 pt-2">
        ⚠ Synthetic cohort data for clinical demonstration purposes only.
      </p>
    </div>
  )
}
