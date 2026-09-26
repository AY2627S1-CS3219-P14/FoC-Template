import { useState } from 'react'
import { SearchInput } from '../components/ui/SearchInput'
import { SupplierCard } from '../components/ui/SupplierCard'
import { mockSuppliers } from '../features/suppliers/supplier.mock'

function normaliseSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const normalisedSearchTerm = normaliseSearchValue(searchTerm)
  const filteredSuppliers = mockSuppliers.filter((supplier) =>
    normaliseSearchValue(supplier.name).includes(normalisedSearchTerm),
  )

  return (
    <section>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        Choose a supplier
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Select the supplier for your campus errand.
      </p>

      <SearchInput
        label="Search suppliers by name"
        placeholder="Search suppliers by name"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        autoComplete="off"
        className="mt-6 max-w-xl"
      />

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'} found
      </p>

      {filteredSuppliers.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              isSelected={selectedSupplierId === supplier.id}
              onSelect={() => setSelectedSupplierId(supplier.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No suppliers found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try checking the spelling or using a different supplier name.
          </p>
        </div>
      )}
    </section>
  )
}
