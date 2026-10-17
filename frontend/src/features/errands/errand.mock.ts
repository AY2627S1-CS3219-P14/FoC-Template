import type { DeliveryBuildingOption, ErrandSupplierOption } from './errand.types'

export const MOCK_AVAILABLE_CREDITS = 24

export const MOCK_ERRAND_SUPPLIERS: ErrandSupplierOption[] = [
  {
    id: 'central-library-print-centre',
    name: 'Central Library Print Centre',
    category: 'Printing',
  },
  {
    id: 'frontier-canteen',
    name: 'Frontier',
    category: 'Food & Drinks',
  },
  {
    id: 'nus-coop',
    name: 'NUS Co-op',
    category: 'Retail',
  },
]

export const MOCK_DELIVERY_BUILDINGS: DeliveryBuildingOption[] = [
  { id: 'com3', name: 'COM3' },
  { id: 'central-library', name: 'Central Library' },
  { id: 'utown', name: 'University Town' },
  { id: 'yusof-ishak-house', name: 'Yusof Ishak House' },
]
