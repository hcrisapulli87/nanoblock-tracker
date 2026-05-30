import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from '../../../src/renderer/components/Sidebar'
import type { SidebarFilters } from '../../../src/renderer/components/Sidebar'

const defaultFilters: SidebarFilters = {
  search: '',
  status: 'all',
  generation: 0,
  series: 'all',
  sort: 'number-asc',
}

describe('Sidebar', () => {
  it('renders search input', () => {
    render(<Sidebar filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument()
  })

  it('calls onChange with updated search when user types', async () => {
    const onChange = vi.fn()
    render(<Sidebar filters={defaultFilters} onChange={onChange} />)
    await userEvent.type(screen.getByPlaceholderText(/Search/i), 'Pika')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Pika' }))
  })

  it('calls onChange with status:owned when Owned filter clicked', async () => {
    const onChange = vi.fn()
    render(<Sidebar filters={defaultFilters} onChange={onChange} />)
    await userEvent.click(screen.getByText(/^Owned$/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'owned' }))
  })

  it('calls onChange with generation:1 when Gen 1 clicked', async () => {
    const onChange = vi.fn()
    render(<Sidebar filters={defaultFilters} onChange={onChange} />)
    await userEvent.click(screen.getByText('Gen 1'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ generation: 1 }))
  })
})
