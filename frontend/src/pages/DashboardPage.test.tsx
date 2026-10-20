import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadOpenErrandDashboard } from '../features/errands/errand.dashboard'
import type { OpenErrandDashboardData } from '../features/errands/errand.dashboard'
import type { ErrandDashboardItem } from '../features/errands/errand.types'
import { DashboardPage } from './DashboardPage'

vi.mock('../features/errands/errand.dashboard', () => ({
  loadOpenErrandDashboard: vi.fn(),
}))

const loadOpenErrandDashboardMock = vi.mocked(loadOpenErrandDashboard)

const openErrand: ErrandDashboardItem = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'OPEN',
  requester_id: '11111111-1111-4111-8111-111111111111',
  courier_id: null,
  supplier_id: '22222222-2222-4222-8222-222222222222',
  required_item: 'Nasi Lemak + Iced Milo',
  credit_value: 8,
  delivery_building_id: '33333333-3333-4333-8333-333333333333',
  delivery_floor: null,
  delivery_description: 'Meet at the main entrance',
  expires_at: '2026-10-21T04:00:00.000Z',
  created_at: '2026-10-20T04:00:00.000Z',
  accepted_at: null,
  completed_at: null,
  cancelled_at: null,
  failed_at: null,
  failure_reason: null,
  supplier_name: 'The Deck',
  supplier_building_name: 'Faculty of Arts and Social Sciences',
  delivery_building_name: 'UTown Residence',
}

const secondOpenErrand: ErrandDashboardItem = {
  ...openErrand,
  id: '660e8400-e29b-41d4-a716-446655440000',
  supplier_id: '44444444-4444-4444-8444-444444444444',
  delivery_building_id: '55555555-5555-4555-8555-555555555555',
  required_item: 'Print and bind project report',
  credit_value: 12,
  supplier_name: 'Central Library Printing',
  supplier_building_name: 'Central Library',
  delivery_building_name: 'COM3',
}

const dashboardData: OpenErrandDashboardData = {
  total: 2,
  items: [openErrand, secondOpenErrand],
  deliveryBuildings: [
    { id: openErrand.delivery_building_id, name: openErrand.delivery_building_name },
    {
      id: secondOpenErrand.delivery_building_id,
      name: secondOpenErrand.delivery_building_name,
    },
  ],
}

const defaultFilters = {
  deliveryBuildingId: '',
  credit: 'all',
  expiry: 'all',
  sort: 'expires_at,asc',
} as const

