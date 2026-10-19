import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import clipboardIcon from '../../assets/nav-clipboard.svg'
import compassIcon from '../../assets/nav-compass.svg'

type SidebarNavItemProps = {
  to: string
  end?: boolean
  icon: string
  children: ReactNode
}

function SidebarNavItem({
  to,
  end,
  icon,
  children,
}: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex h-11 items-center gap-3 rounded-xl px-3.5',
          'text-sm font-medium transition',
          isActive
            ? 'bg-[#ddf3e7] text-[#175c45]'
            : 'text-[#68736c] hover:bg-[#f5f7f4] hover:text-[#17211d]',
        ].join(' ')
      }
    >
      <img src={icon} alt="" width="19" height="19" />
      {children}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-76px)] border-r border-[#dde3de] bg-white px-5 py-7 lg:block">
      <nav
        aria-label="Primary navigation"
        className="space-y-2"
      >
        <SidebarNavItem to="/" end icon={compassIcon}>
          Browse errands
        </SidebarNavItem>

        <SidebarNavItem to="/suppliers" icon={clipboardIcon}>
          Suppliers
        </SidebarNavItem>
      </nav>

      <div className="mt-7 rounded-[18px] bg-[#0d3c2d] p-4 text-white">
        <p className="text-sm leading-5">Need something picked up on campus?</p>
        <NavLink
          to="/errands/new"
          className="mt-3 block rounded-lg bg-[#d8f06b] px-3 py-2.5 text-center text-sm font-semibold text-[#0d3c2d] transition hover:bg-[#cce85b]"
        >
          ＋ Create errand
        </NavLink>
      </div>
    </aside>
  )
}
