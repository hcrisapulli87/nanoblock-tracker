import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SetCard } from '../../../src/renderer/components/SetCard'
import type { NanoblockSet } from '../../../src/shared/types'

const set: NanoblockSet = {
  id: 'NBPM-001',
  pokemonName: 'Bulbasaur',
  pokemonNumber: 1,
  generation: 1,
  setCode: 'NBPM-001',
  imageUrl: 'https://example.com/bulbasaur.png',
}

describe('SetCard', () => {
  it('shows the pokemon name', () => {
    render(<SetCard set={set} isOwned={true} onClick={vi.fn()} />)
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument()
  })

  it('shows Owned indicator when owned', () => {
    render(<SetCard set={set} isOwned={true} onClick={vi.fn()} />)
    expect(screen.getByText(/Owned/i)).toBeInTheDocument()
  })

  it('shows Missing indicator when not owned', () => {
    render(<SetCard set={set} isOwned={false} onClick={vi.fn()} />)
    expect(screen.getByText(/Missing/i)).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<SetCard set={set} isOwned={true} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledWith(set)
  })
})
