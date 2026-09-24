import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

type SidebarNavItemProps = {
  to: string
  end?: boolean
  children: ReactNode
}

function SidebarNavItem({
  to,
  end,
  children,
}: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'block rounded-lg px-4 py-3',
          'text-sm font-medium',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-76px)] border-r border-slate-200 bg-white p-5 lg:block">
      <nav
        aria-label="Primary navigation"
        className="space-y-1"
      >
        <SidebarNavItem to="/" end>
          Dashboard
        </SidebarNavItem>

        <SidebarNavItem to="/suppliers">
          Choose a supplier
        </SidebarNavItem>
      </nav>
    </aside>
  )
}