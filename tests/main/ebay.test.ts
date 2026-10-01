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

const makeItem = (price: string, title = 'nanoblock Pokemon Bulbasaur NBPM-002') => ({
  title,
  buyingOptions: ['FIXED_PRICE'],
  price: { value: price, currency: 'USD' },
})

beforeEach(() => {
  vi.clearAllMocks()
  process.env.EBAY_CLIENT_ID = 'test-id'
  process.env.EBAY_CLIENT_SECRET = 'test-secret'
})

describe('fetchEbayPrices', () => {
  it('returns lowest, typical (median), highest from active listings', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([
        makeItem('10.00'),
        makeItem('20.00'),
        makeItem('30.00'),
      ]))

    const result = await fetchEbayPrices('Bulbasaur')
    expect(result.lowestPrice).toBe(10)
    expect(result.averagePrice).toBe(20)
    expect(result.highestPrice).toBe(30)
    expect(result.currency).toBe('USD')
  })

  it('uses the median so one overpriced listing does not drag the typical price', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([
        makeItem('20.00'), makeItem('22.00'), makeItem('24.00'), makeItem('26.00'), makeItem('400.00'),
      ]))

    const result = await fetchEbayPrices('Bulbasaur')
    expect(result.averagePrice).toBe(24)
  })

  it('ignores lots, bundles and instruction-only listings', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([
        makeItem('25.00'),
        makeItem('180.00', 'Nanoblock Pokemon LOT of 8 sets Bulbasaur Charmander'),
        makeItem('150.00', 'Pokemon nanoblock bundle x5'),
        makeItem('3.00', 'Bulbasaur nanoblock instructions only'),
      ]))

    const result = await fetchEbayPrices('Bulbasaur')
    expect(result.lowestPrice).toBe(25)
    expect(result.highestPrice).toBe(25)
  })

  it('searches without catalog suffixes like (Deluxe) or (RS)', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([makeItem('25.00')]))

    await fetchEbayPrices('Charizard (Mega X RS)')
    const searchUrl = mockFetch.mock.calls[1][0] as string
    expect(decodeURIComponent(searchUrl)).toContain('q=Charizard Mega X RS nanoblock')
  })

  it('marks no listings as not-found', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(searchResponse([]))

    const err = await fetchEbayPrices('Bulbasaur').catch(e => e)
    expect(err).toBeInstanceOf(EbayError)
    expect(err.notFound).toBe(true)
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
