export class ScraperError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScraperError'
  }
}

export async function fetchNanoblockPrice(pokemonName: string): Promise<number> {
  const url = `https://www.nanoblock.com/search?q=${encodeURIComponent(pokemonName)}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NanoblockTracker/1.0)' },
  })

  if (!response.ok) throw new ScraperError(`Nanoblock site returned ${response.status}`)

  const html = await response.text()

  // Try JSON-LD structured data first (most reliable)
  const ldMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  if (ldMatch) {
    for (const block of ldMatch) {
      try {
        const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, '').trim()) as Record<string, unknown>
        const offers = (json['offers'] ?? (json['@graph'] && (json['@graph'] as Record<string, unknown>[])[0]?.['offers'])) as Record<string, string> | undefined
        if (offers?.['price']) return parseFloat(offers['price'])
      } catch {
        // malformed JSON-LD — try next block
      }
    }
  }

  // Fallback: look for a price pattern near currency symbols
  const priceMatch = html.match(/\$(\d+\.\d{2})/)
  if (priceMatch) return parseFloat(priceMatch[1])

  throw new ScraperError('Could not find retail price on nanoblock.com')
}
