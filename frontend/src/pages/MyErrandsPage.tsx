import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MyErrandCard } from '../components/errands/MyErrandCard'
import { MOCK_MY_ERRANDS } from '../features/errands/my-errands.mock'
import type { MyErrandFilter } from '../features/errands/my-errands.types'

const filterOptions: Array<{ value: MyErrandFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'requester', label: 'Requesting' },
  { value: 'courier', label: 'Delivering' },
]

export function MyErrandsPage() {
  const [filter, setFilter] = useState<MyErrandFilter>('all')

  const visibleErrands = useMemo(
    () =>
      filter === 'all'
        ? MOCK_MY_ERRANDS
        : MOCK_MY_ERRANDS.filter((errand) => errand.role === filter),
    [filter],
  )

  const emptyCopy =
    filter === 'requester'
      ? 'You do not have any active errand requests.'
      : filter === 'courier'
        ? 'You are not delivering any errands right now.'
        : 'Errands you request or accept will appear here.'

  return (
    <section>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#175c45] sm:text-sm">
            YOUR ERRANDS
          </p>
          <h1 className="mt-2 text-[2rem] font-medium leading-[1.08] tracking-[-0.035em] text-[#17211d] sm:text-[2.375rem]">
            My errands
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736c] sm:text-base">
            Keep track of errands you requested and deliveries you accepted.
          </p>
        </div>
        <p className="text-sm text-[#68736c]" aria-live="polite">
          {visibleErrands.length} active
        </p>
      </div>

      <div
        className="mt-6 inline-flex rounded-xl border border-[#dde3de] bg-white p-1"
        role="group"
        aria-label="Filter my errands"
      >
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={[
              'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]',
              filter === option.value
                ? 'bg-[#ddf3e7] text-[#175c45]'
                : 'text-[#68736c] hover:bg-[#f5f7f4] hover:text-[#17211d]',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleErrands.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleErrands.map((errand) => (
            <MyErrandCard key={errand.id} errand={errand} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[18px] border border-dashed border-[#bdc8c0] bg-white px-6 py-12 text-center">
          <div
            className="mx-auto grid size-10 place-items-center rounded-full bg-[#ddf3e7] text-lg text-[#175c45]"
            aria-hidden="true"
          >
            ✓
          </div>
          <h2 className="mt-3 text-lg font-medium text-[#17211d]">No active errands</h2>
          <p className="mt-2 text-sm text-[#68736c]">{emptyCopy}</p>
          <Link
            to={filter === 'requester' ? '/errands/new' : '/'}
            className="mt-5 inline-block rounded-lg bg-[#d8f06b] px-4 py-2.5 text-sm font-semibold text-[#0d3c2d] transition hover:bg-[#cce85b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
          >
            {filter === 'requester' ? 'Create an errand' : 'Browse open errands'}
          </Link>
        </div>
      )}
    </section>
  )
}
