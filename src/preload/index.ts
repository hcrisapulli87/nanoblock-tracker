import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  fetchEbayPrices: (pokemonName: string) => ipcRenderer.invoke(IPC.FETCH_EBAY_PRICES, pokemonName),
  fetchNanoblockPrice: (pokemonName: string) => ipcRenderer.invoke(IPC.FETCH_NANOBLOCK_PRICE, pokemonName),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  getLegacyRows: () => ipcRenderer.invoke(IPC.GET_LEGACY_ROWS),
})
