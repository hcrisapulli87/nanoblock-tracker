import { createServer } from 'http'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { shell } from 'electron'
import type { Database } from 'sql.js'
import { CATALOG } from '../shared/catalog'
import { getCollection } from './db'

// One-way sync: tracker app → Google Tasks list "Nanoblock Collection".
// Pending task = set still to buy; completed task = set owned (condition in notes).
// The app is the single source of truth — phone-side edits are healed on the next sync.
// Dependency-free: loopback OAuth via Node http, REST calls via global fetch.
// See docs/superpowers/specs/2026-06-11-google-tasks-sync-design.md

const LIST_TITLE = 'Nanoblock Collection'
const SCOPE = 'https://www.googleapis.com/auth/tasks'
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000
const DEBOUNCE_MS = 3000

interface StoredToken {
  access_token: string
  refresh_token: string
  expiry: number // epoch ms
}

interface GTask {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  notes?: string
}

let userDataPath = ''
let database: Database | null = null
let syncRunning = false
let syncQueued = false
let debounceTimer: NodeJS.Timeout | null = null
let authInFlight: Promise<string> | null = null

const log = (...args: unknown[]) => console.log('[google-tasks-sync]', ...args)

// ── auth ──────────────────────────────────────────────────────────────────────

function credentialsPath(): string {
  return join(userDataPath, 'google-credentials.json')
}

function tokenPath(): string {
  return join(userDataPath, 'google-tasks-token.json')
}

function loadClient(): { client_id: string; client_secret: string } | null {
  if (!existsSync(credentialsPath())) return null
  const raw = JSON.parse(readFileSync(credentialsPath(), 'utf-8'))
  const c = raw.installed ?? raw.web
  return c ? { client_id: c.client_id, client_secret: c.client_secret } : null
}

async function exchangeToken(params: Record<string, string>): Promise<StoredToken> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  const existing = existsSync(tokenPath())
    ? (JSON.parse(readFileSync(tokenPath(), 'utf-8')) as StoredToken)
    : null
  const token: StoredToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? existing?.refresh_token ?? '',
    expiry: Date.now() + data.expires_in * 1000,
  }
  writeFileSync(tokenPath(), JSON.stringify(token, null, 2), 'utf-8')
  return token
}

/** Loopback OAuth sign-in: opens the system browser, waits for the redirect. */
function signIn(client: { client_id: string; client_secret: string }): Promise<StoredToken> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('Sign-in timed out after 5 minutes'))
    }, SIGN_IN_TIMEOUT_MS)

    server.on('request', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const code = url.searchParams.get('code')
      if (!code) {
        res.writeHead(400).end('Missing code')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<h2>Nanoblock Tracker is connected to Google Tasks — you can close this tab.</h2>')
      clearTimeout(timeout)
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      server.close()
      try {
        resolve(
          await exchangeToken({
            code,
            client_id: client.client_id,
            client_secret: client.client_secret,
            redirect_uri: `http://127.0.0.1:${port}`,
            grant_type: 'authorization_code',
          })
        )
      } catch (e) {
        reject(e)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      const params = new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: `http://127.0.0.1:${port}`,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        prompt: 'consent',
      })
      shell.openExternal(`${AUTH_URL}?${params.toString()}`)
      log('Browser opened for Google Tasks sign-in')
    })
  })
}

/** Returns a valid access token, refreshing or running first-time sign-in as needed. */
async function getAccessToken(): Promise<string> {
  if (authInFlight) return authInFlight
  authInFlight = (async () => {
    const client = loadClient()
    if (!client) throw new Error('google-credentials.json missing — sync disabled')

    let token: StoredToken | null = existsSync(tokenPath())
      ? (JSON.parse(readFileSync(tokenPath(), 'utf-8')) as StoredToken)
      : null

    if (token && Date.now() < token.expiry - 60_000) return token.access_token

    if (token?.refresh_token) {
      try {
        token = await exchangeToken({
          refresh_token: token.refresh_token,
          client_id: client.client_id,
          client_secret: client.client_secret,
          grant_type: 'refresh_token',
        })
        return token.access_token
      } catch (e) {
        log('Refresh failed (token likely expired) — starting browser sign-in', e)
      }
    }

    token = await signIn(client)
    return token.access_token
  })()
  try {
    return await authInFlight
  } finally {
    authInFlight = null
  }
}

