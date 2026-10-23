import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedFetch } from '../auth/auth.fetch'
import { getSupplier } from './supplier.api'
import type { Supplier } from './supplier.types'

vi.mock('../auth/auth.fetch', () => ({
  authenticatedFetch: vi.fn(),
}))

const authenticatedFetchMock = vi.mocked(authenticatedFetch)

const supplier: Supplier = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Techno Edge',
  category: { id: 'category-food', name: 'Food' },
  building: { id: 'building-engineering', name: 'Engineering E2' },
  floor: '2',
  description: null,
  openingTime: null,
  closingTime: null,
  imageUrl: null,
  status: 'ACTIVE',
}

describe('getSupplier', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset()
  })

  it('loads one supplier by identifier and forwards request cancellation', async () => {
    authenticatedFetchMock.mockResolvedValue(
      new Response(JSON.stringify(supplier), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const signal = new AbortController().signal

    await expect(getSupplier(supplier.id, signal)).resolves.toEqual(supplier)

    const expectedBaseUrl = (import.meta.env.VITE_SUPPLIER_API_URL ?? '')
      .trim()
      .replace(/\/+$/, '')
    expect(authenticatedFetchMock).toHaveBeenCalledWith(
      `${expectedBaseUrl}/suppliers/${supplier.id}`,
      {
        headers: { Accept: 'application/json' },
        signal,
      },
    )
  })
})
