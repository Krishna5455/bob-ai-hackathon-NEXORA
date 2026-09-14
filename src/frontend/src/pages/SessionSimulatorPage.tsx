import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Zap } from 'lucide-react'
import { getPatient } from '@/lib/api'
import { SimulatorBanner } from '@/components/ui/SimulatorBanner'
import { LoadingState, ErrorState } from '@/components/ui/States'
import type { PatientDetail } from '@/types/api'

export default function SessionSimulatorPage() {
  const { id } = useParams<{ id: string }>()

  const { data: patient, isLoading, error } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingState message="Loading patient data…" />
  if (error || !patient)
    return <ErrorState message={`Patient ${id ?? ''} not found.`} />

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to={`/patients/${id}`} className="flex items-center gap-1 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          {patient.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Treatment Session</span>
      </div>

      {/* Simulator disclaimer — always shown */}
      <div className="mb-6">
        <SimulatorBanner />
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Simulated Treatment Session</h1>
          <p className="text-sm text-slate-500">
            {patient.name} · {patient.diagnosis}
          </p>
        </div>
      </div>

      {/* Phase 3 placeholder panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Session controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Session Controls</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Planned Duration</p>
                <p className="text-xs text-slate-500">Standard protocol</p>
              </div>
              <span className="text-lg font-semibold text-slate-900">20 min</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Sessions / Week</p>
                <p className="text-xs text-slate-500">Prescribed frequency</p>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                {patient.planned_sessions_per_week}
              </span>
            </div>
          </div>
          <button
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white opacity-50"
          >
            Start Simulated Session — Available in Phase 3
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Full interactive simulator with compression and NMES visualisation will be
            implemented in Phase 3.
          </p>
        </div>

        {/* Simulated device status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Simulated Device Status
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              Not active
            </span>
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Compression Status', value: '—', sub: 'Session not started' },
              { label: 'NMES Pattern', value: '—', sub: 'Session not started' },
              { label: 'Session Timer', value: '00:00', sub: 'Elapsed time' },
              { label: 'Battery Level', value: '—', sub: 'Simulated device' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <span className="text-sm font-semibold text-slate-400">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What Phase 3 will implement */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-blue-800">Phase 3 — Simulator Implementation</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Animated compression cycle visualisation (active / rest phases)</li>
            <li>• Animated NMES waveform display (ramp-up → sustained → ramp-down → rest)</li>
            <li>• Live session timer and progress bar</li>
            <li>• Patient-reported pain and comfort outcome form on completion</li>
            <li>• Session data posted to backend and reflected in patient adherence and outcomes</li>
          </ul>
          <p className="mt-3 text-xs text-blue-600">
            ⚠ The Veno-Pump physical device is a proposed concept. All session data is simulated
            and does not represent real device operation or clinically validated treatment.
          </p>
        </div>
      </div>
    </div>
  )
}
