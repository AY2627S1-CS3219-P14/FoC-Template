import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import creditIcon from '../assets/errand-credit.svg'
import routeMarkers from '../assets/errand-route.svg'
import {
  ErrandActionDialog,
  type ErrandAction,
} from '../components/errands/ErrandActionDialog'
import { getMockErrandDetails } from '../features/errands/errand-details.mock'
import type { ErrandDetails } from '../features/errands/errand-details.types'
import type { ErrandStatus } from '../features/errands/errand.types'

const statusPresentation: Record<
  ErrandStatus,
  { label: string; className: string }
> = {
  OPEN: { label: 'Open', className: 'bg-[#fff3d8] text-[#8e6523]' },
  ACCEPTED: { label: 'Accepted', className: 'bg-[#ddf3e7] text-[#1e694e]' },
  COMPLETED: { label: 'Completed', className: 'bg-[#ddf3e7] text-[#1e694e]' },
  CANCELLED: { label: 'Cancelled', className: 'bg-[#edf0ed] text-[#68736c]' },
  FAILED: { label: 'Failed', className: 'bg-[#fde8e7] text-[#a33a32]' },
  EXPIRED: { label: 'Expired', className: 'bg-[#edf0ed] text-[#68736c]' },
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

type DetailRowProps = {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-[0.06em] text-[#7b867f]">{label}</dt>
      <dd className="mt-1.5 text-sm leading-6 text-[#28332d]">{value}</dd>
    </div>
  )
}

function getStatusCopy(errand: ErrandDetails) {
  if (errand.status === 'OPEN') {
    return {
      title: 'Waiting for a courier',
      description: 'Your request is visible to couriers until the collection deadline.',
    }
  }

  if (errand.status === 'ACCEPTED' && errand.viewerRole === 'requester') {
    return {
      title: 'Courier assigned',
      description: `${errand.courierName ?? 'A courier'} accepted your errand. Confirm only after you receive the items.`,
    }
  }

  if (errand.status === 'ACCEPTED') {
    return {
      title: 'Delivery in progress',
      description: 'You accepted this errand. Follow the pickup and delivery instructions shown here.',
    }
  }

  const terminalCopy: Record<Exclude<ErrandStatus, 'OPEN' | 'ACCEPTED'>, string> = {
    COMPLETED: 'The requester confirmed this delivery as completed.',
    CANCELLED: 'The requester cancelled this errand before it was accepted.',
    FAILED: 'This errand was reported as unsuccessful and is now closed.',
    EXPIRED: 'No courier accepted this errand before its collection deadline.',
  }

  return {
    title: statusPresentation[errand.status].label,
    description: terminalCopy[errand.status],
  }
}

function getOutcomeTime(errand: ErrandDetails) {
  if (errand.status === 'COMPLETED') return errand.completedAt
  if (errand.status === 'CANCELLED') return errand.cancelledAt
  if (errand.status === 'FAILED') return errand.failedAt
  if (errand.status === 'EXPIRED') return errand.expiresAt
  return null
}

export function ErrandDetailsPage() {
  const { errandId = '' } = useParams()
  const fixtureErrand = getMockErrandDetails(errandId)
  const [errand, setErrand] = useState(fixtureErrand)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [activeAction, setActiveAction] = useState<ErrandAction | null>(null)

  useEffect(() => {
    setErrand(fixtureErrand)
    setRefreshMessage('')
    setActiveAction(null)
  }, [errandId, fixtureErrand])

  if (!errand) {
    return (
      <section className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-xs font-medium tracking-[0.08em] text-[#175c45]">ERRAND DETAILS</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.035em] text-[#17211d]">
          Errand not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68736c]">
          This errand may no longer be available, or the link may be incorrect.
        </p>
        <Link
          to="/my-errands"
          className="mt-6 inline-block rounded-lg bg-[#175c45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
        >
          Back to My errands
        </Link>
      </section>
    )
  }

  const status = statusPresentation[errand.status]
  const statusCopy = getStatusCopy(errand)
  const outcomeTime = getOutcomeTime(errand)
  const deliveryLocation = [
    errand.deliveryBuilding,
    errand.deliveryFloor ? `Level ${errand.deliveryFloor}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  function refreshPreview() {
    setErrand(fixtureErrand)
    setRefreshMessage('Details refreshed from the local preview.')
  }

  function confirmAction(failureReason?: string) {
    if (!errand || !activeAction) return

    const changedAt = new Date().toISOString()
    setErrand({
      ...errand,
      status:
        activeAction === 'cancel'
          ? 'CANCELLED'
          : activeAction === 'complete'
            ? 'COMPLETED'
            : 'FAILED',
      cancelledAt: activeAction === 'cancel' ? changedAt : errand.cancelledAt,
      completedAt: activeAction === 'complete' ? changedAt : errand.completedAt,
      failedAt: activeAction === 'fail' ? changedAt : errand.failedAt,
      failureReason: activeAction === 'fail' ? (failureReason ?? null) : errand.failureReason,
    })
    setRefreshMessage('Preview updated locally. No backend request was sent.')
    setActiveAction(null)
  }

  return (
    <section>
      <Link
        className="inline-flex rounded-sm text-sm font-medium text-[#175c45] hover:text-[#0d3c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
        to="/my-errands"
      >
        ← Back to My errands
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.08em] text-[#175c45]">
            ERRAND DETAILS
          </p>
          <h1 className="mt-2 max-w-3xl text-[2rem] font-medium leading-[1.1] tracking-[-0.035em] text-[#17211d] sm:text-[2.375rem]">
            {errand.requiredItem}
          </h1>
          <p className="mt-2 text-sm text-[#68736c]">Reference {errand.id}</p>
        </div>

        <button
          type="button"
          onClick={refreshPreview}
          className="inline-flex h-10 w-fit shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#bdc8c0] bg-white px-4 text-sm font-semibold text-[#175c45] transition hover:bg-[#f0f6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
        >
          ↻ Refresh
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {refreshMessage}
      </p>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-6">
        <div className="space-y-5">
          <article className="rounded-[18px] border border-[#dde3de] bg-white p-5 shadow-[0_8px_24px_rgba(22,59,42,0.07)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-medium tracking-[-0.02em] text-[#17211d]">
                Route
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-[#ddf3e7] px-3 py-1.5 text-sm font-medium text-[#175c45]">
                <img src={creditIcon} alt="" width="15" height="15" />
                {errand.creditValue} credits
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[24px_minmax(0,1fr)]">
              <img
                src={routeMarkers}
                alt=""
                width="18"
                height="28"
                className="mt-1 hidden sm:block"
              />
              <dl className="grid gap-5 sm:grid-cols-2">
                <DetailRow label="PICK UP" value={`${errand.supplierName} · ${errand.pickupLocation}`} />
                <DetailRow label="DELIVER TO" value={deliveryLocation} />
              </dl>
            </div>
          </article>

          <article className="rounded-[18px] border border-[#dde3de] bg-white p-5 shadow-[0_8px_24px_rgba(22,59,42,0.07)] sm:p-6">
            <h2 className="text-xl font-medium tracking-[-0.02em] text-[#17211d]">
              Delivery information
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailRow
                label="INSTRUCTIONS"
                value={errand.deliveryDescription ?? 'No additional instructions provided.'}
              />
              <DetailRow label="COLLECT BEFORE" value={formatDateTime(errand.expiresAt)} />
              <DetailRow label="REQUESTER" value={errand.requesterName} />
              <DetailRow label="COURIER" value={errand.courierName ?? 'Not accepted yet'} />
            </dl>
          </article>

          {errand.failureReason ? (
            <article className="rounded-[18px] border border-[#f0c8c5] bg-[#fff8f7] p-5 sm:p-6">
              <h2 className="text-base font-semibold text-[#8c302a]">Reported problem</h2>
              <p className="mt-2 text-sm leading-6 text-[#713934]">{errand.failureReason}</p>
            </article>
          ) : null}
        </div>

        <aside className="rounded-[18px] border border-[#dde3de] bg-white p-5 shadow-[0_8px_24px_rgba(22,59,42,0.07)] xl:sticky xl:top-[106px]">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${status.className}`}>
            {status.label}
          </span>
          <p className="mt-4 text-xs font-medium tracking-[0.06em] text-[#7b867f]">
            {errand.viewerRole === 'requester' ? 'YOU REQUESTED THIS' : 'YOU ARE DELIVERING'}
          </p>
          <h2 className="mt-2 text-lg font-medium text-[#17211d]">{statusCopy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#68736c]">
            {statusCopy.description}
          </p>
          <dl className="mt-5 space-y-4 border-t border-[#e6eae7] pt-5">
            <DetailRow label="CREATED" value={formatDateTime(errand.createdAt)} />
            {errand.acceptedAt ? (
              <DetailRow label="ACCEPTED" value={formatDateTime(errand.acceptedAt)} />
            ) : null}
            {outcomeTime ? (
              <DetailRow
                label={errand.status === 'EXPIRED' ? 'EXPIRED' : errand.status}
                value={formatDateTime(outcomeTime)}
              />
            ) : null}
          </dl>

          {errand.viewerRole === 'requester' && errand.status === 'OPEN' ? (
            <button
              type="button"
              onClick={() => setActiveAction('cancel')}
              className="mt-6 h-11 w-full cursor-pointer rounded-lg border border-[#d49a95] bg-white px-4 text-sm font-semibold text-[#a33a32] transition hover:bg-[#fff5f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a33a32]"
            >
              Cancel errand
            </button>
          ) : null}

          {errand.viewerRole === 'requester' && errand.status === 'ACCEPTED' ? (
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setActiveAction('complete')}
                className="h-11 w-full cursor-pointer rounded-lg bg-[#d8f06b] px-4 text-sm font-semibold text-[#0d3c2d] transition hover:bg-[#cce85b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
              >
                Confirm delivery
              </button>
              <button
                type="button"
                onClick={() => setActiveAction('fail')}
                className="h-11 w-full cursor-pointer rounded-lg border border-[#d49a95] bg-white px-4 text-sm font-semibold text-[#a33a32] transition hover:bg-[#fff5f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a33a32]"
              >
                Report problem
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {activeAction ? (
        <ErrandActionDialog
          action={activeAction}
          errandName={errand.requiredItem}
          onClose={() => setActiveAction(null)}
          onConfirm={confirmAction}
        />
      ) : null}
    </section>
  )
}

