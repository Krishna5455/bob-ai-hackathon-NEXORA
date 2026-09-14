import { clsx } from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'warning' | 'danger' | 'success'
  icon?: React.ReactNode
}

const accentMap = {
  default: 'bg-white border-slate-200',
  warning: 'bg-amber-50 border-amber-200',
  danger: 'bg-red-50 border-red-200',
  success: 'bg-green-50 border-green-200',
}

export function StatCard({ label, value, sub, accent = 'default', icon }: StatCardProps) {
  return (
    <div className={clsx('rounded-xl border p-5 shadow-sm', accentMap[accent])}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}
