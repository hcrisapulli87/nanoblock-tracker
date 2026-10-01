// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchNanoblockPrice, ScraperError } from '../../src/main/nanoblock-scraper'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => vi.clearAllMocks())

const RATE_RESPONSE = {
  ok: true,
  json: async () => ({ rates: { AUD: 1.12 } }),
}

function shopifyHtml(products: object[]) {
  return {
    ok: true,
    text: async () => `<html><head></head><body>
      <script>
        ShopifyAnalytics.meta.currency = 'SGD';
        var meta = ${JSON.stringify({ products })};
        window.ShopifyAnalytics = window.ShopifyAnalytics || {};
      </script>
    </body></html>`,
  }
}

describe('fetchNanoblockPrice', () => {
  it('returns AUD price for exact SKU match', async () => {
    const products = [{ variants: [{ price: 1590, sku: 'NBPM-001' }] }]
    mockFetch
      .mockResolvedValueOnce(shopifyHtml(products)) // search page
      .mockResolvedValueOnce(RATE_RESPONSE)          // exchange rate

    const result = await fetchNanoblockPrice('NBPM-001')
    // S$15.90 * 1.12 AUD/SGD = A$17.808 → rounded to A$17.81
    expect(result).toBe(17.81)
  })

  it('does not guess a price when no product has the exact SKU', async () => {
    // The store's search is fuzzy: a query for an unstocked set returns other sets.
    // Their prices must not be shown as this set's retail price.
    const products = [
      { variants: [{ price: 1990, sku: 'NBPM-005' }] },
      { variants: [{ price: 2490, sku: 'NBPM-010' }] },
    ]
    mockFetch.mockResolvedValueOnce(shopifyHtml(products))

    const err = await fetchNanoblockPrice('NBPM-999').catch(e => e)
    expect(err).toBeInstanceOf(ScraperError)
    expect(err.notFound).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1) // no exchange-rate call
  })

  it('marks an empty search as not-found rather than a failure', async () => {
    mockFetch.mockResolvedValueOnce(shopifyHtml([]))
    const err = await fetchNanoblockPrice('NBPM-001').catch(e => e)
    expect(err.notFound).toBe(true)
  })

  it('treats a non-200 response as a real failure, not not-found', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
    const err = await fetchNanoblockPrice('NBPM-001').catch(e => e)
    expect(err).toBeInstanceOf(ScraperError)
    expect(err.notFound).toBe(false)
  })

  it('throws ScraperError when no products found', async () => {
    mockFetch.mockResolvedValueOnce(shopifyHtml([]))
    await expect(fetchNanoblockPrice('NBPM-001')).rejects.toThrow(ScraperError)
  })

  it('throws ScraperError on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchNanoblockPrice('NBPM-001')).rejects.toThrow(ScraperError)
  })

  it('throws ScraperError when exchange rate API fails', async () => {
    const products = [{ variants: [{ price: 1590, sku: 'NBPM-001' }] }]
    mockFetch
      .mockResolvedValueOnce(shopifyHtml(products))
      .mockResolvedValueOnce({ ok: false, status: 503 })

    await expect(fetchNanoblockPrice('NBPM-001')).rejects.toThrow(ScraperError)
  })

  it('throws ScraperError when var meta block is absent from HTML', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<html><body>No meta here</body></html>' })
    await expect(fetchNanoblockPrice('NBPM-001')).rejects.toThrow(ScraperError)
  })
})
