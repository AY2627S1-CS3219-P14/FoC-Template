import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AdminPreviewPage } from './AdminPreviewPage'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function preview(path = '/admin') {
  render(<MemoryRouter initialEntries={[path]}><AdminPreviewPage /></MemoryRouter>)
}

describe('Admin dashboard preview', () => {
  it('renders without API requests and keeps edits across admin navigation', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    preview()
    fireEvent.click(screen.getByRole('button', { name: 'Add category →' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Name *'), { target: { value: 'Essentials' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add to directory' }))
    fireEvent.click(screen.getByRole('link', { name: /Categories/ }))
    expect(screen.getByText('Essentials')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('edits suppliers locally, validates duplicates, and resets after confirmation', () => {
    preview('/admin/suppliers')
    fireEvent.click(screen.getByRole('button', { name: 'Edit Robot Café' }))
    let dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Supplier name *'), { target: { value: 'Campus Print' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save supplier' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('already exists')
    fireEvent.change(within(dialog).getByLabelText('Supplier name *'), { target: { value: 'Morning Café' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save supplier' }))
    expect(screen.getByRole('button', { name: 'Edit Morning Café' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset sample data' }))
    dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reset sample data' }))
    expect(screen.getByRole('button', { name: 'Edit Robot Café' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Morning Café' })).not.toBeInTheDocument()
  })

  it('filters errands and shows failure details without moderation actions', () => {
    preview('/admin/errands')
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Failed' } })
    expect(screen.queryByText('Two iced lattes')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View ERR-1045' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Requested item was out of stock/)).toBeInTheDocument()
    expect(within(dialog).getByText('Alex Lim')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Cancel errand|Complete errand/ })).not.toBeInTheDocument()
  })

  it('provides recovery from empty supplier search results', () => {
    preview('/admin/suppliers')
    fireEvent.change(screen.getByLabelText('Search suppliers'), { target: { value: 'does not exist' } })
    expect(screen.getByText('No suppliers match your filters.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('button', { name: 'Edit Robot Café' })).toBeInTheDocument()
  })
})
