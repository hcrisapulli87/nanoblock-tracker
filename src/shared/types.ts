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
  GET_COLLECTION: 'collection:get',
  ADD_TO_COLLECTION: 'collection:add',
  UPDATE_COLLECTION_ENTRY: 'collection:update',
  REMOVE_FROM_COLLECTION: 'collection:remove',
  FETCH_EBAY_PRICES: 'prices:ebay',
  FETCH_NANOBLOCK_PRICE: 'prices:nanoblock',
  OPEN_EXTERNAL: 'shell:openExternal',
  MOBILE_GET_SERVER_STATUS: 'mobile:getServerStatus',
  MOBILE_GET_TUNNEL_STATUS: 'mobile:getTunnelStatus',
  MOBILE_GET_TUNNEL_URL: 'mobile:getTunnelUrl',
  MOBILE_SET_PIN: 'mobile:setPin',
  MOBILE_SET_TUNNEL_CONFIG: 'mobile:setTunnelConfig',
} as const

export interface MobileConfig {
  pinHash: string
  cookieSecret: string
  tunnelName: string
  tunnelUrl: string
}
