import type { CollectionEntry, EbayPriceData } from '../shared/types'

type IpcOk<T> = { ok: true; data: T }
type IpcErr = { ok: false; message: string }
type IpcResult<T> = IpcOk<T> | IpcErr

declare global {
  interface Window {
    electronAPI: {
      fetchEbayPrices: (pokemonName: string) => Promise<IpcResult<EbayPriceData>>
      fetchNanoblockPrice: (pokemonName: string) => Promise<IpcResult<number>>
      openExternal: (url: string) => Promise<void>
      // One-time migration: rows from the pre-Supabase local collection.db (main process).
      getLegacyRows: () => Promise<CollectionEntry[]>
    }
  }
}
