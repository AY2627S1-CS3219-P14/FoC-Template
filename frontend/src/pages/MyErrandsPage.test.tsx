import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MyErrandsPage } from './MyErrandsPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <MyErrandsPage />
    </MemoryRouter>,
  )
}

describe('MyErrandsPage', () => {
  it('renders active requester and courier errands from local fixtures', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'My errands' })).toBeInTheDocument()
    expect(screen.getByText('4 active')).toBeInTheDocument()
    expect(screen.getByText('Awaiting confirmation')).toBeInTheDocument()
    expect(screen.getByText('Waiting for requester')).toBeInTheDocument()
    expect(screen.getAllByText('Requester')).toHaveLength(2)
    expect(screen.getAllByText('Courier')).toHaveLength(2)
  })

  it('filters errands by the user role', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Requesting' }))

    expect(screen.getByText('2 active')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    for (const card of screen.getAllByRole('article')) {
      expect(within(card).getByText('Requester')).toBeInTheDocument()
      expect(within(card).queryByText('Courier')).not.toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Delivering' }))

    expect(screen.getByText('2 active')).toBeInTheDocument()
    for (const card of screen.getAllByRole('article')) {
      expect(within(card).getByText('Courier')).toBeInTheDocument()
      expect(within(card).queryByText('Requester')).not.toBeInTheDocument()
    }
  })

  it('exposes the filter state accessibly', () => {
    renderPage()

    const all = screen.getByRole('button', { name: 'All' })
    const requesting = screen.getByRole('button', { name: 'Requesting' })
    expect(all).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(requesting)
    expect(all).toHaveAttribute('aria-pressed', 'false')
    expect(requesting).toHaveAttribute('aria-pressed', 'true')
  })

  it('links each errand to its details route', () => {
    renderPage()

    expect(screen.getAllByRole('link', { name: 'View details →' })[0]).toHaveAttribute(
      'href',
      '/errands/2fdf7658-f477-4a52-94ed-cbbf2447e005',
    )
  })
})
