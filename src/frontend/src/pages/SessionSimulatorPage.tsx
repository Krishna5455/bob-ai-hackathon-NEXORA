import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Gauge,
  ChevronRight,
  ShieldCheck,
  Send,
  Sliders,
  Check,
} from 'lucide-react'
import { getPatient, createSession } from '@/lib/api'
import { SimulatorBanner } from '@/components/ui/SimulatorBanner'
import { LoadingState, ErrorState } from '@/components/ui/States'
import type { PatientDetail, TreatmentSessionCreate } from '@/types/api'

// Treatment phase definition
type TreatmentPhase = 'idle' | 'inflation' | 'hold' | 'deflation' | 'rest'

// Phase durations in simulation seconds (12s total cycle)
const PHASE_DURATIONS: Record<Exclude<TreatmentPhase, 'idle'>, number> = {
  inflation: 3.5, // Ankle -> Mid -> Upper graduated inflation
  hold: 4.0,      // Sustained compression + NMES active stimulation
  deflation: 2.0, // Rapid pressure release
  rest: 2.5,      // Resting refractory period
}

const CYCLE_DURATION =
  PHASE_DURATIONS.inflation +
  PHASE_DURATIONS.hold +
  PHASE_DURATIONS.deflation +
  PHASE_DURATIONS.rest // 12.0s

const PLANNED_DURATION_MINUTES = 20
const TOTAL_SESSION_SECONDS = PLANNED_DURATION_MINUTES * 60 // 1200 seconds

