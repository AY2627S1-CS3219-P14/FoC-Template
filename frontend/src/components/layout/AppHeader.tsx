import { Link } from 'react-router'
import creditCoin from '../../assets/credit-coin.svg'
import routeIcon from '../../assets/route.svg'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#dde3de] bg-white px-4 lg:h-[76px] lg:px-8">
      <Link
        to="/"
        className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.02em] text-[#17211d] lg:text-xl lg:font-medium"
      >
        <span className="grid size-9 place-items-center rounded-[11px] bg-[#175c45] lg:size-[38px]">
          <img src={routeIcon} alt="" width="20" height="20" />
        </span>
        <span>Campus Couriers</span>
      </Link>

      <div className="flex items-center gap-2.5 text-sm text-[#17211d] lg:gap-3">
        <span className="flex items-center gap-2 rounded-full bg-[#fff3d8] px-2.5 py-2 lg:px-3.5">
          <img src={creditCoin} alt="" width="18" height="18" className="size-4 lg:size-[18px]" />
          <span className="hidden sm:inline">24 credits</span>
          <span className="sm:hidden">24</span>
        </span>
        <button
          type="button"
          className="grid size-9 cursor-pointer place-items-center rounded-full bg-[#ddf3e7] text-xs font-semibold text-[#175c45] transition hover:bg-[#caead9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45] lg:size-10"
          aria-label="Open profile"
        >
          EY
        </button>
      </div>
    </header>
  )
}
