import { useEffect, useState } from 'react'
import { ActiveErrandsPanel } from '../components/errands/ActiveErrandsPanel'
import { ErrandCard } from '../components/errands/ErrandCard'
import { ErrandFilters } from '../components/errands/ErrandFilters'
import {
  loadOpenErrandDashboard,
  type OpenErrandDashboardData,
} from '../features/errands/errand.dashboard'
import type {
  ErrandCreditFilter,
  ErrandExpiryFilter,
  ErrandSort,
} from '../features/errands/errand.types'

export function DashboardPage() {
  const [deliveryBuildingId, setDeliveryBuildingId] = useState('')
  const [credit, setCredit] = useState<ErrandCreditFilter>('all')
  const [expiry, setExpiry] = useState<ErrandExpiryFilter>('all')
  const [sort, setSort] = useState<ErrandSort>('expires_at,asc')
  const [dashboardData, setDashboardData] = useState<OpenErrandDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    loadOpenErrandDashboard(
      { deliveryBuildingId, credit, expiry, sort },
      controller.signal,
    )
      .then(setDashboardData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load open errands.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [credit, deliveryBuildingId, expiry, retryCount, sort])

  const visibleErrands = dashboardData?.items ?? []
  const availableCount = dashboardData?.total ?? 0

  function prepareRequest() {
    setIsLoading(true)
    setErrorMessage(null)
  }

  function updateDeliveryBuilding(buildingId: string) {
    prepareRequest()
    setDeliveryBuildingId(buildingId)
  }

  function updateCredit(nextCredit: ErrandCreditFilter) {
    prepareRequest()
    setCredit(nextCredit)
  }

  function updateExpiry(nextExpiry: ErrandExpiryFilter) {
    prepareRequest()
    setExpiry(nextExpiry)
  }

  function updateSort(nextSort: ErrandSort) {
    prepareRequest()
    setSort(nextSort)
  }

  function resetFilters() {
    prepareRequest()
    setDeliveryBuildingId('')
    setCredit('all')
    setExpiry('all')
    setRetryCount((count) => count + 1)
  }

  function retryRequest() {
    prepareRequest()
    setRetryCount((count) => count + 1)
  }

  return (
    <section>
      <div>
        <p className="text-xs font-medium tracking-[0.08em] text-[#175c45] sm:text-sm">
          CAMPUS ERRANDS
        </p>
        <h1 className="mt-2 max-w-3xl text-[2rem] font-medium leading-[1.08] tracking-[-0.035em] text-[#17211d] sm:text-[2.375rem]">
          Find an errand on your route
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736c] sm:text-base">
          Help a student, earn credits, and make your next walk count.
        </p>
      </div>

      <div className="mt-5 sm:mt-6">
        <ErrandFilters
          deliveryBuildings={dashboardData?.deliveryBuildings ?? []}
          deliveryBuildingId={deliveryBuildingId}
          credit={credit}
          expiry={expiry}
          sort={sort}
          onDeliveryBuildingChange={updateDeliveryBuilding}
          onCreditChange={updateCredit}
          onExpiryChange={updateExpiry}
          onSortChange={updateSort}
        />
      </div>

      <div className="mt-6 grid items-start gap-7 xl:mt-7 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-6">
        <div>
          <div className="flex items-baseline justify-between gap-4" aria-live="polite">
            <h2 className="text-[1.375rem] font-medium tracking-[-0.02em] text-[#17211d] sm:text-2xl">
              Open errands
            </h2>
            <p className="text-sm text-[#68736c]">
              {isLoading
                ? 'Loading…'
                : errorMessage
                  ? 'Unavailable'
                  : `${availableCount} available`}
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-6 py-10 text-center"
            >
              <h3 className="text-lg font-medium text-red-900">Could not load errands</h3>
              <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
              <button
                type="button"
                onClick={retryRequest}
                className="mt-5 cursor-pointer rounded-lg bg-[#175c45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
              >
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div
              role="status"
              className="mt-4 rounded-[18px] border border-[#dde3de] bg-white px-6 py-12 text-center text-sm text-[#68736c]"
            >
              Loading open errands…
            </div>
          ) : visibleErrands.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleErrands.map((errand) => (
                <ErrandCard key={errand.id} errand={errand} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border border-dashed border-[#bdc8c0] bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-medium text-[#17211d]">No open errands match</h3>
              <p className="mt-2 text-sm text-[#68736c]">
                Clear the filters to see all available errands.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 cursor-pointer rounded-lg bg-[#175c45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <ActiveErrandsPanel count={0} />
      </div>
    </section>
  )
}
