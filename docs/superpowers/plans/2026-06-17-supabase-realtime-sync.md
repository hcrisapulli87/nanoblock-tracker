# Nanoblock Tracker — Supabase Real-Time Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nanoblock tracker's local sql.js store + Google Tasks + Cloudflare-tunnel mobile paths with a single hosted Supabase table that syncs the desktop Electron renderer and a new installable phone PWA in near-real-time, both directions.

**Architecture:** Supabase Postgres is the only source of truth. The desktop renderer and a new `mobile/` Vite PWA both use `@supabase/supabase-js` directly (select/insert/update/delete + a Realtime subscription). The static `CATALOG` stays bundled in both apps; Supabase stores only the small `collection` table. RLS scopes all rows to the single signed-in user. A one-time migration uploads the existing local `collection.db` rows.

**Tech Stack:** Electron + electron-vite + React 19 + TS (desktop), Vite + React + TS + vite-plugin-pwa (phone), Supabase (Postgres + Realtime + Auth + RLS), Vercel, vitest.

**Env var names (both apps):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (matches Tandem).

---

## File Structure

**Supabase / repo root**
- Create `supabase/schema.sql` — `collection` table, RLS, Realtime publication (idempotent).
- Modify `.env` (append Supabase vars) + create `.env.example`; ensure `.env` gitignored.

**Desktop renderer (`src/renderer/`)**
- Create `lib/supabase.ts` — browser client.
- Create `auth/AuthProvider.tsx`, `screens/Login.tsx` — email+password session gate.
- Create `data/collection.ts` — row↔entry mapping + supabase CRUD + owned-id derivation.
- Modify `hooks/useCollection.ts` — same public interface, now supabase + Realtime + migration trigger.
- Modify `App.tsx` — auth gate, remove Mobile button/panel.
- Modify `main.tsx` — wrap in `AuthProvider`.

**Desktop main (`src/main/`)**
- Create `migration.ts` — read legacy `collection.db` via sql.js (one-time).
- Modify `ipc.ts` — keep eBay/scraper/openExternal, add `migration:getLegacyRows`, drop collection + mobile handlers.
- Modify `index.ts` — remove sql.js store wrapper, Google Tasks, Express server, tunnel; keep window + eBay/scraper; register migration handler.
- Modify `src/preload/index.ts` — drop collection + mobile bridges, add `getLegacyRows`.
- Modify `src/shared/types.ts` — trim IPC constants, add migration constant.
- **Delete:** `main/db.ts`, `main/google-tasks-sync.ts`, `main/server.ts`, `main/tunnel.ts`, `main/mobile-config.ts`, `renderer/components/MobileAccessPanel.tsx`.

**Tests**
- Create `tests/renderer/data/collection.test.ts`, `tests/main/migration.test.ts`.
- Modify `tests/renderer/hooks/useCollection.test.ts`, `tests/renderer/components/App.test.tsx`.
- **Delete:** `tests/main/{server,tunnel,mobile-config,db}.test.ts`, `tests/renderer/components/MobileAccessPanel.test.tsx`. (Google Tasks had no test.)

**Phone PWA (`mobile/`)** — new self-contained Vite project
- `package.json`, `vite.config.ts`, `index.html`, `tsconfig*.json`, `.env.example`, `.gitignore`.
- `src/main.tsx`, `src/App.tsx`, `src/styles.css`.
- `src/lib/supabase.ts`, `src/auth/AuthProvider.tsx`, `src/screens/Login.tsx`, `src/screens/Collection.tsx`.
- `src/data/collection.ts`, `src/hooks/useCollection.ts`.
- `src/shared/{catalog.ts,types.ts}` — copied from desktop `src/shared/` (build-time copy script to prevent drift).
- `public/` PWA icons + `favicon.svg`.

---

## PHASE A — Desktop port

### Task A1: Supabase schema + env scaffolding

**Files:**
- Create: `supabase/schema.sql`
- Create: `.env.example`
- Modify: `.env` (append), `.gitignore` (ensure `.env`)

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- Nanoblock Tracker — Supabase schema. Idempotent & safe to re-run.
-- The SQL Editor flags the `drop policy if exists` lines as "destructive"; that is a
-- keyword false-positive — there is no DROP TABLE / DELETE / TRUNCATE and no row is removed.

create table if not exists public.collection (
  set_id     text not null,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  condition  text not null check (condition in ('sealed','built','loose')),
  notes      text not null default '',
  date_added timestamptz not null default now(),
  primary key (owner_id, set_id)
);

