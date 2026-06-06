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
    const tempServer = startServer(db, noPin, '/tmp', 0)
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
