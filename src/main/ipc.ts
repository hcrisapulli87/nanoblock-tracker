import { ipcMain, shell } from 'electron'
import type { Database } from 'sql.js'
import { IPC } from '../shared/types'
import type { CollectionEntry } from '../shared/types'
import { getCollection, addToCollection, updateCollectionEntry, removeFromCollection } from './db'
import { fetchEbayPrices, EbayError } from './ebay'
import { fetchNanoblockPrice, ScraperError } from './nanoblock-scraper'

export function registerIpcHandlers(db: Database): void {
  ipcMain.handle(IPC.GET_COLLECTION, () => getCollection(db))

  ipcMain.handle(IPC.ADD_TO_COLLECTION, (_event, entry: CollectionEntry) => {
    addToCollection(db, entry)
  })

  ipcMain.handle(IPC.UPDATE_COLLECTION_ENTRY, (_event, entry: CollectionEntry) => {
    updateCollectionEntry(db, entry)
  })

  ipcMain.handle(IPC.REMOVE_FROM_COLLECTION, (_event, setId: string) => {
    removeFromCollection(db, setId)
  })

  ipcMain.handle(IPC.FETCH_EBAY_PRICES, async (_event, pokemonName: string) => {
    try {
      return { ok: true, data: await fetchEbayPrices(pokemonName) }
    } catch (e) {
      return { ok: false, message: e instanceof EbayError ? e.message : 'Unknown eBay error' }
    }
  })

  ipcMain.handle(IPC.FETCH_NANOBLOCK_PRICE, async (_event, pokemonName: string) => {
    try {
      return { ok: true, data: await fetchNanoblockPrice(pokemonName) }
    } catch (e) {
      return { ok: false, message: e instanceof ScraperError ? e.message : 'Scrape failed' }
    }
  })

  ipcMain.handle(IPC.OPEN_EXTERNAL, (_event, url: string) => {
    const allowed = ['https://', 'http://']
    if (!allowed.some(scheme => url.startsWith(scheme))) {
      console.warn(`Blocked openExternal with disallowed scheme: ${url}`)
      return
    }
    shell.openExternal(url)
  })
}
