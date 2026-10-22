import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import clipboardIcon from '../../assets/nav-clipboard.svg'
import compassIcon from '../../assets/nav-compass.svg'

type MobileNavItemProps = {
  to: string
  end?: boolean
  icon?: string
  children: ReactNode
}

function MobileNavItem({
  to,
  end,
  icon,
  children,
}: MobileNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1',
          'text-center text-[10px] font-medium transition',
          isActive
            ? 'text-[#175c45]'
            : 'text-[#68736c] hover:text-[#17211d]',
        ].join(' ')
      }
    >
      {icon ? <img src={icon} alt="" width="17" height="17" /> : <span className="text-base leading-[17px]" aria-hidden="true">＋</span>}
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[68px] items-center justify-between border-t border-[#dde3de] bg-white px-[18px] py-2.5 lg:hidden"
    >
      <MobileNavItem to="/" end icon={compassIcon}>
        Browse
      </MobileNavItem>

      <MobileNavItem to="/suppliers" icon={clipboardIcon}>
        Suppliers
      </MobileNavItem>

      <MobileNavItem to="/errands/new">
        Create errand
      </MobileNavItem>
    </nav>
  )
}