alter table public.collection enable row level security;

drop policy if exists "collection: owner read"   on public.collection;
drop policy if exists "collection: owner insert"  on public.collection;
drop policy if exists "collection: owner update"  on public.collection;
drop policy if exists "collection: owner delete"  on public.collection;

create policy "collection: owner read"
  on public.collection for select using (owner_id = auth.uid());
create policy "collection: owner insert"
  on public.collection for insert with check (owner_id = auth.uid());
create policy "collection: owner update"
  on public.collection for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "collection: owner delete"
  on public.collection for delete using (owner_id = auth.uid());

-- Realtime: broadcast row changes to every signed-in client.
alter publication supabase_realtime add table public.collection;
```

- [ ] **Step 2: Write `.env.example`**

```
# Supabase (Project Settings → API). The publishable key is a public browser key —
# safe to ship; data is protected by Row-Level Security. Keep the real .env gitignored.
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# Existing eBay keys stay as they are (used by the main process).
```

- [ ] **Step 3: Append Supabase vars to the existing `.env`** (leave eBay vars untouched), and confirm `.gitignore` contains a line `.env`. If missing, add it.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql .env.example .gitignore
git commit -m "feat(sync): add Supabase schema + env scaffolding for nanoblock collection"
```

---

### Task A2: Add supabase-js dependency

**Files:** Modify `package.json`

- [ ] **Step 1:** Install client: `npm install @supabase/supabase-js`
- [ ] **Step 2:** Verify it lands in `dependencies`. (express/cookie-parser removal happens in Task A11 after their code is gone.)
- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add @supabase/supabase-js"
```

---

### Task A3: Desktop Supabase client

**Files:** Create `src/renderer/lib/supabase.ts`; Modify `electron.vite.config.ts`

- [ ] **Step 1:** Add `envPrefix` to the renderer config so `VITE_*` reaches the renderer in electron-vite. Replace the `renderer` block in `electron.vite.config.ts`:

```ts
  renderer: {
    root: 'src/renderer',
    envPrefix: ['VITE_', 'RENDERER_VITE_'],
    build: { rollupOptions: { input: 'src/renderer/index.html' } },
    plugins: [react()],
  },
```

- [ ] **Step 2:** Write `src/renderer/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the desktop renderer. The publishable key is a public
// browser key; the database is protected by Row-Level Security, not by hiding it.
// supabase-js persists the session in the renderer's localStorage (Electron userData),
// so the desktop stays signed in across launches.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey || url.includes('YOUR-PROJECT')) {
  console.warn(
    '[nanoblock] Supabase env not configured. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (Supabase → Project Settings → API).',
  )
}

export const supabase = createClient(url, publishableKey)
```

- [ ] **Step 3:** Add a renderer env typings file `src/renderer/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(sync): desktop supabase client + renderer env prefix"`

---

### Task A4: Collection data layer (TDD)

**Files:** Create `src/renderer/data/collection.ts`, `tests/renderer/data/collection.test.ts`

The pure parts (mapping rows ↔ `CollectionEntry`, deriving owned ids) are unit-tested; the
network calls are thin wrappers over the supabase client.

- [ ] **Step 1: Write failing test** `tests/renderer/data/collection.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { rowToEntry, entryToRow, deriveOwnedIds } from '../../../src/renderer/data/collection'

describe('collection mapping', () => {
  it('rowToEntry maps snake_case row to CollectionEntry', () => {
    const e = rowToEntry({
      set_id: 'NBPM-001', owner_id: 'u1', condition: 'built',
      notes: 'mint', date_added: '2026-06-17T00:00:00Z',
    })
    expect(e).toEqual({ setId: 'NBPM-001', condition: 'built', notes: 'mint', dateAdded: '2026-06-17' })
  })

  it('entryToRow strips owner_id (server defaults it via auth.uid())', () => {
    const r = entryToRow({ setId: 'NBPM-002', condition: 'sealed', notes: '', dateAdded: '2026-06-17' })
    expect(r).toEqual({ set_id: 'NBPM-002', condition: 'sealed', notes: '', date_added: '2026-06-17' })
  })

  it('deriveOwnedIds returns a Set of set ids', () => {
    const ids = deriveOwnedIds([
      { setId: 'NBPM-001', condition: 'built', notes: '', dateAdded: '2026-06-17' },
      { setId: 'NBPM-002', condition: 'loose', notes: '', dateAdded: '2026-06-17' },
    ])
    expect(ids).toEqual(new Set(['NBPM-001', 'NBPM-002']))
  })
})
```

