import type { Database } from 'sql.js'
import type { CollectionEntry } from '../shared/types'

export function createSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS collection (
      set_id    TEXT PRIMARY KEY,
      condition TEXT NOT NULL CHECK(condition IN ('sealed','built','loose')),
      notes     TEXT NOT NULL DEFAULT '',
      date_added TEXT NOT NULL
    )
  `)
}

export function getCollection(db: Database): CollectionEntry[] {
  const stmt = db.prepare(
    'SELECT set_id, condition, notes, date_added FROM collection ORDER BY set_id'
  )
  const rows: CollectionEntry[] = []
  while (stmt.step()) {
    const r = stmt.getAsObject() as Record<string, string>
    rows.push({
      setId: r['set_id'],
      condition: r['condition'] as CollectionEntry['condition'],
      notes: r['notes'],
      dateAdded: r['date_added'],
    })
  }
  stmt.free()
  return rows
}

export function addToCollection(db: Database, entry: CollectionEntry): void {
  db.run(
    'INSERT INTO collection (set_id, condition, notes, date_added) VALUES (?, ?, ?, ?)',
    [entry.setId, entry.condition, entry.notes, entry.dateAdded]
  )
}

export function updateCollectionEntry(db: Database, entry: CollectionEntry): void {
  db.run(
    'UPDATE collection SET condition = ?, notes = ? WHERE set_id = ?',
    [entry.condition, entry.notes, entry.setId]
  )
}

export function removeFromCollection(db: Database, setId: string): void {
  db.run('DELETE FROM collection WHERE set_id = ?', [setId])
}
