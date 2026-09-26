import type { Supplier } from '../../features/suppliers/supplier.types'

type SupplierCardProps = {
  supplier: Supplier
  onSelect: (supplier: Supplier) => void
  isSelected?: boolean
}

export function SupplierCard({ supplier, onSelect, isSelected = false }: SupplierCardProps) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isSelected ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'
      }`}
    >
      {supplier.imageUrl ? (
        <img
          src={supplier.imageUrl}
          alt={`${supplier.name} storefront`}
          loading="lazy"
          decoding="async"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-44 items-center justify-center bg-slate-100 text-4xl font-semibold text-slate-400"
          aria-label={`No image available for ${supplier.name}`}
        >
          {supplier.name.charAt(0)}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {supplier.category}
        </span>

        <h2 className="mt-3 text-lg font-semibold text-slate-950">{supplier.name}</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">{supplier.building}</p>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
          {supplier.description || 'No description is available for this supplier yet.'}
        </p>

        <button
          type="button"
          onClick={() => onSelect(supplier)}
          className={`mt-5 w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold transition bg-emerald-700 text-white hover:bg-emerald-800`}
        >
          Create Errand
        </button>
      </div>
    </article>
  )
}
