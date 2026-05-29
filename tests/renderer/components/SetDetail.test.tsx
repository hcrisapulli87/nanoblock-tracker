import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SetDetail } from '../../../src/renderer/components/SetDetail'
import type { NanoblockSet, CollectionEntry, PriceResult } from '../../../src/shared/types'

const set: NanoblockSet = { id: 'NBPM-001', pokemonName: 'Bulbasaur', pokemonNumber: 1, generation: 1, setCode: 'NBPM-001' }
const entry: CollectionEntry = { setId: 'NBPM-001', condition: 'sealed', notes: 'From Tokyo', dateAdded: '2024-01-01' }
const loading: PriceResult = { source: 'ebay', status: 'loading' }

describe('SetDetail — owned', () => {
  it('shows OWNED badge', () => {
    render(<SetDetail set={set} entry={entry} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    expect(screen.getByText(/OWNED/i)).toBeInTheDocument()
  })

  it('shows current condition as active pill', () => {
    render(<SetDetail set={set} entry={entry} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Sealed/i })).toHaveClass('active')
  })

  it('calls onUpdate with new condition when condition pill is clicked', async () => {
    const onUpdate = vi.fn()
    render(<SetDetail set={set} entry={entry} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={onUpdate} onRemove={vi.fn()} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Built/i }))
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ condition: 'built' }))
  })

  it('calls onRemove when Remove link is clicked', async () => {
    const onRemove = vi.fn()
    render(<SetDetail set={set} entry={entry} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={onRemove} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    await userEvent.click(screen.getByText(/Remove/i))
    expect(onRemove).toHaveBeenCalledWith('NBPM-001')
  })
})

describe('SetDetail — missing', () => {
  it('shows MISSING badge when entry is null', () => {
    render(<SetDetail set={set} entry={null} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    expect(screen.getByText(/MISSING/i)).toBeInTheDocument()
  })

  it('shows Mark as Owned button when missing', () => {
    render(<SetDetail set={set} entry={null} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onMarkOwned={vi.fn()} onBuyLink={vi.fn()} />)
    expect(screen.getByText(/Mark as Owned/i)).toBeInTheDocument()
  })

  it('calls onMarkOwned with condition and notes on confirm', async () => {
    const onMarkOwned = vi.fn()
    render(<SetDetail set={set} entry={null} ebay={loading} nanoblock={loading} onClose={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onMarkOwned={onMarkOwned} onBuyLink={vi.fn()} />)
    await userEvent.click(screen.getByText(/Mark as Owned/i))
    await userEvent.click(screen.getByRole('button', { name: /Confirm/i }))
    expect(onMarkOwned).toHaveBeenCalledWith(expect.objectContaining({ setId: 'NBPM-001', condition: 'sealed' }))
  })
})
