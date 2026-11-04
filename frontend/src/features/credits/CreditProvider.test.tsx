import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAvailableBalance } from './credit.api'
import { CreditProvider } from './CreditProvider'
import { useCredits } from './useCredits'

vi.mock('./credit.api', () => ({ getAvailableBalance: vi.fn() }))

const getAvailableBalanceMock = vi.mocked(getAvailableBalance)

function Consumer() {
  const { availableBalance, status, error, refreshBalance } = useCredits()
  return (
    <div>
      <span>{status}</span>
      <span>{availableBalance ?? 'none'}</span>
      <span>{error ?? 'no error'}</span>
      <button type="button" onClick={() => void refreshBalance()}>Refresh</button>
    </div>
  )
}

describe('CreditProvider', () => {
  beforeEach(() => getAvailableBalanceMock.mockReset())

  it('loads and refreshes the available balance', async () => {
    getAvailableBalanceMock.mockResolvedValueOnce(30).mockResolvedValueOnce(25)
    render(<CreditProvider><Consumer /></CreditProvider>)

    expect(await screen.findByText('30')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Refresh' }).click()
    expect(await screen.findByText('25')).toBeInTheDocument()
    expect(getAvailableBalanceMock).toHaveBeenCalledTimes(2)
  })

  it('exposes an error and can retry', async () => {
    getAvailableBalanceMock
      .mockRejectedValueOnce(new Error('Wallet unavailable'))
      .mockResolvedValueOnce(0)
    render(<CreditProvider><Consumer /></CreditProvider>)

    expect(await screen.findByText('Wallet unavailable')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Refresh' }).click()
    expect(await screen.findByText('0')).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('aborts a refresh that is still active when unmounted', async () => {
    getAvailableBalanceMock.mockResolvedValueOnce(30)
    const { unmount } = render(<CreditProvider><Consumer /></CreditProvider>)
    expect(await screen.findByText('30')).toBeInTheDocument()

    let refreshSignal: AbortSignal | undefined
    getAvailableBalanceMock.mockImplementationOnce(
      (signal) =>
        new Promise((resolve) => {
          refreshSignal = signal
          signal?.addEventListener('abort', () => resolve(25))
        }),
    )
    screen.getByRole('button', { name: 'Refresh' }).click()
    await waitFor(() => expect(refreshSignal).toBeDefined())

    unmount()
    expect(refreshSignal?.aborted).toBe(true)
  })
})
