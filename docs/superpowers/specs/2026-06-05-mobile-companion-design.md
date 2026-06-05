# Mobile Companion Design

**Goal:** Add a read-only mobile PWA accessible from iPhone that shows the Nanoblock collection — overview stats, full catalog, and missing sets — via an embedded Express server and a Cloudflare named tunnel with a stable URL.

---

## Overview

When the Nanoblock Tracker desktop app is open, two background processes start automatically:
1. An **Express HTTP server** on `localhost:45678` that serves the mobile PWA and read-only API endpoints.
2. A **cloudflared tunnel** that connects the local Express server to Cloudflare, making it reachable at a stable HTTPS URL from anywhere.

The iPhone opens the Cloudflare URL in Safari, enters a PIN, and gets a 30-day session cookie. From then on it loads the PWA directly (and can be added to the Home Screen). When the Electron app closes, both the server and tunnel stop.

---

## Architecture

```
iPhone (Safari/PWA)
    ↕  HTTPS (anywhere)
Cloudflare Tunnel  →  stable URL: e.g. nanoblock.yourdomain.com
    ↕  encrypted tunnel (outbound only, no port forwarding needed)
PC — Nanoblock Tracker running
  ├─ cloudflared process  ↔  Express :45678  ↔  sql.js DB
  └─ Electron renderer (unchanged — full read/write, existing UI)
```

The Express server and cloudflared process live entirely in the Electron **main process** alongside the existing database code. The renderer process (the desktop UI) is untouched except for a new "Mobile Access" panel.

---

## Catalog Refactor

The catalog currently lives in `src/renderer/data/catalog.ts` and imports three local PNG files (NBPM-025 Litten, NBPM-026 Popplio, NBPM-027 Rowlet). Local file imports fail in a Node.js context, so the catalog must be moved to shared.

**Change:**
- Move catalog data to `src/shared/catalog.ts`. Replace the three `import xxxImg from '...'` lines with CDN URL strings using the same `nbImage('NBPM-XXX')` pattern as all other sets. The three sets already have CDN entries; the local PNGs were overrides and can be dropped.
- Update `src/renderer/data/catalog.ts` to simply re-export: `export { CATALOG } from '../../shared/catalog'`
- The local PNG asset files can remain (unused) or be deleted — the SetCard fallback to PokéAPI sprites already handles missing CDN images.

---

## File Structure

### New files

| Path | Purpose |
|------|---------|
| `src/main/server.ts` | Express HTTP server — starts/stops, serves static PWA files, mounts API routes, PIN middleware |
| `src/main/tunnel.ts` | cloudflared process manager — spawn, kill, parse URL from stdout, restart on crash |
| `resources/server/index.html` | Mobile PWA shell — single HTML file, loads app.js + styles.css |
| `resources/server/app.js` | PWA JavaScript — vanilla JS, three views (overview/catalog/missing), PIN entry, fetch from `/api/*` |
| `resources/server/styles.css` | Mobile-optimised CSS — dark theme, bottom nav, touch targets |
| `resources/server/manifest.json` | Web App Manifest — makes PWA installable on iPhone via Safari "Add to Home Screen" |
| `resources/server/service-worker.js` | Minimal service worker — required for iOS PWA installability; no offline caching needed |

### Modified files

| Path | Change |
|------|--------|
| `src/shared/catalog.ts` | New file — catalog data moved here from renderer/data/catalog.ts |
| `src/renderer/data/catalog.ts` | Becomes a re-export only |
| `src/main/index.ts` | Start server and tunnel after DB init; stop both on `window-all-closed` |
| `src/main/ipc.ts` | Add IPC handlers: `mobile:getServerStatus`, `mobile:getTunnelStatus`, `mobile:getTunnelUrl`, `mobile:setPin`, `mobile:setTunnelConfig` |
| `src/shared/types.ts` | Add `MobileConfig` interface and new IPC channel constants |
| `src/renderer/App.tsx` | Add Mobile Access button in header; render `<MobileAccessPanel>` when open |
| `src/renderer/components/MobileAccessPanel.tsx` | New component — shows tunnel URL + copy button, server status, PIN change form |

