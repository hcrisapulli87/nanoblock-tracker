export class ScraperError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScraperError'
  }
}

interface ShopifyVariant {
  price: number
  sku: string
}

interface ShopifyProduct {
  variants: ShopifyVariant[]
}

function extractShopifyMeta(html: string): { products: ShopifyProduct[] } | null {
  const marker = 'var meta = '
  const start = html.indexOf(marker)
  if (start === -1) return null

  const jsonStart = start + marker.length
  let depth = 0
  let i = jsonStart
  while (i < html.length) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) break
    }
    i++
  }

  try {
    return JSON.parse(html.slice(jsonStart, i + 1)) as { products: ShopifyProduct[] }
  } catch {
    return null
  }
}

async function convertSgdToAud(sgdAmount: number): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/SGD')
  if (!res.ok) throw new ScraperError('Could not fetch SGD/AUD exchange rate')
  const data = await res.json() as { rates: Record<string, number> }
  const rate = data.rates?.AUD
  if (!rate) throw new ScraperError('AUD rate missing from exchange rate response')
  return Math.round(sgdAmount * rate * 100) / 100
}

export async function fetchNanoblockPrice(setCode: string): Promise<number> {
  const url = `https://www.nanoblock.com.sg/search?q=${encodeURIComponent(setCode)}&type=product`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
  })

  if (!response.ok) throw new ScraperError(`nanoblock.com.sg returned ${response.status}`)

  const html = await response.text()
  const meta = extractShopifyMeta(html)

  if (!meta?.products?.length) {
    throw new ScraperError('No listings found on nanoblock.com.sg')
  }

  // Prefer an exact SKU match for the NBPM set code
  for (const product of meta.products) {
    for (const variant of product.variants) {
      if (variant.sku === setCode) {
        return convertSgdToAud(variant.price / 100)
      }
    }
  }

  // Fallback: use the first product's price if no exact SKU match
  const fallbackPrice = meta.products[0]?.variants[0]?.price
  if (fallbackPrice !== undefined) {
    return convertSgdToAud(fallbackPrice / 100)
  }

  throw new ScraperError('Could not extract price from nanoblock.com.sg')
}
