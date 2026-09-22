import { Outlet } from 'react-router'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppHeader />
      <div className="lg:grid lg:grid-cols-[236px_1fr]">
        <Sidebar />
        <main className="min-w-0 px-4 py-6 pb-24 lg:px-9 lg:py-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