- [ ] **Step 2: Run, expect FAIL** `npx vitest run tests/renderer/data/collection.test.ts` → module not found.

- [ ] **Step 3: Implement** `src/renderer/data/collection.ts`:

```ts
import { supabase } from '../lib/supabase'
import type { CollectionEntry } from '../../shared/types'

export interface CollectionRow {
  set_id: string
  owner_id?: string
  condition: CollectionEntry['condition']
  notes: string
  date_added: string
}

// date_added is a timestamptz in Postgres; the app treats it as a plain date.
export function rowToEntry(r: CollectionRow): CollectionEntry {
  return { setId: r.set_id, condition: r.condition, notes: r.notes, dateAdded: r.date_added.slice(0, 10) }
}

// owner_id is omitted — the column defaults to auth.uid() and RLS enforces it.
export function entryToRow(e: CollectionEntry): CollectionRow {
  return { set_id: e.setId, condition: e.condition, notes: e.notes, date_added: e.dateAdded }
}

export function deriveOwnedIds(entries: CollectionEntry[]): Set<string> {
  return new Set(entries.map((e) => e.setId))
}

export async function fetchCollection(): Promise<CollectionEntry[]> {
  const { data, error } = await supabase.from('collection').select('*').order('set_id')
  if (error) throw error
  return (data as CollectionRow[]).map(rowToEntry)
}

export async function insertEntry(entry: CollectionEntry): Promise<void> {
  const { error } = await supabase.from('collection').insert(entryToRow(entry))
  if (error) throw error
}

export async function updateEntry(entry: CollectionEntry): Promise<void> {
  const { error } = await supabase
    .from('collection')
    .update({ condition: entry.condition, notes: entry.notes })
    .eq('set_id', entry.setId)
  if (error) throw error
}

export async function deleteEntry(setId: string): Promise<void> {
  const { error } = await supabase.from('collection').delete().eq('set_id', setId)
  if (error) throw error
}

// Bulk upsert used once by the migration. ignoreDuplicates keeps existing rows.
export async function upsertEntries(entries: CollectionEntry[]): Promise<void> {
  if (entries.length === 0) return
  const { error } = await supabase
    .from('collection')
    .upsert(entries.map(entryToRow), { onConflict: 'owner_id,set_id', ignoreDuplicates: true })
  if (error) throw error
}
```

- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(sync): collection data layer (mapping + supabase CRUD)"`

---

### Task A5: Auth provider + Login (desktop)

**Files:** Create `src/renderer/auth/AuthProvider.tsx`, `src/renderer/screens/Login.tsx`

- [ ] **Step 1:** Write `src/renderer/auth/AuthProvider.tsx` — port of Tandem's (`C:\Users\Harrison Crisapulli\Documents\claudecode\tandem\src\auth\AuthProvider.tsx`) verbatim except the import path is `../lib/supabase` and the comment says "desktop renderer / installed PWA". Same `AuthContextValue` (`session`, `user`, `loading`, `signIn(email,password)`, `signOut`) and `useAuth()` export.

- [ ] **Step 2:** Write `src/renderer/screens/Login.tsx` — port of Tandem's `Login.tsx`, changing the brand line to `Pokémon Nanoblock Tracker` and the tagline to `Your collection, synced everywhere.` Keep `autoComplete="email"` / `current-password`, the `messageFor()` error mapper, and the same class names (styles added in Task A6). Use existing app dark-theme classes where present.

- [ ] **Step 3: Commit** `git add -A && git commit -m "feat(sync): desktop email+password auth gate"`

---

### Task A6: Auth/login styles

**Files:** Modify `src/renderer/styles.css`

- [ ] **Step 1:** Append login styles consistent with the app's existing dark theme (`#0f1923` bg, `#7dd3fc` accent seen in `MobileAccessPanel`). Add `.screen--center` (flex column centered, full height), `.brand` (title), `.muted`, `.login-form` (column, gap, max-width 320), `.input` (dark field), `.btn--primary` (accent button), `.error` (red text), and `.loading` (centered). Concrete block:

```css
.screen--center { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; }
.brand { font-size: 26px; font-weight: 700; color: #e2e8f0; }
.muted { color: #64748b; font-size: 14px; }
.login-form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px; margin-top: 8px; }
.input { background: #1a2a3a; border: 1px solid #2a3a50; border-radius: 8px; color: #e2e8f0; font-size: 14px; padding: 11px 12px; }
.btn--primary { background: #7dd3fc; border: none; border-radius: 8px; color: #0f1923; cursor: pointer; font-size: 14px; font-weight: 700; padding: 11px 0; }
.btn--primary:disabled { opacity: .5; cursor: default; }
.error { color: #f87171; font-size: 13px; }
.loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #64748b; }
```