describe('DashboardPage', () => {
  beforeEach(() => {
    loadOpenErrandDashboardMock.mockReset()
    loadOpenErrandDashboardMock.mockResolvedValue(dashboardData)
  })

  it('shows a loading state before live open errands arrive', async () => {
    let resolveRequest!: (data: OpenErrandDashboardData) => void
    loadOpenErrandDashboardMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    render(<DashboardPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading open errands…')

    await act(async () => resolveRequest(dashboardData))
    expect(await screen.findByText('Nasi Lemak + Iced Milo')).toBeInTheDocument()
  })

  it('renders API-backed card information and friendly status text', async () => {
    render(<DashboardPage />)

    expect(await screen.findByText('2 available')).toBeInTheDocument()
    const nasiLemakCard = screen
      .getAllByRole('article')
      .find((card) => within(card).queryByText('Nasi Lemak + Iced Milo'))

    expect(nasiLemakCard).toBeDefined()
    expect(within(nasiLemakCard!).getByText('The Deck')).toBeInTheDocument()
    expect(within(nasiLemakCard!).getByText('UTown Residence')).toBeInTheDocument()
    expect(within(nasiLemakCard!).getByText('8 credits')).toBeInTheDocument()
    expect(screen.queryByText('OPEN')).not.toBeInTheDocument()
    expect(loadOpenErrandDashboardMock).toHaveBeenCalledWith(
      defaultFilters,
      expect.any(AbortSignal),
    )
  })

  it('requests a new result set when the delivery location changes', async () => {
    render(<DashboardPage />)
    await screen.findByText('2 available')

    fireEvent.change(screen.getByLabelText('Filter by delivery location'), {
      target: { value: secondOpenErrand.delivery_building_id },
    })

    await waitFor(() =>
      expect(loadOpenErrandDashboardMock).toHaveBeenLastCalledWith(
        {
          ...defaultFilters,
          deliveryBuildingId: secondOpenErrand.delivery_building_id,
        },
        expect.any(AbortSignal),
      ),
    )
  })

  it('requests API-compatible credit and expiry filters', async () => {
    render(<DashboardPage />)
    await screen.findByText('2 available')

    fireEvent.change(screen.getByLabelText('Filter by credit value'), {
      target: { value: '6-to-10' },
    })
    await waitFor(() =>
      expect(loadOpenErrandDashboardMock).toHaveBeenLastCalledWith(
        { ...defaultFilters, credit: '6-to-10' },
        expect.any(AbortSignal),
      ),
    )

    fireEvent.change(screen.getByLabelText('Filter by expiry'), {
      target: { value: 'next-4-hours' },
    })
    await waitFor(() =>
      expect(loadOpenErrandDashboardMock).toHaveBeenLastCalledWith(
        { ...defaultFilters, credit: '6-to-10', expiry: 'next-4-hours' },
        expect.any(AbortSignal),
      ),
    )
  })

  it('requests a new server ordering when the sort changes', async () => {
    render(<DashboardPage />)
    await screen.findByText('2 available')

    fireEvent.change(screen.getByLabelText('Sort errands'), {
      target: { value: 'credit_value,desc' },
    })

    await waitFor(() =>
      expect(loadOpenErrandDashboardMock).toHaveBeenLastCalledWith(
        { ...defaultFilters, sort: 'credit_value,desc' },
        expect.any(AbortSignal),
      ),
    )
  })

  it('shows an empty state and clears incompatible filters', async () => {
    loadOpenErrandDashboardMock.mockResolvedValue({
      total: 0,
      items: [],
      deliveryBuildings: dashboardData.deliveryBuildings,
    })
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'No open errands match' })

    fireEvent.change(screen.getByLabelText('Filter by delivery location'), {
      target: { value: secondOpenErrand.delivery_building_id },
    })
    fireEvent.change(screen.getByLabelText('Filter by credit value'), {
      target: { value: '11-plus' },
    })
    await screen.findByRole('heading', { name: 'No open errands match' })
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() =>
      expect(loadOpenErrandDashboardMock).toHaveBeenLastCalledWith(
        defaultFilters,
        expect.any(AbortSignal),
      ),
    )
  })

  it('shows service errors and retries the request', async () => {
    loadOpenErrandDashboardMock
      .mockRejectedValueOnce(new Error('Could not connect to the Order Service.'))
      .mockResolvedValueOnce(dashboardData)
    render(<DashboardPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not connect to the Order Service.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Nasi Lemak + Iced Milo')).toBeInTheDocument()
    expect(loadOpenErrandDashboardMock).toHaveBeenCalledTimes(2)
  })

  it('cancels the previous request when filters change', async () => {
    loadOpenErrandDashboardMock.mockImplementation(() => new Promise(() => undefined))
    render(<DashboardPage />)
    const firstSignal = loadOpenErrandDashboardMock.mock.calls[0][1]

    fireEvent.change(screen.getByLabelText('Filter by credit value'), {
      target: { value: 'up-to-5' },
    })

    await waitFor(() => expect(firstSignal?.aborted).toBe(true))
  })

  it('keeps the active-errands panel as an empty reserved area', async () => {
    render(<DashboardPage />)
    await screen.findByText('2 available')

    const panel = screen.getByRole('complementary')
    expect(within(panel).getByRole('heading', { name: 'Active errands' })).toBeInTheDocument()
    expect(within(panel).getByText('No active errands')).toBeInTheDocument()
    expect(
      within(panel).getByText('Errands you request or accept will appear here.'),
    ).toBeInTheDocument()
  })
})
