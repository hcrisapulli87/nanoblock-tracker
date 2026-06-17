import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PriceComparison } from '../../../src/renderer/components/PriceComparison'
import type { PriceResult } from '../../../src/shared/types'

const ebaySuccess: PriceResult = {
  source: 'ebay',
  status: 'success',
  data: { lowestPrice: 10, averagePrice: 20, highestPrice: 30, currency: 'AUD' },
}

const nanoblockSuccess: PriceResult = {
  source: 'nanoblock',
  status: 'success',
  data: 24.99,
}

const onBuyLink = vi.fn()

describe('PriceComparison', () => {
  it('shows eBay prices when loaded', () => {
    render(<PriceComparison ebay={ebaySuccess} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    expect(screen.getByText('$10.00')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
  })

  it('shows nanoblock retail price when loaded', () => {
    render(<PriceComparison ebay={ebaySuccess} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    expect(screen.getByText('$24.99')).toBeInTheDocument()
  })

  it('shows loading state for eBay while fetching', () => {
    const loading: PriceResult = { source: 'ebay', status: 'loading' }
    render(<PriceComparison ebay={loading} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error message when eBay fetch fails', () => {
    const error: PriceResult = { source: 'ebay', status: 'error', errorMessage: 'eBay API key not configured' }
    render(<PriceComparison ebay={error} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    expect(screen.getByText(/eBay API key not configured/i)).toBeInTheDocument()
  })

  it('renders all four buy link buttons', () => {
    render(<PriceComparison ebay={ebaySuccess} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    expect(screen.getByText(/eBay/i)).toBeInTheDocument()
    expect(screen.getByText(/Amazon/i)).toBeInTheDocument()
    expect(screen.getByText(/AmiAmi/i)).toBeInTheDocument()
    expect(screen.getByText(/Nanoblock Official/i)).toBeInTheDocument()
  })

  it('calls onBuyLink with the correct URL when a buy button is clicked', async () => {
    render(<PriceComparison ebay={ebaySuccess} nanoblock={nanoblockSuccess} pokemonName="Bulbasaur" onBuyLink={onBuyLink} />)
    await userEvent.click(screen.getByText(/Amazon/i))
    expect(onBuyLink).toHaveBeenCalledWith(expect.stringContaining('amazon.com'))
  })
})
