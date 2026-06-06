import { ipcMain, shell } from 'electron'
import type { Database } from 'sql.js'
import { createHash } from 'crypto'
import type * as http from 'http'
import { IPC } from '../shared/types'
import type { CollectionEntry, MobileConfig } from '../shared/types'
import { getCollection, addToCollection, updateCollectionEntry, removeFromCollection } from './db'
import { fetchEbayPrices, EbayError } from './ebay'
import { fetchNanoblockPrice, ScraperError } from './nanoblock-scraper'
import { saveConfig } from './mobile-config'
import { TunnelManager } from './tunnel'

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

export function registerMobileIpcHandlers(
  server: http.Server,
  tunnelHolder: { value: TunnelManager | null },
  config: MobileConfig,
  userDataPath: string
): void {
  ipcMain.handle(IPC.MOBILE_GET_SERVER_STATUS, () => ({
    running: server.listening,
    port: 45678,
  }))

  ipcMain.handle(IPC.MOBILE_GET_TUNNEL_STATUS, () => ({
    status: tunnelHolder.value?.status ?? 'not-configured',
  }))

  ipcMain.handle(IPC.MOBILE_GET_TUNNEL_URL, () => ({
    url: config.tunnelUrl,
  }))

  ipcMain.handle(IPC.MOBILE_SET_PIN, (_event, pin: string) => {
    config.pinHash = createHash('sha256').update(pin).digest('hex')
    saveConfig(config, userDataPath)
    return { success: true }
  })

  ipcMain.handle(
    IPC.MOBILE_SET_TUNNEL_CONFIG,
    (_event, args: { tunnelName: string; tunnelUrl: string }) => {
      tunnelHolder.value?.stop()
      config.tunnelName = args.tunnelName
      config.tunnelUrl = args.tunnelUrl
      saveConfig(config, userDataPath)
      tunnelHolder.value = args.tunnelName ? new TunnelManager(args.tunnelName) : null
      return { success: true }
    }
  )
}
