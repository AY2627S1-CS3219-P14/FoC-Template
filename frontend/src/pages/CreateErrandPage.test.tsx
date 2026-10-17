import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listSupplierBuildings, listSuppliers } from '../features/suppliers/supplier.api'
import type { Supplier, SupplierReference } from '../features/suppliers/supplier.types'
import { CreateErrandPage } from './CreateErrandPage'

vi.mock('../features/suppliers/supplier.api', () => ({
  listSuppliers: vi.fn(),
  listSupplierBuildings: vi.fn(),
}))

const listSuppliersMock = vi.mocked(listSuppliers)
const listSupplierBuildingsMock = vi.mocked(listSupplierBuildings)

const suppliers: Supplier[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Central Library Print Centre',
    category: { id: 'category-printing', name: 'Printing' },
    building: { id: 'building-central-library', name: 'Central Library' },
    floor: '1',
    description: null,
    openingTime: '09:00:00',
    closingTime: '18:00:00',
    imageUrl: null,
    status: 'ACTIVE',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Techno Edge',
    category: { id: 'category-food', name: 'Food & Drinks' },
    building: { id: 'building-techno-edge', name: 'Techno Edge' },
    floor: '1',
    description: null,
    openingTime: '08:00:00',
    closingTime: '20:00:00',
    imageUrl: null,
    status: 'ACTIVE',
  },
]

const buildings: SupplierReference[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'COM3' },
  { id: '55555555-5555-4555-8555-555555555555', name: 'Central Library' },
]

const supplierResponse = {
  items: suppliers,
  page: {
    number: 0,
    size: 100,
    totalElements: suppliers.length,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
}

type TestLocation = {
  pathname: string
  search?: string
  state?: unknown
}

function renderPage(initialEntry: string | TestLocation) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CreateErrandPage />
    </MemoryRouter>,
  )
}

function futureLocalDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

describe('CreateErrandPage', () => {
  beforeEach(() => {
    listSuppliersMock.mockReset()
    listSupplierBuildingsMock.mockReset()
    listSuppliersMock.mockResolvedValue(supplierResponse)
    listSupplierBuildingsMock.mockResolvedValue({ items: buildings })
  })

  it('loads suppliers and delivery buildings from the Supplier Service', async () => {
    renderPage('/errands/new')

    expect(screen.getByLabelText(/pickup supplier/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create errand' })).toBeDisabled()

    expect(
      await screen.findByRole('option', { name: 'Central Library Print Centre' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'COM3' })).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup supplier/i)).toBeEnabled()
    expect(listSuppliersMock).toHaveBeenCalledWith(
      { size: 100 },
      expect.any(AbortSignal),
    )
    expect(listSupplierBuildingsMock).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('starts without a supplier when opened directly', async () => {
    renderPage('/errands/new')

    await screen.findByRole('option', { name: 'Central Library Print Centre' })
    expect(screen.getByRole('heading', { name: 'Create an errand' })).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup supplier/i)).toHaveValue('')
    expect(screen.getByLabelText(/category/i)).toHaveValue('')
  })

  it('preselects a supplier from the supplier browser after options load', async () => {
    renderPage({
      pathname: '/errands/new',
      search: '?supplierId=44444444-4444-4444-8444-444444444444',
    })

    await waitFor(() =>
      expect(screen.getByLabelText(/pickup supplier/i)).toHaveValue(
        '44444444-4444-4444-8444-444444444444',
      ),
    )
    expect(screen.getByLabelText(/category/i)).toHaveValue('Food & Drinks')
  })

  it('clears an unknown preselected supplier', async () => {
    renderPage('/errands/new?supplierId=unknown-supplier')

    await screen.findByRole('option', { name: 'Central Library Print Centre' })
    expect(screen.getByLabelText(/pickup supplier/i)).toHaveValue('')
  })

  it('updates the read-only category when the supplier changes', async () => {
    renderPage('/errands/new')
    await screen.findByRole('option', { name: 'Central Library Print Centre' })

    fireEvent.change(screen.getByLabelText(/pickup supplier/i), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    })

    expect(screen.getByLabelText(/category/i)).toHaveValue('Printing')
    expect(screen.getByLabelText(/category/i)).toHaveAttribute('readonly')
  })

  it('shows an error and retries loading the form options', async () => {
    listSuppliersMock.mockRejectedValueOnce(new Error('Supplier Service is unavailable.'))
    renderPage('/errands/new')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Supplier Service is unavailable.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('option', { name: 'Central Library Print Centre' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(listSuppliersMock).toHaveBeenCalledTimes(2)
  })

  it('shows empty states when no options are available', async () => {
    listSuppliersMock.mockResolvedValue({
      ...supplierResponse,
      items: [],
      page: { ...supplierResponse.page, totalElements: 0, totalPages: 0 },
    })
    listSupplierBuildingsMock.mockResolvedValue({ items: [] })
    renderPage('/errands/new')

    expect(
      await screen.findByText('No active suppliers are currently available.'),
    ).toBeInTheDocument()
    expect(screen.getByText('No delivery buildings are currently available.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create errand' })).toBeDisabled()
  })

  it('shows local validation errors without creating an errand', async () => {
    renderPage('/errands/new')
    await screen.findByRole('option', { name: 'Central Library Print Centre' })

    fireEvent.click(screen.getByRole('button', { name: 'Create errand' }))

    expect(screen.getByText('Choose a pickup supplier.')).toBeInTheDocument()
    expect(screen.getByText('Describe the items you need.')).toBeInTheDocument()
    expect(screen.getByText('Choose a delivery building.')).toBeInTheDocument()
  })

  it('accepts a complete local preview without creating an errand', async () => {
    renderPage('/errands/new')
    await screen.findByRole('option', { name: 'Central Library Print Centre' })

    fireEvent.change(screen.getByLabelText(/pickup supplier/i), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    })
    fireEvent.change(screen.getByLabelText(/requested items/i), {
      target: { value: 'Two sandwiches and one coffee' },
    })
    fireEvent.change(screen.getByLabelText(/delivery building/i), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    })
    fireEvent.change(screen.getByLabelText(/floor/i), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(/collect before/i), {
      target: { value: futureLocalDateTime() },
    })
    fireEvent.change(screen.getByLabelText(/delivery instructions/i), {
      target: { value: 'Meet outside room 03-12' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create errand' }))

    expect(
      screen.getByText('Frontend preview only — no errand was created.'),
    ).toBeInTheDocument()
  })
})
