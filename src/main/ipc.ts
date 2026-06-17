import { ipcMain, shell } from 'electron'
import { IPC } from '../shared/types'
import { fetchEbayPrices, EbayError } from './ebay'
import { fetchNanoblockPrice, ScraperError } from './nanoblock-scraper'
import { readLegacyCollection, legacyDbPath } from './migration'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.FETCH_EBAY_PRICES, async (_e, pokemonName: string) => {
    try {
      return { ok: true, data: await fetchEbayPrices(pokemonName) }
    } catch (e) {
      return { ok: false, message: e instanceof EbayError ? e.message : 'Unknown eBay error' }
    }
  })

  ipcMain.handle(IPC.FETCH_NANOBLOCK_PRICE, async (_e, pokemonName: string) => {
    try {
      return { ok: true, data: await fetchNanoblockPrice(pokemonName) }
    } catch (e) {
      return { ok: false, message: e instanceof ScraperError ? e.message : 'Scrape failed' }
    }
  })

  ipcMain.handle(IPC.OPEN_EXTERNAL, (_e, url: string) => {
    if (!/^https?:\/\//.test(url)) {
      console.warn(`Blocked openExternal with disallowed scheme: ${url}`)
      return
    }
    shell.openExternal(url)
  })

  ipcMain.handle(IPC.GET_LEGACY_ROWS, () => readLegacyCollection(legacyDbPath()))
}
