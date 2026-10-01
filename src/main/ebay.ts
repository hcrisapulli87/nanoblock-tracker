import type { EbayPriceData } from '../shared/types'

export class EbayError extends Error {
  // notFound = eBay has no matching listings right now (not a failure).
  constructor(message: string, readonly notFound = false) {
    super(message)
    this.name = 'EbayError'
  }
}

// Listings that aren't a single set — they skew low/high/typical prices.
const NOT_A_SINGLE_SET = /\b(lot|lots|bundle|bulk|job ?lot|set of \d+|x ?\d+|\d+ ?sets|instructions? only|manual only|parts only|custom|moc)\b/i

// Catalog names carry display suffixes ("Charizard (Mega X RS)", "Pikachu (Deluxe)")
// that sellers rarely type in that form — search the bare words instead.
function searchTerms(pokemonName: string): string {
  return `${pokemonName.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()} nanoblock`
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new EbayError('eBay API key not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  })

  if (!response.ok) throw new EbayError('Failed to obtain eBay access token')
  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function fetchEbayPrices(pokemonName: string): Promise<EbayPriceData> {
  const token = await getAccessToken()
  const query = encodeURIComponent(searchTerms(pokemonName))

  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=50&filter=buyingOptions%3A%7BFIXED_PRICE%7D`,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_AU' } }
  )

  if (!response.ok) throw new EbayError('eBay search request failed')

  const data = await response.json() as {
    itemSummaries?: Array<{ title?: string; buyingOptions: string[]; price: { value: string; currency: string } }>
  }
  const items = (data.itemSummaries ?? []).filter(
    i => i.buyingOptions.includes('FIXED_PRICE') && !NOT_A_SINGLE_SET.test(i.title ?? ''),
  )

  const prices = items.map(i => parseFloat(i.price.value)).filter(p => !isNaN(p)).sort((a, b) => a - b)
  if (prices.length === 0) throw new EbayError('No listings found on eBay', true)

  return {
    lowestPrice: prices[0],
    // Median, not mean: one overpriced or mislabelled listing shouldn't move the "typical" price.
    averagePrice: median(prices),
    highestPrice: prices[prices.length - 1],
    currency: items[0].price.currency,
  }
}
