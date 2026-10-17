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

export type ErrandSupplierOption = {
  id: string
  name: string
  category: string
}

export type DeliveryBuildingOption = {
  id: string
  name: string
}
