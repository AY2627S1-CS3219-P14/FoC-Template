import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMockErrandDetails } from '../features/errands/errand-details.mock'
import {
  cancelErrand,
  completeErrand,
  ErrandApiError,
  failErrand,
} from '../features/errands/errand.api'
import { loadErrandDetails } from '../features/errands/errand.view'
import { ErrandDetailsPage } from './ErrandDetailsPage'

const requesterAcceptedId = '2fdf7658-f477-4a52-94ed-cbbf2447e005'
const courierAcceptedId = '6376fe09-c727-43df-b59c-56cc7e0c7de8'
const requesterOpenId = '54a639e7-98f6-4254-8ac3-3a7f1e003bf9'

vi.mock('../features/errands/errand.view', () => ({ loadErrandDetails: vi.fn() }))
vi.mock('../features/errands/errand.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/errands/errand.api')>()),
  cancelErrand: vi.fn(),
  completeErrand: vi.fn(),
  failErrand: vi.fn(),
}))
vi.mock('../features/auth/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    currentUserId: '11111111-1111-4111-8111-111111111111',
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

const loadErrandDetailsMock = vi.mocked(loadErrandDetails)
const cancelErrandMock = vi.mocked(cancelErrand)
const completeErrandMock = vi.mocked(completeErrand)
const failErrandMock = vi.mocked(failErrand)

function renderPage(errandId: string) {
  return render(
    <MemoryRouter initialEntries={[`/errands/${errandId}`]}>
      <Routes>
        <Route path="/errands/:errandId" element={<ErrandDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ErrandDetailsPage', () => {
  beforeEach(() => {
    loadErrandDetailsMock.mockReset()
    cancelErrandMock.mockReset()
    completeErrandMock.mockReset()
    failErrandMock.mockReset()
    cancelErrandMock.mockResolvedValue({
      id: requesterOpenId,
      status: 'CANCELLED',
      cancelled_at: '2026-10-22T04:00:00.000Z',
    })
    completeErrandMock.mockResolvedValue({
      id: requesterAcceptedId,
      status: 'COMPLETED',
      completed_at: '2026-10-22T04:00:00.000Z',
    })
    failErrandMock.mockResolvedValue({
      id: requesterAcceptedId,
      status: 'FAILED',
      failed_at: '2026-10-22T04:00:00.000Z',
      failure_reason: 'The requested item was unavailable.',
    })
    loadErrandDetailsMock.mockImplementation(async (errandId) => {
      const errand = getMockErrandDetails(errandId)
      if (!errand) throw new ErrandApiError('Errand not found.', 404)
      return errand
    })
  })

  it('renders service-backed delivery information', async () => {
    renderPage(requesterAcceptedId)
    expect(
      await screen.findByRole('heading', { name: 'Print and bind project report' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Central Library Print Centre · Central Library, Level 5')).toBeInTheDocument()
    expect(screen.getByText('COM3, Level 2')).toBeInTheDocument()
    expect(screen.getByText('Jordan Tan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to My errands' })).toHaveAttribute('href', '/my-errands')
  })

  it('shows requester actions only for an accepted requester errand', async () => {
    renderPage(requesterAcceptedId)
    expect(await screen.findByRole('button', { name: 'Confirm delivery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Report problem' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
  })

  it('keeps an accepted courier errand read-only', async () => {
    renderPage(courierAcceptedId)
    expect(await screen.findByText('YOU ARE DELIVERING')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delivery in progress' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm delivery' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report problem' })).not.toBeInTheDocument()
  })

  it('cancels an open errand and reloads its details', async () => {
    const openErrand = getMockErrandDetails(requesterOpenId)!
    loadErrandDetailsMock.mockResolvedValueOnce(openErrand).mockResolvedValueOnce({
      ...openErrand,
      status: 'CANCELLED',
      cancelledAt: '2026-10-22T04:00:00.000Z',
    })
    renderPage(requesterOpenId)

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel errand' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel this errand?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel errand' }))

    await waitFor(() =>
      expect(cancelErrandMock).toHaveBeenCalledWith(requesterOpenId, expect.any(AbortSignal)),
    )
    expect(await screen.findByRole('heading', { name: 'Cancelled' })).toBeInTheDocument()
  })

  it('requires and submits a failure reason before reloading', async () => {
    const acceptedErrand = getMockErrandDetails(requesterAcceptedId)!
    loadErrandDetailsMock.mockResolvedValueOnce(acceptedErrand).mockResolvedValueOnce({
      ...acceptedErrand,
      status: 'FAILED',
      failedAt: '2026-10-22T04:00:00.000Z',
      failureReason: 'The requested item was unavailable.',
    })
    renderPage(requesterAcceptedId)

    fireEvent.click(await screen.findByRole('button', { name: 'Report problem' }))
    const dialog = screen.getByRole('dialog', { name: 'Report a problem' })
    const submitButton = within(dialog).getByRole('button', { name: 'Report problem' })
    fireEvent.click(submitButton)
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Enter a reason for reporting this errand.')
    fireEvent.change(within(dialog).getByLabelText(/What went wrong/), {
      target: { value: 'The requested item was unavailable.' },
    })
    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(failErrandMock).toHaveBeenCalledWith(
        requesterAcceptedId,
        'The requested item was unavailable.',
        expect.any(AbortSignal),
      ),
    )
    expect(await screen.findByRole('heading', { name: 'Failed' })).toBeInTheDocument()
  })

  it('keeps the dialog open when a mutation fails', async () => {
    completeErrandMock.mockRejectedValue(new ErrandApiError('Errand is no longer ACCEPTED', 409))
    renderPage(requesterAcceptedId)

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm delivery' }))
    const dialog = screen.getByRole('dialog', { name: 'Confirm this delivery?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm delivery' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Errand is no longer ACCEPTED')
    expect(dialog).toBeInTheDocument()
  })

  it('manually refreshes the current errand', async () => {
    renderPage(requesterAcceptedId)
    await screen.findByRole('heading', { name: 'Print and bind project report' })
    fireEvent.click(screen.getByRole('button', { name: '↻ Refresh' }))
    await waitFor(() => expect(loadErrandDetailsMock).toHaveBeenCalledTimes(2))
  })

  it('shows terminal errands without mutation actions', async () => {
    renderPage('completed-errand')
    expect(await screen.findByRole('heading', { name: 'Completed' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm delivery' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report problem' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
  })

  it('shows a not-found state for an unknown errand', async () => {
    renderPage('missing-errand')
    expect(await screen.findByRole('heading', { name: 'Errand not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to My errands' })).toHaveAttribute('href', '/my-errands')
  })
})