- [ ] **Step 2: Commit** `git add -A && git commit -m "style(sync): login screen styles"`

---

### Task A7: Migration module (TDD)

**Files:** Create `src/main/migration.ts`, `tests/main/migration.test.ts`

- [ ] **Step 1: Write failing test** `tests/main/migration.test.ts` — builds a fixture sql.js DB with two rows, writes it to a temp path, asserts `readLegacyCollection(path)` parses them, and returns `[]` for a missing path:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { writeFileSync, mkdtempSync } from 'fs'
import initSqlJs from 'sql.js'
import { readLegacyCollection } from '../../src/main/migration'

let dbPath = ''
beforeAll(async () => {
  const SQL = await initSqlJs({ locateFile: (f) => join(process.cwd(), 'node_modules/sql.js/dist/', f) })
  const db = new SQL.Database()
  db.run(`CREATE TABLE collection (set_id TEXT PRIMARY KEY, condition TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', date_added TEXT NOT NULL)`)
  db.run(`INSERT INTO collection VALUES ('NBPM-001','built','mint','2025-01-01'),('NBPM-005','sealed','','2025-02-02')`)
  const dir = mkdtempSync(join(tmpdir(), 'nb-mig-'))
  dbPath = join(dir, 'collection.db')
  writeFileSync(dbPath, Buffer.from(db.export()))
})

describe('readLegacyCollection', () => {
  it('parses rows from an existing legacy db', async () => {
    const rows = await readLegacyCollection(dbPath)
    expect(rows).toEqual([
      { setId: 'NBPM-001', condition: 'built', notes: 'mint', dateAdded: '2025-01-01' },
      { setId: 'NBPM-005', condition: 'sealed', notes: '', dateAdded: '2025-02-02' },
    ])
  })
  it('returns [] when the db file does not exist', async () => {
    expect(await readLegacyCollection(join(tmpdir(), 'nope', 'collection.db'))).toEqual([])
  })
})
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** `src/main/migration.ts`:

```ts
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import initSqlJs from 'sql.js'
import type { CollectionEntry } from '../shared/types'

// One-time read of the pre-Supabase local collection DB so the renderer can upload
// it under the user's session. sql.js is retained ONLY for this.
export async function readLegacyCollection(dbPath: string): Promise<CollectionEntry[]> {
  if (!existsSync(dbPath)) return []
  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      app?.isPackaged
        ? join(process.resourcesPath, file)
        : join(process.cwd(), 'node_modules/sql.js/dist/', file),
  })
  const db = new SQL.Database(readFileSync(dbPath))
  const out: CollectionEntry[] = []
  try {
    const stmt = db.prepare('SELECT set_id, condition, notes, date_added FROM collection ORDER BY set_id')
    while (stmt.step()) {
      const r = stmt.getAsObject() as Record<string, string>
      out.push({ setId: r['set_id'], condition: r['condition'] as CollectionEntry['condition'], notes: r['notes'] ?? '', dateAdded: r['date_added'] })
    }
    stmt.free()
  } catch {
    // No legacy `collection` table (fresh install) — nothing to migrate.
  }
  db.close()
  return out
}

export function legacyDbPath(): string {
  return join(app.getPath('userData'), 'collection.db')
}
```

- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(sync): one-time legacy collection.db reader (main)"`

---

### Task A8: IPC + preload + shared types trim

**Files:** Modify `src/shared/types.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`

- [ ] **Step 1:** In `src/shared/types.ts`, replace the `IPC` object and drop `MobileConfig`:

```ts
export const IPC = {
  FETCH_EBAY_PRICES: 'prices:ebay',
  FETCH_NANOBLOCK_PRICE: 'prices:nanoblock',
  OPEN_EXTERNAL: 'shell:openExternal',
  GET_LEGACY_ROWS: 'migration:getLegacyRows',
} as const
```

(Remove the `MobileConfig` interface entirely.)

- [ ] **Step 2:** Replace `src/main/ipc.ts` with the trimmed version (eBay, scraper, openExternal, migration only):

