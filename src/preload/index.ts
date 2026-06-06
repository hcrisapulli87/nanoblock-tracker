import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { CollectionEntry } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  getCollection: () =>
    ipcRenderer.invoke(IPC.GET_COLLECTION),
  addToCollection: (entry: CollectionEntry) =>
    ipcRenderer.invoke(IPC.ADD_TO_COLLECTION, entry),
  updateCollectionEntry: (entry: CollectionEntry) =>
    ipcRenderer.invoke(IPC.UPDATE_COLLECTION_ENTRY, entry),
  removeFromCollection: (setId: string) =>
    ipcRenderer.invoke(IPC.REMOVE_FROM_COLLECTION, setId),
  fetchEbayPrices: (pokemonName: string) =>
    ipcRenderer.invoke(IPC.FETCH_EBAY_PRICES, pokemonName),
  fetchNanoblockPrice: (pokemonName: string) =>
    ipcRenderer.invoke(IPC.FETCH_NANOBLOCK_PRICE, pokemonName),
  openExternal: (url: string) =>
    ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  mobileGetServerStatus: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_SERVER_STATUS),
  mobileGetTunnelStatus: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_TUNNEL_STATUS),
  mobileGetTunnelUrl: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_TUNNEL_URL),
  mobileSetPin: (pin: string) =>
    ipcRenderer.invoke(IPC.MOBILE_SET_PIN, pin),
  mobileSetTunnelConfig: (args: { tunnelName: string; tunnelUrl: string }) =>
    ipcRenderer.invoke(IPC.MOBILE_SET_TUNNEL_CONFIG, args),
})
