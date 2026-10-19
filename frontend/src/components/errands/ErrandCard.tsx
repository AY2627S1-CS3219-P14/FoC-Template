import clockIcon from '../../assets/errand-clock.svg'
import creditIcon from '../../assets/errand-credit.svg'
import routeMarkers from '../../assets/errand-route.svg'
import type { ErrandDashboardItem } from '../../features/errands/errand.types'

type ErrandCardProps = {
  errand: ErrandDashboardItem
}

function formatExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const time = new Intl.DateTimeFormat('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(expiry)

  if (expiry.toDateString() === now.toDateString()) return `Today, ${time}`
  if (expiry.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`

  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(expiry)
}

export function ErrandCard({ errand }: ErrandCardProps) {
  const destination = [
    errand.delivery_building_name,
    errand.delivery_floor ? `Level ${errand.delivery_floor}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex min-h-[242px] flex-col rounded-[18px] border border-[#dde3de] bg-white p-5 shadow-[0_8px_24px_rgba(22,59,42,0.07)]">
      <h2 className="text-lg font-medium leading-tight tracking-[-0.015em] text-[#17211d]">
        {errand.required_item}
      </h2>

      <div className="mt-4 flex gap-3 text-sm leading-6 text-[#28332d]">
        <img
          src={routeMarkers}
          alt=""
          width="16"
          height="24"
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate">{errand.supplier_name}</p>
          <p className="truncate">{destination}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="flex min-w-0 items-center gap-2 text-xs text-[#68736c]">
          <img src={clockIcon} alt="" width="15" height="15" className="shrink-0" />
          <span className="truncate">By {formatExpiry(errand.expires_at)}</span>
        </p>
        <p className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#ddf3e7] px-2.5 py-1.5 text-sm font-medium text-[#175c45]">
          <img src={creditIcon} alt="" width="14" height="14" />
          {errand.credit_value} credits
        </p>
      </div>
    </article>
  )
}