// ── Tasks API helpers ─────────────────────────────────────────────────────────

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${TASKS_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Tasks API ${method} ${path}: ${res.status} ${await res.text()}`)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

async function findOrCreateList(): Promise<string> {
  let pageToken = ''
  do {
    const page = await api<{ items?: { id: string; title: string }[]; nextPageToken?: string }>(
      'GET',
      `/users/@me/lists?maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`
    )
    const match = (page.items ?? []).find(l => l.title === LIST_TITLE)
    if (match) return match.id
    pageToken = page.nextPageToken ?? ''
  } while (pageToken)
  const created = await api<{ id: string }>('POST', '/users/@me/lists', { title: LIST_TITLE })
  log(`Created task list "${LIST_TITLE}"`)
  return created.id
}

async function fetchAllTasks(listId: string): Promise<GTask[]> {
  const tasks: GTask[] = []
  let pageToken = ''
  do {
    const page = await api<{ items?: GTask[]; nextPageToken?: string }>(
      'GET',
      `/lists/${listId}/tasks?maxResults=100&showCompleted=true&showHidden=true` +
        (pageToken ? `&pageToken=${pageToken}` : '')
    )
    tasks.push(...(page.items ?? []))
    pageToken = page.nextPageToken ?? ''
  } while (pageToken)
  return tasks
}

// ── sync ──────────────────────────────────────────────────────────────────────

function parseSetId(title: string): string | null {
  const m = title.match(/^(NBPM-[A-Z0-9]+)\s+—/)
  return m ? m[1] : null
}

async function syncNow(): Promise<void> {
  if (!database) return
  const collection = new Map(getCollection(database).map(e => [e.setId, e]))
  const listId = await findOrCreateList()
  const existing = await fetchAllTasks(listId)

  // Group existing tasks by parsed set id; ignore tasks that aren't ours
  const bySetId = new Map<string, GTask[]>()
  for (const t of existing) {
    const id = parseSetId(t.title ?? '')
    if (!id) continue
    const group = bySetId.get(id) ?? []
    group.push(t)
    bySetId.set(id, group)
  }

  let inserted = 0
  let patched = 0
  let deleted = 0
  // Ordering anchor: completed tasks live outside Google's position ordering, so
  // chaining `previous` through them is silently ignored — only chain across pending.
  let previousPendingId: string | undefined

  for (const set of CATALOG) {
    const entry = collection.get(set.id)
    const wantStatus: GTask['status'] = entry ? 'completed' : 'needsAction'
    const wantNotes = entry
      ? `Condition: ${entry.condition}\nAdded: ${entry.dateAdded}` +
        (entry.notes ? `\n${entry.notes}` : '')
      : ''
    const title = `${set.id} — ${set.pokemonName}`

    const group = bySetId.get(set.id) ?? []
    const task = group[0]
    for (const extra of group.slice(1)) {
      await api('DELETE', `/lists/${listId}/tasks/${extra.id}`)
      deleted++
    }

    if (!task) {
      const usePrev = wantStatus === 'needsAction' && previousPendingId
      const created = await api<GTask>(
        'POST',
        `/lists/${listId}/tasks${usePrev ? `?previous=${previousPendingId}` : ''}`,
        { title, status: wantStatus, notes: wantNotes || undefined }
      )
      if (wantStatus === 'needsAction') previousPendingId = created.id
      inserted++
      continue
    }
    if (task.status === 'needsAction') previousPendingId = task.id

    const patch: Partial<GTask> = {}
    if (task.status !== wantStatus) patch.status = wantStatus
    if ((task.notes ?? '') !== wantNotes) patch.notes = wantNotes
    if (task.title !== title) patch.title = title
    if (Object.keys(patch).length > 0) {
      await api('PATCH', `/lists/${listId}/tasks/${task.id}`, patch)
      patched++
    }
  }

  if (inserted || patched || deleted) {
    log(`Sync done: ${inserted} inserted, ${patched} updated, ${deleted} duplicates removed`)
  }
}

// ── public interface ──────────────────────────────────────────────────────────

export function initGoogleTasksSync(db: Database, userData: string): void {
  database = db
  userDataPath = userData
  if (!existsSync(credentialsPath())) {
    log('google-credentials.json not found in userData — sync disabled')
    return
  }
  void runSync()
}

/** Debounced trigger — call after any collection mutation. */
export function scheduleGoogleTasksSync(): void {
  if (!database || !existsSync(credentialsPath())) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void runSync(), DEBOUNCE_MS)
}

async function runSync(): Promise<void> {
  if (syncRunning) {
    syncQueued = true
    return
  }
  syncRunning = true
  try {
    await syncNow()
  } catch (e) {
    log('Sync failed:', e instanceof Error ? e.message : e)
  } finally {
    syncRunning = false
    if (syncQueued) {
      syncQueued = false
      void runSync()
    }
  }
}
