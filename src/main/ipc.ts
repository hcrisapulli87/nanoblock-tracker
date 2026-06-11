import { ipcMain, shell } from 'electron'
import type { Database } from 'sql.js'
import { createHash } from 'crypto'
import type * as http from 'http'
import { IPC } from '../shared/types'
import type { CollectionEntry, MobileConfig } from '../shared/types'
import { getCollection, addToCollection, updateCollectionEntry, removeFromCollection } from './db'
import { scheduleGoogleTasksSync } from './google-tasks-sync'
import { fetchEbayPrices, EbayError } from './ebay'
import { fetchNanoblockPrice, ScraperError } from './nanoblock-scraper'
import { saveConfig } from './mobile-config'
import { TunnelManager } from './tunnel'

export function registerIpcHandlers(db: Database): void {
  ipcMain.handle(IPC.GET_COLLECTION, () => getCollection(db))

  ipcMain.handle(IPC.ADD_TO_COLLECTION, (_event, entry: CollectionEntry) => {
    addToCollection(db, entry)
    scheduleGoogleTasksSync()
  })

  ipcMain.handle(IPC.UPDATE_COLLECTION_ENTRY, (_event, entry: CollectionEntry) => {
    updateCollectionEntry(db, entry)
    scheduleGoogleTasksSync()
  })

  ipcMain.handle(IPC.REMOVE_FROM_COLLECTION, (_event, setId: string) => {
    removeFromCollection(db, setId)
    scheduleGoogleTasksSync()
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

const TUNNEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/
const PIN_RE = /^\d{4,8}$/

function isValidHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:'
  } catch {
    return false
  }
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

  ipcMain.handle(IPC.MOBILE_SET_PIN, (_event, pin: unknown) => {
    if (typeof pin !== 'string' || !PIN_RE.test(pin)) {
      return { success: false, error: 'PIN must be 4–8 digits' }
    }
    config.pinHash = createHash('sha256').update(pin).digest('hex')
    saveConfig(config, userDataPath)
    return { success: true }
  })

  ipcMain.handle(
    IPC.MOBILE_SET_TUNNEL_CONFIG,
    (_event, args: { tunnelName: string; tunnelUrl: string }) => {
      if (typeof args?.tunnelName !== 'string' || !TUNNEL_NAME_RE.test(args.tunnelName)) {
        return { success: false, error: 'Invalid tunnel name' }
      }
      if (typeof args?.tunnelUrl !== 'string' || !isValidHttpsUrl(args.tunnelUrl)) {
        return { success: false, error: 'tunnelUrl must be a valid https:// URL' }
      }
      tunnelHolder.value?.stop()
      config.tunnelName = args.tunnelName
      config.tunnelUrl = args.tunnelUrl
      saveConfig(config, userDataPath)
      tunnelHolder.value = new TunnelManager(args.tunnelName)
      return { success: true }
    }
  )
}
