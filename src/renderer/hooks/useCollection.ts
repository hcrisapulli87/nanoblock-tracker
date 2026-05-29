import { useState, useEffect, useCallback } from 'react'
import type { CollectionEntry } from '../../shared/types'

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([])

  useEffect(() => {
    window.electronAPI.getCollection().then(setEntries)
  }, [])

  const ownedIds = new Set(entries.map(e => e.setId))

  const addEntry = useCallback(async (entry: CollectionEntry) => {
    await window.electronAPI.addToCollection(entry)
    setEntries(prev => [...prev, entry])
  }, [])

  const updateEntry = useCallback(async (entry: CollectionEntry) => {
    await window.electronAPI.updateCollectionEntry(entry)
    setEntries(prev => prev.map(e => e.setId === entry.setId ? entry : e))
  }, [])

  const removeEntry = useCallback(async (setId: string) => {
    await window.electronAPI.removeFromCollection(setId)
    setEntries(prev => prev.filter(e => e.setId !== setId))
  }, [])

  return { entries, ownedIds, addEntry, updateEntry, removeEntry }
}
