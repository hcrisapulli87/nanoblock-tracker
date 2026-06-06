import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import initSqlJs from 'sql.js'
import * as fs from 'fs'
import { createSchema } from './db'
import { registerIpcHandlers, registerMobileIpcHandlers } from './ipc'
import { loadConfig } from './mobile-config'
import { startServer, stopServer } from './server'
import { TunnelManager } from './tunnel'
import type * as http from 'http'

let mobileServer: http.Server | null = null
const mobileTunnelHolder: { value: TunnelManager | null } = { value: null }
let mobileUserDataPath = ''

function getMobileStaticRoot(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'server')
    : join(process.cwd(), 'resources/server')
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // webSecurity:false disables CORP/CORS enforcement in the renderer,
      // allowing the Merlinsbricks CDN product images to load.
      // Safe for a local personal-use desktop app with no web-facing surface.
      webSecurity: false,
    },
  })

  // Open links in system browser, not in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      app.isPackaged
        ? join(process.resourcesPath, file)
        : join(process.cwd(), 'node_modules/sql.js/dist/', file),
  })

  const dbPath = join(app.getPath('userData'), 'collection.db')
  const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined
  const db = buffer ? new SQL.Database(buffer) : new SQL.Database()
  createSchema(db)

  return { db, dbPath }
}

app.whenReady().then(async () => {
  // Strip Cross-Origin-Resource-Policy from Merlinsbricks CDN so product images load.
  // Merlinsbricks sends CORP: same-site which blocks Electron (non-web origin) from loading images.
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://cdn.merlinsbricks.com/*'] },
    (details, callback) => {
      const headers = { ...details.responseHeaders }
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'cross-origin-resource-policy') {
          delete headers[key]
        }
      }
      callback({ responseHeaders: headers })
    }
  )


  const { db, dbPath } = await initDatabase()

  // Wrap db.run to auto-persist after every write
  const originalRun = db.run.bind(db)
  db.run = (...args: Parameters<typeof db.run>) => {
    const result = originalRun(...args)
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
    return result
  }

  mobileUserDataPath = app.getPath('userData')
  const config = loadConfig(mobileUserDataPath)
  const mobileServerInstance = startServer(db, config, getMobileStaticRoot())
  mobileServer = mobileServerInstance
  if (config.tunnelName) {
    mobileTunnelHolder.value = new TunnelManager(config.tunnelName)
  }

  registerIpcHandlers(db)
  registerMobileIpcHandlers(mobileServerInstance, mobileTunnelHolder, config, mobileUserDataPath)
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', async () => {
  mobileTunnelHolder.value?.stop()
  if (mobileServer) await stopServer(mobileServer)
  if (process.platform !== 'darwin') app.quit()
})
