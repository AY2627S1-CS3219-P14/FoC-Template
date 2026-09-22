import type { Supplier } from '../../features/suppliers/supplier.types'

type SupplierCardProps = {
  supplier: Supplier
  onSelect: (supplier: Supplier) => void
}

export function SupplierCard({ supplier, onSelect }: SupplierCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {supplier.imageUrl ? (
        <img src={supplier.imageUrl} alt="" className="h-44 w-full object-cover" />
      ) : null}
      <div className="p-4">
        <h2 className="font-semibold text-slate-950">{supplier.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{supplier.description}</p>
        <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
          {supplier.category}
        </span>
        <button
          type="button"
          onClick={() => onSelect(supplier)}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Select supplier
        </button>
      </div>
    </article>
  )
}
