import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'

function renderedCardTitles() {
  return screen
    .getAllByRole('article')
    .map((card) => within(card).getByRole('heading', { level: 2 }).textContent)
}

describe('DashboardPage', () => {
  it('renders the supported open-errand information from local fixtures', () => {
    render(<DashboardPage />)

    expect(
      screen.getByRole('heading', { name: 'Find an errand on your route' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Open errands' })).toBeInTheDocument()
    expect(screen.getByText('6 available')).toBeInTheDocument()
    const nasiLemakCard = screen
      .getAllByRole('article')
      .find((card) => within(card).queryByText('Nasi Lemak + Iced Milo'))

    expect(nasiLemakCard).toBeDefined()
    expect(within(nasiLemakCard!).getByText('The Deck')).toBeInTheDocument()
    expect(within(nasiLemakCard!).getByText('UTown Residence')).toBeInTheDocument()
    expect(within(nasiLemakCard!).getByText('8 credits')).toBeInTheDocument()
    expect(screen.queryByText('OPEN')).not.toBeInTheDocument()
  })

  it('filters errands by delivery location', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText('Filter by delivery location'), {
      target: { value: 'COM3' },
    })

    expect(screen.getByText('Print and bind project report')).toBeInTheDocument()
    expect(screen.queryByText('Nasi Lemak + Iced Milo')).not.toBeInTheDocument()
    expect(screen.getByText('1 available')).toBeInTheDocument()
  })

  it('filters errands by credit value', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText('Filter by credit value'), {
      target: { value: 'up-to-5' },
    })

    expect(screen.getByText('Notebook and black pens')).toBeInTheDocument()
    expect(screen.queryByText('Two kopi c kosong')).not.toBeInTheDocument()
    expect(screen.getByText('1 available')).toBeInTheDocument()
  })

  it('filters errands by expiry window', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText('Filter by expiry'), {
      target: { value: 'next-4-hours' },
    })

    expect(screen.getByText('Nasi Lemak + Iced Milo')).toBeInTheDocument()
    expect(screen.getByText('Two kopi c kosong')).toBeInTheDocument()
    expect(screen.queryByText('Collect lab goggles')).not.toBeInTheDocument()
    expect(screen.getByText('2 available')).toBeInTheDocument()
  })

  it('sorts errands using API-compatible credit and expiry values', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText('Sort errands'), {
      target: { value: 'credit_value,desc' },
    })
    expect(renderedCardTitles()[0]).toBe('Collect parcel from locker')

    fireEvent.change(screen.getByLabelText('Sort errands'), {
      target: { value: 'expires_at,desc' },
    })
    expect(renderedCardTitles()[0]).toBe('Notebook and black pens')
  })

  it('shows an empty state and clears incompatible filters', () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByLabelText('Filter by delivery location'), {
      target: { value: 'School of Computing' },
    })
    fireEvent.change(screen.getByLabelText('Filter by credit value'), {
      target: { value: '11-plus' },
    })

    expect(screen.getByRole('heading', { name: 'No open errands match' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('6 available')).toBeInTheDocument()
  })

  it('reserves an empty active-errands panel without invented lifecycle data', () => {
    render(<DashboardPage />)

    const panel = screen.getByRole('complementary')
    expect(within(panel).getByRole('heading', { name: 'Active errands' })).toBeInTheDocument()
    expect(within(panel).getByText('No active errands')).toBeInTheDocument()
    expect(
      within(panel).getByText('Errands you request or accept will appear here.'),
    ).toBeInTheDocument()
  })
})
