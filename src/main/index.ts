import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import initSqlJs from 'sql.js'
import * as fs from 'fs'
import { createSchema } from './db'
import { registerIpcHandlers } from './ipc'

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
  // The Merlinsbricks CDN sends `Cross-Origin-Resource-Policy: same-site` which
  // blocks Electron (a non-web origin) from loading their images.
  // We strip that header only for cdn.merlinsbricks.com requests so the
  // product photos can display. This is safe — it only affects this local app.
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

  registerIpcHandlers(db)
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
