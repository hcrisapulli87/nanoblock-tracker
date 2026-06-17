function encode(name: string): string {
  return encodeURIComponent(`${name} Nanoblock`)
}

export function ebaySearchUrl(pokemonName: string): string {
  return `https://www.ebay.com.au/sch/i.html?_nkw=${encode(pokemonName)}`
}

export function amazonSearchUrl(pokemonName: string): string {
  return `https://www.amazon.com.au/s?k=${encode(pokemonName)}`
}

export function amiAmiSearchUrl(pokemonName: string): string {
  return `https://www.amiami.com/eng/search/list/?s_keywords=${encode(pokemonName)}`
}

export function nanoblockSearchUrl(pokemonName: string): string {
  return `https://www.nanoblock.com.sg/search?q=${encodeURIComponent(pokemonName)}`
}
