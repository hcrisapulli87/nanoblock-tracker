export interface NanoblockSet {
  id: string
  pokemonName: string
  pokemonNumber: number
  generation: number
  setCode: string
  imageUrl?: string
}

export interface CollectionEntry {
  setId: string
  condition: 'sealed' | 'built' | 'loose'
  notes: string
  dateAdded: string
}

export interface EbayPriceData {
  lowestPrice: number
  averagePrice: number
  highestPrice: number
  currency: string
}

export interface PriceResult {
  source: 'ebay' | 'nanoblock'
  status: 'loading' | 'success' | 'error' | 'not-found'
  data?: EbayPriceData | number
  errorMessage?: string
}

export const IPC = {
  GET_COLLECTION: 'collection:get',
  ADD_TO_COLLECTION: 'collection:add',
  UPDATE_COLLECTION_ENTRY: 'collection:update',
  REMOVE_FROM_COLLECTION: 'collection:remove',
  FETCH_EBAY_PRICES: 'prices:ebay',
  FETCH_NANOBLOCK_PRICE: 'prices:nanoblock',
  OPEN_EXTERNAL: 'shell:openExternal',
} as const
