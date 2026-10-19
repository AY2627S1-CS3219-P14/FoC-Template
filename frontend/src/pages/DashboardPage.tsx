import { useMemo, useState } from 'react'
import { ActiveErrandsPanel } from '../components/errands/ActiveErrandsPanel'
import { ErrandCard } from '../components/errands/ErrandCard'
import { ErrandFilters } from '../components/errands/ErrandFilters'
import {
  MOCK_ACTIVE_ERRANDS,
  MOCK_OPEN_ERRANDS,
} from '../features/errands/errand.mock'
import type {
  ErrandCreditFilter,
  ErrandDashboardItem,
  ErrandExpiryFilter,
  ErrandSort,
} from '../features/errands/errand.types'

const HOUR_IN_MS = 60 * 60 * 1000
const DAY_IN_MS = 24 * HOUR_IN_MS

function matchesCreditFilter(errand: ErrandDashboardItem, filter: ErrandCreditFilter) {
  if (filter === 'up-to-5') return errand.credit_value <= 5
  if (filter === '6-to-10') return errand.credit_value >= 6 && errand.credit_value <= 10
  if (filter === '11-plus') return errand.credit_value >= 11
  return true
}

function matchesExpiryFilter(
  errand: ErrandDashboardItem,
  filter: ErrandExpiryFilter,
  now: Date,
) {
  if (filter === 'all') return true

  const expiry = new Date(errand.expires_at)
  if (filter === 'next-4-hours') return expiry.getTime() <= now.getTime() + 4 * HOUR_IN_MS
  if (filter === 'next-7-days') return expiry.getTime() <= now.getTime() + 7 * DAY_IN_MS

  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  return expiry.getTime() <= endOfToday.getTime()
}

function sortErrands(errands: ErrandDashboardItem[], sort: ErrandSort) {
  const [field, direction] = sort.split(',') as [
    'expires_at' | 'credit_value',
    'asc' | 'desc',
  ]

  return [...errands].sort((left, right) => {
    const leftValue =
      field === 'credit_value' ? left.credit_value : new Date(left.expires_at).getTime()
    const rightValue =
      field === 'credit_value' ? right.credit_value : new Date(right.expires_at).getTime()
    const difference = leftValue - rightValue

    if (difference !== 0) return direction === 'asc' ? difference : -difference
    return left.id.localeCompare(right.id)
  })
}

export function DashboardPage() {
  const [building, setBuilding] = useState('')
  const [credit, setCredit] = useState<ErrandCreditFilter>('all')
  const [expiry, setExpiry] = useState<ErrandExpiryFilter>('all')
  const [sort, setSort] = useState<ErrandSort>('expires_at,asc')

  const openErrands = useMemo(
    () => MOCK_OPEN_ERRANDS.filter((errand) => errand.status === 'OPEN'),
    [],
  )
  const buildings = useMemo(
    () => [...new Set(openErrands.map((errand) => errand.delivery_building_name))].sort(),
    [openErrands],
  )
  const visibleErrands = useMemo(() => {
    const now = new Date()
    const filtered = openErrands.filter(
      (errand) =>
        (!building || errand.delivery_building_name === building) &&
        matchesCreditFilter(errand, credit) &&
        matchesExpiryFilter(errand, expiry, now),
    )

    return sortErrands(filtered, sort)
  }, [building, credit, expiry, openErrands, sort])

  function resetFilters() {
    setBuilding('')
    setCredit('all')
    setExpiry('all')
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

      <div className="mt-6">
        <ErrandFilters
          buildings={buildings}
          building={building}
          credit={credit}
          expiry={expiry}
          sort={sort}
          onBuildingChange={setBuilding}
          onCreditChange={setCredit}
          onExpiryChange={setExpiry}
          onSortChange={setSort}
        />
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex items-baseline justify-between gap-4" aria-live="polite">
            <h2 className="text-[1.375rem] font-medium tracking-[-0.02em] text-[#17211d] sm:text-2xl">
              Open errands
            </h2>
            <p className="text-sm text-[#68736c]">
              {visibleErrands.length} available
            </p>
          </div>

          {visibleErrands.length > 0 ? (
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

        <ActiveErrandsPanel count={MOCK_ACTIVE_ERRANDS.length} />
      </div>
    </section>
  )
}
