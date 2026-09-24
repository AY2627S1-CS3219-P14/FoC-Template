import type { Supplier } from './supplier.types'

export const mockSuppliers: Supplier[] = [
  {
    id: 'annas-x-soup-union',
    name: "Anna's x Soup Union",
    category: 'Food',
    building: 'Central Library',
    description: 'Next to NUS Co-op',
  },
  {
    id: 'nus-co-op',
    name: 'NUS Co-op',
    category: 'Shopping',
    building: 'Central Library',
    description: 'Inside the library on the right side',
  },
  {
    id: 'printer-com-2',
    name: 'Printer @ COM 2',
    category: 'Printing',
    building: 'COM 2',
    description: 'Next to LT19',
  },
]
