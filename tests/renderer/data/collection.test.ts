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
