import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
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
      // webSecurity:false lets the Merlinsbricks CDN product images load in the renderer's
      // non-web origin. Safe for a local personal-use desktop app with no web-facing surface.
      webSecurity: false,
    },
  })

  // Open links in the system browser, not in-app.
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

app.whenReady().then(async () => {
  // Strip Cross-Origin-Resource-Policy from the Merlinsbricks CDN so its product images
  // load in Electron's non-web origin (the CDN sends CORP: same-site, which blocks them).
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://cdn.merlinsbricks.com/*'] },
    (details, callback) => {
      const headers = { ...details.responseHeaders }
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'cross-origin-resource-policy') delete headers[key]
      }
      callback({ responseHeaders: headers })
    }
  )

  registerIpcHandlers()
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
