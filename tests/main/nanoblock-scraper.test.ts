// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchNanoblockPrice, ScraperError } from '../../src/main/nanoblock-scraper'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => vi.clearAllMocks())

const htmlWithPrice = (price: string) => ({
  ok: true,
  text: async () => `
    <html>
      <head>
        <script type="application/ld+json">
          {"@type":"Product","offers":{"price":"${price}","priceCurrency":"AUD"}}
        </script>
      </head>
    </html>
  `,
})

describe('fetchNanoblockPrice', () => {
  it('parses price from JSON-LD structured data', async () => {
    mockFetch.mockResolvedValueOnce(htmlWithPrice('24.99'))
    const result = await fetchNanoblockPrice('Bulbasaur')
    expect(result).toBe(24.99)
  })

  it('throws ScraperError when no price found in page', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<html><body>No price here</body></html>' })
    await expect(fetchNanoblockPrice('Bulbasaur')).rejects.toThrow(ScraperError)
  })

  it('throws ScraperError on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchNanoblockPrice('Bulbasaur')).rejects.toThrow(ScraperError)
  })
})
