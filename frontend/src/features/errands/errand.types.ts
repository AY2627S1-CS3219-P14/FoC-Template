export type ErrandDraft = {
  supplierId: string
  requiredItem: string
  deliveryBuildingId: string
  deliveryFloor: string
  deliveryDescription: string
  expiresAt: string
  creditValue: string
}

export type ErrandDraftField = keyof ErrandDraft

export type ErrandDraftErrors = Partial<Record<ErrandDraftField, string>>

export type ErrandStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED'

export type CreateErrandRequest = {
  supplier_id: string
  required_item: string
  credit_value: number
  delivery_building_id: string
  delivery_floor: string | null
  delivery_description: string | null
  expires_at: string
}

export type CreateErrandResponse = CreateErrandRequest & {
  id: string
  status: ErrandStatus
  requester_id: string
  courier_id: string | null
  created_at: string
}

export type ErrandListItem = {
  id: string
  status: ErrandStatus
  requester_id: string
  courier_id: string | null
  supplier_id: string
  required_item: string
  credit_value: number
  delivery_building_id: string
  delivery_floor: string | null
  delivery_description: string | null
  expires_at: string
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  failed_at: string | null
  failure_reason: string | null
}

export type ErrandListResponse = {
  total: number
  items: ErrandListItem[]
}

export type ErrandListSort =
  | 'created_at,asc'
  | 'created_at,desc'
  | 'credit_value,asc'
  | 'credit_value,desc'
  | 'expires_at,asc'
  | 'expires_at,desc'

export type ListErrandsParams = {
  errandId?: string
  supplierId?: string
  requesterId?: string
  courierId?: string
  statuses?: ErrandStatus[]
  deliveryBuildingId?: string
  minCreditValue?: number
  maxCreditValue?: number
  expiresAfter?: string
  expiresBefore?: string
  availableOnly?: boolean
  sort?: ErrandListSort
  page?: number
  size?: number
}

export type ErrandDashboardItem = ErrandListItem & {
  supplier_name: string
  supplier_building_name: string
  delivery_building_name: string
}

export type ErrandCreditFilter = 'all' | 'up-to-5' | '6-to-10' | '11-plus'

export type ErrandExpiryFilter = 'all' | 'next-4-hours' | 'today' | 'next-7-days'

export type ErrandSort =
  Exclude<ErrandListSort, 'created_at,asc' | 'created_at,desc'>

export type ErrandValidationIssue = {
  loc: Array<string | number>
  msg: string
  type: string
}
