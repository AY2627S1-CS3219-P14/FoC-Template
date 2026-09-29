export type SupplierStatus = 'ACTIVE' | 'INACTIVE'

export type SupplierReference = {
  id: string
  name: string
}

export type Supplier = {
  id: string
  name: string
  category: SupplierReference
  building: SupplierReference
  floor: string | null
  description: string | null
  openingTime: string | null
  closingTime: string | null
  imageUrl: string | null
  status: SupplierStatus
}

export type SupplierPage = {
  number: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export type SupplierListResponse = {
  items: Supplier[]
  page: SupplierPage
}

export type SupplierReferenceListResponse = {
  items: SupplierReference[]
}
