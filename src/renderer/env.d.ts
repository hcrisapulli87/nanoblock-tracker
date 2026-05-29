import type { CollectionEntry, EbayPriceData } from '../shared/types'

type IpcOk<T> = { ok: true; data: T }
type IpcErr = { ok: false; message: string }
type IpcResult<T> = IpcOk<T> | IpcErr

declare global {
  interface Window {
    electronAPI: {
      getCollection: () => Promise<CollectionEntry[]>
      addToCollection: (entry: CollectionEntry) => Promise<void>
      updateCollectionEntry: (entry: CollectionEntry) => Promise<void>
      removeFromCollection: (setId: string) => Promise<void>
      fetchEbayPrices: (pokemonName: string) => Promise<IpcResult<EbayPriceData>>
      fetchNanoblockPrice: (pokemonName: string) => Promise<IpcResult<number>>
      openExternal: (url: string) => void
    }
  }
}