---

## Static File Serving

Static PWA files live in `resources/server/` in the source tree. The existing `extraResources` pattern in `package.json` copies them to the packaged app:

```json
"extraResources": [
  { "from": "node_modules/sql.js/dist/sql-wasm.wasm", "to": "sql-wasm.wasm" },
  { "from": "resources/server", "to": "server" }
]
```

At runtime the server locates its static root:

```typescript
const staticRoot = app.isPackaged
  ? join(process.resourcesPath, 'server')
  : join(process.cwd(), 'resources/server')
```

This mirrors exactly how the existing code locates the WASM file.

---

## Express Server (`src/main/server.ts`)

### Startup / shutdown

```typescript
export function startServer(db: Database, config: MobileConfig): http.Server
export function stopServer(server: http.Server): Promise<void>
```

`startServer` is called from `main/index.ts` after DB init, passed the live `db` instance and loaded config.

### Middleware stack

1. `express.static(staticRoot)` — serves PWA files
2. `cookieParser(SECRET)` — parses signed cookies (SECRET is a random UUID stored in `MobileConfig` on first run)
3. `requireAuth` middleware — checks `req.signedCookies.session === 'ok'`; passes through to `/api/auth`, rejects everything else with 401

### API routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth` | Body: `{ pin: string }`. Hashes with SHA-256, compares to `config.pinHash`. On match: sets `session` signed cookie (30-day `maxAge`), returns 200. On fail: 401. |
| `GET` | `/api/stats` | Returns `{ total, owned, byCondition: { sealed, built, loose } }`. Reads from DB + catalog length. |
| `GET` | `/api/catalog` | Returns full catalog array. Each item includes fields from `NanoblockSet` plus `owned: boolean`, `condition?: string`, `notes?: string`. Joins catalog with DB collection. |
| `GET` | `/api/missing` | Same as `/api/catalog` but filtered to sets where `owned === false`. |

All routes except `/api/auth` are protected by `requireAuth`.

### PIN hashing

```typescript
import { createHash } from 'crypto'
function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}
```

No third-party crypto library needed — Node.js built-in `crypto` module.

---

## Mobile Config (`MobileConfig`)

Stored as JSON in `app.getPath('userData')/mobile-config.json`.

```typescript
interface MobileConfig {
  pinHash: string       // SHA-256 hex of PIN; empty string means no PIN set yet
  cookieSecret: string  // Random UUID generated once on first run
  tunnelName: string    // cloudflared tunnel name passed to `cloudflared tunnel run <name>`
  tunnelUrl: string     // Full HTTPS URL (e.g. https://nanoblock.yourdomain.com) — user-entered in Settings
}
```

Config is read at startup. If the file doesn't exist, defaults are written (empty `pinHash`, generated `cookieSecret`, empty `tunnelName`). The `pinHash` being empty causes the server to serve a "no PIN set" page until the user sets one in the desktop app Settings.

---

## Cloudflare Tunnel (`src/main/tunnel.ts`)

### Interface

```typescript
export function startTunnel(tunnelName: string): ChildProcess
export function stopTunnel(proc: ChildProcess): void
```

### Behaviour

- Spawns `cloudflared tunnel run <tunnelName>` as a child process.
- Reads stdout/stderr to detect when the tunnel is connected (looks for "Registered tunnel connection" in cloudflared output).
- Once connected, notifies the IPC layer so the renderer can update its status indicator.
- On unexpected exit (not triggered by `stopTunnel`), waits 5 seconds and restarts.
- `stopTunnel` sends SIGTERM (or `proc.kill()` on Windows).

### cloudflared binary location

`cloudflared` must be installed and on the system PATH. The Settings panel shows a link to the download page if the binary is not found. The app does not bundle `cloudflared`.

### One-time setup (user does this once)