export default function SessionSimulatorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Patient data query
  const { data: patient, isLoading, error } = useQuery<PatientDetail>({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  })

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1) // 1x, 5x, 20x
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<TreatmentPhase>('idle')
  const [phaseProgress, setPhaseProgress] = useState(0) // 0 to 1 within current phase
  const [completedCycles, setCompletedCycles] = useState(0)

  // Outcome submission state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [painScore, setPainScore] = useState<number>(2)
  const [comfortScore, setComfortScore] = useState<number>(8)
  const [sessionNotes, setSessionNotes] = useState<string>('')
  const [submittedSession, setSubmittedSession] = useState<{
    id: string
    duration: number
    date: string
    pain: number
    comfort: number
  } | null>(null)

  // Post session mutation
  const sessionMutation = useMutation({
    mutationFn: (payload: TreatmentSessionCreate) => createSession(payload),
    onSuccess: (data) => {
      // Invalidate relevant queries so charts & dashboards immediately update
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      setSubmittedSession({
        id: data.id,
        duration: data.duration_minutes,
        date: data.session_date,
        pain: data.patient_reported_pain,
        comfort: data.patient_reported_comfort,
      })
      setShowFeedbackModal(false)
    },
  })

  // Timer loop
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRunning || isCompleted) {
      lastTimeRef.current = null
      return
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const delta = 0.1 * speedMultiplier
        const next = prev + delta

        if (next >= TOTAL_SESSION_SECONDS) {
          setIsRunning(false)
          setIsCompleted(true)
          setCurrentPhase('idle')
          setShowFeedbackModal(true)
          return TOTAL_SESSION_SECONDS
        }

        // Calculate phase from cycle time
        const cycleTime = next % CYCLE_DURATION
        let phase: TreatmentPhase = 'inflation'
        let pProgress = 0

        if (cycleTime < PHASE_DURATIONS.inflation) {
          phase = 'inflation'
          pProgress = cycleTime / PHASE_DURATIONS.inflation
        } else if (cycleTime < PHASE_DURATIONS.inflation + PHASE_DURATIONS.hold) {
          phase = 'hold'
          pProgress = (cycleTime - PHASE_DURATIONS.inflation) / PHASE_DURATIONS.hold
        } else if (
          cycleTime <
          PHASE_DURATIONS.inflation + PHASE_DURATIONS.hold + PHASE_DURATIONS.deflation
        ) {
          phase = 'deflation'
          pProgress =
            (cycleTime - (PHASE_DURATIONS.inflation + PHASE_DURATIONS.hold)) /
            PHASE_DURATIONS.deflation
        } else {
          phase = 'rest'
          pProgress =
            (cycleTime -
              (PHASE_DURATIONS.inflation +
                PHASE_DURATIONS.hold +
                PHASE_DURATIONS.deflation)) /
            PHASE_DURATIONS.rest
        }

        setCurrentPhase(phase)
        setPhaseProgress(pProgress)
        setCompletedCycles(Math.floor(next / CYCLE_DURATION))

        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning, isCompleted, speedMultiplier])

  // Handlers
  const handleStart = () => {
    setIsRunning(true)
    if (currentPhase === 'idle') {
      setCurrentPhase('inflation')
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsCompleted(false)
    setElapsedSeconds(0)
    setCurrentPhase('idle')
    setPhaseProgress(0)
    setCompletedCycles(0)
    setSubmittedSession(null)
    setShowFeedbackModal(false)
  }

  const handleFastForwardComplete = () => {
    setIsRunning(false)
    setIsCompleted(true)
    setElapsedSeconds(TOTAL_SESSION_SECONDS)
    setCurrentPhase('idle')
    setPhaseProgress(1)
    setCompletedCycles(Math.floor(TOTAL_SESSION_SECONDS / CYCLE_DURATION))
    setShowFeedbackModal(true)
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || sessionMutation.isPending) return

    sessionMutation.mutate({
      patient_id: id,
      session_date: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      status: 'completed',
      compression_level: 'moderate',
      nmes_pattern: 'standard-calf',
      patient_reported_pain: painScore,
      patient_reported_comfort: comfortScore,
      notes: sessionNotes.trim() || 'Simulated treatment session completed successfully.',
    })
  }

  if (isLoading) return <LoadingState message="Loading patient data…" />
  if (error || !patient)
    return <ErrorState message={`Patient ${id ?? ''} not found.`} />

  // Calculated display values
  const progressPercent = Math.min(100, (elapsedSeconds / TOTAL_SESSION_SECONDS) * 100)
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const elapsedSecsRemainder = Math.floor(elapsedSeconds % 60)
  const formattedTime = `${String(elapsedMinutes).padStart(2, '0')}:${String(
    elapsedSecsRemainder,
  ).padStart(2, '0')}`

  // Calculate simulated chamber pressures based on current phase and progress
  const getChamberPressures = () => {
    if (currentPhase === 'idle' || currentPhase === 'rest') {
      return { distal: 0, medial: 0, proximal: 0 }
    }
    if (currentPhase === 'inflation') {
      const distal = Math.round(Math.min(45, phaseProgress * 1.5 * 45))
      const medial = Math.round(
        Math.min(35, Math.max(0, (phaseProgress - 0.2) * 1.6 * 35)),
      )
      const proximal = Math.round(
        Math.min(25, Math.max(0, (phaseProgress - 0.4) * 1.8 * 25)),
      )
      return { distal, medial, proximal }
    }
    if (currentPhase === 'hold') {
      return { distal: 45, medial: 35, proximal: 25 }
    }
    if (currentPhase === 'deflation') {
      const remaining = 1 - phaseProgress
      return {
        distal: Math.round(45 * remaining),
        medial: Math.round(35 * remaining),
        proximal: Math.round(25 * remaining),
      }
    }
    return { distal: 0, medial: 0, proximal: 0 }
  }

  const pressures = getChamberPressures()
  const isNMESActive = isRunning && currentPhase === 'hold'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            to={`/patients/${id}`}
            className="flex items-center gap-1.5 font-medium hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {patient.name} ({patient.id})
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Treatment Simulator</span>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              SESSION IN PROGRESS ({speedMultiplier}x)
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SESSION COMPLETED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Prominent Medical Concept & Simulation Banner */}
      <SimulatorBanner />

      {/* Main Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Veno-Pump Calf Rehabilitation Simulator
              </h1>
              <span className="rounded bg-brand-100 text-brand-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                Virtual Device
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Target Patient: <strong className="text-slate-700">{patient.name}</strong> · Protocol:{' '}
              <span className="text-slate-700">
                Graduated Pneumatic Compression (25-45 mmHg) + Synchronized Calf NMES (35 Hz)
              </span>
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500 px-2">Simulation Speed:</span>
          {[
            { label: '1x (Real)', val: 1 },
            { label: '5x (Fast)', val: 5 },
            { label: '20x (Demo)', val: 20 },
          ].map(({ label, val }) => (
            <button
              key={val}
              type="button"
              onClick={() => setSpeedMultiplier(val)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                speedMultiplier === val
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Submission Success Confirmation View */}
      {submittedSession && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-900">
                  Simulated Session Recorded Successfully!
                </h2>
                <p className="text-sm text-emerald-800 mt-1">
                  Session record has been committed to the clinical database (`venopump.db`) and
                  integrated into patient adherence and outcome metrics.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-emerald-900">
                  <div className="rounded-md bg-white/80 px-3 py-1.5 border border-emerald-200">
                    Session ID: <span className="font-mono text-slate-700">{submittedSession.id.slice(0, 8)}...</span>
                  </div>
                  <div className="rounded-md bg-white/80 px-3 py-1.5 border border-emerald-200">
                    Duration: <span className="font-bold text-slate-800">{submittedSession.duration} mins</span>
                  </div>
                  <div className="rounded-md bg-white/80 px-3 py-1.5 border border-emerald-200">
                    Reported Pain: <span className="font-bold text-slate-800">{submittedSession.pain} / 10</span>
                  </div>
                  <div className="rounded-md bg-white/80 px-3 py-1.5 border border-emerald-200">
                    Reported Comfort: <span className="font-bold text-slate-800">{submittedSession.comfort} / 10</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                Run Another Session
              </button>
              <button
                type="button"
                onClick={() => navigate(`/patients/${id}`)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-colors"
              >
                Return to Patient Profile
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Device Visualization (Chambers & Waveforms) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Calf Sleeve Graduated Compression Visualizer */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Graduated Calf Compression Chamber Telemetry
                </h2>
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  currentPhase === 'inflation'
                    ? 'bg-blue-100 text-blue-800'
                    : currentPhase === 'hold'
                    ? 'bg-purple-100 text-purple-800'
                    : currentPhase === 'deflation'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Phase: {currentPhase === 'idle' ? 'Standby' : currentPhase}
              </span>
            </div>

            {/* Visual Sleeve Chambers */}
            <div className="rounded-xl bg-slate-900 p-6 text-white space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Anatomical Calf Zone (Proximal → Distal)</span>
                <span>Graduated Pressure Target / Live mmHg</span>
              </div>

              {/* Proximal Chamber (Upper Calf) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 3: Upper Calf (Proximal)
                  </span>
                  <span className="font-mono font-bold text-blue-400">
                    {pressures.proximal} <span className="text-slate-500">/ 25 mmHg</span>
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
                    style={{ width: `${(pressures.proximal / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medial Chamber (Mid Calf) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 2: Mid Calf (Gastrocnemius Bellies)
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {pressures.medial} <span className="text-slate-500">/ 35 mmHg</span>
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                    style={{ width: `${(pressures.medial / 35) * 100}%` }}
                  />
                </div>
              </div>

              {/* Distal Chamber (Ankle) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 1: Distal Ankle (Max Pressure Base)
                  </span>
                  <span className="font-mono font-bold text-teal-300">
                    {pressures.distal} <span className="text-slate-500">/ 45 mmHg</span>
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-150"
                    style={{ width: `${(pressures.distal / 45) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Directional Venous Flow: Ascending ↑</span>
                <span>Active Cycle: #{completedCycles + 1}</span>
              </div>
            </div>

            {/* Cycle Sequence Tracker */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { phase: 'inflation', label: '1. Inflation (3.5s)', desc: 'Sequential build' },
                { phase: 'hold', label: '2. Hold + NMES (4s)', desc: 'Peak compression' },
                { phase: 'deflation', label: '3. Deflation (2s)', desc: 'Rapid release' },
                { phase: 'rest', label: '4. Rest (2.5s)', desc: 'Venous refill' },
              ].map(({ phase, label, desc }) => {
                const isActive = currentPhase === phase
                return (
                  <div
                    key={phase}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/80 font-bold text-brand-900 ring-2 ring-brand-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="truncate">{label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-normal">{desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 2: NMES Pulse & Muscle Stimulation Visualizer */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">
                  Neuromuscular Electrical Stimulation (NMES) Pulse Train
                </h2>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isNMESActive
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isNMESActive ? '⚡ STIMULATION FIRING (35 Hz)' : 'QUIESCENT'}
              </span>
            </div>

            {/* Pulse Train Oscilloscope Visual */}
            <div className="rounded-xl bg-slate-950 p-5 font-mono text-xs text-amber-400 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-500 mb-3 border-b border-slate-800 pb-2">
                <span>SIMULATED BIPHASIC WAVEFORM</span>
                <span>CH1: SOLEUS | CH2: GASTROCNEMIUS</span>
              </div>

              {/* Dynamic Waveform Simulation */}
              <div className="h-20 flex items-center justify-center relative">
                {isNMESActive ? (
                  <div className="w-full h-full flex items-center justify-around">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-amber-400 rounded-full animate-bounce"
                        style={{
                          height: `${30 + Math.sin(i * 0.8 + elapsedSeconds * 10) * 50}%`,
                          animationDelay: `${(i % 6) * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full border-t border-dashed border-slate-700 flex items-center justify-center">
                    <span className="bg-slate-950 px-3 text-[11px] text-slate-500">
                      NMES pulses active during compression HOLD phase only
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                <div>
                  Freq: <span className="text-amber-300 font-semibold">35 Hz</span>
                </div>
                <div>
                  Pulse Width: <span className="text-amber-300 font-semibold">250 µs</span>
                </div>
                <div>
                  Current: <span className="text-amber-300 font-semibold">28 mA (Sim)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              ⚠ Safe UI representation of simulated electrical parameters. No physical voltage or
              current is emitted.
            </p>
          </div>
        </div>

        {/* Right Column: Controls, Telemetry, and Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Session Progress & Timer Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-600" />
              Session Control & Telemetry
            </h2>

            {/* Circular / Large Timer Display */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Simulated Elapsed Time
              </span>
              <div className="text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
                {formattedTime}
                <span className="text-xl font-normal text-slate-400"> / 20:00</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Session Completion</span>
                  <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isCompleted}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-brand-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4 fill-white" />
                  {elapsedSeconds > 0 && !isCompleted ? 'Resume Treatment' : 'Start Treatment Session'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-amber-700 active:scale-[0.99] transition-all"
                >
                  <Pause className="h-4 w-4 fill-white" />
                  Pause Treatment Session
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={elapsedSeconds === 0}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Session
                </button>

                <button
                  type="button"
                  onClick={handleFastForwardComplete}
                  disabled={isCompleted}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 py-2.5 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Fast-forward to 100% completion for hackathon judges"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Fast Complete (Demo)
                </button>
              </div>
            </div>

            {/* Prescribed Protocol Summary */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-700">Prescription Specifications:</div>
              <div className="flex justify-between text-slate-600">
                <span>Protocol:</span>
                <span className="font-medium text-slate-800">Standard Sequential Calf</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Compression Gradient:</span>
                <span className="font-medium text-slate-800">45 mmHg → 35 mmHg → 25 mmHg</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Prescribed Frequency:</span>
                <span className="font-medium text-slate-800">
                  {patient.planned_sessions_per_week} sessions / week
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Device Serial Number:</span>
                <span className="font-mono text-slate-800">VP-DEV-SIM-2026</span>
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 text-xs text-blue-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              Clinical Trial Demo Mode
            </div>
            <p className="leading-relaxed">
              Upon session completion, the patient outcome feedback form will prompt for
              standardized visual analog pain (0–10) and comfort scores. Results are automatically
              committed to the patient cohort and re-evaluated by the risk engine.
            </p>
          </div>
        </div>
      </div>

      {/* Post-Session Patient Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Treatment Session Completed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record patient-reported outcomes for {patient.name} ({patient.id})
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                100% Completed
              </span>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Pain Score (0-10) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-slate-800">
                    Patient Reported Pain / Discomfort (0–10):
                  </label>
                  <span
                    className={`font-mono font-bold text-base px-2 py-0.5 rounded ${
                      painScore <= 3
                        ? 'bg-emerald-100 text-emerald-800'
                        : painScore <= 6
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {painScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0: No pain</span>
                  <span>5: Moderate discomfort</span>
                  <span>10: Severe pain</span>
                </div>
              </div>

              {/* Comfort Score (0-10) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-slate-800">
                    Sleeve Fit & Treatment Comfort (0–10):
                  </label>
                  <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {comfortScore} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={comfortScore}
                  onChange={(e) => setComfortScore(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0: Very uncomfortable</span>
                  <span>5: Neutral</span>
                  <span>10: Highly comfortable</span>
                </div>
              </div>

              {/* Optional Session Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Clinical Session Notes (Optional):
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Good tolerance, patient reported mild muscular activation in medial gastrocnemius."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Error Message if API fails */}
              {sessionMutation.isError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>
                    Failed to submit session to backend. Please check network connection and try
                    again.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={sessionMutation.isPending}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={sessionMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-60"
                >
                  {sessionMutation.isPending ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit & Save Session Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

