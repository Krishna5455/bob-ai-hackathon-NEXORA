import { clsx } from 'clsx'
import type { RiskLevel } from '@/types/api'

const styles: Record<RiskLevel, string> = {
  low: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950',
  medium: 'bg-amber-950/60 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950',
  high: 'bg-rose-950/60 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-950',
}

const labels: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
}

interface Props {
  level: RiskLevel
  compact?: boolean
}

export function RiskBadge({ level, compact = false }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        styles[level],
      )}
    >
      <span
        className={clsx('mr-1.5 h-1.5 w-1.5 rounded-full', {
          'bg-emerald-400': level === 'low',
          'bg-amber-400': level === 'medium',
          'bg-rose-400 animate-pulse': level === 'high',
        })}
      />
      {compact ? level.charAt(0).toUpperCase() + level.slice(1) : labels[level]}
    </span>
  )
}
