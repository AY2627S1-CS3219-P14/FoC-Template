import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AdminPage } from './AdminPage'
import {
  createSupplier, deactivateSupplier, listAdminBuildings, listAdminCategories,
  listDeactivatedBuildings, listDeactivatedCategories, listDeactivatedSuppliers, listSuppliers,
  reactivateSupplier, SupplierApiError,
} from '../features/suppliers/supplier.api'
import type { Supplier } from '../features/suppliers/supplier.types'
import { listErrands } from '../features/errands/errand.api'
import { getProfile } from '../features/auth/profile.api'
import type { ErrandListItem } from '../features/errands/errand.types'

vi.mock('../components/layout/AccountMenu', () => ({ AccountMenu: () => <button>Account menu</button> }))
vi.mock('../features/errands/errand.api', () => ({ listErrands: vi.fn() }))
vi.mock('../features/auth/profile.api', () => ({ getProfile: vi.fn() }))

vi.mock('../features/suppliers/supplier.api', async importOriginal => ({
  ...await importOriginal<typeof import('../features/suppliers/supplier.api')>(),
  createBuilding: vi.fn(), createCategory: vi.fn(), createSupplier: vi.fn(),
  deactivateBuilding: vi.fn(), deactivateCategory: vi.fn(), deactivateSupplier: vi.fn(),
  listAdminBuildings: vi.fn(), listAdminCategories: vi.fn(), listDeactivatedBuildings: vi.fn(),
  listDeactivatedCategories: vi.fn(), listDeactivatedSuppliers: vi.fn(), listSuppliers: vi.fn(),
  reactivateBuilding: vi.fn(), reactivateCategory: vi.fn(), reactivateSupplier: vi.fn(),
  updateBuilding: vi.fn(), updateCategory: vi.fn(), updateSupplier: vi.fn(),
}))

const category = { id: 'category-food', name: 'Food', status: 'ACTIVE' as const }
const building = { id: 'building-com3', name: 'COM3', status: 'ACTIVE' as const }
const supplier: Supplier = {
  id: 'supplier-1', name: 'Robot Café', category, building, floor: '1', description: 'Coffee',
  openingTime: '08:00:00', closingTime: '18:00:00', imageUrl: null, status: 'ACTIVE',
}
const page = (items: Supplier[]) => ({ items, page: { number: 0, size: 100, totalElements: items.length, totalPages: 1, hasNext: false, hasPrevious: false } })
const errand: ErrandListItem = {
  id: 'errand-1', status: 'ACCEPTED', requester_id: 'requester-1', courier_id: 'courier-1',
  supplier_id: supplier.id, required_item: 'Two iced coffees', credit_value: 12,
  delivery_building_id: building.id, delivery_floor: '2', delivery_description: null,
  expires_at: '2026-11-10T12:00:00Z', created_at: '2026-11-10T09:00:00Z',
  accepted_at: '2026-11-10T09:05:00Z', delivered_at: null, completed_at: null,
  cancelled_at: null, failed_at: null, failure_reason: null,
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listSuppliers).mockResolvedValue(page([supplier]))
  vi.mocked(listDeactivatedSuppliers).mockResolvedValue(page([]))
  vi.mocked(listAdminCategories).mockResolvedValue({ items: [category] })
  vi.mocked(listDeactivatedCategories).mockResolvedValue({ items: [] })
  vi.mocked(listAdminBuildings).mockResolvedValue({ items: [building] })
  vi.mocked(listDeactivatedBuildings).mockResolvedValue({ items: [] })
  vi.mocked(createSupplier).mockResolvedValue(supplier)
  vi.mocked(deactivateSupplier).mockResolvedValue({ ...supplier, status: 'INACTIVE' })
  vi.mocked(listErrands).mockResolvedValue({ total: 1, items: [errand] })
  vi.mocked(getProfile).mockImplementation(async id => ({
    name: id === errand.requester_id ? 'Jamie Tan' : 'Alex Lim',
    email: `${id}@u.nus.edu`,
  }))
})

function dashboard(path = '/admin') {
  return render(<MemoryRouter initialEntries={[path]}><AdminPage /></MemoryRouter>)
}

