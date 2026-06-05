# Mobile Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only mobile PWA reachable from iPhone via an embedded Express server and a Cloudflare named tunnel with a stable HTTPS URL.

**Architecture:** An Express HTTP server and a `cloudflared` child process both start in the Electron main process when the app opens. The mobile PWA (plain HTML/JS/CSS in `resources/server/`) is served by Express and makes API calls to `/api/stats`, `/api/catalog`, and `/api/missing`. A PIN stored as SHA-256 in `userData/mobile-config.json` protects all API routes via a 30-day signed cookie.

**Tech Stack:** express, cookie-parser, Node.js built-in `crypto` (SHA-256), cloudflared CLI (user-installed), vanilla JS PWA, vitest + supertest for server tests, @testing-library/react for component tests.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/shared/catalog.ts` | Create | Catalog data moved here (no local PNG imports) |
| `src/renderer/data/catalog.ts` | Modify | Re-export from `../../shared/catalog` |
| `src/shared/types.ts` | Modify | Add `MobileConfig` interface + IPC constants |
| `src/main/mobile-config.ts` | Create | Load/save `mobile-config.json` from userData |
| `src/main/server.ts` | Create | Express server — static files + 4 API routes + PIN auth |
| `src/main/tunnel.ts` | Create | `TunnelManager` class — spawns cloudflared, tracks status |
| `src/main/index.ts` | Modify | Start server + tunnel after DB init; stop both on quit |
| `src/main/ipc.ts` | Modify | Add `registerMobileIpcHandlers` function |
| `src/preload/index.ts` | Modify | Expose 5 new mobile IPC channels |
| `src/renderer/env.d.ts` | Modify | Add 5 mobile methods to `window.electronAPI` type |
| `src/renderer/components/MobileAccessPanel.tsx` | Create | Settings panel — server/tunnel status, URL copy, PIN form |
| `src/renderer/App.tsx` | Modify | Add "Mobile" button + render `<MobileAccessPanel>` |
| `resources/server/index.html` | Create | PWA shell |
| `resources/server/app.js` | Create | PWA logic — 3 views, PIN entry, bottom nav |
| `resources/server/styles.css` | Create | Dark mobile CSS |
| `resources/server/manifest.json` | Create | Web App Manifest for iPhone install |
| `resources/server/service-worker.js` | Create | Minimal pass-through SW (iOS install requirement) |
| `package.json` | Modify | Add dependencies + `extraResources` for `resources/server` |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd nanoblock-tracker
npm install express cookie-parser
```

Expected: `package.json` dependencies now includes `"express"` and `"cookie-parser"`.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install --save-dev @types/express @types/cookie-parser supertest @types/supertest
```

Expected: `package.json` devDependencies now includes the four packages.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add express, cookie-parser, supertest dependencies"
```

---

### Task 2: Add MobileConfig types and IPC constants

**Files:**
- Modify: `src/shared/types.ts`
- Test: `tests/shared/types.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/shared/types.test.ts` (below the existing tests):

```typescript
import type { MobileConfig } from '../../src/shared/types'
import { IPC } from '../../src/shared/types'

describe('MobileConfig', () => {
  it('IPC has all five mobile channel constants', () => {
    expect(IPC.MOBILE_GET_SERVER_STATUS).toBe('mobile:getServerStatus')
    expect(IPC.MOBILE_GET_TUNNEL_STATUS).toBe('mobile:getTunnelStatus')
    expect(IPC.MOBILE_GET_TUNNEL_URL).toBe('mobile:getTunnelUrl')
    expect(IPC.MOBILE_SET_PIN).toBe('mobile:setPin')
    expect(IPC.MOBILE_SET_TUNNEL_CONFIG).toBe('mobile:setTunnelConfig')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/types.test.ts
```

Expected: FAIL — `IPC.MOBILE_GET_SERVER_STATUS` is `undefined`.

- [ ] **Step 3: Add MobileConfig and IPC constants to `src/shared/types.ts`**

Append to the end of the file:

```typescript
export interface MobileConfig {
  pinHash: string
  cookieSecret: string
  tunnelName: string
  tunnelUrl: string
}
```

Add five entries to the `IPC` constant (inside the `{}`):

```typescript
  MOBILE_GET_SERVER_STATUS: 'mobile:getServerStatus',
  MOBILE_GET_TUNNEL_STATUS: 'mobile:getTunnelStatus',
  MOBILE_GET_TUNNEL_URL: 'mobile:getTunnelUrl',
  MOBILE_SET_PIN: 'mobile:setPin',
  MOBILE_SET_TUNNEL_CONFIG: 'mobile:setTunnelConfig',
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts tests/shared/types.test.ts
git commit -m "feat: add MobileConfig interface and mobile IPC constants"
```

---

### Task 3: Move catalog to src/shared/catalog.ts

**Files:**
- Create: `src/shared/catalog.ts`
- Modify: `src/renderer/data/catalog.ts`
- Test: `tests/renderer/data/catalog.test.ts` (existing — must still pass)

The catalog currently lives in `src/renderer/data/catalog.ts` and imports 3 local PNG files. These imports fail in Node.js (main process). Moving to shared eliminates the Electron process boundary problem.

- [ ] **Step 1: Read the full current catalog file**

Open `src/renderer/data/catalog.ts` and read the entire file. Note:
- The 3 local import lines at the top (`import littenImg from ...`, `import popplioImg from ...`, `import rowletImg from ...`)
- The 3 corresponding `imageUrl: littenImg`, `imageUrl: popplioImg`, `imageUrl: rowletImg` usages in the CATALOG array (sets NBPM-025, NBPM-026, NBPM-027)
- Everything else (the `nbImage()` helper, `kawada()` helper, the full CATALOG array)

- [ ] **Step 2: Create `src/shared/catalog.ts`**

Create the file with the same content as `src/renderer/data/catalog.ts`, with these two changes:

1. Remove the 3 local PNG import lines:
   ```typescript
   // DELETE these three lines:
   import littenImg from '../assets/nanoblock/nbpm-025-litten.png'
   import popplioImg from '../assets/nanoblock/nbpm-026-popplio.png'
   import rowletImg from '../assets/nanoblock/nbpm-027-rowlet.png'
   ```

