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
      openExternal: (url: string) => Promise<void>
      mobileGetServerStatus: () => Promise<{ running: boolean; port: number }>
      mobileGetTunnelStatus: () => Promise<{ status: 'connected' | 'connecting' | 'not-configured' }>
      mobileGetTunnelUrl: () => Promise<{ url: string }>
      mobileSetPin: (pin: string) => Promise<{ success: boolean }>
      mobileSetTunnelConfig: (args: { tunnelName: string; tunnelUrl: string }) => Promise<{ success: boolean }>
    }
  }
}
