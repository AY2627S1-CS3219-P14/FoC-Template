import { useState } from 'react'
import { SupplierCard } from '../components/ui/SupplierCard'
import { mockSuppliers } from '../features/suppliers/supplier.mock'

export function SuppliersPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)

  return (
    <section>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        Choose a supplier
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Select the supplier for your campus errand.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {mockSuppliers.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            isSelected={selectedSupplierId === supplier.id}
            onSelect={() => setSelectedSupplierId(supplier.id)}
          />
        ))}
      </div>
    </section>
  )
}