2. For the 3 sets that used the local images, replace the variable reference with the CDN URL pattern. Find the entries for NBPM-025, NBPM-026, NBPM-027 and change `imageUrl: littenImg` → `imageUrl: nbImage('NBPM-025')`, `imageUrl: popplioImg` → `imageUrl: nbImage('NBPM-026')`, `imageUrl: rowletImg` → `imageUrl: nbImage('NBPM-027')`.

The import in the new file should be:
```typescript
import type { NanoblockSet } from './types'
```
(not `'../../shared/types'` — the file is now IN shared, so it's just `'./types'`)

- [ ] **Step 3: Replace `src/renderer/data/catalog.ts` with a re-export**

```typescript
export { CATALOG } from '../../shared/catalog'
```

That's the entire file content. The existing import path in `src/renderer/App.tsx` (`import { CATALOG } from './data/catalog'`) continues to work unchanged.

- [ ] **Step 4: Run the existing catalog test**

```bash
npx vitest run tests/renderer/data/catalog.test.ts
```

Expected: All 7 tests PASS. The test imports `src/renderer/data/catalog` which now re-exports from shared — transparent to the test.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/shared/catalog.ts src/renderer/data/catalog.ts
git commit -m "refactor: move catalog to src/shared for main-process access"
```

---

### Task 4: Mobile config file I/O

**Files:**
- Create: `src/main/mobile-config.ts`
- Test: `tests/main/mobile-config.test.ts`

`loadConfig(userDataPath)` reads `<userDataPath>/mobile-config.json`. If the file doesn't exist, it writes a default config with a fresh UUID `cookieSecret` and returns it. `saveConfig(config, userDataPath)` writes the config back to disk.

- [ ] **Step 1: Write the failing tests**

Create `tests/main/mobile-config.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync, existsSync } from 'fs'
import { loadConfig, saveConfig } from '../../src/main/mobile-config'
import type { MobileConfig } from '../../src/shared/types'

const testDir = join(tmpdir(), 'nb-mobile-config-test-' + Date.now())

afterEach(() => {
  try { rmSync(testDir, { recursive: true }) } catch {}
})

describe('loadConfig', () => {
  it('creates mobile-config.json with defaults when file does not exist', () => {
    const config = loadConfig(testDir)

    expect(config.pinHash).toBe('')
    expect(config.tunnelName).toBe('')
    expect(config.tunnelUrl).toBe('')
    expect(config.cookieSecret).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(existsSync(join(testDir, 'mobile-config.json'))).toBe(true)
  })

  it('returns the same cookieSecret on subsequent calls', () => {
    const first = loadConfig(testDir)
    const second = loadConfig(testDir)
    expect(first.cookieSecret).toBe(second.cookieSecret)
  })

  it('reads values previously written by saveConfig', () => {
    loadConfig(testDir) // initialise file
    const update: MobileConfig = {
      pinHash: 'deadbeef',
      cookieSecret: 'fixed-secret',
      tunnelName: 'nanoblock',
      tunnelUrl: 'https://nanoblock.example.com',
    }
    saveConfig(update, testDir)
    const loaded = loadConfig(testDir)
    expect(loaded).toEqual(update)
  })
})

