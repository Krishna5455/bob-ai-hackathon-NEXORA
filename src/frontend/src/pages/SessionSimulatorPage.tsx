import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertCircle,
  Zap,
  Activity,
  Gauge,
  ChevronRight,
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
    setElapsedSeconds(TOTAL_SESSION_SECONDS)
    setIsRunning(false)
    setIsCompleted(true)
    setCurrentPhase('idle')
    setShowFeedbackModal(true)
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs Navigation */}
      <nav className="animate-cs-fade-in-up flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/patients" className="hover:text-cyan-300 transition-colors">
          Patients
        </Link>
        <span>/</span>
        <Link to={`/patients/${id}`} className="hover:text-cyan-300 transition-colors">
          {patient.name} ({patient.id})
        </Link>
        <span>/</span>
        <span className="text-cyan-400 font-semibold">Treatment Session</span>
      </nav>

      {/* Prominent Medical Concept & Simulation Notice */}
      <div className="animate-cs-fade-in-up cs-stagger-1">
        <SimulatorBanner />
      </div>

      {/* Main Header Card */}
      <div className="animate-cs-fade-in-up cs-stagger-2 rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 cs-card">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Veno-Pump Treatment Session Simulator
              </h1>
              <span className="rounded-full bg-cyan-950 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                SIMULATED DEVICE SESSION
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Patient: <strong className="text-white">{patient.name} ({patient.id})</strong> · Protocol:{' '}
              <span className="text-cyan-300 font-mono">
                Graduated Compression (45/35/25 mmHg) + Synchronized Calf NMES (35 Hz)
              </span>
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 self-start md:self-auto shadow-inner">
          <span className="text-xs font-semibold text-slate-400 px-2 font-mono">Speed:</span>
          {[
            { label: '1x (Real)', val: 1 },
            { label: '5x (Fast)', val: 5 },
            { label: '20x (Demo)', val: 20 },
          ].map(({ label, val }) => (
            <button
              key={val}
              type="button"
              onClick={() => setSpeedMultiplier(val)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                speedMultiplier === val
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Submission Success Confirmation View */}
      {submittedSession && (
        <div className="rounded-3xl glass-panel border border-emerald-500/40 bg-emerald-950/20 p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-2xl bg-emerald-950 p-2.5 text-emerald-400 border border-emerald-500/30">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-300">
                  Simulated Treatment Session Recorded Successfully!
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Session telemetry has been written to the clinical database (`venopump.db`) and updated
                  across cohort adherence and outcome calculations.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono text-emerald-300">
                  <div className="rounded-xl bg-slate-950/80 px-3.5 py-1.5 border border-slate-800">
                    Session ID: <span className="font-bold text-white">{submittedSession.id.slice(0, 8)}...</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 px-3.5 py-1.5 border border-slate-800">
                    Duration: <span className="font-bold text-white">{submittedSession.duration} mins</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 px-3.5 py-1.5 border border-slate-800">
                    Discomfort: <span className="font-bold text-white">{submittedSession.pain} / 10</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 px-3.5 py-1.5 border border-slate-800">
                    Comfort: <span className="font-bold text-white">{submittedSession.comfort} / 10</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Run Another Session
              </button>
              <button
                type="button"
                onClick={() => navigate(`/patients/${id}`)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 shadow-md shadow-cyan-500/20 transition-all"
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
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">
                  Graduated Calf Compression Chamber Telemetry
                </h2>
              </div>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  currentPhase === 'inflation'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse'
                    : currentPhase === 'hold'
                    ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                    : currentPhase === 'deflation'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Phase: {currentPhase === 'idle' ? 'Standby' : currentPhase}
              </span>
            </div>

            {/* Visual Sleeve Chambers */}
            <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/20 p-6 space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span>Anatomical Calf Zone (Proximal → Distal)</span>
                <span className="font-mono text-cyan-400">Target / Live Pressure</span>
              </div>

              {/* Proximal Chamber (Upper Calf) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 3: Upper Calf (Proximal)
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {pressures.proximal} <span className="text-slate-500">/ 25 mmHg</span>
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-150 shadow-sm shadow-cyan-400/30"
                    style={{ width: `${(pressures.proximal / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medial Chamber (Mid Calf) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 2: Mid Calf (Gastrocnemius Bellies)
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {pressures.medial} <span className="text-slate-500">/ 35 mmHg</span>
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-150 shadow-sm shadow-teal-400/30"
                    style={{ width: `${(pressures.medial / 35) * 100}%` }}
                  />
                </div>
              </div>

              {/* Distal Chamber (Ankle) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Chamber 1: Distal Ankle (Max Pressure Base)
                  </span>
                  <span className="font-mono font-bold text-teal-300">
                    {pressures.distal} <span className="text-slate-500">/ 45 mmHg</span>
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-150 shadow-sm shadow-emerald-400/30"
                    style={{ width: `${(pressures.distal / 45) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Directional Venous Emptying: Ascending ↑</span>
                <span>Active Cycle: #{completedCycles + 1}</span>
              </div>
            </div>

            {/* Cycle Sequence Tracker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              {[
                { phase: 'inflation', label: '1. Inflation', desc: 'Sequential build (3.5s)' },
                { phase: 'hold', label: '2. Hold + NMES', desc: 'Peak compression (4.0s)' },
                { phase: 'deflation', label: '3. Deflation', desc: 'Rapid release (2.0s)' },
                { phase: 'rest', label: '4. Rest', desc: 'Venous refill (2.5s)' },
              ].map(({ phase, label, desc }) => {
                const isActive = currentPhase === phase
                return (
                  <div
                    key={phase}
                    className={`p-3 rounded-2xl border transition-all ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950/80 font-bold text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    <div className="truncate font-semibold">{label}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-normal">{desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 2: NMES Pulse & Muscle Stimulation Visualizer */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Neuromuscular Electrical Stimulation (NMES) Pulse Train
                </h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  isNMESActive
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {isNMESActive ? '⚡ STIMULATION FIRING (35 Hz)' : 'QUIESCENT'}
              </span>
            </div>

            {/* Pulse Train Oscilloscope Visual */}
            <div className="rounded-2xl bg-slate-950 p-6 font-mono text-xs text-amber-400 border border-slate-800">
              <div className="flex items-center justify-between text-slate-500 mb-3 border-b border-slate-800 pb-2 text-[11px]">
                <span>SIMULATED BIPHASIC WAVEFORM</span>
                <span>TARGET: GASTROCNEMIUS & SOLEUS</span>
              </div>

              {/* Dynamic Waveform Simulation */}
              <div className="h-20 flex items-center justify-center relative">
                {isNMESActive ? (
                  <div className="w-full h-full flex items-center justify-around">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-amber-500 to-cyan-400 rounded-full animate-bounce"
                        style={{
                          height: `${30 + Math.sin(i * 0.8 + elapsedSeconds * 10) * 50}%`,
                          animationDelay: `${(i % 6) * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full border-t border-dashed border-slate-800 flex items-center justify-center">
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

            <p className="text-xs text-slate-400 italic">
              ⚠ Simulated electrical waveform only. No physical voltage or current is emitted.
            </p>
          </div>
        </div>

        {/* Right Column: Controls, Telemetry, and Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Session Progress & Timer Controls */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-400" />
              Session Control & Telemetry
            </h2>

            {/* Large Timer Display */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 text-center space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Simulated Elapsed Time
              </span>
              <div className="text-5xl font-extrabold font-mono text-white tracking-tight">
                {formattedTime}
                <span className="text-xl font-normal text-slate-400"> / 20:00</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Session Completion</span>
                  <span className="text-cyan-400 font-bold">{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200 shadow-sm shadow-cyan-400/30"
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
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-300 py-4 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-slate-950" />
                  {elapsedSeconds > 0 && !isCompleted ? 'Resume Treatment' : 'Start Treatment Session'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Pause className="h-4 w-4 fill-slate-950" />
                  Pause Treatment Session
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={elapsedSeconds === 0}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-3 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Session
                </button>

                <button
                  type="button"
                  onClick={handleFastForwardComplete}
                  disabled={isCompleted}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/50 py-3 px-3 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Fast-forward to 100% completion for clinical demonstration"
                >
                  <FastForward className="h-3.5 w-3.5" />
                  Fast Complete (Demo)
                </button>
              </div>
            </div>

            {/* Prescribed Protocol Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-300">Prescription Specifications:</div>
              <div className="flex justify-between text-slate-400">
                <span>Protocol:</span>
                <span className="font-semibold text-white">Standard Sequential Calf</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Compression Gradient:</span>
                <span className="font-mono text-cyan-400">45 → 35 → 25 mmHg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Prescribed Target:</span>
                <span className="font-semibold text-white">
                  {patient.planned_sessions_per_week} sessions / week
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Session Patient Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-cyan-500/40 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Treatment Session Completed
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Record patient-reported outcomes for {patient.name} ({patient.id})
                </p>
              </div>
              <span className="rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-xs font-mono font-bold">
                100% Completed
              </span>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              {/* Pain Score (0-10) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <label>Patient Reported Discomfort (0–10):</label>
                  <span
                    className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                      painScore <= 3
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : painScore <= 6
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
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
                  className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0: No pain</span>
                  <span>5: Moderate discomfort</span>
                  <span>10: Severe discomfort</span>
                </div>
              </div>

              {/* Comfort Score (0-10) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <label>Sleeve Fit & Treatment Comfort (0–10):</label>
                  <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
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
                  className="w-full accent-cyan-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0: Very uncomfortable</span>
                  <span>5: Neutral</span>
                  <span>10: Highly comfortable</span>
                </div>
              </div>

              {/* Optional Session Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Clinical Session Notes (Optional):
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Good tolerance, patient reported mild muscular activation in medial gastrocnemius."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Error Message if API fails */}
              {sessionMutation.isError && (
                <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>
                    Failed to submit session to backend. Please check network connection and try again.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={sessionMutation.isPending}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={sessionMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-6 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-md shadow-cyan-500/25 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {sessionMutation.isPending ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit & Commit Record</span>
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
