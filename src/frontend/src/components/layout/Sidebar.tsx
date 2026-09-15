import { NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Sparkles,
  Activity,
  Radio,
} from 'lucide-react'

const primaryNavItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/assistant', label: 'AI Assistant', icon: HeartPulse },
]

const experienceNavItems = [
  { to: '/', label: 'Story & Overview', icon: Sparkles },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#08101e]/90 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
          <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">Veno-Pump</span>
            <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              Platform
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Clinical Monitor</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {/* Main Platform Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform
          </p>
          <nav className="mt-2 space-y-1">
            {primaryNavItems.map(({ to, label, icon: Icon }) => {
              const active =
                to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={clsx(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                    active
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Experience / Story Section */}
        <div className="space-y-1 pt-2 border-t border-slate-800/60">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Experience
          </p>
          <nav className="mt-2 space-y-1">
            {experienceNavItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={clsx(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                    active
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-cyan-400' : 'text-cyan-400/70 group-hover:text-cyan-300',
                    )}
                  />
                  <span>{label}</span>
                  <span className="ml-auto text-[10px] font-mono text-cyan-400/60">Story</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="border-t border-slate-800/80 bg-[#060c18] p-4">
        <div className="flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed">
          <Radio className="h-3.5 w-3.5 text-cyan-500 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-semibold text-slate-300">Prototype Clinical Monitor</p>
            <p className="text-[9px] text-slate-400">
              Synthetic demo data • Decision support only
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
