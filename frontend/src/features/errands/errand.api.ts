import { authenticatedFetch } from '../auth/auth.fetch'
import type {
  CreateErrandRequest,
  CreateErrandResponse,
  ErrandListResponse,
  ErrandValidationIssue,
  ListErrandsParams,
} from './errand.types'

const orderApiBaseUrl = (import.meta.env.VITE_ORDER_API_URL ?? '').trim().replace(/\/+$/, '')

type OrderApiProblem = {
  detail?: string | ErrandValidationIssue[]
}

function isValidationIssue(value: unknown): value is ErrandValidationIssue {
  if (!value || typeof value !== 'object') return false

  const issue = value as Partial<ErrandValidationIssue>
  return (
    Array.isArray(issue.loc) &&
    typeof issue.msg === 'string' &&
    typeof issue.type === 'string'
  )
}

export class ErrandApiError extends Error {
  status: number
  issues: ErrandValidationIssue[]

  constructor(message: string, status: number, issues: ErrandValidationIssue[] = []) {
    super(message)
    this.name = 'ErrandApiError'
    this.status = status
    this.issues = issues
  }
}

export async function listErrands(
  {
    errandId,
    supplierId,
    requesterId,
    courierId,
    statuses,
    deliveryBuildingId,
    minCreditValue,
    maxCreditValue,
    expiresAfter,
    expiresBefore,
    availableOnly,
    sort,
    page,
    size,
  }: ListErrandsParams = {},
  signal?: AbortSignal,
): Promise<ErrandListResponse> {
  const searchParams = new URLSearchParams()

  if (errandId) searchParams.set('errand_id', errandId)
  if (supplierId) searchParams.set('supplier_id', supplierId)
  if (requesterId) searchParams.set('requester_id', requesterId)
  if (courierId) searchParams.set('courier_id', courierId)
  statuses?.forEach((status) => searchParams.append('status', status))
  if (deliveryBuildingId) {
    searchParams.set('delivery_building_id', deliveryBuildingId)
  }
  if (minCreditValue !== undefined) {
    searchParams.set('min_credit_value', minCreditValue.toString())
  }
  if (maxCreditValue !== undefined) {
    searchParams.set('max_credit_value', maxCreditValue.toString())
  }
  if (expiresAfter) searchParams.set('expires_after', expiresAfter)
  if (expiresBefore) searchParams.set('expires_before', expiresBefore)
  if (availableOnly !== undefined) {
    searchParams.set('available_only', availableOnly.toString())
  }
  if (sort) searchParams.set('sort', sort)
  if (page !== undefined) searchParams.set('page', page.toString())
  if (size !== undefined) searchParams.set('size', size.toString())

  const query = searchParams.toString()
  const url = `${orderApiBaseUrl}/errands${query ? `?${query}` : ''}`
  let response: Response

  try {
    response = await authenticatedFetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrandApiError('Could not connect to the Order Service.', 0)
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as OrderApiProblem | null
    const issues = Array.isArray(problem?.detail)
      ? problem.detail.filter(isValidationIssue)
      : []
    const message =
      typeof problem?.detail === 'string'
        ? problem.detail
        : issues[0]?.msg ?? 'Unable to load errands right now. Please try again.'

    throw new ErrandApiError(message, response.status, issues)
  }

  return (await response.json()) as ErrandListResponse
}

export async function createErrand(
  request: CreateErrandRequest,
  signal?: AbortSignal,
): Promise<CreateErrandResponse> {
  let response: Response

  try {
    response = await authenticatedFetch(`${orderApiBaseUrl}/errand/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrandApiError('Could not connect to the Order Service.', 0)
  }

  if (response.status !== 201) {
    const problem = (await response.json().catch(() => null)) as OrderApiProblem | null
    const issues = Array.isArray(problem?.detail)
      ? problem.detail.filter(isValidationIssue)
      : []
    const message =
      typeof problem?.detail === 'string'
        ? problem.detail
        : issues[0]?.msg ?? 'Unable to create the errand right now. Please try again.'

    throw new ErrandApiError(message, response.status, issues)
  }

  return (await response.json()) as CreateErrandResponse
}
