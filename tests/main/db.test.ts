// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import initSqlJs from 'sql.js'
import {
  createSchema,
  getCollection,
  addToCollection,
  updateCollectionEntry,
  removeFromCollection,
} from '../../src/main/db'
import type { CollectionEntry } from '../../src/shared/types'

let db: Awaited<ReturnType<typeof initSqlJs>>['Database']['prototype']

beforeEach(async () => {
  const SQL = await initSqlJs()
  db = new SQL.Database()
  createSchema(db)
})

const entry: CollectionEntry = {
  setId: 'NBPM-001',
  condition: 'sealed',
  notes: 'From Tokyo store',
  dateAdded: '2024-01-01',
}

describe('getCollection', () => {
  it('returns empty array when no entries exist', () => {
    expect(getCollection(db)).toEqual([])
  })
})

describe('addToCollection', () => {
  it('adds an entry retrievable by getCollection', () => {
    addToCollection(db, entry)
    const result = getCollection(db)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(entry)
  })

  it('throws when adding a duplicate setId', () => {
    addToCollection(db, entry)
    expect(() => addToCollection(db, entry)).toThrow()
  })
})

describe('updateCollectionEntry', () => {
  it('updates condition and notes for existing entry', () => {
    addToCollection(db, entry)
    updateCollectionEntry(db, { ...entry, condition: 'built', notes: 'Now built' })
    const result = getCollection(db)
    expect(result[0].condition).toBe('built')
    expect(result[0].notes).toBe('Now built')
  })
})

describe('removeFromCollection', () => {
  it('removes the entry with matching setId', () => {
    addToCollection(db, entry)
    removeFromCollection(db, 'NBPM-001')
    expect(getCollection(db)).toHaveLength(0)
  })

  it('is a no-op for a setId that does not exist', () => {
    expect(() => removeFromCollection(db, 'NBPM-999')).not.toThrow()
  })
})
