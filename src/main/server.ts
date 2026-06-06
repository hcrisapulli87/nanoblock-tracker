import express from 'express'
import cookieParser from 'cookie-parser'
import { createHash } from 'crypto'
import type * as http from 'http'
import type { Database } from 'sql.js'
import type { MobileConfig } from '../shared/types'
import { CATALOG } from '../shared/catalog'
import { getCollection } from './db'

export const DEFAULT_PORT = 45678

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
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

  return app.listen(port)
}

export function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(err => (err ? reject(err) : resolve()))
  })
}
