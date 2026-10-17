import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CreateErrandPage } from './CreateErrandPage'

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

afterEach(() => vi.unstubAllGlobals())

function futureLocalDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

describe('CreateErrandPage', () => {
  it('starts without a supplier when opened directly', () => {
    renderPage('/errands/new')

    expect(screen.getByRole('heading', { name: 'Create an errand' })).toBeInTheDocument()
    expect(screen.getByLabelText(/pickup supplier/i)).toHaveValue('')
    expect(screen.getByLabelText(/category/i)).toHaveValue('')
  })

  it('preselects supplier details passed from the supplier browser', () => {
    renderPage({
      pathname: '/errands/new',
      search: '?supplierId=live-supplier-id',
      state: {
        supplier: {
          id: 'live-supplier-id',
          name: 'Techno Edge',
          category: 'Food & Drinks',
        },
      },
    })

    expect(screen.getByLabelText(/pickup supplier/i)).toHaveValue('live-supplier-id')
    expect(screen.getByLabelText(/category/i)).toHaveValue('Food & Drinks')
  })

  it('updates the read-only category when the supplier changes', () => {
    renderPage('/errands/new')

    fireEvent.change(screen.getByLabelText(/pickup supplier/i), {
      target: { value: 'central-library-print-centre' },
    })

    expect(screen.getByLabelText(/category/i)).toHaveValue('Printing')
    expect(screen.getByLabelText(/category/i)).toHaveAttribute('readonly')
  })

  it('shows local validation errors without calling a backend', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage('/errands/new')

    fireEvent.click(screen.getByRole('button', { name: 'Create errand' }))

    expect(screen.getByText('Choose a pickup supplier.')).toBeInTheDocument()
    expect(screen.getByText('Describe the items you need.')).toBeInTheDocument()
    expect(screen.getByText('Choose a delivery building.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a complete local preview without creating an errand', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage('/errands/new')

    fireEvent.change(screen.getByLabelText(/pickup supplier/i), {
      target: { value: 'central-library-print-centre' },
    })
    fireEvent.change(screen.getByLabelText(/requested items/i), {
      target: { value: 'Two sandwiches and one coffee' },
    })
    fireEvent.change(screen.getByLabelText(/delivery building/i), {
      target: { value: 'com3' },
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
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
