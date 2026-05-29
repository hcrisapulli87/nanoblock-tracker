import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SetGrid } from '../../../src/renderer/components/SetGrid'
import { CATALOG } from '../../../src/renderer/data/catalog'
import type { SidebarFilters } from '../../../src/renderer/components/Sidebar'

const ownedIds = new Set(['NBPM-001', 'NBPM-004'])
const allFilters: SidebarFilters = { search: '', status: 'all', generation: 0, sort: 'number-asc' }

describe('SetGrid', () => {
  it('renders a card for every set in the catalog', () => {
    render(<SetGrid catalog={CATALOG} ownedIds={ownedIds} filters={allFilters} onCardClick={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(CATALOG.length)
  })

  it('filters to only owned sets when status is owned', () => {
    render(<SetGrid catalog={CATALOG} ownedIds={ownedIds} filters={{ ...allFilters, status: 'owned' }} onCardClick={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(ownedIds.size)
  })

  it('filters by name search (case-insensitive)', () => {
    // Dragonite only has one set (NBPM-011) — unambiguous search
    render(<SetGrid catalog={CATALOG} ownedIds={ownedIds} filters={{ ...allFilters, search: 'dragonit' }} onCardClick={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(1)
    expect(screen.getByText('Dragonite')).toBeInTheDocument()
  })

  it('filters by generation', () => {
    const gen1Count = CATALOG.filter(s => s.generation === 1).length
    render(<SetGrid catalog={CATALOG} ownedIds={ownedIds} filters={{ ...allFilters, generation: 1 }} onCardClick={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(gen1Count)
  })
})
