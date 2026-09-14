import { clsx } from 'clsx'
import type { RiskLevel } from '@/types/api'

const styles: Record<RiskLevel, string> = {
  low: 'bg-green-50 text-green-700 ring-green-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
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
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        styles[level],
      )}
    >
      {compact ? level.charAt(0).toUpperCase() + level.slice(1) : labels[level]}
    </span>
  )
}
