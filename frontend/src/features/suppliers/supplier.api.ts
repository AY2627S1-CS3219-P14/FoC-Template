import type {
  SupplierListResponse,
  SupplierReferenceListResponse,
} from './supplier.types'

const supplierApiBaseUrl = (import.meta.env.VITE_SUPPLIER_API_URL ?? '').trim().replace(/\/+$/, '')

type SupplierSort = 'name,asc' | 'name,desc'

type ListSuppliersParams = {
  query?: string
  categoryId?: string
  buildingId?: string
  page?: number
  size?: number
  sort?: SupplierSort
}

type ProblemDetails = {
  detail?: string
  title?: string
}

export class SupplierApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SupplierApiError'
    this.status = status
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${supplierApiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new SupplierApiError('Could not connect to the Supplier Service.', 0)
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null
    const message = problem?.detail ?? problem?.title ?? 'Unable to load supplier data.'
    throw new SupplierApiError(message, response.status)
  }

  return (await response.json()) as T
}

export async function listSuppliers(
  {
    query,
    categoryId,
    buildingId,
    page = 0,
    size = 20,
    sort = 'name,asc',
  }: ListSuppliersParams = {},
  signal?: AbortSignal,
) {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
  })

  if (query) searchParams.set('q', query)
  if (categoryId) searchParams.set('categoryId', categoryId)
  if (buildingId) searchParams.set('buildingId', buildingId)

  return getJson<SupplierListResponse>(`/suppliers?${searchParams}`, signal)
}

export function listSupplierCategories(signal?: AbortSignal) {
  return getJson<SupplierReferenceListResponse>('/categories', signal)
}

export function listSupplierBuildings(signal?: AbortSignal) {
  return getJson<SupplierReferenceListResponse>('/buildings', signal)
}
