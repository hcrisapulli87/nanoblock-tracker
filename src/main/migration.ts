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
      out.push({
        setId: r['set_id'],
        condition: r['condition'] as CollectionEntry['condition'],
        notes: r['notes'] ?? '',
        dateAdded: r['date_added'],
      })
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
