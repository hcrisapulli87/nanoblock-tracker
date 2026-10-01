import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  fetchEbayPrices: (pokemonName: string) => ipcRenderer.invoke(IPC.FETCH_EBAY_PRICES, pokemonName),
  fetchNanoblockPrice: (setCode: string) => ipcRenderer.invoke(IPC.FETCH_NANOBLOCK_PRICE, setCode),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  getLegacyRows: () => ipcRenderer.invoke(IPC.GET_LEGACY_ROWS),
})
