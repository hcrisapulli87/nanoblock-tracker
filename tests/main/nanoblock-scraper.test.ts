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

  it('falls back to first product when no exact SKU match', async () => {
    const products = [
      { variants: [{ price: 1990, sku: 'NBPM-005' }] },
      { variants: [{ price: 2490, sku: 'NBPM-010' }] },
    ]
    mockFetch
      .mockResolvedValueOnce(shopifyHtml(products))
      .mockResolvedValueOnce(RATE_RESPONSE)

    const result = await fetchNanoblockPrice('NBPM-999')
    // S$19.90 * 1.12 = A$22.288 → A$22.29
    expect(result).toBe(22.29)
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
