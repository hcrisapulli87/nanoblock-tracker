import type { CollectionEntry, EbayPriceData } from '../shared/types'

type IpcOk<T> = { ok: true; data: T }
// notFound: the source has no listing for this set — shown as "unavailable", not as an error.
type IpcErr = { ok: false; message: string; notFound?: boolean }
type IpcResult<T> = IpcOk<T> | IpcErr

declare global {
  interface Window {
    electronAPI: {
      fetchEbayPrices: (pokemonName: string) => Promise<IpcResult<EbayPriceData>>
      fetchNanoblockPrice: (setCode: string) => Promise<IpcResult<number>>
      openExternal: (url: string) => Promise<void>
      // One-time migration: rows from the pre-Supabase local collection.db (main process).
      getLegacyRows: () => Promise<CollectionEntry[]>
    }
  }
}
