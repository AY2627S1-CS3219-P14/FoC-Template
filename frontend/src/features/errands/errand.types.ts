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

export type ErrandValidationIssue = {
  loc: Array<string | number>
  msg: string
  type: string
}
