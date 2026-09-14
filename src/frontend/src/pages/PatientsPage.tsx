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
    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-600">{pct}%</span>
    </div>
  )
}

function PatientRow({ patient }: { patient: PatientSummary }) {
  return (
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-slate-400">{patient.id}</span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-900">{patient.name}</p>
          <p className="text-xs text-slate-400">{patient.diagnosis}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        {patient.adherence ? (
          <AdherenceBar pct={patient.adherence.adherence_pct} />
        ) : (
          <span className="text-xs text-slate-400">No data</span>
        )}
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={patient.risk_level} compact />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {patient.risk_flags.length > 0 ? (
          <ul className="space-y-0.5">
            {patient.risk_flags.map((f, i) => (
              <li key={i} className="truncate max-w-48">
                {f.flag_type.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/patients/${patient.id}/session`}
            className="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
          >
            <Play className="h-3 w-3" />
            Session
          </Link>
          <Link
            to={`/patients/${patient.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Profile
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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.length} patient${data.length !== 1 ? 's' : ''}` : '—'} in the Veno-Pump programme
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, ID, or diagnosis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading patients…" />
        ) : error ? (
          <ErrorState message="Could not load patients. Is the backend running?" />
        ) : !data || data.length === 0 ? (
          <EmptyState message="No patients found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Adherence (28d)</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Risk</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Flags</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((patient) => (
                  <PatientRow key={patient.id} patient={patient} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        ⚠ All patient data is synthetic demo data only.
      </p>
    </div>
  )
}
