import type { EbayPriceData } from '../shared/types'

export class EbayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EbayError'
  }
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
  const query = encodeURIComponent(`${pokemonName} Nanoblock`)

  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=50&filter=buyingOptions%3A%7BFIXED_PRICE%7D`,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_AU' } }
  )

  if (!response.ok) throw new EbayError('eBay search request failed')

  const data = await response.json() as { itemSummaries?: Array<{ buyingOptions: string[]; price: { value: string; currency: string } }> }
  const items = (data.itemSummaries ?? []).filter(i => i.buyingOptions.includes('FIXED_PRICE'))

  if (items.length === 0) throw new EbayError('No listings found on eBay')

  const prices = items.map(i => parseFloat(i.price.value)).filter(p => !isNaN(p))
  const currency = items[0].price.currency

  return {
    lowestPrice: Math.min(...prices),
    averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    highestPrice: Math.max(...prices),
    currency,
  }
}
