import { authenticatedFetch } from '../auth/auth.fetch'
import type { WalletBalanceResponse } from './credit.types'

const creditApiBaseUrl = (import.meta.env.VITE_CREDIT_API_URL ?? '').trim().replace(/\/+$/, '')

type ProblemDetails = {
  detail?: string
  title?: string
}

export class CreditApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CreditApiError'
    this.status = status
  }
}

export async function getAvailableBalance(signal?: AbortSignal): Promise<number> {
  let response: Response

  try {
    response = await authenticatedFetch(`${creditApiBaseUrl}/api/wallets/availableBalance`, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new CreditApiError('Could not connect to the Credit Service.', 0)
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null
    throw new CreditApiError(
      problem?.detail ?? problem?.title ?? 'Unable to load your credit balance.',
      response.status,
    )
  }

  const wallet = (await response.json()) as WalletBalanceResponse
  return wallet.availableBalance
}
