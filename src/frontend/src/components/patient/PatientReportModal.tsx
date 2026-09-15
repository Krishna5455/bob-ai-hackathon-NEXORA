import { useState, useEffect } from 'react'
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Brain,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge'
import type { PatientReportResponse } from '@/types/api'

interface PatientReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportData?: PatientReportResponse
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function PatientReportModal({
  isOpen,
  onClose,
  reportData,
  isLoading,
  isError,
  onRetry,
}: PatientReportModalProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'structured' | 'plaintext'>('structured')

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    if (!reportData?.report) return
    try {
      await navigator.clipboard.writeText(reportData.report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const adh = reportData?.adherence
  const ai = reportData?.ai_insight
  const flags = reportData?.risk_flags || []
  const recentSessions = reportData?.recent_sessions || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-cs-fade-in">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl glass-panel border border-slate-700/80 bg-[#081224] shadow-2xl overflow-hidden print-area"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4.5 border-b border-slate-800 bg-[#060c18]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Clinical Patient Summary Report
                {reportData?.patient_id && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    {reportData.patient_id}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Official decision-support clinical telemetry export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'structured'
                    ? 'bg-cyan-950 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Structured
              </button>
              <button
                type="button"
                onClick={() => setViewMode('plaintext')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'plaintext'
                    ? 'bg-cyan-950 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Plaintext
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={!reportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 transition-all disabled:opacity-40"
              title="Copy text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!reportData}
              className="print-keep inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <RotateCw className="h-9 w-9 animate-spin mx-auto text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Compiling Clinical Report & AI Synthesis...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Aggregating 28-day adherence telemetry, pain records, and IBM Granite observations.
                </p>
              </div>
            </div>
          )}

          {isError && (
            <div className="py-12 text-center space-y-4">
              <AlertTriangle className="h-9 w-9 mx-auto text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-white">Failed to Generate Report</p>
                <p className="text-xs text-slate-400 mt-1">
                  Unable to fetch report data from the backend.
                </p>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                Retry Report Generation
              </button>
            </div>
          )}

          {reportData && viewMode === 'plaintext' && (
            <div className="space-y-4">
              <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto print-border">
                {reportData.report}
              </pre>
            </div>
          )}

          {reportData && viewMode === 'structured' && (
            <div className="space-y-6">
              {/* Report Header Card */}
              <div className="rounded-2xl glass-panel p-6 border border-slate-800 bg-slate-950/70 space-y-4 print-border">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
                      VENO-PUMP CLINICAL MONITORING PLATFORM
                    </span>
                    <h1 className="text-2xl font-extrabold text-white mt-1">
                      {reportData.patient_name || reportData.patient_id}
                    </h1>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {reportData.diagnosis}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {reportData.risk_level && (
                      <RiskBadge level={reportData.risk_level} />
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {reportData.patient_id} · Age: {reportData.age}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex flex-wrap gap-4 text-slate-400">
                    <span>
                      Start Date:{' '}
                      <strong className="text-white font-mono">
                        {reportData.start_date ? new Date(reportData.start_date).toLocaleDateString() : 'N/A'}
                      </strong>
                    </span>
                    <span>
                      Prescribed Schedule:{' '}
                      <strong className="text-cyan-300 font-mono">
                        {reportData.planned_sessions_per_week} sessions/week
                      </strong>
                    </span>
                  </div>
                  <span className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 print-badge">
                    ⚠ Synthetic Demo Data
                  </span>
                </div>
              </div>

              {/* Grid: 28-day Adherence & Outcomes */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* 28-Day Adherence */}
                <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 print-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Authoritative 28-Day Adherence
                    </p>
                    {adh && (
                      <span className="text-xs font-mono text-emerald-400">
                        {adh.week_over_week_trend > 0 ? '+' : ''}
                        {adh.week_over_week_trend}pp WoW
                      </span>
                    )}
                  </div>

                  {adh && (
                    <>
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`text-4xl font-extrabold font-mono ${
                            adh.adherence_pct >= 80
                              ? 'text-emerald-400'
                              : adh.adherence_pct >= 60
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {adh.adherence_pct}%
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({adh.completed_sessions} completed / {adh.planned_sessions} planned in 28d)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
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
                  )}
                </div>

                {/* Clinical Outcomes */}
                <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 print-border">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Patient Outcomes & Tolerance
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Avg Discomfort</span>
                      <span
                        className={`text-2xl font-extrabold font-mono ${
                          Number(reportData.avg_pain) >= 7
                            ? 'text-rose-400'
                            : Number(reportData.avg_pain) >= 4
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {reportData.avg_pain}
                        <span className="text-xs font-normal text-slate-400">/10</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Avg Comfort</span>
                      <span className="text-2xl font-extrabold font-mono text-cyan-300">
                        {reportData.avg_comfort}
                        <span className="text-xs font-normal text-slate-400">/10</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 font-mono pt-1">
                    <span>Total Telemetry Sessions: {reportData.total_sessions}</span>
                    <span>Completed: {reportData.completed_sessions}</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment & Flags */}
              <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3 print-border">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Risk Assessment & Active Risk Signals
                  </h3>
                </div>

                {flags.length > 0 ? (
                  <ul className="space-y-2">
                    {flags.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 text-xs text-amber-200 print-border"
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
                          <strong className="text-white capitalize">
                            {f.flag_type.replace(/_/g, ' ')}:
                          </strong>{' '}
                          <span>{f.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>No critical flags detected. Patient demonstrates a stable clinical profile.</span>
                  </div>
                )}
              </div>

              {/* IBM watsonx.ai Granite AI Section */}
              {ai && (
                <div className="rounded-2xl glass-panel border border-cyan-500/30 p-6 space-y-4 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 print-border">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Brain className="h-5 w-5 text-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        AI Clinical Decision Support Synthesis
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 print-badge">
                      Provider: {ai.provider} ({ai.model_used})
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <strong className="text-slate-400 uppercase text-[10px] block mb-1">
                        Clinical Synthesis & Observations:
                      </strong>
                      <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/20">
                        {ai.status}
                      </p>
                    </div>

                    {ai.suggested_review && (
                      <div>
                        <strong className="text-slate-400 uppercase text-[10px] block mb-1">
                          Suggested Clinical Action:
                        </strong>
                        <p className="text-cyan-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/20">
                          {ai.suggested_review}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Sessions Table */}
              {recentSessions.length > 0 && (
                <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-3 print-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      Recent Recorded Telemetry Sessions (Last 5)
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#08101e] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Discomfort (0–10)</th>
                          <th className="px-4 py-2.5">Comfort (0–10)</th>
                          <th className="px-4 py-2.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {recentSessions.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-300">
                              {new Date(s.session_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <SessionStatusBadge status={s.status} />
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {s.status === 'completed' ? `${s.patient_reported_pain}/10` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-cyan-300">
                              {s.status === 'completed' ? `${s.patient_reported_comfort}/10` : '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-400">
                              {s.status === 'completed' ? `${s.duration_minutes}m` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety Disclaimer */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-[11px] text-slate-400 flex items-start gap-2.5 print-border">
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300 block mb-0.5">Clinical Safety Notice</strong>
                  <span>
                    {reportData.disclaimer ||
                      'Decision support only — clinician judgement required. AI output does not constitute a diagnosis, treatment recommendation, or prescription.'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                <span>Veno-Pump Digital Health Monitoring System</span>
                <span>
                  Generated: {reportData.generated_at ? new Date(reportData.generated_at).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
