import { useEffect, useMemo, useState } from 'react'
import {
  ActiveErrandsPanel,
  ActiveErrandsSummary,
} from '../components/errands/ActiveErrandsPanel'
import { AcceptErrandDialog } from '../components/errands/AcceptErrandDialog'
import { ErrandCard } from '../components/errands/ErrandCard'
import { ErrandFilters } from '../components/errands/ErrandFilters'
import {
  applyDeliveryBuildingNames,
  loadErrandDashboardBuildings,
  loadOpenErrandDashboard,
  type OpenErrandDashboardData,
} from '../features/errands/errand.dashboard'
import { MOCK_MY_ERRANDS } from '../features/errands/my-errands.mock'
import type { MyErrandItem } from '../features/errands/my-errands.types'
import type {
  ErrandCreditFilter,
  ErrandDashboardItem,
  ErrandExpiryFilter,
  ErrandSort,
} from '../features/errands/errand.types'
import type { SupplierReference } from '../features/suppliers/supplier.types'

export function DashboardPage() {
  const [deliveryBuildingId, setDeliveryBuildingId] = useState('')
  const [credit, setCredit] = useState<ErrandCreditFilter>('all')
  const [expiry, setExpiry] = useState<ErrandExpiryFilter>('all')
  const [sort, setSort] = useState<ErrandSort>('expires_at,asc')
  const [dashboardData, setDashboardData] = useState<OpenErrandDashboardData | null>(null)
  const [deliveryBuildings, setDeliveryBuildings] = useState<SupplierReference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [buildingErrorMessage, setBuildingErrorMessage] = useState<string | null>(null)
  const [buildingRetryCount, setBuildingRetryCount] = useState(0)
  const [pendingErrand, setPendingErrand] = useState<ErrandDashboardItem | null>(null)
  const [locallyAcceptedErrands, setLocallyAcceptedErrands] = useState<ErrandDashboardItem[]>([])
  const [acceptMessage, setAcceptMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    loadErrandDashboardBuildings(controller.signal)
      .then((buildings) => {
        setDeliveryBuildings(buildings)
        setBuildingErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setBuildingErrorMessage(
          error instanceof Error ? error.message : 'Unable to load delivery locations.',
        )
      })

    return () => controller.abort()
  }, [buildingRetryCount])

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

  const displayData = useMemo(
    () =>
      dashboardData
        ? applyDeliveryBuildingNames(dashboardData, deliveryBuildings)
        : null,
    [dashboardData, deliveryBuildings],
  )
  const acceptedIds = useMemo(
    () => new Set(locallyAcceptedErrands.map((errand) => errand.id)),
    [locallyAcceptedErrands],
  )
  const visibleErrands = useMemo(
    () => displayData?.items.filter((errand) => !acceptedIds.has(errand.id)) ?? [],
    [acceptedIds, displayData],
  )
  const availableCount = Math.max(
    0,
    (displayData?.total ?? 0) -
      (displayData?.items.filter((errand) => acceptedIds.has(errand.id)).length ?? 0),
  )
  const activeErrands = useMemo<MyErrandItem[]>(
    () => [
      ...locallyAcceptedErrands.map((errand) => ({
        id: errand.id,
        requiredItem: errand.required_item,
        pickupLocation: errand.supplier_name,
        deliveryLocation: [
          errand.delivery_building_name,
          errand.delivery_floor ? `Level ${errand.delivery_floor}` : null,
        ]
          .filter(Boolean)
          .join(', '),
        creditValue: errand.credit_value,
        role: 'courier' as const,
        progress: 'accepted' as const,
        expiresAt: errand.expires_at,
      })),
      ...MOCK_MY_ERRANDS,
    ],
    [locallyAcceptedErrands],
  )

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

  function retryBuildings() {
    setBuildingErrorMessage(null)
    setBuildingRetryCount((count) => count + 1)
  }

  function acceptErrandPreview() {
    if (!pendingErrand) return

    setLocallyAcceptedErrands((current) =>
      current.some((errand) => errand.id === pendingErrand.id)
        ? current
        : [...current, pendingErrand],
    )
    setAcceptMessage(`${pendingErrand.required_item} was added to your active errands preview.`)
    setPendingErrand(null)
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

      <ActiveErrandsSummary errands={activeErrands} />

      <div className="mt-5 sm:mt-6">
        <ErrandFilters
          deliveryBuildings={deliveryBuildings}
          deliveryBuildingId={deliveryBuildingId}
          credit={credit}
          expiry={expiry}
          sort={sort}
          onDeliveryBuildingChange={updateDeliveryBuilding}
          onCreditChange={updateCredit}
          onExpiryChange={updateExpiry}
          onSortChange={updateSort}
        />
        {buildingErrorMessage ? (
          <div
            role="status"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>Delivery locations could not be loaded. {buildingErrorMessage}</span>
            <button
              type="button"
              onClick={retryBuildings}
              className="cursor-pointer font-semibold text-[#175c45] underline decoration-[#175c45]/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
            >
              Retry locations
            </button>
          </div>
        ) : null}
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
                <ErrandCard key={errand.id} errand={errand} onAccept={setPendingErrand} />
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

        <ActiveErrandsPanel errands={activeErrands} />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {acceptMessage}
      </p>

      {pendingErrand ? (
        <AcceptErrandDialog
          errand={pendingErrand}
          onClose={() => setPendingErrand(null)}
          onConfirm={acceptErrandPreview}
        />
      ) : null}
    </section>
  )
}
