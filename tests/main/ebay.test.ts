// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEbayPrices, EbayError } from '../../src/main/ebay'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const tokenResponse = {
  ok: true,
  json: async () => ({ access_token: 'test-token', expires_in: 7200 }),
}

const searchResponse = (items: unknown[]) => ({
  ok: true,
  json: async () => ({ itemSummaries: items }),
})

const makeItem = (price: string) => ({
  buyingOptions: ['FIXED_PRICE'],
  price: { value: price, currency: 'USD' },
})

beforeEach(() => {
  vi.clearAllMocks()
  process.env.EBAY_CLIENT_ID = 'test-id'
  process.env.EBAY_CLIENT_SECRET = 'test-secret'
})

describe('fetchEbayPrices', () => {
  it('returns lowest, average, highest from active listings', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([
        makeItem('10.00'),
        makeItem('20.00'),
        makeItem('30.00'),
      ]))

    const result = await fetchEbayPrices('Bulbasaur')
    expect(result.lowestPrice).toBe(10)
    expect(result.averagePrice).toBeCloseTo(20)
    expect(result.highestPrice).toBe(30)
    expect(result.currency).toBe('USD')
  })

  it('throws EbayError when no listings found', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([]))

    await expect(fetchEbayPrices('Bulbasaur')).rejects.toThrow(EbayError)
  })

  it('throws EbayError when API key is missing', async () => {
    delete process.env.EBAY_CLIENT_ID
    await expect(fetchEbayPrices('Bulbasaur')).rejects.toThrow(EbayError)
  })

  it('only includes FIXED_PRICE listings in price calculation', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([
        makeItem('15.00'),
        { buyingOptions: ['AUCTION'], price: { value: '5.00', currency: 'USD' } },
      ]))

    const result = await fetchEbayPrices('Bulbasaur')
    expect(result.lowestPrice).toBe(15)
    expect(result.highestPrice).toBe(15)
  })
})