```ts
import { ipcMain, shell } from 'electron'
import { IPC } from '../shared/types'
import { fetchEbayPrices, EbayError } from './ebay'
import { fetchNanoblockPrice, ScraperError } from './nanoblock-scraper'
import { readLegacyCollection, legacyDbPath } from './migration'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.FETCH_EBAY_PRICES, async (_e, pokemonName: string) => {
    try { return { ok: true, data: await fetchEbayPrices(pokemonName) } }
    catch (e) { return { ok: false, message: e instanceof EbayError ? e.message : 'Unknown eBay error' } }
  })

  ipcMain.handle(IPC.FETCH_NANOBLOCK_PRICE, async (_e, pokemonName: string) => {
    try { return { ok: true, data: await fetchNanoblockPrice(pokemonName) } }
    catch (e) { return { ok: false, message: e instanceof ScraperError ? e.message : 'Scrape failed' } }
  })

  ipcMain.handle(IPC.OPEN_EXTERNAL, (_e, url: string) => {
    if (!/^https?:\/\//.test(url)) { console.warn(`Blocked openExternal: ${url}`); return }
    shell.openExternal(url)
  })

  ipcMain.handle(IPC.GET_LEGACY_ROWS, () => readLegacyCollection(legacyDbPath()))
}
```

- [ ] **Step 3:** Replace `src/preload/index.ts`:

```ts
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

contextBridge.exposeInMainWorld('electronAPI', {
  fetchEbayPrices: (pokemonName: string) => ipcRenderer.invoke(IPC.FETCH_EBAY_PRICES, pokemonName),
  fetchNanoblockPrice: (pokemonName: string) => ipcRenderer.invoke(IPC.FETCH_NANOBLOCK_PRICE, pokemonName),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  getLegacyRows: () => ipcRenderer.invoke(IPC.GET_LEGACY_ROWS),
})
```

- [ ] **Step 4:** Replace `src/preload/index.d.ts` with the typed global so the renderer compiles:

```ts
import type { EbayPriceData, CollectionEntry } from '../shared/types'

type PriceResponse =
  | { ok: true; data: EbayPriceData | number }
  | { ok: false; message: string }

declare global {
  interface Window {
    electronAPI: {
      fetchEbayPrices: (pokemonName: string) => Promise<PriceResponse>
      fetchNanoblockPrice: (pokemonName: string) => Promise<PriceResponse>
      openExternal: (url: string) => Promise<void>
      getLegacyRows: () => Promise<CollectionEntry[]>
    }
  }
}

export {}
```

- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(sync): trim IPC/preload to eBay+scraper+migration"`

---

### Task A9: Rewrite `useCollection` (supabase + Realtime + migration)

**Files:** Modify `src/renderer/hooks/useCollection.ts`

Keep the exact return shape so consumers are untouched.

- [ ] **Step 1:** Replace `src/renderer/hooks/useCollection.ts`:

```ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { CollectionEntry } from '../../shared/types'
import {
  fetchCollection, insertEntry, updateEntry as apiUpdate, deleteEntry, upsertEntries,
} from '../data/collection'
import { supabase } from '../lib/supabase'

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const migratedRef = useRef(false)

  const reload = useCallback(async () => {
    const rows = await fetchCollection()
    setEntries(rows)
    return rows
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await reload()
      // One-time migration: if the cloud is empty but a legacy local DB has rows, upload once.
      if (!cancelled && !migratedRef.current && rows.length === 0) {
        migratedRef.current = true
        const legacy = await window.electronAPI.getLegacyRows()
        if (legacy.length > 0) { await upsertEntries(legacy); await reload() }
      }
    })()

    // Realtime: any insert/update/delete on the collection re-reads the table.
    const channel = supabase
      .channel('collection-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection' }, () => { void reload() })
      .subscribe()

    return () => { cancelled = true; void supabase.removeChannel(channel) }
  }, [reload])

  const ownedIds = new Set(entries.map((e) => e.setId))

  const addEntry = useCallback(async (entry: CollectionEntry) => {
    await insertEntry(entry)
    setEntries((prev) => [...prev, entry])
  }, [])

  const updateEntry = useCallback(async (entry: CollectionEntry) => {
    await apiUpdate(entry)
    setEntries((prev) => prev.map((e) => (e.setId === entry.setId ? entry : e)))
  }, [])

  const removeEntry = useCallback(async (setId: string) => {
    await deleteEntry(setId)
    setEntries((prev) => prev.filter((e) => e.setId !== setId))
  }, [])

  return { entries, ownedIds, addEntry, updateEntry, removeEntry }
}
```

