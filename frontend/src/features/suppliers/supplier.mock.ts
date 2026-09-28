import annaImage from '../../../../data/images/ANNA.jpeg'
import coolSpotImage from '../../../../data/images/COOL_SPOT.jpeg'
import instaChefImage from '../../../../data/images/INSTACHEF.jpeg'
import nusCoopImage from '../../../../data/images/NUS_COOP.jpeg'
import printerImage from '../../../../data/images/PRINTER_COM2.jpeg'
import robotCafeImage from '../../../../data/images/ROBOT_CAFE.jpeg'
import type { SupplierListResponse, SupplierReference } from './supplier.types'

const categories = {
  food: { id: '96d0e3eb-223f-4548-b5eb-87197be96223', name: 'Food' },
  foodAndCoffee: { id: 'ba81f571-d41f-4a29-b9d0-eb749e582d35', name: 'Food/Coffee' },
  printing: { id: '337ae422-5495-4543-a8b9-41e4448d24ec', name: 'Printing' },
  shopping: { id: 'e0effce9-790a-43da-a145-278c286069af', name: 'Shopping' },
} satisfies Record<string, SupplierReference>

const buildings = {
  centralLibrary: {
    id: 'a75aa337-dbcf-42fb-84f5-4f62a76a916a',
    name: 'Central Library',
  },
  com2: { id: '585e31cf-c9b9-45c0-815f-424bc686ebcd', name: 'COM2' },
  terrace: { id: '85865842-763e-49a9-8335-2726ce5783e7', name: 'The Terrace' },
} satisfies Record<string, SupplierReference>

export const mockSupplierResponse: SupplierListResponse = {
  items: [
    {
      id: '4ef8e103-781c-4f6a-8c7c-f2b417e0a940',
      name: "Anna's x Soup Union",
      category: categories.food,
      building: buildings.centralLibrary,
      floor: '1',
      description: 'Next to NUS Co-op',
      openingTime: '09:00:00',
      closingTime: '18:00:00',
      imageUrl: annaImage,
      status: 'ACTIVE',
    },
    {
      id: 'b9945186-e2c5-40eb-b18a-ebf9c27ac006',
      name: 'NUS Co-op',
      category: categories.shopping,
      building: buildings.centralLibrary,
      floor: '1',
      description: 'Inside the library on the right side',
      openingTime: '09:00:00',
      closingTime: '16:00:00',
      imageUrl: nusCoopImage,
      status: 'ACTIVE',
    },
    {
      id: 'e46c9514-0bd5-4a85-b9d0-c88e899e0f22',
      name: 'Printer @ COM 2',
      category: categories.printing,
      building: buildings.com2,
      floor: '1',
      description: 'Next to LT19',
      openingTime: '00:00:00',
      closingTime: '23:59:00',
      imageUrl: printerImage,
      status: 'ACTIVE',
    },
    {
      id: '7f9f0651-22fb-48fd-b23b-681d85afea19',
      name: 'Cool Spot',
      category: categories.food,
      building: buildings.com2,
      floor: '1',
      description: 'Opposite LT16',
      openingTime: '09:00:00',
      closingTime: '21:30:00',
      imageUrl: coolSpotImage,
      status: 'ACTIVE',
    },
    {
      id: 'df553146-d30f-478c-9fd0-21b787ce0c55',
      name: 'InstaChef',
      category: categories.food,
      building: buildings.terrace,
      floor: '1',
      description: 'Next to the foyer',
      openingTime: '00:00:00',
      closingTime: '23:59:00',
      imageUrl: instaChefImage,
      status: 'ACTIVE',
    },
    {
      id: '0e4f677f-f14a-4f05-9226-b1e5e33e12cc',
      name: 'Cafe+ Robot Cafe',
      category: categories.foodAndCoffee,
      building: buildings.centralLibrary,
      floor: '1',
      description: 'Opposite the Central Library entrance',
      openingTime: '00:00:00',
      closingTime: '23:59:00',
      imageUrl: robotCafeImage,
      status: 'ACTIVE',
    },
  ],
  page: {
    number: 0,
    size: 20,
    totalElements: 6,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
}
