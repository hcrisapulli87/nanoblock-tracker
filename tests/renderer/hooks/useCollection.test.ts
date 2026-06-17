import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../../src/renderer/lib/supabase', () => ({
  supabase: {
    channel: () => ({
      on() {
        return this
      },
      subscribe() {
        return this
      },
    }),
    removeChannel: vi.fn(),
  },
}))

const data = vi.hoisted(() => ({
  fetchCollection: vi.fn(async () => [] as unknown[]),
  insertEntry: vi.fn(async () => {}),
  updateEntry: vi.fn(async () => {}),
  deleteEntry: vi.fn(async () => {}),
  upsertEntries: vi.fn(async () => {}),
}))
vi.mock('../../../src/renderer/data/collection', () => data)

import { useCollection } from '../../../src/renderer/hooks/useCollection'
import type { CollectionEntry } from '../../../src/shared/types'

const entry: CollectionEntry = { setId: 'NBPM-001', condition: 'built', notes: '', dateAdded: '2026-06-17' }

beforeEach(() => {
  vi.clearAllMocks()
  data.fetchCollection.mockResolvedValue([])
  // @ts-expect-error test global stub
  window.electronAPI = { getLegacyRows: vi.fn(async () => []) }
})

describe('useCollection', () => {
  it('loads the collection on mount', async () => {
    data.fetchCollection.mockResolvedValue([entry])
    const { result } = renderHook(() => useCollection())
    await waitFor(() => expect(result.current.entries).toEqual([entry]))
  })

  it('adds an entry through the data layer and reflects it in ownedIds', async () => {
    const { result } = renderHook(() => useCollection())
    await waitFor(() => expect(data.fetchCollection).toHaveBeenCalled())
    await act(async () => {
      await result.current.addEntry(entry)
    })
    expect(data.insertEntry).toHaveBeenCalled()
    expect(result.current.ownedIds.has('NBPM-001')).toBe(true)
  })

  it('removes an entry', async () => {
    data.fetchCollection.mockResolvedValue([entry])
    const { result } = renderHook(() => useCollection())
    await waitFor(() => expect(result.current.entries.length).toBe(1))
    await act(async () => {
      await result.current.removeEntry('NBPM-001')
    })
    expect(data.deleteEntry).toHaveBeenCalledWith('NBPM-001')
    expect(result.current.ownedIds.has('NBPM-001')).toBe(false)
  })

  it('migrates legacy rows once when the cloud is empty', async () => {
    // @ts-expect-error test global stub
    window.electronAPI = { getLegacyRows: vi.fn(async () => [entry]) }
    renderHook(() => useCollection())
    await waitFor(() => expect(data.upsertEntries).toHaveBeenCalledWith([entry]))
  })
})
