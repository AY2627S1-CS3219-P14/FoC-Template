import { NavLink } from 'react-router'

export function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-76px)] border-r border-slate-200 bg-white p-5 lg:block">
      <nav aria-label="Primary navigation">
        <NavLink
          to="/suppliers"
          className={({ isActive }) =>
            `block rounded-lg px-4 py-3 text-sm font-medium ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`
          }
        >
          Choose a supplier
        </NavLink>
      </nav>
    </aside>
  )
}
