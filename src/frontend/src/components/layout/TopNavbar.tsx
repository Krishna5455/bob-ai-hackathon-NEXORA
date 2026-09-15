import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Activity,
  LayoutDashboard,
  Users,
  Brain,
  Sparkles,
  Radio,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/assistant', label: 'AI Assistant', icon: Brain },
]

export function TopNavbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#08101e]/85 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
              title="Return to Veno-Pump Story & Overview"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition-shadow">
                <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    Veno-Pump
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 -mt-0.5">
                  Clinical Monitor
                </span>
              </div>
            </Link>

            {/* Subtle Clinician View Architecture Badge */}
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-[9px] font-bold tracking-wider text-cyan-300 uppercase">
                Clinician View
              </span>
            </div>
          </div>

          {/* Center / Left Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 ml-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={clsx(
                    'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                    )}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe]" />
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-medium">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Synthetic Demo</span>
            </div>

            {/* Quick Action Button */}
            <Link
              to="/assistant"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800 transition-all shadow-sm shadow-cyan-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Ask AI</span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#08101e] px-4 pt-3 pb-5 space-y-3 animate-cs-fade-in">
          {/* Clinician Badge in Mobile */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Active Environment
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-[9px] font-bold tracking-wider text-cyan-300 uppercase">
              Clinician View
            </span>
          </div>

          <div className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                to === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Back to Story</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 px-1">
            <Radio className="h-3 w-3 text-cyan-400 shrink-0" />
            <span>Synthetic cohort data · Decision support only</span>
          </div>
        </div>
      )}
    </header>
  )
}
