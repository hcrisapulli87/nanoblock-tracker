import type { EbayPriceData, CollectionEntry } from '../shared/types'

type PriceResponse =
  | { ok: true; data: EbayPriceData | number }
  | { ok: false; message: string; notFound?: boolean }

declare global {
  interface Window {
    electronAPI: {
      fetchEbayPrices: (pokemonName: string) => Promise<PriceResponse>
      fetchNanoblockPrice: (setCode: string) => Promise<PriceResponse>
      openExternal: (url: string) => Promise<void>
      getLegacyRows: () => Promise<CollectionEntry[]>
    }
  }
}

export {}
