import { useEffect, useState } from 'react'
import { SearchInput } from '../components/ui/SearchInput'
import { SupplierCard } from '../components/ui/SupplierCard'
import { listSuppliers } from '../features/suppliers/supplier.api'
import type { SupplierListResponse } from '../features/suppliers/supplier.types'

const SEARCH_DEBOUNCE_MS = 300
const SUPPLIERS_PER_PAGE = 20

export function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [supplierResponse, setSupplierResponse] = useState<SupplierListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearchTerm = searchTerm.trim()

      if (nextSearchTerm === debouncedSearchTerm) return

      setIsLoading(true)
      setErrorMessage(null)
      setDebouncedSearchTerm(nextSearchTerm)
      setPageNumber(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [debouncedSearchTerm, searchTerm])

  useEffect(() => {
    const controller = new AbortController()

    listSuppliers(
      {
        query: debouncedSearchTerm || undefined,
        page: pageNumber,
        size: SUPPLIERS_PER_PAGE,
        sort: 'name,asc',
      },
      controller.signal,
    )
      .then(setSupplierResponse)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load suppliers.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearchTerm, pageNumber, retryCount])

  const suppliers = supplierResponse?.items ?? []
  const page = supplierResponse?.page

  function requestPage(nextPageNumber: number) {
    setIsLoading(true)
    setErrorMessage(null)
    setPageNumber(nextPageNumber)
  }

  function retryRequest() {
    setIsLoading(true)
    setErrorMessage(null)
    setRetryCount((count) => count + 1)
  }

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
        {isLoading
          ? 'Loading suppliers…'
          : `${page?.totalElements ?? 0} ${page?.totalElements === 1 ? 'supplier' : 'suppliers'} found`}
      </p>

      {errorMessage ? (
        <div
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-red-900">Could not load suppliers</h2>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={retryRequest}
            className="mt-5 cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      ) : isLoading && !supplierResponse ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
          Loading suppliers…
        </div>
      ) : suppliers.length > 0 ? (
        <>
          <div className={`mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 ${isLoading ? 'opacity-60' : ''}`}>
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                isSelected={selectedSupplierId === supplier.id}
                onSelect={() => setSelectedSupplierId(supplier.id)}
              />
            ))}
          </div>

          {page && page.totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Supplier pages">
              <button
                type="button"
                disabled={!page.hasPrevious || isLoading}
                onClick={() => requestPage(Math.max(0, page.number - 1))}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page.number + 1} of {page.totalPages}
              </span>
              <button
                type="button"
                disabled={!page.hasNext || isLoading}
                onClick={() => requestPage(page.number + 1)}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          ) : null}
        </>
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
