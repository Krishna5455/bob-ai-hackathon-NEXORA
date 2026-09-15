import React from 'react'
import { clsx } from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'warning' | 'danger' | 'success' | 'cyan'
  icon?: React.ReactNode
  className?: string
}

const accentMap = {
  default: 'border-slate-800/80 bg-[#0a1324]/80 text-white hover:border-cyan-500/40 hover:shadow-cyan-500/10',
  cyan: 'border-cyan-500/30 bg-[#081c30]/80 text-cyan-300 shadow-sm shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-cyan-500/20',
  warning: 'border-amber-500/30 bg-amber-950/40 text-amber-200 hover:border-amber-400/50 hover:shadow-amber-500/10',
  danger: 'border-rose-500/40 bg-rose-950/40 text-rose-200 shadow-sm shadow-rose-950 hover:border-rose-400/60 hover:shadow-rose-500/15',
  success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200 hover:border-emerald-400/50 hover:shadow-emerald-500/10',
}

export function StatCard({ label, value, sub, accent = 'default', icon, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cs-card',
        accentMap[accent],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-extrabold font-mono tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
