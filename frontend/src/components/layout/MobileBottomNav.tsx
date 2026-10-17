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
          'flex-1 rounded-xl px-3 py-2.5',
          'text-center text-xs font-semibold transition',
          isActive
            ? 'bg-[#ddf3e7] text-[#175c45]'
            : 'text-[#68736c] hover:bg-[#f5f7f4]',
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
      className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t border-[#dde3de] bg-white/95 p-3 backdrop-blur lg:hidden"
    >
      <MobileNavItem to="/" end>
        Dashboard
      </MobileNavItem>

      <MobileNavItem to="/suppliers">
        Suppliers
      </MobileNavItem>

      <MobileNavItem to="/errands/new">
        Create
      </MobileNavItem>
    </nav>
  )
}