- [ ] **Step 2: Update** `tests/renderer/hooks/useCollection.test.ts` — replace the IPC-mock test with a supabase-data-layer mock. Mock `../../../src/renderer/data/collection` and `../../../src/renderer/lib/supabase` (the latter returns a channel stub with `.on().subscribe()` and `removeChannel`). Stub `window.electronAPI.getLegacyRows` → `[]`. Assert `addEntry` calls `insertEntry` and updates `ownedIds`. Concrete skeleton:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../../src/renderer/lib/supabase', () => ({
  supabase: {
    channel: () => ({ on() { return this }, subscribe() { return this } }),
    removeChannel: vi.fn(),
  },
}))
const data = vi.hoisted(() => ({
  fetchCollection: vi.fn(async () => [] as unknown[]),
  insertEntry: vi.fn(async () => {}),
  updateEntry: vi.fn(async () => {}),
  deleteEntry: vi.fn(async () => {}),
  upsertEntries: vi.fn(async () => {}),
}))
vi.mock('../../../src/renderer/data/collection', () => data)

import { useCollection } from '../../../src/renderer/hooks/useCollection'

beforeEach(() => {
  vi.clearAllMocks()
  // @ts-expect-error test global
  window.electronAPI = { getLegacyRows: vi.fn(async () => []) }
})

describe('useCollection', () => {
  it('adds an entry through the data layer', async () => {
    const { result } = renderHook(() => useCollection())
    await waitFor(() => expect(data.fetchCollection).toHaveBeenCalled())
    await act(async () => {
      await result.current.addEntry({ setId: 'NBPM-001', condition: 'built', notes: '', dateAdded: '2026-06-17' })
    })
    expect(data.insertEntry).toHaveBeenCalled()
    expect(result.current.ownedIds.has('NBPM-001')).toBe(true)
  })
})
```

- [ ] **Step 3: Run** `npx vitest run tests/renderer/hooks/useCollection.test.ts` → PASS.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(sync): useCollection via supabase + realtime + one-time migration"`

---

### Task A10: App shell + auth gate

**Files:** Modify `src/renderer/App.tsx`, `src/renderer/main.tsx`

