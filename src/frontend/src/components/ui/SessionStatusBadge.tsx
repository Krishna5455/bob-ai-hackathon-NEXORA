import { clsx } from 'clsx'
import type { SessionStatus } from '@/types/api'

const styles: Record<SessionStatus, string> = {
  completed: 'bg-green-50 text-green-700 ring-green-200',
  missed: 'bg-red-50 text-red-700 ring-red-200',
  incomplete: 'bg-amber-50 text-amber-700 ring-amber-200',
}

const labels: Record<SessionStatus, string> = {
  completed: 'Completed',
  missed: 'Missed',
  incomplete: 'Incomplete',
}

interface Props {
  status: SessionStatus
}

export function SessionStatusBadge({ status }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}
