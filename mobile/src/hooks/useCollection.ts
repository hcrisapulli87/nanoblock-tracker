import { useState, useEffect, useCallback } from 'react'
import type { CollectionEntry } from '../shared/types'
import {
  fetchCollection,
  insertEntry,
  updateEntry as apiUpdate,
  deleteEntry,
} from '../data/collection'
import { supabase } from '../lib/supabase'

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([])

  const reload = useCallback(async () => {
    setEntries(await fetchCollection())
  }, [])

  useEffect(() => {
    void reload()
    // Realtime: changes from the desktop (or another phone) re-read the table within ~1s.
    const channel = supabase
      .channel('collection-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection' }, () => {
        void reload()
      })
      .subscribe()
    return () => {
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
