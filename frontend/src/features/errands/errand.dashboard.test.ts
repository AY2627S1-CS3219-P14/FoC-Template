import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupplier, listSupplierBuildings } from '../suppliers/supplier.api'
import type { Supplier } from '../suppliers/supplier.types'
import { listErrands } from './errand.api'
import {
  buildOpenErrandParams,
  loadOpenErrandDashboard,
  type ErrandDashboardFilters,
} from './errand.dashboard'
import type { ErrandListItem } from './errand.types'

vi.mock('./errand.api', () => ({
  listErrands: vi.fn(),
}))

vi.mock('../suppliers/supplier.api', () => ({
  getSupplier: vi.fn(),
  listSupplierBuildings: vi.fn(),
}))

const listErrandsMock = vi.mocked(listErrands)
const getSupplierMock = vi.mocked(getSupplier)
const listSupplierBuildingsMock = vi.mocked(listSupplierBuildings)

const defaultFilters: ErrandDashboardFilters = {
  deliveryBuildingId: '',
  credit: 'all',
  expiry: 'all',
  sort: 'expires_at,asc',
}

const errand: ErrandListItem = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'OPEN',
  requester_id: '11111111-1111-4111-8111-111111111111',
  courier_id: null,
  supplier_id: '22222222-2222-4222-8222-222222222222',
  required_item: 'Two sandwiches and one coffee',
  credit_value: 8,
  delivery_building_id: '33333333-3333-4333-8333-333333333333',
  delivery_floor: '3',
  delivery_description: 'Outside room 03-12',
  expires_at: '2026-10-20T12:00:00.000Z',
  created_at: '2026-10-20T04:00:00.000Z',
  accepted_at: null,
  completed_at: null,
  cancelled_at: null,
  failed_at: null,
  failure_reason: null,
}

const supplier: Supplier = {
  id: errand.supplier_id,
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

describe('buildOpenErrandParams', () => {
  const now = new Date('2026-10-20T02:30:00.000Z')

  it('always requests the first page of available open errands using the selected sort', () => {
    expect(buildOpenErrandParams(defaultFilters, now)).toEqual({
      statuses: ['OPEN'],
      deliveryBuildingId: undefined,
      availableOnly: true,
      sort: 'expires_at,asc',
      page: 0,
      size: 20,
    })
  })

  it.each([
    ['up-to-5', undefined, 5],
    ['6-to-10', 6, 10],
    ['11-plus', 11, undefined],
  ] as const)('maps the %s credit filter to API bounds', (credit, minimum, maximum) => {
    const params = buildOpenErrandParams({ ...defaultFilters, credit }, now)

    expect(params.minCreditValue).toBe(minimum)
    expect(params.maxCreditValue).toBe(maximum)
  })

  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  it.each([
    ['next-4-hours', '2026-10-20T06:30:00.000Z'],
    ['today', endOfToday.toISOString()],
    ['next-7-days', '2026-10-27T02:30:00.000Z'],
  ] as const)('maps the %s expiry filter to an inclusive upper bound', (expiry, expected) => {
    expect(
      buildOpenErrandParams({ ...defaultFilters, expiry }, now).expiresBefore,
    ).toBe(expected)
  })

  it('passes a selected delivery building through by identifier', () => {
    expect(
      buildOpenErrandParams(
        { ...defaultFilters, deliveryBuildingId: errand.delivery_building_id },
        now,
      ).deliveryBuildingId,
    ).toBe(errand.delivery_building_id)
  })
})

describe('loadOpenErrandDashboard', () => {
  beforeEach(() => {
    listErrandsMock.mockReset()
    getSupplierMock.mockReset()
    listSupplierBuildingsMock.mockReset()

    listErrandsMock.mockResolvedValue({ total: 1, items: [errand] })
    getSupplierMock.mockResolvedValue(supplier)
    listSupplierBuildingsMock.mockResolvedValue({
      items: [{ id: errand.delivery_building_id, name: 'COM3' }],
    })
  })

  it('loads open errands and enriches their service identifiers for dashboard cards', async () => {
    const signal = new AbortController().signal

    await expect(
      loadOpenErrandDashboard(defaultFilters, signal, new Date('2026-10-20T02:30:00.000Z')),
    ).resolves.toEqual({
      total: 1,
      items: [
        {
          ...errand,
          supplier_name: 'Techno Edge',
          supplier_building_name: 'Engineering E2',
          delivery_building_name: 'COM3',
        },
      ],
      deliveryBuildings: [{ id: errand.delivery_building_id, name: 'COM3' }],
    })

    expect(listErrandsMock).toHaveBeenCalledWith(
      buildOpenErrandParams(defaultFilters, new Date('2026-10-20T02:30:00.000Z')),
      signal,
    )
    expect(listSupplierBuildingsMock).toHaveBeenCalledWith(signal)
    expect(getSupplierMock).toHaveBeenCalledWith(errand.supplier_id, signal)
  })

  it('loads each supplier only once when multiple errands use it', async () => {
    listErrandsMock.mockResolvedValue({
      total: 2,
      items: [errand, { ...errand, id: '660e8400-e29b-41d4-a716-446655440000' }],
    })

    await loadOpenErrandDashboard(defaultFilters)

    expect(getSupplierMock).toHaveBeenCalledTimes(1)
  })

  it('uses explicit fallback labels when reference data has no delivery building', async () => {
    listSupplierBuildingsMock.mockResolvedValue({ items: [] })

    const result = await loadOpenErrandDashboard(defaultFilters)

    expect(result.items[0].delivery_building_name).toBe('Delivery location unavailable')
  })
})
