import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgressBar } from '../../../src/renderer/components/ProgressBar'

describe('ProgressBar', () => {
  it('displays owned and total counts', () => {
    render(<ProgressBar owned={7} total={25} />)
    expect(screen.getByText(/7 \/ 25/)).toBeInTheDocument()
  })

  it('renders a filled bar proportional to progress', () => {
    const { container } = render(<ProgressBar owned={1} total={4} />)
    const fill = container.querySelector('[data-testid="progress-fill"]')
    expect(fill).toHaveStyle({ width: '25%' })
  })

  it('clamps to 100% when owned equals total', () => {
    const { container } = render(<ProgressBar owned={10} total={10} />)
    const fill = container.querySelector('[data-testid="progress-fill"]')
    expect(fill).toHaveStyle({ width: '100%' })
  })
})
