import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCollection } from '../../../src/renderer/hooks/useCollection'
import type { CollectionEntry } from '../../../src/shared/types'

const entry: CollectionEntry = { setId: 'NBPM-001', condition: 'sealed', notes: '', dateAdded: '2024-01-01' }

const mockAPI = {
  getCollection: vi.fn(),
  addToCollection: vi.fn(),
  updateCollectionEntry: vi.fn(),
  removeFromCollection: vi.fn(),
  fetchEbayPrices: vi.fn(),
  fetchNanoblockPrice: vi.fn(),
  openExternal: vi.fn(),
}
vi.stubGlobal('window', { electronAPI: mockAPI })

beforeEach(() => {
  vi.clearAllMocks()
  mockAPI.getCollection.mockResolvedValue([])
})

describe('useCollection', () => {
  it('loads collection on mount', async () => {
    mockAPI.getCollection.mockResolvedValue([entry])
    const { result } = renderHook(() => useCollection())
    await act(async () => {})
    expect(result.current.entries).toEqual([entry])
  })

  it('adds an entry and reflects it in ownedIds', async () => {
    const { result } = renderHook(() => useCollection())
    await act(async () => {})
    await act(async () => { await result.current.addEntry(entry) })
    expect(result.current.ownedIds.has('NBPM-001')).toBe(true)
  })

  it('removes an entry', async () => {
    mockAPI.getCollection.mockResolvedValue([entry])
    const { result } = renderHook(() => useCollection())
    await act(async () => {})
    await act(async () => { await result.current.removeEntry('NBPM-001') })
    expect(result.current.ownedIds.has('NBPM-001')).toBe(false)
  })

  it('updates an entry condition', async () => {
    mockAPI.getCollection.mockResolvedValue([entry])
    const { result } = renderHook(() => useCollection())
    await act(async () => {})
    await act(async () => { await result.current.updateEntry({ ...entry, condition: 'built' }) })
    const updated = result.current.entries.find(e => e.setId === 'NBPM-001')
    expect(updated?.condition).toBe('built')
  })
})
