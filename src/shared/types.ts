export interface NanoblockSet {
  id: string
  pokemonName: string
  pokemonNumber: number
  generation: number
  setCode: string
  imageUrl?: string
}

export interface CollectionEntry {
  // setId is the primary key — one row per owned set
  setId: string
  condition: 'sealed' | 'built' | 'loose'
  notes: string
  dateAdded: string  // ISO date string, e.g. "2024-01-01"
}

export interface EbayPriceData {
  lowestPrice: number
  averagePrice: number
  highestPrice: number
  currency: string
}

export type PriceResult =
  | { source: 'ebay' | 'nanoblock'; status: 'loading' }
  | { source: 'ebay' | 'nanoblock'; status: 'success'; data: EbayPriceData | number }
  | { source: 'ebay' | 'nanoblock'; status: 'error'; errorMessage: string }
  | { source: 'ebay' | 'nanoblock'; status: 'not-found' }

export const IPC = {
  FETCH_EBAY_PRICES: 'prices:ebay',
  FETCH_NANOBLOCK_PRICE: 'prices:nanoblock',
  OPEN_EXTERNAL: 'shell:openExternal',
  GET_LEGACY_ROWS: 'migration:getLegacyRows',
} as const
