import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedFetch } from '../auth/auth.fetch'
import { createErrand, ErrandApiError } from './errand.api'
import type { CreateErrandRequest, CreateErrandResponse } from './errand.types'

vi.mock('../auth/auth.fetch', () => ({
  authenticatedFetch: vi.fn(),
}))

const authenticatedFetchMock = vi.mocked(authenticatedFetch)

const request: CreateErrandRequest = {
  supplier_id: '22222222-2222-4222-8222-222222222222',
  required_item: 'Two sandwiches and one coffee',
  credit_value: 10,
  delivery_building_id: '11111111-1111-4111-8111-111111111111',
  delivery_floor: '3',
  delivery_description: 'Outside room 03-12',
  expires_at: '2026-10-18T04:00:00.000Z',
}

const createdErrand: CreateErrandResponse = {
  ...request,
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'OPEN',
  requester_id: '33333333-3333-4333-8333-333333333333',
  courier_id: null,
  created_at: '2026-10-17T04:00:00.000Z',
}

describe('createErrand', () => {
  beforeEach(() => {
    authenticatedFetchMock.mockReset()
  })

  it('posts the exact request body to the Order Service', async () => {
    authenticatedFetchMock.mockResolvedValue(
      new Response(JSON.stringify(createdErrand), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(createErrand(request)).resolves.toEqual(createdErrand)

    const expectedBaseUrl = (import.meta.env.VITE_ORDER_API_URL ?? '').trim().replace(/\/+$/, '')
    expect(authenticatedFetchMock).toHaveBeenCalledWith(`${expectedBaseUrl}/errand/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: undefined,
    })
  })

  it('preserves FastAPI field validation issues', async () => {
    authenticatedFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: [
            {
              loc: ['body', 'expires_at'],
              msg: 'expires_at must be in the future',
              type: 'value_error',
            },
          ],
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const error = await createErrand(request).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ErrandApiError)
    expect(error).toMatchObject({
      status: 422,
      message: 'expires_at must be in the future',
      issues: [
        {
          loc: ['body', 'expires_at'],
          msg: 'expires_at must be in the future',
          type: 'value_error',
        },
      ],
    })
  })

  it('uses string problem details as the error message', async () => {
    authenticatedFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Supplier does not exist or is unavailable' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(createErrand(request)).rejects.toMatchObject({
      status: 422,
      message: 'Supplier does not exist or is unavailable',
      issues: [],
    })
  })

  it('reports a connection error when the request fails', async () => {
    authenticatedFetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createErrand(request)).rejects.toMatchObject({
      status: 0,
      message: 'Could not connect to the Order Service.',
    })
  })

  it('preserves request cancellation', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('The operation was aborted.', 'AbortError')
    authenticatedFetchMock.mockRejectedValue(abortError)

    await expect(createErrand(request, controller.signal)).rejects.toBe(abortError)
  })
})
