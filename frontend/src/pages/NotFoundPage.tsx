import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div>
        <p className="text-sm font-medium text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Page not found</h1>
        <Link
          to="/suppliers"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Back to suppliers
        </Link>
      </div>
    </main>
  )
}