1. Create a free Cloudflare account at cloudflare.com
2. Add a domain (any domain — even a subdomain of an existing one works)
3. Install `cloudflared`: `winget install Cloudflare.cloudflared`
4. `cloudflared tunnel login` — opens browser, authorises the CLI
5. `cloudflared tunnel create nanoblock` — creates the named tunnel
6. `cloudflared tunnel route dns nanoblock nanoblock.yourdomain.com` — sets the DNS
7. Enter the tunnel name (`nanoblock`) in the app's Mobile Access Settings panel

After this, the app handles starting and stopping the tunnel automatically on every launch.

---

## Mobile PWA (`resources/server/`)

### `index.html`

Single-page app shell. Loads `styles.css`, `manifest.json` link, `app.js`. Contains a `<div id="app">` where the JS renders views.

### `manifest.json`

```json
{
  "name": "Nanoblock Tracker",
  "short_name": "Nanoblock",
  "display": "standalone",
  "background_color": "#0f1923",
  "theme_color": "#0f1923",
  "start_url": "/",
  "icons": []
}
```

No icon required for basic installability, but an empty `icons` array is valid.

### `service-worker.js`

Minimal — registers a fetch handler that passes all requests through without caching. Required for iOS "Add to Home Screen" installability.

```javascript
self.addEventListener('fetch', event => event.respondWith(fetch(event.request)))
```

### `app.js` — Three views

**PIN Entry view** (shown if no session cookie)
- Single PIN input, submit button
- `POST /api/auth` → on success, reload page (cookie set, will redirect to overview)

**Overview view**
- Fetches `GET /api/stats`
- Shows: progress bar (owned/total), counts by condition (sealed/built/loose)

**Catalog view**
- Fetches `GET /api/catalog`
- Scrollable list: set code, Pokémon name, owned/missing badge, condition chip if owned
- Search filter (client-side, no round-trip needed)

**Missing view**
- Fetches `GET /api/missing`
- Same list format, only unowned sets — useful when shopping

**Navigation**
- Bottom tab bar: Overview | Catalog | Missing
- Active view stored in `localStorage` so it persists across refreshes

---

## Settings Panel (`MobileAccessPanel.tsx`)

A slide-in panel (or modal) triggered by a "Mobile" button in the desktop app header.

Contents:
- **Server status**: green dot "Running on :45678" or red dot "Stopped"
- **Tunnel status**: green dot "Connected", yellow dot "Connecting…", or red dot "Not configured"
- **Tunnel URL**: read-only text field showing `config.tunnelUrl` + "Copy" button
- **Tunnel config**: if not configured — two inputs (Tunnel name, Tunnel URL) + Save button (calls `mobile:setTunnelConfig`)
- **PIN section**: if no PIN set — prompt to set one. If set — "Change PIN" form (enter new PIN, confirm, save via `mobile:setPin`)
- **Setup guide**: collapsible "First-time setup" instructions with the 6 shell commands and a download link for cloudflared

IPC channels used:
- `mobile:getServerStatus` → `{ running: boolean, port: number }`
- `mobile:getTunnelStatus` → `{ status: 'connected' | 'connecting' | 'not-configured' }`
- `mobile:getTunnelUrl` → `{ url: string }` (reads `config.tunnelUrl`)
- `mobile:setPin(pin: string)` → `{ success: boolean }`
- `mobile:setTunnelConfig({ tunnelName, tunnelUrl })` → `{ success: boolean }` (saves to config file)

---

## Dependencies to Add

```bash
npm install express cookie-parser
npm install --save-dev @types/express @types/cookie-parser
```

No session management library needed — `cookie-parser` with signed cookies covers the use case. No bcrypt — Node.js built-in `crypto` SHA-256 is sufficient for a PIN.

---

## What This Does NOT Do

- No write operations from mobile (read-only)
- No image hosting — images are CDN URLs loaded directly by the PWA from Merlinsbricks/Kawada/PokéAPI
- No push notifications
- No offline support (service worker is minimal pass-through only)
- No web-facing port on the PC — the only inbound connection is the cloudflared tunnel (outbound from PC)