describe('Admin dashboard supplier integration', () => {
  it('loads live suppliers, categories and buildings', async () => {
    dashboard('/admin/suppliers')
    expect(await screen.findByText('Robot Café')).toBeInTheDocument()
    expect(listSuppliers).toHaveBeenCalledWith({ page: 0, size: 100 }, expect.any(AbortSignal))
    expect(listDeactivatedSuppliers).toHaveBeenCalled()
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'COM3' })).toBeInTheDocument()
    expect(screen.getByText('08:00–18:00')).toBeInTheDocument()
  })

  it('shows active and inactive directory totals without the old overview subtitle', async () => {
    vi.mocked(listDeactivatedCategories).mockResolvedValue({ items: [{ id: 'old-category', name: 'Old category', status: 'RETIRED' }] })
    vi.mocked(listDeactivatedBuildings).mockResolvedValue({ items: [{ id: 'old-building', name: 'Old building', status: 'RETIRED' }] })
    dashboard()
    expect(await screen.findByText('Directory overview')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Suppliers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Buildings' })).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(3)
    expect(screen.getAllByText('Inactive')).toHaveLength(3)
    expect(screen.getByText('Expired errands')).toBeInTheDocument()
    expect(screen.getByText('Cancelled errands')).toBeInTheDocument()
    expect(screen.getByText('Failed errands')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all errands →' })).toHaveAttribute('href', '/admin/errands')
    expect(screen.getByRole('link', { name: 'Manage categories →' })).toHaveAttribute('href', '/admin/categories')
    expect(screen.getByRole('link', { name: 'Manage buildings →' })).toHaveAttribute('href', '/admin/buildings')
    expect(screen.queryByText('Keep the directory current.')).not.toBeInTheDocument()
    expect(screen.queryByText('Manage the campus supplier directory.')).not.toBeInTheDocument()
  })

  it('submits supplier IDs and nullable optional fields to Supplier Service', async () => {
    dashboard('/admin/suppliers')
    await screen.findByText('Robot Café')
    fireEvent.click(screen.getByRole('button', { name: /Add supplier/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Supplier name *'), { target: { value: 'New Shop' } })
    fireEvent.change(within(dialog).getByLabelText('Category *'), { target: { value: category.id } })
    fireEvent.change(within(dialog).getByLabelText('Building *'), { target: { value: building.id } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save supplier' }))
    await waitFor(() => expect(createSupplier).toHaveBeenCalledWith({
      name: 'New Shop', categoryId: category.id, buildingId: building.id, floor: null,
      description: null, openingTime: null, closingTime: null, imageUrl: null,
    }))
  })

  it('checks time pairs and basic image URL formatting before submission', async () => {
    dashboard('/admin/suppliers')
    await screen.findByText('Robot Café')
    fireEvent.click(screen.getByRole('button', { name: /Add supplier/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Supplier name *'), { target: { value: 'New Shop' } })
    fireEvent.change(within(dialog).getByLabelText('Category *'), { target: { value: category.id } })
    fireEvent.change(within(dialog).getByLabelText('Building *'), { target: { value: building.id } })
    fireEvent.change(within(dialog).getByLabelText('Opening time'), { target: { value: '09:00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save supplier' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('both opening and closing')
    expect(createSupplier).not.toHaveBeenCalled()
    fireEvent.change(within(dialog).getByLabelText('Closing time'), { target: { value: '18:00' } })
    fireEvent.change(within(dialog).getByLabelText('Image URL'), { target: { value: 'ftp://invalid.test/image' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save supplier' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('valid HTTP or HTTPS')
  })

  it('confirms supplier deactivation before calling the lifecycle endpoint', async () => {
    dashboard('/admin/suppliers')
    await screen.findByText('Robot Café')
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Deactivate Robot Café?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(deactivateSupplier).toHaveBeenCalledWith(supplier.id))
  })

  it('loads administrator-wide errands and participant names from live services', async () => {
    dashboard('/admin/errands')
    expect(await screen.findByText('Two iced coffees')).toBeInTheDocument()
    expect(screen.getByText('Jamie Tan')).toBeInTheDocument()
    expect(screen.getByLabelText('Supplier')).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Oldest first' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Lowest credits' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search by item or ID'), { target: { value: 'Jamie Tan' } })
    expect(screen.queryByText('Two iced coffees')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search by item or ID'), { target: { value: 'errand-1' } })
    expect(screen.getByText('Two iced coffees')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View errand-1' }))
    expect(screen.queryByText(/Errand monitoring is read-only/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Robot Café').length).toBeGreaterThan(0)
    expect(listErrands).toHaveBeenCalledWith(
      { page: 0, size: 100, sort: 'created_at,desc' },
      expect.any(AbortSignal),
    )
    expect(getProfile).toHaveBeenCalledWith('requester-1', expect.any(AbortSignal))
    expect(getProfile).toHaveBeenCalledWith('courier-1', expect.any(AbortSignal))
  })

  it('shows a clear reactivation error in a dialog', async () => {
    vi.mocked(listDeactivatedSuppliers).mockResolvedValue(page([{ ...supplier, status: 'INACTIVE' }]))
    vi.mocked(reactivateSupplier).mockRejectedValue(new SupplierApiError(
      'The following selected references are not active: category, building',
      409,
      ['category', 'building'],
    ))
    dashboard('/admin/suppliers')
    await screen.findByText('Robot Café')
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'inactive' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reactivate' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'category and building are inactive. Reactivate them first',
    )
    expect(screen.queryByText(/Inactive references:/)).not.toBeInTheDocument()
  })

  it('searches categories by name and provides a visible user-home link', async () => {
    dashboard('/admin/categories')
    expect(await screen.findByText('Food')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'User home' })).toHaveAttribute('href', '/')
    fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: 'printing' } })
    expect(screen.queryByText('Food')).not.toBeInTheDocument()
    expect(screen.getByText('No categories match that name.')).toBeInTheDocument()
  })

  it('paginates directory entries and prefixes supplier floors', async () => {
    const categories = Array.from({ length: 12 }, (_, index) => ({
      id: `category-${index}`,
      name: `Category ${String(index + 1).padStart(2, '0')}`,
      status: 'ACTIVE' as const,
    }))
    vi.mocked(listAdminCategories).mockResolvedValue({ items: categories })
    const { unmount } = dashboard('/admin/categories')
    expect(await screen.findByText('Category 01')).toBeInTheDocument()
    expect(screen.queryByText('Category 11')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Category 11')).toBeInTheDocument()
    expect(screen.queryByText('Category 01')).not.toBeInTheDocument()
    unmount()

    dashboard('/admin/suppliers')
    expect(await screen.findByText('Floor 1')).toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard / Suppliers')).not.toBeInTheDocument()
  })
})
