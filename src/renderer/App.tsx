import { useState } from 'react'
import type { NanoblockSet, CollectionEntry } from '../shared/types'
import { CATALOG } from './data/catalog'
import { useCollection } from './hooks/useCollection'
import { usePriceLookup } from './hooks/usePriceLookup'
import { Sidebar } from './components/Sidebar'
import type { SidebarFilters } from './components/Sidebar'
import { SetGrid } from './components/SetGrid'
import { SetDetail } from './components/SetDetail'
import { ProgressBar } from './components/ProgressBar'
import { MobileAccessPanel } from './components/MobileAccessPanel'

const DEFAULT_FILTERS: SidebarFilters = {
  search: '',
  status: 'all',
  generation: 0,
  series: 'all',
  sort: 'code-asc',
}

function DetailPane({ set, entry, onClose, onUpdate, onRemove, onMarkOwned }: {
  set: NanoblockSet
  entry: CollectionEntry | null
  onClose: () => void
  onUpdate: (e: CollectionEntry) => void
  onRemove: (id: string) => void
  onMarkOwned: (e: CollectionEntry) => void
}) {
  // Only fetch prices for missing sets (entry === null)
  const { ebay, nanoblock } = usePriceLookup(entry ? '' : set.pokemonName, entry ? '' : set.setCode)
  return (
    <SetDetail
      set={set}
      entry={entry}
      ebay={ebay}
      nanoblock={nanoblock}
      onClose={onClose}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onMarkOwned={onMarkOwned}
      onBuyLink={url => window.electronAPI.openExternal(url)}
    />
  )
}

export default function App() {
  const { entries, ownedIds, addEntry, updateEntry, removeEntry } = useCollection()
  const [filters, setFilters] = useState<SidebarFilters>(DEFAULT_FILTERS)
  const [selectedSet, setSelectedSet] = useState<NanoblockSet | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const selectedEntry = selectedSet
    ? entries.find(e => e.setId === selectedSet.id) ?? null
    : null

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Pokémon Nanoblock Tracker</h1>
        <ProgressBar owned={ownedIds.size} total={CATALOG.length} />
        <button
          className="mobile-btn"
          aria-label="Mobile"
          onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: '1px solid #2a3a50', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '5px 12px', marginLeft: 12 }}
        >
          📱 Mobile
        </button>
      </header>
      <div className="app__body">
        <Sidebar filters={filters} onChange={setFilters} />
        <main className="app__main">
          <SetGrid
            catalog={CATALOG}
            ownedIds={ownedIds}
            filters={filters}
            onCardClick={setSelectedSet}
          />
        </main>
      </div>
      {selectedSet && (
        <DetailPane
          set={selectedSet}
          entry={selectedEntry}
          onClose={() => setSelectedSet(null)}
          onUpdate={updateEntry}
          onRemove={async (id) => { await removeEntry(id); setSelectedSet(null) }}
          onMarkOwned={addEntry}
        />
      )}
      {mobileOpen && <MobileAccessPanel onClose={() => setMobileOpen(false)} />}
    </div>
  )
}
