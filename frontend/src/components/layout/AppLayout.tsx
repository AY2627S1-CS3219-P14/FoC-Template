import { Outlet } from 'react-router'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#17211d]">
      <AppHeader />
      <div className="lg:grid lg:grid-cols-[236px_1fr]">
        <Sidebar />
        <main className="min-w-0 px-4 py-5 pb-24 sm:px-6 lg:px-9 lg:py-[34px] lg:pb-12">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
