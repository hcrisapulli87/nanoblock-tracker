import { useState, useEffect, useCallback, useRef } from 'react'
import type { CollectionEntry } from '../../shared/types'
import {
  fetchCollection,
  insertEntry,
  updateEntry as apiUpdate,
  deleteEntry,
  upsertEntries,
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
        if (legacy.length > 0) {
          await upsertEntries(legacy)
          await reload()
        }
      }
    })()

    // Realtime: any insert/update/delete on the collection re-reads the table so the
    // desktop reflects changes made on the phone (and vice versa) within ~1s.
    const channel = supabase
      .channel('collection-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection' }, () => {
        void reload()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
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
