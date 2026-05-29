import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePriceLookup } from '../../../src/renderer/hooks/usePriceLookup'
import type { EbayPriceData } from '../../../src/shared/types'

const mockEbayData: EbayPriceData = { lowestPrice: 10, averagePrice: 20, highestPrice: 30, currency: 'USD' }

const mockAPI = {
  getCollection: vi.fn(),
  addToCollection: vi.fn(),
  updateCollectionEntry: vi.fn(),
  removeFromCollection: vi.fn(),
  fetchEbayPrices: vi.fn(),
  fetchNanoblockPrice: vi.fn(),
  openExternal: vi.fn(),
}
vi.stubGlobal('window', { electronAPI: mockAPI })

beforeEach(() => {
  vi.clearAllMocks()
  mockAPI.fetchEbayPrices.mockResolvedValue({ ok: false, message: 'Not configured' })
  mockAPI.fetchNanoblockPrice.mockResolvedValue({ ok: false, message: 'Not configured' })
})

describe('usePriceLookup', () => {
  it('starts with loading state for both sources', () => {
    const { result } = renderHook(() => usePriceLookup('Bulbasaur'))
    expect(result.current.ebay.status).toBe('loading')
    expect(result.current.nanoblock.status).toBe('loading')
  })

  it('transitions eBay to success on resolved fetch', async () => {
    mockAPI.fetchEbayPrices.mockResolvedValue({ ok: true, data: mockEbayData })
    mockAPI.fetchNanoblockPrice.mockResolvedValue({ ok: true, data: 24.99 })
    const { result } = renderHook(() => usePriceLookup('Bulbasaur'))
    await act(async () => {})
    expect(result.current.ebay.status).toBe('success')
    expect(result.current.ebay.data).toEqual(mockEbayData)
  })

  it('transitions eBay to error on failed fetch', async () => {
    mockAPI.fetchEbayPrices.mockResolvedValue({ ok: false, message: 'eBay API key not configured' })
    mockAPI.fetchNanoblockPrice.mockResolvedValue({ ok: true, data: 24.99 })
    const { result } = renderHook(() => usePriceLookup('Bulbasaur'))
    await act(async () => {})
    expect(result.current.ebay.status).toBe('error')
    expect(result.current.ebay.errorMessage).toBe('eBay API key not configured')
  })

  it('nanoblock succeeds independently even if eBay fails', async () => {
    mockAPI.fetchEbayPrices.mockResolvedValue({ ok: false, message: 'No listings' })
    mockAPI.fetchNanoblockPrice.mockResolvedValue({ ok: true, data: 19.99 })
    const { result } = renderHook(() => usePriceLookup('Bulbasaur'))
    await act(async () => {})
    expect(result.current.nanoblock.status).toBe('success')
    expect(result.current.nanoblock.data).toBe(19.99)
  })
})
