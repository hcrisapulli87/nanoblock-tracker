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
  db.run(
    `CREATE TABLE collection (set_id TEXT PRIMARY KEY, condition TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', date_added TEXT NOT NULL)`,
  )
  db.run(
    `INSERT INTO collection VALUES ('NBPM-001','built','mint','2025-01-01'),('NBPM-005','sealed','','2025-02-02')`,
  )
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
