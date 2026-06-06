import express from 'express'
import cookieParser from 'cookie-parser'
import { createHash, timingSafeEqual } from 'crypto'
import type * as http from 'http'
import type { Database } from 'sql.js'
import type { MobileConfig } from '../shared/types'
import { CATALOG } from '../shared/catalog'
import { getCollection } from './db'

export const DEFAULT_PORT = 45678

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000

interface FailEntry { count: number; lockedUntil: number }
const failedAttempts = new Map<string, FailEntry>()

function isRateLimited(ip: string): boolean {
  const e = failedAttempts.get(ip)
  if (!e) return false
  if (Date.now() < e.lockedUntil) return true
  if (e.lockedUntil > 0) { failedAttempts.delete(ip); return false }
  return false
}

function recordFailure(ip: string): void {
  const e = failedAttempts.get(ip) ?? { count: 0, lockedUntil: 0 }
  e.count++
  if (e.count >= MAX_ATTEMPTS) e.lockedUntil = Date.now() + LOCKOUT_MS
  failedAttempts.set(ip, e)
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip)
}

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

function verifyPin(input: string, storedHash: string): boolean {
  if (!storedHash || storedHash.length !== 64) return false
  const a = Buffer.from(hashPin(input), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  return timingSafeEqual(a, b)
}

export function startServer(
  db: Database,
  config: MobileConfig,
  staticRoot: string,
  port = DEFAULT_PORT
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
    const ip = req.ip ?? 'unknown'
    const { pin } = req.body as { pin?: string }

    if (!pin || !config.pinHash) {
      res.status(401).json({ error: 'No PIN configured' })
      return
    }

    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many attempts. Try again later.' })
      return
    }

    if (verifyPin(pin, config.pinHash)) {
      clearFailures(ip)
      res.cookie('session', 'ok', {
        signed: true,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
        secure: req.secure || req.get('x-forwarded-proto') === 'https',
      })
      res.json({ ok: true })
    } else {
      recordFailure(ip)
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

  const server = app.listen(port)
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[mobile] Port ${port} already in use — server not started`)
    } else {
      console.error('[mobile] Server error:', err)
    }
  })
  return server
}

export function stopServer(server: http.Server): Promise<void> {
  return new Promise(resolve => {
    if (!server.listening) { resolve(); return }
    server.close(() => resolve())
  })
}
