import { useState } from 'react'
import { Link } from 'react-router'
import creditCoin from '../../assets/credit-coin.svg'
import routeIcon from '../../assets/route.svg'
import { useAuth } from '../../features/auth/useAuth'

export function AppHeader() {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

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
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="h-9 cursor-pointer rounded-lg border border-[#cfd8d1] bg-white px-3 text-xs font-semibold text-[#175c45] transition hover:bg-[#f0f6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45] disabled:cursor-wait disabled:opacity-60 lg:h-10 lg:px-4 lg:text-sm"
        >
          {isSigningOut ? 'Signing out…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
