import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ErrandDetailsPage } from './ErrandDetailsPage'

const requesterAcceptedId = '2fdf7658-f477-4a52-94ed-cbbf2447e005'
const courierAcceptedId = '6376fe09-c727-43df-b59c-56cc7e0c7de8'
const requesterOpenId = '54a639e7-98f6-4254-8ac3-3a7f1e003bf9'

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
  it('renders the selected errand and its delivery information', () => {
    renderPage(requesterAcceptedId)

    expect(
      screen.getByRole('heading', { name: 'Print and bind project report' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Central Library Print Centre · Central Library, Level 5')).toBeInTheDocument()
    expect(screen.getByText('COM3, Level 2')).toBeInTheDocument()
    expect(screen.getByText('Jordan Tan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to My errands' })).toHaveAttribute(
      'href',
      '/my-errands',
    )
    expect(screen.getByRole('button', { name: '↻ Refresh' })).toBeInTheDocument()
  })

  it('shows requester actions only for an accepted requester errand', () => {
    renderPage(requesterAcceptedId)

    expect(screen.getByRole('button', { name: 'Confirm delivery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Report problem' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
  })

  it('keeps an accepted courier errand read-only', () => {
    renderPage(courierAcceptedId)

    expect(screen.getByText('YOU ARE DELIVERING')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delivery in progress' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm delivery' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report problem' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
  })

  it('lets the requester preview cancelling an open errand', () => {
    renderPage(requesterOpenId)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel errand' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel this errand?' })
    expect(dialog).toHaveTextContent('Coffee Bean order')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel errand' }))

    expect(screen.getByRole('heading', { name: 'Cancelled' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preview updated locally. No backend request was sent.',
    )
  })

  it('requires a reason before previewing a failed errand', () => {
    renderPage(requesterAcceptedId)

    fireEvent.click(screen.getByRole('button', { name: 'Report problem' }))
    const dialog = screen.getByRole('dialog', { name: 'Report a problem' })
    const submitButton = within(dialog).getByRole('button', { name: 'Report problem' })

    fireEvent.click(submitButton)
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Enter a reason for reporting this errand.',
    )

    fireEvent.change(within(dialog).getByLabelText(/What went wrong/), {
      target: { value: 'The requested item was unavailable.' },
    })
    fireEvent.click(submitButton)

    expect(screen.getByRole('heading', { name: 'Failed' })).toBeInTheDocument()
    expect(screen.getByText('The requested item was unavailable.')).toBeInTheDocument()
  })

  it('shows terminal errands without mutation actions', () => {
    renderPage('completed-errand')

    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm delivery' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Report problem' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel errand' })).not.toBeInTheDocument()
  })

  it('shows a not-found state for an unknown errand', () => {
    renderPage('missing-errand')

    expect(screen.getByRole('heading', { name: 'Errand not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to My errands' })).toHaveAttribute(
      'href',
      '/my-errands',
    )
  })
})