describe('saveConfig', () => {
  it('persists all fields to disk', () => {
    loadConfig(testDir)
    const config: MobileConfig = {
      pinHash: 'abc123',
      cookieSecret: 'secret',
      tunnelName: 'my-tunnel',
      tunnelUrl: 'https://example.com',
    }
    saveConfig(config, testDir)
    expect(loadConfig(testDir).pinHash).toBe('abc123')
    expect(loadConfig(testDir).tunnelUrl).toBe('https://example.com')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/main/mobile-config.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/main/mobile-config.ts`**

```typescript
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { MobileConfig } from '../shared/types'

const CONFIG_FILE = 'mobile-config.json'

function defaultConfig(): MobileConfig {
  return {
    pinHash: '',
    cookieSecret: randomUUID(),
    tunnelName: '',
    tunnelUrl: '',
  }
}

export function loadConfig(userDataPath: string): MobileConfig {
  mkdirSync(userDataPath, { recursive: true })
  const filePath = join(userDataPath, CONFIG_FILE)
  if (!existsSync(filePath)) {
    const config = defaultConfig()
    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')
    return config
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as MobileConfig
}

export function saveConfig(config: MobileConfig, userDataPath: string): void {
  mkdirSync(userDataPath, { recursive: true })
  writeFileSync(join(userDataPath, CONFIG_FILE), JSON.stringify(config, null, 2), 'utf-8')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/main/mobile-config.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/mobile-config.ts tests/main/mobile-config.test.ts
git commit -m "feat: add mobile-config file I/O helpers"
```

---

### Task 5: Express server

**Files:**
- Create: `src/main/server.ts`
- Test: `tests/main/server.test.ts`

`startServer(db, config, staticRoot)` creates and starts the Express app. The catalog is imported from `src/shared/catalog.ts`. `staticRoot` is passed in so tests can use a dummy path and avoid any Electron dependency.

- [ ] **Step 1: Write the failing tests**

Create `tests/main/server.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import type * as http from 'http'
import initSqlJs from 'sql.js'
import { createHash } from 'crypto'
import { createSchema, addToCollection } from '../../src/main/db'
import { startServer, stopServer } from '../../src/main/server'
import type { MobileConfig } from '../../src/shared/types'

const PIN = '1234'
const config: MobileConfig = {
  pinHash: createHash('sha256').update(PIN).digest('hex'),
  cookieSecret: 'test-cookie-secret-32chars-padding!!',
  tunnelName: '',
  tunnelUrl: '',
}

let server: http.Server
let db: any

async function authCookie(): Promise<string> {
  const res = await request(server).post('/api/auth').send({ pin: PIN })
  return (res.headers['set-cookie'] as string[])[0]
}

beforeAll(async () => {
  const SQL = await initSqlJs()
  db = new SQL.Database()
  createSchema(db)
  server = startServer(db, config, '/nonexistent-static-root')
})

afterAll(() => stopServer(server))

beforeEach(() => {
  // Reset DB between tests that mutate it
  db.run('DELETE FROM collection')
})

describe('POST /api/auth', () => {
  it('returns 401 with wrong PIN', async () => {
    await request(server).post('/api/auth').send({ pin: 'wrong' }).expect(401)
  })

  it('returns 200 and sets signed cookie with correct PIN', async () => {
    const res = await request(server).post('/api/auth').send({ pin: PIN }).expect(200)
    const cookie = (res.headers['set-cookie'] as string[])?.[0]
    expect(cookie).toMatch(/session=/)
  })

  it('returns 401 when pinHash is empty (no PIN set)', async () => {
    const noPin: MobileConfig = { ...config, pinHash: '' }
    const tempServer = startServer(db, noPin, '/tmp')
    await request(tempServer).post('/api/auth').send({ pin: '1234' }).expect(401)
    await stopServer(tempServer)
  })
})

describe('GET /api/stats', () => {
  it('returns 401 without auth cookie', async () => {
    await request(server).get('/api/stats').expect(401)
  })

  it('returns stats with owned=0 on empty collection', async () => {
    const cookie = await authCookie()
    const res = await request(server).get('/api/stats').set('Cookie', cookie).expect(200)
    expect(res.body.owned).toBe(0)
    expect(res.body.total).toBeGreaterThan(0)
    expect(res.body.byCondition).toEqual({ sealed: 0, built: 0, loose: 0 })
  })

  it('counts owned sets correctly after adding one', async () => {
    addToCollection(db, { setId: 'NBPM-001', condition: 'sealed', notes: '', dateAdded: '2024-01-01' })
    const cookie = await authCookie()
    const res = await request(server).get('/api/stats').set('Cookie', cookie).expect(200)
    expect(res.body.owned).toBe(1)
    expect(res.body.byCondition.sealed).toBe(1)
  })
})

describe('GET /api/catalog', () => {
  it('returns 401 without auth cookie', async () => {
    await request(server).get('/api/catalog').expect(401)
  })

  it('returns all catalog sets with owned flag', async () => {
    addToCollection(db, { setId: 'NBPM-001', condition: 'built', notes: 'test', dateAdded: '2024-01-01' })
    const cookie = await authCookie()
    const res = await request(server).get('/api/catalog').set('Cookie', cookie).expect(200)

    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)

    const first = res.body.find((s: any) => s.id === 'NBPM-001')
    expect(first.owned).toBe(true)
    expect(first.condition).toBe('built')

    const other = res.body.find((s: any) => s.id === 'NBPM-002')
    expect(other.owned).toBe(false)
  })
})

describe('GET /api/missing', () => {
  it('returns 401 without auth cookie', async () => {
    await request(server).get('/api/missing').expect(401)
  })

  it('excludes owned sets from results', async () => {
    addToCollection(db, { setId: 'NBPM-001', condition: 'sealed', notes: '', dateAdded: '2024-01-01' })
    const cookie = await authCookie()
    const res = await request(server).get('/api/missing').set('Cookie', cookie).expect(200)

    const ids = res.body.map((s: any) => s.id)
    expect(ids).not.toContain('NBPM-001')
    expect(res.body.every((s: any) => s.owned === false)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/main/server.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/main/server.ts`**

```typescript
import express from 'express'
import cookieParser from 'cookie-parser'
import { createHash } from 'crypto'
import type * as http from 'http'
import type { Database } from 'sql.js'
import type { MobileConfig } from '../shared/types'
import { CATALOG } from '../shared/catalog'
import { getCollection } from './db'

const PORT = 45678

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

export function startServer(
  db: Database,
  config: MobileConfig,
  staticRoot: string
): http.Server {
  const app = express()

  app.use(express.static(staticRoot))
  app.use(cookieParser(config.cookieSecret))
  app.use(express.json())

  const requireAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (req.signedCookies['session'] === 'ok') {
      next()
    } else {
      res.status(401).json({ error: 'Unauthorized' })
    }
  }

  app.post('/api/auth', (req, res) => {
    const { pin } = req.body as { pin?: string }
    if (!pin || !config.pinHash) {
      res.status(401).json({ error: 'No PIN configured' })
      return
    }
    if (hashPin(pin) === config.pinHash) {
      res.cookie('session', 'ok', {
        signed: true,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      })
      res.json({ ok: true })
    } else {
      res.status(401).json({ error: 'Invalid PIN' })
    }
  })

  app.get('/api/stats', requireAuth, (_req, res) => {
    const collection = getCollection(db)
    const byCondition = { sealed: 0, built: 0, loose: 0 }
    for (const e of collection) byCondition[e.condition]++
    res.json({ total: CATALOG.length, owned: collection.length, byCondition })
  })

  app.get('/api/catalog', requireAuth, (_req, res) => {
    const collection = getCollection(db)
    const ownedMap = new Map(collection.map(e => [e.setId, e]))
    res.json(
      CATALOG.map(set => {
        const entry = ownedMap.get(set.id)
        return { ...set, owned: !!entry, condition: entry?.condition, notes: entry?.notes }
      })
    )
  })

  app.get('/api/missing', requireAuth, (_req, res) => {
    const collection = getCollection(db)
    const ownedIds = new Set(collection.map(e => e.setId))
    res.json(CATALOG.filter(set => !ownedIds.has(set.id)).map(set => ({ ...set, owned: false })))
  })

  return app.listen(PORT)
}

export function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(err => (err ? reject(err) : resolve()))
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/main/server.test.ts
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/main/server.ts tests/main/server.test.ts
git commit -m "feat: add Express mobile companion server with PIN auth"
```

---

### Task 6: Cloudflared tunnel manager

**Files:**
- Create: `src/main/tunnel.ts`
- Test: `tests/main/tunnel.test.ts`

`TunnelManager` spawns `cloudflared tunnel run <name>` as a child process, watches stdout/stderr for the "Registered tunnel connection" line to detect when the tunnel is live, and restarts on unexpected exit (5 second delay). It extends `EventEmitter` and emits `'status'` events.

- [ ] **Step 1: Write the failing tests**

Create `tests/main/tunnel.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => ({ spawn: vi.fn() }))

import { spawn } from 'child_process'
import { TunnelManager } from '../../src/main/tunnel'

function makeMockProc() {
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TunnelManager', () => {
  it('starts with connecting status and spawns cloudflared', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    expect(mgr.status).toBe('connecting')
    expect(spawn).toHaveBeenCalledWith('cloudflared', ['tunnel', 'run', 'nanoblock'], expect.any(Object))
  })

  it('transitions to connected when stdout contains registration message', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    const events: string[] = []
    mgr.on('status', s => events.push(s))

    proc.stdout.emit('data', Buffer.from('INF Registered tunnel connection to edge'))

    expect(mgr.status).toBe('connected')
    expect(events).toContain('connected')
  })

  it('also detects connection via stderr', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    proc.stderr.emit('data', Buffer.from('Registered tunnel connection'))
    expect(mgr.status).toBe('connected')
  })

  it('kills the process and sets stopped status on stop()', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    mgr.stop()

    expect(proc.kill).toHaveBeenCalled()
    expect(mgr.status).toBe('stopped')
  })

  it('restarts after 5 seconds on unexpected exit', () => {
    const proc1 = makeMockProc()
    const proc2 = makeMockProc()
    vi.mocked(spawn).mockReturnValueOnce(proc1 as any).mockReturnValueOnce(proc2 as any)

    new TunnelManager('nanoblock')
    proc1.emit('exit', 1)

    expect(spawn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5000)
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('does NOT restart after stop() when process exits', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    mgr.stop()
    proc.emit('exit', 0)

    vi.advanceTimersByTime(6000)
    expect(spawn).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/main/tunnel.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/main/tunnel.ts`**

```typescript
import { spawn } from 'child_process'
import { EventEmitter } from 'events'

export type TunnelStatus = 'connecting' | 'connected' | 'stopped'

export class TunnelManager extends EventEmitter {
  status: TunnelStatus = 'connecting'
  private proc: ReturnType<typeof spawn> | null = null
  private stopped = false

  constructor(private readonly tunnelName: string) {
    super()
    this.launch()
  }

  private launch(): void {
    this.proc = spawn('cloudflared', ['tunnel', 'run', this.tunnelName], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const onData = (data: Buffer): void => {
      if (data.toString().includes('Registered tunnel connection')) {
        this.status = 'connected'
        this.emit('status', 'connected' as TunnelStatus)
      }
    }

    this.proc.stdout?.on('data', onData)
    this.proc.stderr?.on('data', onData)

    this.proc.on('exit', () => {
      if (this.stopped) return
      this.status = 'connecting'
      this.emit('status', 'connecting' as TunnelStatus)
      setTimeout(() => {
        if (!this.stopped) this.launch()
      }, 5000)
    })
  }

  stop(): void {
    this.stopped = true
    this.status = 'stopped'
    this.emit('status', 'stopped' as TunnelStatus)
    this.proc?.kill()
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/main/tunnel.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/tunnel.ts tests/main/tunnel.test.ts
git commit -m "feat: add TunnelManager for cloudflared process lifecycle"
```

---

### Task 7: PWA static files and extraResources

**Files:**
- Create: `resources/server/index.html`
- Create: `resources/server/app.js`
- Create: `resources/server/styles.css`
- Create: `resources/server/manifest.json`
- Create: `resources/server/service-worker.js`
- Modify: `package.json` (extraResources)

No unit tests for static files — they are verified end-to-end when the full app runs.

- [ ] **Step 1: Create `resources/server/` directory**

```bash
mkdir -p resources/server
```

- [ ] **Step 2: Create `resources/server/manifest.json`**

```json
{
  "name": "Nanoblock Tracker",
  "short_name": "Nanoblock",
  "display": "standalone",
  "background_color": "#0f1923",
  "theme_color": "#0f1923",
  "start_url": "/"
}
```

- [ ] **Step 3: Create `resources/server/service-worker.js`**

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
```

- [ ] **Step 4: Create `resources/server/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0f1923">
  <title>Nanoblock Tracker</title>
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `resources/server/styles.css`**

```css
:root {
  --bg: #0f1923;
  --surface: #1a2a3a;
  --border: #2a3a50;
  --text: #e2e8f0;
  --dim: #64748b;
  --accent: #7dd3fc;
  --green: #86efac;
  --sealed: #86efac;
  --built: #7dd3fc;
  --loose: #c4b5fd;
  --miss: #475569;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
#app { height: 100%; display: flex; flex-direction: column; }

/* PIN */
.pin-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 32px; gap: 14px; }
.pin-title { font-size: 22px; font-weight: 700; color: var(--accent); }
.pin-sub { color: var(--dim); font-size: 14px; }
.pin-input { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 24px; letter-spacing: 8px; padding: 12px 20px; text-align: center; width: 180px; }
.pin-btn { background: var(--accent); border: none; border-radius: 8px; color: #0f1923; font-size: 15px; font-weight: 600; padding: 12px 0; cursor: pointer; width: 180px; }
.pin-error { color: #f87171; font-size: 13px; min-height: 18px; }

/* App shell */
.app-shell { display: flex; flex-direction: column; height: 100%; }
.content { flex: 1; overflow-y: auto; padding: 16px 16px 80px; }

/* Bottom nav */
.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); display: flex; padding-bottom: env(safe-area-inset-bottom); }
.nav-btn { flex: 1; background: none; border: none; color: var(--dim); display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 0; cursor: pointer; }
.nav-btn.active { color: var(--accent); }
.nav-icon { font-size: 20px; }
.nav-label { font-size: 11px; }

/* Overview */
.section-title { font-size: 18px; font-weight: 600; margin-bottom: 14px; }
.progress-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
.prog-nums { font-size: 38px; font-weight: 700; color: var(--accent); line-height: 1; }
.prog-total { font-size: 22px; color: var(--dim); }
.prog-bar { background: var(--border); border-radius: 4px; height: 6px; margin: 10px 0 6px; overflow: hidden; }
.prog-fill { background: var(--accent); height: 100%; border-radius: 4px; }
.prog-pct { color: var(--dim); font-size: 13px; }
.cond-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cond-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; text-align: center; }
.cond-count { font-size: 28px; font-weight: 700; color: var(--accent); }
.cond-label { font-size: 12px; color: var(--dim); margin-top: 2px; }

/* List */
.search-input { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; padding: 10px 14px; width: 100%; margin-bottom: 12px; }
.set-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
.set-code { font-size: 11px; color: var(--dim); font-family: monospace; }
.set-name { font-size: 14px; font-weight: 500; margin-top: 2px; }
.badge { border-radius: 4px; font-size: 11px; font-weight: 600; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-sealed { background: #1a2e1a; color: var(--sealed); }
.badge-built { background: #1a2a3a; color: var(--built); }
.badge-loose { background: #2a1a3a; color: var(--loose); }
.badge-missing { background: #1a1a2a; color: var(--miss); }
.loading { color: var(--dim); text-align: center; padding: 40px 0; }
```

- [ ] **Step 6: Create `resources/server/app.js`**

```javascript
// @ts-nocheck
let catalogData = null
let missingData = null

async function api(path, options = {}) {
  const res = await fetch(path, options)
  if (res.status === 401) { showPin(); return null }
  return res.json()
}

function showPin() {
  document.getElementById('app').innerHTML = `
    <div class="pin-screen">
      <h1 class="pin-title">Nanoblock Tracker</h1>
      <p class="pin-sub">Enter your PIN to continue</p>
      <input class="pin-input" type="password" inputmode="numeric" maxlength="8" id="pin-input" placeholder="••••" autocomplete="off">
      <button class="pin-btn" onclick="submitPin()">Unlock</button>
      <p id="pin-error" class="pin-error"></p>
    </div>
  `
  setTimeout(() => document.getElementById('pin-input')?.focus(), 50)
}

async function submitPin() {
  const pin = document.getElementById('pin-input').value
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  if (res.ok) { catalogData = null; missingData = null; init() }
  else document.getElementById('pin-error').textContent = 'Incorrect PIN'
}

function showApp(view) {
  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <div class="content" id="content"></div>
      <nav class="bottom-nav">
        <button class="nav-btn" data-view="overview" onclick="switchView('overview')">
          <span class="nav-icon">📊</span><span class="nav-label">Overview</span>
        </button>
        <button class="nav-btn" data-view="catalog" onclick="switchView('catalog')">
          <span class="nav-icon">📋</span><span class="nav-label">Catalog</span>
        </button>
        <button class="nav-btn" data-view="missing" onclick="switchView('missing')">
          <span class="nav-icon">🛒</span><span class="nav-label">Missing</span>
        </button>
      </nav>
    </div>
  `
  switchView(view)
}

function setNav(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view))
}

async function switchView(view) {
  localStorage.setItem('view', view)
  setNav(view)
  if (view === 'overview') await renderOverview()
  else if (view === 'catalog') await renderCatalog()
  else if (view === 'missing') await renderMissing()
}

async function renderOverview() {
  const el = document.getElementById('content')
  el.innerHTML = '<p class="loading">Loading…</p>'
  const d = await api('/api/stats')
  if (!d) return
  const pct = d.total ? Math.round(d.owned / d.total * 100) : 0
  el.innerHTML = `
    <h2 class="section-title">My Collection</h2>
    <div class="progress-card">
      <div class="prog-nums">${d.owned}<span class="prog-total"> / ${d.total}</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
      <div class="prog-pct">${pct}% complete</div>
    </div>
    <div class="cond-grid">
      <div class="cond-card"><div class="cond-count">${d.byCondition.sealed}</div><div class="cond-label">Sealed</div></div>
      <div class="cond-card"><div class="cond-count">${d.byCondition.built}</div><div class="cond-label">Built</div></div>
      <div class="cond-card"><div class="cond-count">${d.byCondition.loose}</div><div class="cond-label">Loose</div></div>
    </div>
  `
}

async function renderCatalog() {
  if (!catalogData) {
    document.getElementById('content').innerHTML = '<p class="loading">Loading…</p>'
    catalogData = await api('/api/catalog')
    if (!catalogData) return
  }
  renderList(catalogData, true)
}

async function renderMissing() {
  if (!missingData) {
    document.getElementById('content').innerHTML = '<p class="loading">Loading…</p>'
    missingData = await api('/api/missing')
    if (!missingData) return
  }
  renderList(missingData, false)
}

function renderList(data, showSearch) {
  const items = data.map(s => `
    <div class="set-item" data-name="${s.pokemonName.toLowerCase()}" data-code="${s.setCode.toLowerCase()}">
      <div>
        <div class="set-code">${s.setCode}</div>
        <div class="set-name">${s.pokemonName}</div>
      </div>
      ${s.owned ? `<span class="badge badge-${s.condition}">${s.condition}</span>` : '<span class="badge badge-missing">missing</span>'}
    </div>
  `).join('')
  document.getElementById('content').innerHTML = `
    <div>
      ${showSearch ? '<input class="search-input" id="search" placeholder="Search Pokémon…" oninput="filterList()" autocomplete="off">' : ''}
      <div id="list-items">${items}</div>
    </div>
  `
}

function filterList() {
  const q = document.getElementById('search').value.toLowerCase()
  document.querySelectorAll('.set-item').forEach(el => {
    el.style.display = (el.dataset.name.includes(q) || el.dataset.code.includes(q)) ? '' : 'none'
  })
}

async function init() {
  const d = await api('/api/stats')
  if (!d) return
  showApp(localStorage.getItem('view') || 'overview')
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {})
}

init()
```

- [ ] **Step 7: Add `resources/server` to `extraResources` in `package.json`**

Find the `"extraResources"` array in `package.json` and add the server entry:

```json
"extraResources": [
  {
    "from": "node_modules/sql.js/dist/sql-wasm.wasm",
    "to": "sql-wasm.wasm"
  },
  {
    "from": "resources/server",
    "to": "server"
  }
]
```

- [ ] **Step 8: Commit**

```bash
git add resources/server/ package.json
git commit -m "feat: add mobile PWA static files and extraResources config"
```

---

### Task 8: Wire server and tunnel into main/index.ts

**Files:**
- Modify: `src/main/index.ts`

Connect `loadConfig`, `startServer`, `TunnelManager` into the existing app startup sequence.

- [ ] **Step 1: Read `src/main/index.ts` in full before editing**

Look at lines 1–93. Key points:
- DB init happens in `initDatabase()`
- `db.run` is monkey-patched to auto-persist
- `registerIpcHandlers(db)` is called before `createWindow()`
- `window-all-closed` calls `app.quit()` on non-macOS

- [ ] **Step 2: Add imports at the top of `src/main/index.ts`**

After the existing imports, add:

```typescript
import { loadConfig, saveConfig } from './mobile-config'
import { startServer, stopServer } from './server'
import { TunnelManager } from './tunnel'
import type { MobileConfig } from '../shared/types'
import type * as http from 'http'
```

- [ ] **Step 3: Add module-level state variables (after imports, before functions)**

Use a holder object for the tunnel so Task 9's IPC handler can swap it when the user changes the config.

```typescript
let mobileServer: http.Server | null = null
const mobileTunnelHolder: { value: TunnelManager | null } = { value: null }
let mobileConfig: MobileConfig | null = null
let mobileUserDataPath = ''

function getMobileStaticRoot(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'server')
    : join(process.cwd(), 'resources/server')
}
```

- [ ] **Step 4: Start server and tunnel inside `app.whenReady()`**

In `app.whenReady().then(async () => { ... })`, after the `registerIpcHandlers(db)` line and before `await createWindow()`, add:

```typescript
  mobileUserDataPath = app.getPath('userData')
  const config = loadConfig(mobileUserDataPath)
  mobileConfig = config
  const mobileServerInstance = startServer(db, config, getMobileStaticRoot())
  mobileServer = mobileServerInstance
  if (config.tunnelName) {
    mobileTunnelHolder.value = new TunnelManager(config.tunnelName)
  }
```

Also update the call to `registerIpcHandlers` to pass the new state (add this line after — the import for `registerMobileIpcHandlers` comes in Task 9):

```typescript
  registerIpcHandlers(db)
  // registerMobileIpcHandlers added in Task 9:
  // registerMobileIpcHandlers(mobileServerInstance, mobileTunnelHolder, mobileConfig, mobileUserDataPath)
```

- [ ] **Step 5: Stop server and tunnel in `window-all-closed`**

Replace the existing `app.on('window-all-closed', ...)` handler with:

```typescript
app.on('window-all-closed', async () => {
  mobileTunnelHolder.value?.stop()
  if (mobileServer) await stopServer(mobileServer)
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: No errors (the `registerMobileIpcHandlers` call is commented out for now).

- [ ] **Step 7: Commit**

```bash
git add src/main/index.ts
git commit -m "feat: start Express server and cloudflared tunnel on app launch"
```

---

### Task 9: Mobile IPC handlers, preload, and type declarations

**Files:**
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/env.d.ts`

Add `registerMobileIpcHandlers` to `ipc.ts`, expose the 5 new channels in the preload, and add TypeScript declarations to `env.d.ts`.

- [ ] **Step 1: Add `registerMobileIpcHandlers` to `src/main/ipc.ts`**

At the top, add imports after the existing ones:

```typescript
import { createHash } from 'crypto'
import type * as http from 'http'
import { saveConfig } from './mobile-config'
import { TunnelManager } from './tunnel'
import type { MobileConfig } from '../shared/types'
```

After the closing `}` of `registerIpcHandlers`, add the new function:

```typescript
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
```

- [ ] **Step 2: Uncomment and complete the `registerMobileIpcHandlers` call in `src/main/index.ts`**

In `index.ts`:

1. Add the import of `registerMobileIpcHandlers`:
   ```typescript
   import { registerIpcHandlers, registerMobileIpcHandlers } from './ipc'
   ```

2. Replace the commented-out line with the real call (using the local `config` and `mobileServerInstance` consts that are still in scope):
   ```typescript
   registerMobileIpcHandlers(mobileServerInstance, mobileTunnelHolder, config, mobileUserDataPath)
   ```

The `window-all-closed` handler becomes:

```typescript
  mobileTunnelHolder.value?.stop()
```

Also add the import of `registerMobileIpcHandlers` to `index.ts`:

```typescript
import { registerIpcHandlers, registerMobileIpcHandlers } from './ipc'
```

- [ ] **Step 3: Expose new channels in `src/preload/index.ts`**

Add the 5 new methods inside `contextBridge.exposeInMainWorld('electronAPI', { ... })`, after the existing `openExternal` entry:

```typescript
  mobileGetServerStatus: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_SERVER_STATUS),
  mobileGetTunnelStatus: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_TUNNEL_STATUS),
  mobileGetTunnelUrl: () =>
    ipcRenderer.invoke(IPC.MOBILE_GET_TUNNEL_URL),
  mobileSetPin: (pin: string) =>
    ipcRenderer.invoke(IPC.MOBILE_SET_PIN, pin),
  mobileSetTunnelConfig: (args: { tunnelName: string; tunnelUrl: string }) =>
    ipcRenderer.invoke(IPC.MOBILE_SET_TUNNEL_CONFIG, args),
```

- [ ] **Step 4: Add type declarations to `src/renderer/env.d.ts`**

Inside the `Window.electronAPI` interface, after `openExternal`, add:

```typescript
      mobileGetServerStatus: () => Promise<{ running: boolean; port: number }>
      mobileGetTunnelStatus: () => Promise<{ status: 'connected' | 'connecting' | 'not-configured' }>
      mobileGetTunnelUrl: () => Promise<{ url: string }>
      mobileSetPin: (pin: string) => Promise<{ success: boolean }>
      mobileSetTunnelConfig: (args: { tunnelName: string; tunnelUrl: string }) => Promise<{ success: boolean }>
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Run full test suite to check nothing is broken**

```bash
npm run test:run
```

Expected: All existing tests plus Tasks 4, 5, 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/main/ipc.ts src/main/index.ts src/preload/index.ts src/renderer/env.d.ts
git commit -m "feat: add mobile IPC handlers and preload bindings"
```

---

### Task 10: MobileAccessPanel component

**Files:**
- Create: `src/renderer/components/MobileAccessPanel.tsx`
- Test: `tests/renderer/components/MobileAccessPanel.test.tsx`

The panel shows server status, tunnel status + URL + copy button, tunnel config form (if not configured), and PIN management.

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/components/MobileAccessPanel.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MobileAccessPanel } from '../../../src/renderer/components/MobileAccessPanel'

const mockApi = {
  mobileGetServerStatus: vi.fn(),
  mobileGetTunnelStatus: vi.fn(),
  mobileGetTunnelUrl: vi.fn(),
  mobileSetPin: vi.fn(),
  mobileSetTunnelConfig: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  window.electronAPI = { ...window.electronAPI, ...mockApi } as typeof window.electronAPI
})

function renderRunning() {
  mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
  mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'connected' })
  mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: 'https://nanoblock.example.com' })
  return render(<MobileAccessPanel onClose={() => {}} />)
}

describe('MobileAccessPanel', () => {
  it('shows running status and port number', async () => {
    renderRunning()
    await waitFor(() => expect(screen.getByText(/45678/)).toBeInTheDocument())
  })

  it('shows tunnel URL when connected', async () => {
    renderRunning()
    await waitFor(() =>
      expect(screen.getByDisplayValue('https://nanoblock.example.com')).toBeInTheDocument()
    )
  })

  it('shows "Not configured" when tunnel status is not-configured', async () => {
    mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
    mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'not-configured' })
    mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: '' })
    render(<MobileAccessPanel onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/not configured/i)).toBeInTheDocument())
  })

  it('calls mobileSetPin when PIN form is submitted', async () => {
    mockApi.mobileSetPin.mockResolvedValue({ success: true })
    renderRunning()
    await waitFor(() => screen.getByPlaceholderText(/new pin/i))
    fireEvent.change(screen.getByPlaceholderText(/new pin/i), { target: { value: '5678' } })
    fireEvent.click(screen.getByRole('button', { name: /save pin/i }))
    await waitFor(() => expect(mockApi.mobileSetPin).toHaveBeenCalledWith('5678'))
  })

  it('calls mobileSetTunnelConfig when tunnel form is saved', async () => {
    mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
    mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'not-configured' })
    mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: '' })
    mockApi.mobileSetTunnelConfig.mockResolvedValue({ success: true })
    render(<MobileAccessPanel onClose={() => {}} />)

    await waitFor(() => screen.getByPlaceholderText(/tunnel name/i))
    fireEvent.change(screen.getByPlaceholderText(/tunnel name/i), { target: { value: 'nanoblock' } })
    fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), { target: { value: 'https://nanoblock.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save tunnel/i }))

    await waitFor(() =>
      expect(mockApi.mobileSetTunnelConfig).toHaveBeenCalledWith({
        tunnelName: 'nanoblock',
        tunnelUrl: 'https://nanoblock.example.com',
      })
    )
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    renderRunning()
    await waitFor(() => screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).not.toHaveBeenCalled() // sanity: ensure we're testing correct element
    // Re-render with the spy
    const onClose2 = vi.fn()
    render(<MobileAccessPanel onClose={onClose2} />)
    await waitFor(() => screen.getAllByRole('button', { name: /close/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[1])
    expect(onClose2).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/renderer/components/MobileAccessPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/renderer/components/MobileAccessPanel.tsx`**

```typescript
import { useEffect, useState } from 'react'

type TunnelStatus = 'connected' | 'connecting' | 'not-configured'

interface ServerStatus {
  running: boolean
  port: number
}

export function MobileAccessPanel({ onClose }: { onClose: () => void }) {
  const [server, setServer] = useState<ServerStatus | null>(null)
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>('not-configured')
  const [tunnelUrl, setTunnelUrl] = useState('')
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [tunnelName, setTunnelName] = useState('')
  const [tunnelUrlInput, setTunnelUrlInput] = useState('')
  const [tunnelMsg, setTunnelMsg] = useState('')

  useEffect(() => {
    void (async () => {
      const [sv, ts, tu] = await Promise.all([
        window.electronAPI.mobileGetServerStatus(),
        window.electronAPI.mobileGetTunnelStatus(),
        window.electronAPI.mobileGetTunnelUrl(),
      ])
      setServer(sv)
      setTunnelStatus(ts.status)
      setTunnelUrl(tu.url)
    })()
  }, [])

  async function handleSavePin() {
    if (!pin) return
    await window.electronAPI.mobileSetPin(pin)
    setPin('')
    setPinMsg('PIN saved.')
    setTimeout(() => setPinMsg(''), 3000)
  }

  async function handleSaveTunnel() {
    if (!tunnelName || !tunnelUrlInput) return
    await window.electronAPI.mobileSetTunnelConfig({ tunnelName, tunnelUrl: tunnelUrlInput })
    setTunnelMsg('Saved. Restart app to apply tunnel.')
    setTimeout(() => setTunnelMsg(''), 4000)
  }

  function copyUrl() {
    void navigator.clipboard.writeText(tunnelUrl)
  }

  const statusDot = (ok: boolean) => (
    <span style={{ color: ok ? '#86efac' : '#f87171', marginRight: 6 }}>●</span>
  )

  const tunnelColor: Record<TunnelStatus, string> = {
    connected: '#86efac',
    connecting: '#fcd34d',
    'not-configured': '#f87171',
  }

  return (
    <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel" style={{ maxWidth: 480 }}>
        <div className="detail-header">
          <h2 className="detail-title">Mobile Access</h2>
          <button className="detail-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Server status */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Server</h3>
            {server ? (
              <p style={{ fontSize: 14 }}>{statusDot(server.running)}{server.running ? `Running on port ${server.port}` : 'Stopped'}</p>
            ) : (
              <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>
            )}
          </section>

          {/* Tunnel status */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tunnel</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>
              <span style={{ color: tunnelColor[tunnelStatus], marginRight: 6 }}>●</span>
              {tunnelStatus === 'connected' ? 'Connected' : tunnelStatus === 'connecting' ? 'Connecting…' : 'Not configured'}
            </p>
            {tunnelUrl && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={tunnelUrl}
                  style={{ flex: 1, background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#7dd3fc', fontSize: 13, padding: '7px 10px' }}
                />
                <button onClick={copyUrl} style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '7px 12px', fontSize: 13 }}>Copy</button>
              </div>
            )}
          </section>

          {/* Tunnel config (shown when not configured) */}
          {tunnelStatus === 'not-configured' && (
            <section>
              <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Configure Tunnel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  placeholder="Tunnel name (e.g. nanoblock)"
                  value={tunnelName}
                  onChange={e => setTunnelName(e.target.value)}
                  style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
                />
                <input
                  placeholder="https://your-url.example.com"
                  value={tunnelUrlInput}
                  onChange={e => setTunnelUrlInput(e.target.value)}
                  style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
                />
                <button onClick={handleSaveTunnel} aria-label="Save tunnel" style={{ background: '#7dd3fc', border: 'none', borderRadius: 6, color: '#0f1923', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '9px 0' }}>Save Tunnel Config</button>
                {tunnelMsg && <p style={{ color: '#86efac', fontSize: 13 }}>{tunnelMsg}</p>}
              </div>
            </section>
          )}

          {/* PIN management */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>PIN</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="New PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                style={{ flex: 1, background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
              />
              <button onClick={handleSavePin} aria-label="Save PIN" style={{ background: '#7dd3fc', border: 'none', borderRadius: 6, color: '#0f1923', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 14px' }}>Save PIN</button>
            </div>
            {pinMsg && <p style={{ color: '#86efac', fontSize: 13, marginTop: 6 }}>{pinMsg}</p>}
          </section>

        </div>
      </div>
    </div>
  )
}
```

Note: The component reuses `.detail-overlay`, `.detail-panel`, `.detail-header`, `.detail-title`, `.detail-close` CSS classes that already exist in the app's stylesheet (used by `SetDetail`). Check `src/renderer/styles.css` and ensure those classes exist; if they don't, use inline styles for the overlay/panel structure.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/renderer/components/MobileAccessPanel.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/MobileAccessPanel.tsx tests/renderer/components/MobileAccessPanel.test.tsx
git commit -m "feat: add MobileAccessPanel settings component"
```

---

### Task 11: Wire MobileAccessPanel into App.tsx

**Files:**
- Modify: `src/renderer/App.tsx`
- Test: `tests/renderer/components/App.test.tsx` (new, minimal)

Add a "Mobile" button to the header. When clicked, render `<MobileAccessPanel>` as an overlay.

- [ ] **Step 1: Write the failing test**

Create `tests/renderer/components/App.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../../src/renderer/App'

vi.mock('../../../src/renderer/hooks/useCollection', () => ({
  useCollection: () => ({ entries: [], ownedIds: new Set(), addEntry: vi.fn(), updateEntry: vi.fn(), removeEntry: vi.fn() }),
}))

vi.mock('../../../src/renderer/hooks/usePriceLookup', () => ({
  usePriceLookup: () => ({ ebay: null, nanoblock: null }),
}))

window.electronAPI = {
  ...window.electronAPI,
  mobileGetServerStatus: vi.fn().mockResolvedValue({ running: true, port: 45678 }),
  mobileGetTunnelStatus: vi.fn().mockResolvedValue({ status: 'not-configured' }),
  mobileGetTunnelUrl: vi.fn().mockResolvedValue({ url: '' }),
  mobileSetPin: vi.fn(),
  mobileSetTunnelConfig: vi.fn(),
} as typeof window.electronAPI

describe('App mobile access', () => {
  it('opens MobileAccessPanel when Mobile button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    expect(screen.getByText('Mobile Access')).toBeInTheDocument()
  })

  it('closes MobileAccessPanel when close button is clicked', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Mobile Access')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/renderer/components/App.test.tsx
```

Expected: FAIL — no "mobile" button in the header.

- [ ] **Step 3: Update `src/renderer/App.tsx`**

Add the import at the top:
```typescript
import { MobileAccessPanel } from './components/MobileAccessPanel'
```

Add state inside the `App` component:
```typescript
const [mobileOpen, setMobileOpen] = useState(false)
```

In the `<header>` JSX, add the Mobile button after the `<ProgressBar>` element:
```tsx
<button
  className="mobile-btn"
  aria-label="Mobile"
  onClick={() => setMobileOpen(true)}
  style={{ background: 'none', border: '1px solid #2a3a50', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '5px 12px', marginLeft: 12 }}
>
  📱 Mobile
</button>
```

After the closing `</div>` of the `app` root (after the SetDetail conditional), add:
```tsx
{mobileOpen && <MobileAccessPanel onClose={() => setMobileOpen(false)} />}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/renderer/components/App.test.tsx
```

Expected: Both tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
npm run test:run
```

Expected: All tests PASS.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/App.tsx tests/renderer/components/App.test.tsx
git commit -m "feat: add Mobile Access button and panel to desktop app"
```

---

## Done

At this point the implementation is complete. The app will:

1. Start the Express server on `localhost:45678` when opened
2. Start the cloudflared tunnel if `tunnelName` is configured
3. Serve the mobile PWA at the stable Cloudflare URL
4. Protect all API routes with a PIN (set via the Mobile Access panel in the desktop UI)

**Manual verification checklist:**
- [ ] Start the app with `npm run dev`
- [ ] Click "📱 Mobile" in the header — the Mobile Access panel opens
- [ ] Set a PIN in the panel
- [ ] Open `http://localhost:45678` in a browser — PIN entry screen appears
- [ ] Enter the PIN — collection overview loads with correct counts
- [ ] Navigate to Catalog and Missing tabs
- [ ] Test search in Catalog tab (filters sets client-side)
