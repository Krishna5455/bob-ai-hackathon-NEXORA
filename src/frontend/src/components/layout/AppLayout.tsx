import { Outlet } from 'react-router-dom'
import { TopNavbar } from './TopNavbar'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050911] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <TopNavbar />
      <main className="flex-1 overflow-x-hidden bg-gradient-to-b from-[#060c18] via-[#050911] to-[#040810]">
        <Outlet />
      </main>
    </div>
  )
}
