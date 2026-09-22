import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

type MobileNavItemProps = {
  to: string
  end?: boolean
  children: ReactNode
}

function MobileNavItem({
  to,
  end,
  children,
}: MobileNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex-1 rounded-lg px-3 py-2',
          'text-center text-sm font-medium',
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

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t border-slate-200 bg-white p-3 lg:hidden"
    >
      <MobileNavItem to="/" end>
        Dashboard
      </MobileNavItem>

      <MobileNavItem to="/suppliers">
        Suppliers
      </MobileNavItem>
    </nav>
  )
}