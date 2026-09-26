import type { Supplier } from './supplier.types'
import annaImage from '../../../../data/images/ANNA.jpeg'
import coolSpotImage from '../../../../data/images/COOL_SPOT.jpeg'
import instaChefImage from '../../../../data/images/INSTACHEF.jpeg'
import nusCoopImage from '../../../../data/images/NUS_COOP.jpeg'
import printerImage from '../../../../data/images/PRINTER_COM2.jpeg'
import robotCafeImage from '../../../../data/images/ROBOT_CAFE.jpeg'

export const mockSuppliers: Supplier[] = [
  {
    id: 'annas-x-soup-union',
    name: "Anna's x Soup Union",
    category: 'Food',
    building: 'Central Library',
    description: 'Next to NUS Co-op',
    imageUrl: annaImage,
  },
  {
    id: 'nus-co-op',
    name: 'NUS Co-op',
    category: 'Shopping',
    building: 'Central Library',
    description: 'Inside the library on the right side',
    imageUrl: nusCoopImage,
  },
  {
    id: 'printer-com-2',
    name: 'Printer @ COM 2',
    category: 'Printing',
    building: 'COM2',
    description: 'Next to LT19',
    imageUrl: printerImage,
  },
  {
    id: 'cool-spot',
    name: 'Cool Spot',
    category: 'Food',
    building: 'COM2',
    description: 'Opposite LT16',
    imageUrl: coolSpotImage,
  },
  {
    id: 'instachef',
    name: 'InstaChef',
    category: 'Food',
    building: 'The Terrace',
    description: 'Next to the foyer',
    imageUrl: instaChefImage,
  },
  {
    id: 'cafe-robot-cafe',
    name: 'Cafe+ Robot Cafe',
    category: 'Food',
    building: 'Central Library',
    description: 'Opposite the Central Library entrance',
    imageUrl: robotCafeImage,
  },
]
