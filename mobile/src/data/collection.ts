import { supabase } from '../lib/supabase'
import type { CollectionEntry } from '../shared/types'

export interface CollectionRow {
  set_id: string
  owner_id?: string
  condition: CollectionEntry['condition']
  notes: string
  date_added: string
}

// date_added is a timestamptz in Postgres; the app treats it as a plain date.
export function rowToEntry(r: CollectionRow): CollectionEntry {
  return { setId: r.set_id, condition: r.condition, notes: r.notes, dateAdded: r.date_added.slice(0, 10) }
}

// owner_id is omitted — the column defaults to auth.uid() and RLS enforces it.
export function entryToRow(e: CollectionEntry): CollectionRow {
  return { set_id: e.setId, condition: e.condition, notes: e.notes, date_added: e.dateAdded }
}

export function deriveOwnedIds(entries: CollectionEntry[]): Set<string> {
  return new Set(entries.map((e) => e.setId))
}

export async function fetchCollection(): Promise<CollectionEntry[]> {
  const { data, error } = await supabase.from('collection').select('*').order('set_id')
  if (error) throw error
  return (data as CollectionRow[]).map(rowToEntry)
}

export async function insertEntry(entry: CollectionEntry): Promise<void> {
  const { error } = await supabase.from('collection').insert(entryToRow(entry))
  if (error) throw error
}

export async function updateEntry(entry: CollectionEntry): Promise<void> {
  const { error } = await supabase
    .from('collection')
    .update({ condition: entry.condition, notes: entry.notes })
    .eq('set_id', entry.setId)
  if (error) throw error
}

export async function deleteEntry(setId: string): Promise<void> {
  const { error } = await supabase.from('collection').delete().eq('set_id', setId)
  if (error) throw error
}
