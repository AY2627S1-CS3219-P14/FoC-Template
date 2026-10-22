import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../features/auth/useAuth'
import { useCredits } from '../../features/credits/useCredits'
import { AppHeader } from './AppHeader'

vi.mock('../../features/auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../features/credits/useCredits', () => ({ useCredits: vi.fn() }))

const useAuthMock = vi.mocked(useAuth)
const useCreditsMock = vi.mocked(useCredits)
const refreshBalance = vi.fn<() => Promise<void>>()

function renderHeader() {
  return render(<MemoryRouter><AppHeader /></MemoryRouter>)
}

describe('AppHeader credit balance', () => {
  beforeEach(() => {
    refreshBalance.mockReset()
    refreshBalance.mockResolvedValue()
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      currentUserId: 'user-id',
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('shows the loaded balance, including zero', () => {
    useCreditsMock.mockReturnValue({
      availableBalance: 0,
      status: 'ready',
      error: null,
      refreshBalance,
    })
    renderHeader()

    expect(screen.getByText('0 credits')).toBeInTheDocument()
  })

  it('uses a neutral placeholder while loading', () => {
    useCreditsMock.mockReturnValue({
      availableBalance: null,
      status: 'loading',
      error: null,
      refreshBalance,
    })
    renderHeader()

    expect(screen.getByText('— credits')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry balance' })).not.toBeInTheDocument()
  })

  it('offers a retry after a balance error', () => {
    useCreditsMock.mockReturnValue({
      availableBalance: null,
      status: 'error',
      error: 'Wallet unavailable',
      refreshBalance,
    })
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Retry balance' }))
    expect(refreshBalance).toHaveBeenCalledOnce()
  })
})