- [ ] **Step 1:** In `src/renderer/main.tsx`, wrap `<App/>` in `<AuthProvider>` (mirror Tandem's `main.tsx`). Example final body:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

(Keep whatever CSS imports already exist; match the existing file's import list.)

- [ ] **Step 2:** In `src/renderer/App.tsx`: remove the `MobileAccessPanel` import, the `mobileOpen` state, the `📱 Mobile` button, and the panel render. Add an auth gate at the top of the default export:

```tsx
import { useAuth } from './auth/AuthProvider'
import Login from './screens/Login'
// ...
export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading">Loading…</div>
  if (!session) return <Login />
  return <Tracker />
}
```

Move the current `App` body into a `function Tracker()` component (same JSX minus the mobile button/panel). The `useCollection()` call lives in `Tracker`.

- [ ] **Step 3:** Update `tests/renderer/components/App.test.tsx` — wrap renders in `AuthProvider` or mock `useAuth` to return a fake session, and mock the data layer + supabase as in Task A9 so the tracker renders. Remove any assertions about the Mobile button.

- [ ] **Step 4: Run** `npx vitest run tests/renderer/components/App.test.tsx` → PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(sync): auth-gate the desktop app; remove mobile panel"`

---

### Task A11: Delete retired modules + dependencies

**Files:** Delete sources/tests; Modify `src/main/index.ts`, `package.json`, `electron-builder.yml`

- [ ] **Step 1:** Rewrite `src/main/index.ts` to drop the sql.js store, Google Tasks, Express server, and tunnel; keep the window (with the Merlinsbricks CORP header strip) and register the trimmed IPC + migration handler:

```ts
import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false,
      // webSecurity:false lets the Merlinsbricks CDN product images load in the renderer.
      webSecurity: false,
    },
  })
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(async () => {
  // Strip CORP from the Merlinsbricks CDN so its images load in Electron's non-web origin.
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://cdn.merlinsbricks.com/*'] },
    (details, callback) => {
      const headers = { ...details.responseHeaders }
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'cross-origin-resource-policy') delete headers[key]
      }
      callback({ responseHeaders: headers })
    },
  )
  registerIpcHandlers()
  await createWindow()
  app.on('activate', async () => { if (BrowserWindow.getAllWindows().length === 0) await createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
```

- [ ] **Step 2:** Delete sources:

```bash
git rm src/main/db.ts src/main/google-tasks-sync.ts src/main/server.ts src/main/tunnel.ts src/main/mobile-config.ts src/renderer/components/MobileAccessPanel.tsx
git rm tests/main/db.test.ts tests/main/server.test.ts tests/main/tunnel.test.ts tests/main/mobile-config.test.ts tests/renderer/components/MobileAccessPanel.test.tsx
```

- [ ] **Step 3:** Remove the now-unused deps and build asset. In `package.json` delete `express`, `cookie-parser` (deps) and `@types/express`, `@types/cookie-parser`, `supertest`, `@types/supertest` (devDeps). In `electron-builder.yml` (and the `build.extraResources` in package.json) remove the `resources/server` entry; keep the `sql-wasm.wasm` entry (migration still needs it). Run `npm install` to prune the lockfile. Delete the now-orphaned `resources/server` directory if present.

- [ ] **Step 4: Run full suite** `npm run typecheck && npx vitest run` → green (no references to deleted modules remain).
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(sync): remove Google Tasks, tunnel, Express, sql.js store"`

---

## PHASE B — Phone PWA (`mobile/`)

### Task B1: Scaffold the `mobile/` PWA

**Files:** Create `mobile/package.json`, `mobile/vite.config.ts`, `mobile/index.html`, `mobile/tsconfig.json`, `mobile/tsconfig.node.json`, `mobile/.gitignore`, `mobile/.env.example`, `mobile/src/vite-env.d.ts`, `mobile/scripts/sync-shared.mjs`

- [ ] **Step 1:** Create `mobile/package.json`:

```json
{
  "name": "nanoblock-mobile",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "presync": "node scripts/sync-shared.mjs",
    "dev": "npm run presync && vite",
    "build": "npm run presync && tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "^5.9.3",
    "vite": "^7.2.6",
    "vite-plugin-pwa": "^1.0.0"
  }
}
```

- [ ] **Step 2:** Create `mobile/scripts/sync-shared.mjs` — copies the desktop shared catalog/types into `mobile/src/shared/` at build time so they cannot drift:

```js
import { copyFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', '..', 'src', 'shared')
const outDir = join(here, '..', 'src', 'shared')
mkdirSync(outDir, { recursive: true })
for (const f of ['catalog.ts', 'types.ts']) copyFileSync(join(srcDir, f), join(outDir, f))
console.log('[mobile] synced shared catalog.ts + types.ts')
```

(Note: `types.ts` includes the desktop `IPC` constants; harmless unused exports in the PWA. Acceptable to avoid a second source of truth for `NanoblockSet`/`CollectionEntry`.)

- [ ] **Step 3:** Create `mobile/vite.config.ts` with PWA:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nanoblock Tracker',
        short_name: 'Nanoblock',
        description: 'Your Pokémon Nanoblock collection, synced everywhere.',
        theme_color: '#0f1923',
        background_color: '#0f1923',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 4:** Create `mobile/index.html`, `mobile/tsconfig.json` (standard Vite React TS), `mobile/tsconfig.node.json`, `mobile/.gitignore` (`node_modules`, `dist`, `.env`, `src/shared`), `mobile/.env.example` (same two `VITE_SUPABASE_*` keys as Task A1), and `mobile/src/vite-env.d.ts` (same `ImportMetaEnv` as Task A3). `index.html` head includes `theme-color #0f1923`, apple-mobile-web-app metas, title "Nanoblock Tracker".

- [ ] **Step 5:** `cd mobile && npm install`
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(mobile): scaffold installable PWA with shared-catalog sync"`

---

### Task B2: Mobile client, auth, data layer

**Files:** Create `mobile/src/lib/supabase.ts`, `mobile/src/auth/AuthProvider.tsx`, `mobile/src/screens/Login.tsx`, `mobile/src/data/collection.ts`, `mobile/src/hooks/useCollection.ts`

- [ ] **Step 1:** `mobile/src/lib/supabase.ts` — same as Task A3 Step 2 but `[nanoblock-mobile]` in the warning.
- [ ] **Step 2:** `mobile/src/auth/AuthProvider.tsx` + `mobile/src/screens/Login.tsx` — same as Tasks A5 (Tandem ports), import path `../lib/supabase`.
- [ ] **Step 3:** `mobile/src/data/collection.ts` — identical to Task A4's `collection.ts` but import `../shared/types` (synced copy). It needs no `upsertEntries`/migration (migration is desktop-only); include `fetchCollection`, `insertEntry`, `updateEntry`, `deleteEntry`, `rowToEntry`, `entryToRow`, `deriveOwnedIds`.
- [ ] **Step 4:** `mobile/src/hooks/useCollection.ts` — like Task A9 but without the migration block (no `window.electronAPI`): initial `fetchCollection`, Realtime channel re-reading on changes, and `addEntry/updateEntry/removeEntry`. Same returned shape.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(mobile): supabase client, auth gate, collection data layer"`

---

### Task B3: Mobile Collection screen + app shell + styles + icons

**Files:** Create `mobile/src/screens/Collection.tsx`, `mobile/src/App.tsx`, `mobile/src/main.tsx`, `mobile/src/styles.css`, `mobile/public/favicon.svg`, icon PNGs

- [ ] **Step 1:** `mobile/src/screens/Collection.tsx` — a mobile-first list over `CATALOG` (imported from `../shared/catalog`): a header with owned/total count, a search box, and a scrollable list. Each row shows the set image (`set.imageUrl`), code + Pokémon name, and an owned toggle (♥/♡). Tapping a row opens a bottom sheet to set owned, condition (sealed/built/loose segmented control), and notes (textarea). Owned state derives from `ownedIds` from `useCollection`. Toggling on inserts an entry `{ setId, condition: 'built' (default), notes: '', dateAdded: today }`; toggling off removes it; condition/notes changes call `updateEntry`. Full component written here (no placeholders) using plain CSS classes defined in Step 4.

- [ ] **Step 2:** `mobile/src/App.tsx` — auth gate identical in shape to Task A10: `loading` → spinner, no `session` → `<Login/>`, else `<Collection/>`.

- [ ] **Step 3:** `mobile/src/main.tsx` — render `<AuthProvider><App/></AuthProvider>`, import `./styles.css`.

- [ ] **Step 4:** `mobile/src/styles.css` — mobile-first dark theme matching the desktop palette (`#0f1923` bg, `#7dd3fc` accent, `#1a2a3a` surfaces). Classes for header/count, search input, list rows, set thumbnail, owned heart toggle, bottom sheet, segmented condition control, notes textarea, login (reuse Task A6 classes). Safe-area insets for iOS.

- [ ] **Step 5:** `mobile/public/favicon.svg` + generate `pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png` (a nanoblock-brick / Poké-themed mark on `#0f1923`). Reuse the desktop `resources/icon.png` styling if suitable.

- [ ] **Step 6:** `cd mobile && npm run build` → succeeds (typecheck + PWA build).
- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(mobile): collection screen, app shell, theme, PWA icons"`

---

## PHASE C — Finalize

### Task C1: README + docs

**Files:** Modify `README.md`

- [ ] **Step 1:** Rewrite `README.md` to document: the Supabase backend (run `supabase/schema.sql`, create the single user with email+password + Auto Confirm), desktop `.env` setup, the `mobile/` PWA (Vercel root dir = `mobile/`, env vars), and the one-time auto-migration. Note eBay/scraper are desktop-only.
- [ ] **Step 2: Commit** `git add README.md && git commit -m "docs(sync): document Supabase sync + mobile PWA setup"`

### Task C2: Full verification pass

- [ ] **Step 1:** `npm run typecheck && npx vitest run` (desktop) → green.
- [ ] **Step 2:** `cd mobile && npm run build` → green.
- [ ] **Step 3:** Hand-off checklist for Harrison (account-bound): create Supabase project + run schema + create user; fill desktop `.env`; create GitHub repo + Vercel (root `mobile/`) + env vars. Verify tables exist BEFORE deploying the PWA.
- [ ] **Step 4:** Manual end-to-end per the spec's Verification section (cross-device toggle ≤1s, RLS rejects anon, migration appears once, PWA installs, desktop eBay/scraper intact).

---

## Self-Review

- **Spec coverage:** source-of-truth=Supabase (A1–A11), single-user RLS (A1), phone full read/write (B1–B3), retire Google Tasks+tunnel (A11), email+password auth (A5/B2), `mobile/` in-repo sharing catalog (B1 sync script), one-time migration (A7/A9), env/secrets (A1/A3), hand-off + verify-before-deploy (C2). All covered.
- **Placeholder scan:** none — components in B3 are described as "full component, no placeholders" and must be written complete during execution.
- **Type consistency:** `CollectionEntry` (`setId/condition/notes/dateAdded`) and `CollectionRow` (`set_id/owner_id?/condition/notes/date_added`) used consistently; `useCollection` returns `{entries, ownedIds, addEntry, updateEntry, removeEntry}` in both apps; IPC trimmed to `FETCH_EBAY_PRICES/FETCH_NANOBLOCK_PRICE/OPEN_EXTERNAL/GET_LEGACY_ROWS`.
