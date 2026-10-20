import { getSupplier, listSupplierBuildings } from '../suppliers/supplier.api'
import type { Supplier, SupplierReference } from '../suppliers/supplier.types'
import { listErrands } from './errand.api'
import type {
  ErrandCreditFilter,
  ErrandDashboardItem,
  ErrandExpiryFilter,
  ErrandListItem,
  ErrandSort,
  ListErrandsParams,
} from './errand.types'

const HOUR_IN_MS = 60 * 60 * 1000
const DAY_IN_MS = 24 * HOUR_IN_MS

export type ErrandDashboardFilters = {
  deliveryBuildingId: string
  credit: ErrandCreditFilter
  expiry: ErrandExpiryFilter
  sort: ErrandSort
}

export type OpenErrandDashboardData = {
  total: number
  items: ErrandDashboardItem[]
}

export function buildOpenErrandParams(
  filters: ErrandDashboardFilters,
  now = new Date(),
): ListErrandsParams {
  const params: ListErrandsParams = {
    statuses: ['OPEN'],
    deliveryBuildingId: filters.deliveryBuildingId || undefined,
    availableOnly: true,
    sort: filters.sort,
    page: 0,
    size: 20,
  }

  if (filters.credit === 'up-to-5') params.maxCreditValue = 5
  if (filters.credit === '6-to-10') {
    params.minCreditValue = 6
    params.maxCreditValue = 10
  }
  if (filters.credit === '11-plus') params.minCreditValue = 11

  if (filters.expiry === 'next-4-hours') {
    params.expiresBefore = new Date(now.getTime() + 4 * HOUR_IN_MS).toISOString()
  }
  if (filters.expiry === 'today') {
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    params.expiresBefore = endOfToday.toISOString()
  }
  if (filters.expiry === 'next-7-days') {
    params.expiresBefore = new Date(now.getTime() + 7 * DAY_IN_MS).toISOString()
  }

  return params
}

function enrichErrand(
  errand: ErrandListItem,
  suppliersById: Map<string, Supplier>,
): ErrandDashboardItem {
  const supplier = suppliersById.get(errand.supplier_id)

  return {
    ...errand,
    supplier_name: supplier?.name ?? 'Supplier unavailable',
    supplier_building_name: supplier?.building.name ?? 'Pickup location unavailable',
    delivery_building_name: 'Delivery location unavailable',
  }
}

export function applyDeliveryBuildingNames(
  data: OpenErrandDashboardData,
  deliveryBuildings: SupplierReference[],
): OpenErrandDashboardData {
  const buildingsById = new Map(
    deliveryBuildings.map((building) => [building.id, building]),
  )

  return {
    ...data,
    items: data.items.map((errand) => ({
      ...errand,
      delivery_building_name:
        buildingsById.get(errand.delivery_building_id)?.name ??
        'Delivery location unavailable',
    })),
  }
}

export async function loadErrandDashboardBuildings(signal?: AbortSignal) {
  const response = await listSupplierBuildings(signal)
  return response.items
}

export async function loadOpenErrandDashboard(
  filters: ErrandDashboardFilters,
  signal?: AbortSignal,
  now = new Date(),
): Promise<OpenErrandDashboardData> {
  const errandResponse = await listErrands(buildOpenErrandParams(filters, now), signal)
  const supplierIds = [...new Set(errandResponse.items.map((errand) => errand.supplier_id))]
  const suppliers = await Promise.all(
    supplierIds.map((supplierId) => getSupplier(supplierId, signal)),
  )
  const suppliersById = new Map(suppliers.map((supplier) => [supplier.id, supplier]))

  return {
    total: errandResponse.total,
    items: errandResponse.items.map((errand) => enrichErrand(errand, suppliersById)),
  }
}
