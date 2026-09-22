import { NavLink } from 'react-router'

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3 lg:hidden"
    >
      <NavLink
        to="/suppliers"
        className="mx-auto block w-fit rounded-lg px-4 py-2 text-sm font-medium text-slate-900"
      >
        Suppliers
      </NavLink>
    </nav>
  )
}
