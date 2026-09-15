import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  HeartPulse,
  Brain,
  ArrowRight,
  Zap,
  TrendingDown,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Radio,
  Cpu,
  Eye,
  FileSpreadsheet,
  Play,
  RotateCcw,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'
import './LandingPage.css'

const NAV_LINKS = [
  { id: 'problem', label: 'Problem' },
  { id: 'concept', label: 'Concept' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'simulator-preview', label: 'Simulator' },
  { id: 'platform', label: 'Platform' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  // Interactive Mechanism State (Concept Section)
  const [activeMechanismTab, setActiveMechanismTab] = useState<'compression' | 'nmes' | 'synergy'>('synergy')

  // Interactive Data Engine Stage (How It Works Section)
  const [activeStageIdx, setActiveStageIdx] = useState(0)

  // Interactive P-004 Scrubber State (Intelligence Section)
  const [p004SelectedWeek, setP004SelectedWeek] = useState<1 | 3 | 6>(6)

  // Interactive AI Assistant Simulation State
  const [activeQuery, setActiveQuery] = useState('Summarize Robert Chen (P-004) risk factors')
  const [aiResponse, setAiResponse] = useState(
    'Patient Robert Chen (P-004) exhibits a 50.3% relative adherence decline over 14 days (down to 41.7%) concurrent with a reported pain increase from 3.0 to 7.5/10. Multi-factor pattern indicates protocol fatigue combined with localized swelling. Recommend clinician review of sleeve circumference sizing and target lower zone pressure adjustment from 45 mmHg to 35 mmHg.'
  )
  const [isTyping, setIsTyping] = useState(false)

  // Interactive Mini Session Simulator State
  const [simPhase, setSimPhase] = useState<'Inflation' | 'Hold' | 'Deflation' | 'NMES Pulse'>('Inflation')
  const [simPressure, setSimPressure] = useState(45)
  const [simRunning, setSimRunning] = useState(true)

  // Top navbar backdrop blur & active section scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      const sectionIds = ['problem', 'concept', 'how-it-works', 'intelligence', 'simulator-preview', 'platform']
      const scrollPos = window.scrollY + 180

      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            current = id
            break
          }
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Mini Simulator Timer Loop
  useEffect(() => {
    if (!simRunning) return
    const interval = setInterval(() => {
      setSimPhase((prev) => {
        if (prev === 'Inflation') {
          setSimPressure(45)
          return 'Hold'
        }
        if (prev === 'Hold') {
          setSimPressure(42)
          return 'Deflation'
        }
        if (prev === 'Deflation') {
          setSimPressure(10)
          return 'NMES Pulse'
        }
        setSimPressure(45)
        return 'Inflation'
      })
    }, 2400)
    return () => clearInterval(interval)
  }, [simRunning])

  const scrollToAnchor = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleAskAI = (promptText: string, customAnswer: string) => {
    setActiveQuery(promptText)
    setIsTyping(true)
    setTimeout(() => {
      setAiResponse(customAnswer)
      setIsTyping(false)
    }, 450)
  }

  // P-004 Scrubber Calculated Values
  const getP004Data = (week: 1 | 3 | 6) => {
    if (week === 1) {
      return { adherence: '92.0%', pain: '3.0 / 10', risk: 'LOW RISK', riskColor: 'emerald', missed: '0 in last 10 days', status: 'Stable Protocol Baseline' }
    }
    if (week === 3) {
      return { adherence: '68.5%', pain: '5.2 / 10', risk: 'MEDIUM RISK', riskColor: 'amber', missed: '2 in last 10 days', status: 'Early Protocol Tapering' }
    }
    return { adherence: '41.7%', pain: '7.5 / 10', risk: 'HIGH RISK', riskColor: 'rose', missed: '4 in last 10 days', status: 'Clinical Attention Warranted' }
  }

  const currentP004 = getP004Data(p004SelectedWeek)

  return (
    <div className="landing-dark-root selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      
      {/* Background Animated Cyber Grid & Glowing Orbs */}
      <div className="cyber-bg-grid" />
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="ambient-orb-3" />

      {/* =========================================================================
          1. TOP NAVIGATION (Uncluttered, Section Spy, Clean Platform CTA)
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#030712]/92 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-black/40 py-3'
            : 'bg-[#030712]/60 backdrop-blur-md border-b border-slate-800/40 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02] shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-400/40 transition-shadow">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Veno-Pump
              </span>
              <span className="text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wider uppercase hidden sm:block">
                Active Circulation &amp; AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToAnchor(link.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/15'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {link.label}
                </button>
              )
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-200 shrink-0"
            >
              <span>Open Platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/80 bg-[#08101e]/95 backdrop-blur-2xl px-4 pt-3 pb-5 mt-3 space-y-2">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollToAnchor(link.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/40 shadow-md"
              >
                <span>Open Platform</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Redesigned Bold Telemetry HUD & Prominent Sleeve Visual)
          ========================================================================= */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-36 lg:pb-28 overflow-hidden scroll-mt-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Hero Narrative */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 mb-6 shadow-sm w-fit animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>DUAL-MECHANISM RESTORATIVE CIRCULATION MONITOR</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                Healthier Legs.{' '}
                <span className="text-cyan-gradient block">
                  Brighter Tomorrows.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
                Targeted sequential pneumatic compression combined with calf neuromuscular electrical stimulation (NMES) and closed-loop IBM Granite AI clinical intelligence.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-xl shadow-cyan-500/25 transition-all duration-200 hover:scale-[1.02]"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToAnchor('simulator-preview')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-200"
                >
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Interactive Simulator</span>
                </button>
              </div>

              {/* Quick Feature Badges */}
              <div className="grid grid-cols-2 gap-3 mt-10 max-w-md pt-6 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Graduated 45/35/25 mmHg</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>35 Hz NMES Stimulation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>IBM Granite 3.3 AI Triage</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Longitudinal Adherence</span>
                </div>
              </div>
            </div>

            {/* Right Column: Redesigned Bold Cyber-Clinical Hero Visual Frame */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[620px] flex items-center justify-center p-4">
                
                {/* Cyber HUD Ambient Background */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-cyan-500/10 via-slate-900/40 to-blue-500/10 border border-cyan-500/20 backdrop-blur-sm" />
                <div className="absolute inset-4 rounded-2xl bg-[#08101e]/60 pointer-events-none" />

                {/* Dominant Primary Image: IMAGE 1 Realistic Calf Sleeve */}
                <img
                  src="/images/calf-sleeve-realistic.png"
                  alt="Proposed Veno-Pump Active Dual-Action Calf Sleeve"
                  className="h-full w-auto max-h-[560px] object-contain relative z-10 drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)] filter contrast-[1.08]"
                />

                {/* Upward Energy Beams along the Sleeve */}
                <div className="absolute inset-0 pointer-events-none flex justify-around px-12 overflow-hidden z-10">
                  <div className="energy-beam h-48 left-1/3" />
                  <div className="energy-beam h-56 left-1/2" style={{ animationDelay: '0.8s' }} />
                  <div className="energy-beam h-44 left-2/3" style={{ animationDelay: '1.4s' }} />
                </div>

                {/* Telemetry HUD Badge 1 (Graduated Sequential Compression) */}
                <div className="absolute top-6 left-2 sm:left-6 z-20 glass-panel px-4 py-3 rounded-2xl border border-cyan-500/40 shadow-2xl animate-float-badge">
                  <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="h-4 w-4 text-cyan-400" />
                    <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                      Graduated Compression
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-cyan-300">
                    45 / 35 / 25 <span className="text-xs font-medium text-slate-400">mmHg</span>
                  </div>
                  <div className="text-[9px] font-semibold text-cyan-400/80 uppercase tracking-widest mt-0.5">
                    ● Sequential Peristaltic
                  </div>
                </div>

                {/* Telemetry HUD Badge 2 (NMES Waveform) */}
                <div className="absolute bottom-6 right-2 sm:right-6 z-20 glass-panel px-4 py-3 rounded-2xl border border-blue-500/40 shadow-2xl animate-float-badge-delayed">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                      NMES Waveform
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-blue-300">
                    35 <span className="text-xs font-medium text-slate-400">Hz Biphasic</span>
                  </div>
                  <div className="text-[9px] font-semibold text-blue-400/80 uppercase tracking-widest mt-0.5">
                    ● Calf Pump Activation
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PROBLEM: CIRCULATION REALITY & PASSIVE LIMITATIONS
          ========================================================================= */}
      <section id="problem" className="py-20 border-t border-slate-800/80 bg-slate-950/40 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              THE CLINICAL REALITY
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              &ldquo;Every step depends on <span className="text-cyan-gradient">circulation.&rdquo;</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Chronic venous insufficiency affects millions, leading to progressive discomfort and functional limitation when left unmonitored.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Problem Card 1 */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                PAIN &amp; HEAVINESS
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Venous pooling in lower extremities causes chronic dull aching, throbbing sensations, and debilitating evening leg fatigue.
              </p>
            </div>

            {/* Problem Card 2 */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <TrendingDown className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                SWELLING &amp; DISCOMFORT
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Microvascular congestion leads to persistent peripheral edema, skin tension, and reduced range of motion in ankle joints.
              </p>
            </div>

            {/* Problem Card 3 */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                REDUCED QUALITY OF LIFE
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Conventional passive stockings suffer from high non-compliance, leaving clinicians blind to at-home treatment adherence and symptom progression.
              </p>
            </div>
          </div>

          {/* Direct Comparison: Passive vs Active Dual-Action */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/30 max-w-4xl mx-auto">
            <h4 className="text-sm font-bold text-white text-center mb-6 uppercase tracking-wider text-cyan-300">
              The Evolution of Circulation Therapy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                  CONVENTIONAL PASSIVE STOCKINGS
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span> High abandonment &amp; non-compliance rates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span> Static constant compression without active pumping
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span> Zero data visibility between clinic appointments
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 shadow-md shadow-cyan-500/10">
                <div className="text-xs font-bold text-cyan-300 uppercase mb-2">
                  VENO-PUMP ACTIVE DUAL-ACTION
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Sequential peristaltic pressure waves (45/35/25 mmHg)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>35 Hz NMES muscle pump activation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Continuous telemetry &amp; AI-assisted triage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. CONCEPT: DUAL-ACTION MECHANISM (New Close-Up Macro Product Visual)
          ========================================================================= */}
      <section id="concept" className="py-20 border-t border-slate-800/80 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              ACTIVE THERAPY INNOVATION
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              Meet <span className="text-cyan-gradient">Veno-Pump</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Dual-action mechanical and neuromuscular therapy designed for restorative at-home circulation.
            </p>
          </div>

          {/* Interactive Mechanism Switcher */}
          <div className="flex justify-center gap-2 mb-10">
            <button
              type="button"
              onClick={() => setActiveMechanismTab('synergy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMechanismTab === 'synergy'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Dual-Action Synergy
            </button>
            <button
              type="button"
              onClick={() => setActiveMechanismTab('compression')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMechanismTab === 'compression'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Graduated Compression (45/35/25)
            </button>
            <button
              type="button"
              onClick={() => setActiveMechanismTab('nmes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMechanismTab === 'nmes'
                  ? 'bg-blue-950 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              NMES Waveform (35 Hz)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Compression Details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border-cyan-500/30">
                <div className="flex items-center gap-2 text-cyan-400 mb-3">
                  <HeartPulse className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Mechanism 01
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  GRADUATED COMPRESSION
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Sequential 3-chamber peristaltic pressure (45 → 35 → 25 mmHg) supports upward deep venous return against gravity.
                </p>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Lower Zone (Ankle):</span>
                    <span className="text-cyan-300 font-bold">45 mmHg</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Mid Zone (Calf):</span>
                    <span className="text-cyan-300 font-bold">35 mmHg</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Upper Zone:</span>
                    <span className="text-cyan-300 font-bold">25 mmHg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Animated Dual-Mechanism Diagram */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-sm rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/10 bg-[#07111e] overflow-hidden p-6">
                {/* Animated Calf cross-section diagram */}
                <div className="relative flex items-center justify-center mb-4">
                  {/* Outer glow ring */}
                  <div className="absolute h-44 w-44 rounded-full border-2 border-cyan-500/20 animate-pulse" />
                  <div className="absolute h-32 w-32 rounded-full border border-cyan-500/30" />
                  {/* Central body shape */}
                  <div className="relative h-36 w-28 rounded-[40%] bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg">
                    {/* Compression zones */}
                    <div className="absolute bottom-2 left-0 right-0 h-9 rounded-b-[40%] bg-cyan-500/20 border-t border-cyan-500/40" />
                    <div className="absolute bottom-11 left-0 right-0 h-7 bg-cyan-500/12 border-t border-cyan-500/20" />
                    <div className="absolute bottom-[72px] left-0 right-0 h-5 bg-cyan-500/8 border-t border-cyan-500/10" />
                    {/* NMES electrode dots */}
                    <div className="absolute top-8 left-3 h-3 w-3 rounded-full bg-blue-400/70 animate-ping" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                    <div className="absolute top-8 right-3 h-3 w-3 rounded-full bg-blue-400/70 animate-ping" style={{ animationDelay: '1s', animationDuration: '2s' }} />
                    <div className="absolute top-16 left-2 h-2 w-2 rounded-full bg-blue-300/50 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
                    <div className="absolute top-16 right-2 h-2 w-2 rounded-full bg-blue-300/50 animate-ping" style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
                  </div>
                  {/* Pressure arrows */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <div className="text-cyan-400 text-[9px] font-bold leading-none">25</div>
                    <div className="text-cyan-400 text-[9px] font-bold leading-none">35</div>
                    <div className="text-cyan-400 text-[9px] font-bold leading-none">45</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[11px] text-cyan-200 font-semibold">Sequential Compression</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300">Active</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-[11px] text-blue-200 font-semibold">NMES Biphasic Pulse</span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-300">35 Hz</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-teal-950/60 border border-teal-500/30">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-teal-400" />
                      <span className="text-[11px] text-teal-200 font-semibold">AI Telemetry Sync</span>
                    </div>
                    <span className="text-[11px] font-mono text-teal-300">Live</span>
                  </div>
                </div>
                <div className="mt-4 text-center text-[10px] font-bold text-cyan-400/70 uppercase tracking-widest">
                  INTEGRATED MICRO-CHAMBER ARCHITECTURE
                </div>
              </div>
            </div>

            {/* Right Column: NMES Details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <Zap className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Mechanism 02
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  NMES STIMULATION
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Targeted 35 Hz biphasic electrical stimulation contracts the gastrocnemius muscles, activating the physiological calf muscle pump.
                </p>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="text-blue-300 font-bold">35 Hz</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Waveform:</span>
                    <span className="text-blue-300 font-bold">Symmetrical Biphasic</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Target Muscle:</span>
                    <span className="text-blue-300 font-bold">Gastrocnemius</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* =========================================================================
          5. TREATMENT BECOMES DATA (HOW IT WORKS)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-950/40 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              CLOSED-LOOP CLINICAL DATA PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              &ldquo;Treatment becomes <span className="text-cyan-gradient">data.&rdquo;</span>{' '}
              <span className="block sm:inline">&ldquo;Data becomes <span className="text-teal-gradient">insight.&rdquo;</span></span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Click any stage in the pipeline to examine how data flows from home sessions into clinical triage.
            </p>
          </div>

          {(() => {
            const pipelineStages = [
              { title: 'PROPOSED SLEEVE', desc: 'At-home dual-action therapy session', metric: '35 Hz / 45 mmHg', icon: HeartPulse, detail: 'Pneumatic bladders inflate sequentially while hydrogel electrodes emit biphasic pulses.' },
              { title: 'SESSION DATA', desc: 'Target pressure & cycle logging', metric: '20 min session', icon: Activity, detail: 'Pressure curves, duration, and cycle timestamps recorded securely.' },
              { title: 'ADHERENCE & OUTCOMES', desc: 'Protocol compliance tracking', metric: '6/7 days logged', icon: FileSpreadsheet, detail: 'Multi-week adherence rate correlated with patient-reported swelling & pain scores.' },
              { title: 'RISK ENGINE', desc: 'Multi-factor drift algorithms', metric: 'Early divergence', icon: AlertTriangle, detail: 'Flags early protocol abandonment or symptom escalation before clinical decline.' },
              { title: 'IBM GRANITE AI', desc: 'Structured clinical intelligence', metric: 'Decision support', icon: Brain, detail: 'IBM Granite 3.3 synthesizes telemetry into concise clinician briefs and triage actions.' },
            ]

            const activeStage = pipelineStages[activeStageIdx]

            return (
              <div>
                {/* 5 Stage Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  {pipelineStages.map((stage, idx) => {
                    const isSelected = activeStageIdx === idx
                    const Icon = stage.icon
                    return (
                      <div
                        key={stage.title}
                        onClick={() => setActiveStageIdx(idx)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/90 border-cyan-400 shadow-xl shadow-cyan-500/25 scale-[1.03] z-10'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">0{idx + 1}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1">
                            {stage.title}
                          </h3>
                          <p className="text-xs text-slate-300">
                            {stage.desc}
                          </p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-cyan-300 font-semibold flex items-center justify-between">
                          <span>{stage.metric}</span>
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Active Stage Callout Box */}
                <div className="glass-panel p-6 rounded-2xl border-cyan-500/40 max-w-2xl mx-auto text-center">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                    ACTIVE PIPELINE TELEMETRY · STAGE 0{activeStageIdx + 1}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">
                    {activeStage.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeStage.detail}
                  </p>
                </div>
              </div>
            )
          })()}

        </div>
      </section>

      {/* =========================================================================
          6. INTELLIGENCE (Interactive P-004 Scrubber + Live AI Sandbox)
          ========================================================================= */}
      <section id="intelligence" className="py-20 border-t border-slate-800/80 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              SYNTHETIC DEMONSTRATION SCENARIO &amp; AI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              &ldquo;When the <span className="text-cyan-gradient">data changes.&rdquo;</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Explore longitudinal adherence drift in Robert Chen (P-004) and interactive IBM Granite AI decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
            
            {/* Patient Dossier Card (Left) */}
            <div className="lg:col-span-4">
              <div className="glass-panel p-6 rounded-2xl border-slate-700/60">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      PATIENT DOSSIER
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Robert Chen
                    </h3>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 font-mono text-xs font-bold border border-slate-700">
                    P-004
                  </div>
                </div>

                <div className="py-4 text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diagnosis:</span>
                    <span className="font-semibold text-slate-200">Chronic Venous Insufficiency</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prescription:</span>
                    <span className="font-semibold text-slate-200">Dual-Action Daily Protocol</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Phase:</span>
                    <span className={`font-semibold ${currentP004.riskColor === 'rose' ? 'text-rose-400' : currentP004.riskColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {currentP004.status}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Link
                    to="/patients/P-004"
                    className="inline-flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 transition-colors"
                  >
                    <span>View Full Patient Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Interactive Timeline & Morphing Trend Scrubber (Right) */}
            <div className="lg:col-span-8">
              <div className="glass-panel p-6 rounded-2xl border-cyan-500/30">
                
                {/* Week Selector Chips */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    Select Longitudinal Timeline:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setP004SelectedWeek(1)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        p004SelectedWeek === 1
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Week 1 (Baseline)
                    </button>
                    <button
                      type="button"
                      onClick={() => setP004SelectedWeek(3)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        p004SelectedWeek === 3
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Week 3 (Drift)
                    </button>
                    <button
                      type="button"
                      onClick={() => setP004SelectedWeek(6)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        p004SelectedWeek === 6
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Week 6 (Spike)
                    </button>
                  </div>
                </div>

                {/* 3 Metric Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Adherence Rate</span>
                      <TrendingDown className={`h-4 w-4 ${p004SelectedWeek > 1 ? 'text-rose-400' : 'text-emerald-400'}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      {currentP004.adherence}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {currentP004.missed}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Reported Pain</span>
                      <TrendingUp className={`h-4 w-4 ${p004SelectedWeek > 1 ? 'text-rose-400' : 'text-emerald-400'}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      {currentP004.pain}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Visual analog scale (VAS)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                    <div className="text-xs text-slate-400 mb-1">
                      Risk Evaluation
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider uppercase border ${
                        currentP004.riskColor === 'emerald'
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                          : currentP004.riskColor === 'amber'
                          ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                          : 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${currentP004.riskColor === 'rose' ? 'bg-rose-400 animate-ping' : currentP004.riskColor === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        {currentP004.risk}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Multi-factor heuristic
                    </div>
                  </div>

                </div>

                {/* SVG Chart */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Adherence &amp; Pain Trend Over Time</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Selected: Week {p004SelectedWeek}
                    </span>
                  </div>

                  <div className="w-full h-28 relative">
                    <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <line x1="0" y1="25" x2="500" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeDasharray="3 3" />

                      {/* Adherence Curve */}
                      <path
                        d={
                          p004SelectedWeek === 1
                            ? 'M 0,20 Q 150,22 250,24 T 500,25'
                            : p004SelectedWeek === 3
                            ? 'M 0,20 Q 150,25 250,50 T 500,55'
                            : 'M 0,20 Q 150,25 250,55 T 500,85'
                        }
                        fill="none"
                        stroke={p004SelectedWeek === 1 ? '#10b981' : p004SelectedWeek === 3 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Pain Bars */}
                      <rect x="40" y="65" width="20" height="25" rx="3" fill="#0284c7" opacity="0.7" />
                      <rect x="130" y="60" width="20" height="30" rx="3" fill="#0284c7" opacity="0.7" />
                      <rect x="220" y={p004SelectedWeek >= 3 ? "45" : "60"} width="20" height={p004SelectedWeek >= 3 ? "45" : "30"} rx="3" fill={p004SelectedWeek >= 3 ? "#f59e0b" : "#0284c7"} opacity="0.8" />
                      <rect x="310" y={p004SelectedWeek === 6 ? "30" : "55"} width="20" height={p004SelectedWeek === 6 ? "60" : "35"} rx="3" fill={p004SelectedWeek === 6 ? "#ef4444" : "#f59e0b"} opacity="0.85" />
                      <rect x="400" y={p004SelectedWeek === 6 ? "15" : "50"} width="20" height={p004SelectedWeek === 6 ? "75" : "40"} rx="3" fill={p004SelectedWeek === 6 ? "#ef4444" : "#f59e0b"} opacity="0.9" />
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>Wk 1</span>
                    <span>Wk 2</span>
                    <span>Wk 3</span>
                    <span>Wk 4</span>
                    <span>Wk 5</span>
                    <span>Wk 6</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Interactive AI Assistant Demonstration Sandbox */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/40 shadow-2xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    IBM Granite 3.3 Clinical Decision Support
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    ibm/granite-13b-instruct-v2 · Interactive Query Preview
                  </div>
                </div>
              </div>
              <Link
                to="/assistant"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                <span>Full AI Assistant</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Quick Question Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() =>
                  handleAskAI(
                    'Summarize Robert Chen (P-004) risk factors',
                    'Patient Robert Chen (P-004) exhibits a 50.3% relative adherence decline over 14 days (down to 41.7%) concurrent with a reported pain increase from 3.0 to 7.5/10. Multi-factor pattern indicates protocol fatigue combined with localized swelling. Recommend clinician review of sleeve circumference sizing and target lower zone pressure adjustment from 45 mmHg to 35 mmHg.'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left"
              >
                Summarize P-004 Risk Factors
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAskAI(
                    'Explain adherence vs discomfort correlation in cohort',
                    'Analysis of 8 synthetic cohort records reveals a strong inverse correlation (r = -0.78) between missed sessions and pain escalation. Patients who miss >3 consecutive sessions show an average 2.8-point increase in VAS pain within 7 days.'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left"
              >
                Adherence vs Discomfort Correlation
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAskAI(
                    'Which patients require attention this week?',
                    '5 cohort patients currently warrant clinical attention: P-002, P-004, P-006, P-007, and P-008. P-004 (Robert Chen) presents the steepest adherence decline and should be prioritized for follow-up.'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left"
              >
                Cohort Triage Summary
              </button>
            </div>

            {/* AI Output Window */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span>Query: &ldquo;{activeQuery}&rdquo;</span>
              </div>

              {isTyping ? (
                <div className="flex items-center gap-2 text-xs text-cyan-300 py-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>IBM Granite synthesizing clinical summary...</span>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {aiResponse}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span>Interactive demonstration query</span>
              <span className="text-cyan-400 font-medium">
                AI decision support only · Not a diagnosis or prescription
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. SIMULATOR: TREATMENT SESSION SIMULATOR PREVIEW (New Dock Preview Image)
          ========================================================================= */}
      <section id="simulator-preview" className="py-20 border-t border-slate-800/80 bg-slate-950/40 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              DEVICE SIMULATION ENGINE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              Experience the <span className="text-cyan-gradient">Dual-Action Simulator</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Test sequential compression inflation cycles and NMES pulse patterns directly in the browser.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/30 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Simulator Controls & Status (Left) */}
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    SIMULATION STATUS
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    LIVE PHYSICS
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Current Active Phase</div>
                  <div className="text-2xl font-extrabold text-cyan-300">
                    {simPhase}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {simPhase === 'Inflation' && 'Sequential peristaltic bladders pressurizing'}
                    {simPhase === 'Hold' && 'Sustained peak graduated venous support'}
                    {simPhase === 'Deflation' && 'Pneumatic exhaust venting to rest'}
                    {simPhase === 'NMES Pulse' && '35 Hz biphasic muscle contraction active'}
                  </div>
                </div>

                {/* Pressure Gauge Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Pneumatic Pressure</span>
                    <span className="text-cyan-300 font-mono font-bold">{simPressure} mmHg</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${(simPressure / 50) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Play / Pause Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSimRunning((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    {simRunning ? <RotateCcw className="h-3.5 w-3.5 text-cyan-400" /> : <Play className="h-3.5 w-3.5 text-cyan-400" />}
                    <span>{simRunning ? 'Pause Engine' : 'Resume Engine'}</span>
                  </button>
                </div>
              </div>

              {/* Animated Therapy Visualization Panel (Right) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center gap-4 p-5 bg-[#07111e] rounded-2xl border border-cyan-500/30">
                {/* Live Phase Indicator Orb */}
                <div className="relative flex items-center justify-center">
                  <div className={`absolute h-28 w-28 rounded-full blur-2xl transition-colors duration-700 ${
                    simPhase === 'Inflation' ? 'bg-cyan-500/30' :
                    simPhase === 'Hold' ? 'bg-blue-500/30' :
                    simPhase === 'Deflation' ? 'bg-slate-500/20' :
                    'bg-blue-400/40'
                  }`} />
                  <div className={`relative h-20 w-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    simPhase === 'Inflation' ? 'border-cyan-400/70 bg-cyan-950/80' :
                    simPhase === 'Hold' ? 'border-blue-400/70 bg-blue-950/80' :
                    simPhase === 'Deflation' ? 'border-slate-500/50 bg-slate-900/80' :
                    'border-blue-300/70 bg-blue-950/80'
                  }`}>
                    {simPhase === 'Inflation' && <HeartPulse className="h-8 w-8 text-cyan-300" />}
                    {simPhase === 'Hold' && <Activity className="h-8 w-8 text-blue-300" />}
                    {simPhase === 'Deflation' && <TrendingDown className="h-8 w-8 text-slate-300" />}
                    {simPhase === 'NMES Pulse' && <Zap className="h-8 w-8 text-blue-200 animate-pulse" />}
                  </div>
                </div>

                {/* 4 Phase Cycle Indicators */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {(['Inflation', 'Hold', 'Deflation', 'NMES Pulse'] as const).map((phase) => (
                    <div
                      key={phase}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-300 ${
                        simPhase === phase
                          ? 'bg-cyan-950/80 border-cyan-400/60 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900/60 border-slate-800 opacity-50'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${
                        simPhase === phase ? 'text-cyan-300' : 'text-slate-400'
                      }`}>{phase}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-1 text-center w-full">
                  <Link
                    to="/patients/P-004/session"
                    className="inline-flex items-center justify-center w-full gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-lg shadow-cyan-500/20"
                  >
                    <span>Launch Full Treatment Simulator</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          8. PLATFORM: CAPABILITIES & ROADMAP
          ========================================================================= */}
      <section id="platform" className="py-20 border-t border-slate-800/80 scroll-mt-24 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
              CLINICAL PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mt-2">
              Complete Clinical <span className="text-cyan-gradient">Visibility</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4">
              Four core capabilities built for vascular clinicians and remote patient monitoring teams.
            </p>
          </div>

          {/* 4 Core Platform Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            
            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                PATIENT MONITORING
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Longitudinal cohort tracking with real-time sync of at-home device sessions, completed cycles, and timestamps.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                ADHERENCE &amp; OUTCOMES
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Continuous correlation of device usage rates against patient-reported swelling, heaviness, and pain indices.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                RISK DETECTION
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multi-factor risk scoring flags patients exhibiting early protocol tapering before clinical deterioration occurs.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 glass-card-hover">
              <div className="h-10 w-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                AI CLINICAL INTEL
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                IBM Granite 3.3 automated clinical summaries and conversational queries for instant cohort triage.
              </p>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-xl shadow-cyan-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              <span>OPEN CLINICAL PLATFORM</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/patients/P-004/session"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>EXPLORE FULL SIMULATOR</span>
            </Link>
          </div>

          {/* Future Vision / Roadmap (Today vs Future) */}
          <div className="glass-panel p-8 rounded-3xl border-slate-800 mb-16">
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                ROADMAP &amp; SYSTEM EVOLUTION
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                From Prototype to Physical Hardware
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase mb-2">
                  <Cpu className="h-4 w-4" />
                  <span>TODAY (CURRENT BUILD)</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Full-stack clinician web platform</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Synthetic patient cohort &amp; session simulator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>IBM Granite 3.3 clinical decision support</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase mb-2">
                  <Radio className="h-4 w-4" />
                  <span>FUTURE (HARDWARE PHASE)</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Connected physical sleeve with micro-pumps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>ESP32 &amp; BLE real-time telemetry streaming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Multi-center clinical validation trials</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final Cinematic Statement & CTA */}
          <div className="text-center py-12">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Better visibility.{' '}
              <span className="text-cyan-gradient block sm:inline">
                Smarter decisions.
              </span>{' '}
              <span className="text-teal-gradient block sm:inline">
                A more connected future.
              </span>
            </h3>

            <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
              Experience the active circulation therapy and clinical intelligence platform.
            </p>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-200"
            >
              <span>OPEN PLATFORM</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Footer & Compliance Notice */}
          <footer className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">Veno-Pump Clinical Monitor</span>
            </div>
            <div className="text-center sm:text-right text-[11px] text-slate-400">
              Synthetic Demonstration Scenario · AI Decision Support Only · Not a Medical Device
            </div>
          </footer>

        </div>
      </section>
    </div>
  )
}
