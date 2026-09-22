import { Link } from 'react-router'

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:h-[76px] lg:px-8">
      <Link to="/suppliers" className="text-lg font-semibold text-slate-950">
        Campus Couriers
      </Link>

      <div className="flex items-center gap-3 text-sm text-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-2">24 credits</span>
        <button
          type="button"
          className="size-9 rounded-full bg-slate-200"
          aria-label="Open profile"
        />
      </div>
    </header>
  )
}
