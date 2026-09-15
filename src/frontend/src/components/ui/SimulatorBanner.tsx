import { AlertTriangle } from 'lucide-react'

/** Persistent banner shown whenever simulated device data is displayed. */
export function SimulatorBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-xs text-amber-200 backdrop-blur-md shadow-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
      <span>
        <strong>Simulated data only.</strong> This session does not represent a real physical device
        or validated clinical treatment. All telemetry values are synthetic and for software demonstration
        purposes only.
      </span>
    </div>
  )
}
