import { useState, useEffect } from 'react'

export interface SidebarFilters {
  search: string
  status: 'all' | 'owned' | 'missing'
  generation: number  // 0 = all
  series: 'all' | 'standard' | 'deluxe' | 'rs'
  sort: 'number-asc' | 'number-desc' | 'name-asc' | 'code-asc'
}

interface Props {
  filters: SidebarFilters
  onChange: (filters: SidebarFilters) => void
}

const GENERATIONS = [
  { label: 'All Gens', value: 0 },
  { label: 'Gen 1', value: 1 },
  { label: 'Gen 2', value: 2 },
  { label: 'Gen 3', value: 3 },
  { label: 'Gen 4', value: 4 },
  { label: 'Gen 6', value: 6 },
  { label: 'Gen 7', value: 7 },
  { label: 'Gen 8', value: 8 },
  { label: 'Gen 9', value: 9 },
]

const STATUSES: { label: string; value: SidebarFilters['status'] }[] = [
  { label: 'All Sets', value: 'all' },
  { label: 'Owned', value: 'owned' },
  { label: 'Missing', value: 'missing' },
]

const SERIES: { label: string; value: SidebarFilters['series'] }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Standard', value: 'standard' },
  { label: 'Deluxe / DX', value: 'deluxe' },
  { label: 'RS Series', value: 'rs' },
]

const SORTS: { label: string; value: SidebarFilters['sort'] }[] = [
  { label: 'Collection #', value: 'code-asc' },
  { label: 'Pokédex # ↑', value: 'number-asc' },
  { label: 'Pokédex # ↓', value: 'number-desc' },
  { label: 'Name A–Z', value: 'name-asc' },
]

export function Sidebar({ filters, onChange }: Props) {
  const [searchValue, setSearchValue] = useState(filters.search)

  // Sync internal state if parent resets the search externally
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const set = (partial: Partial<SidebarFilters>) => onChange({ ...filters, ...partial })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onChange({ ...filters, search: value })
  }

  return (
    <aside className="sidebar">
      <input
        className="sidebar__search"
        placeholder="Search Pokémon..."
        value={searchValue}
        onChange={handleSearchChange}
      />

      <section className="sidebar__section">
        <h4 className="sidebar__heading">Status</h4>
        {STATUSES.map(s => (
          <button
            key={s.value}
            className={`sidebar__filter-btn ${filters.status === s.value ? 'sidebar__filter-btn--active' : ''}`}
            onClick={() => set({ status: s.value })}
          >
            {s.label}
          </button>
        ))}
      </section>

      <section className="sidebar__section">
        <h4 className="sidebar__heading">Series</h4>
        {SERIES.map(s => (
          <button
            key={s.value}
            className={`sidebar__filter-btn ${filters.series === s.value ? 'sidebar__filter-btn--active' : ''}`}
            onClick={() => set({ series: s.value })}
          >
            {s.label}
          </button>
        ))}
      </section>

      <section className="sidebar__section">
        <h4 className="sidebar__heading">Generation</h4>
        {GENERATIONS.map(g => (
          <button
            key={g.value}
            className={`sidebar__filter-btn ${filters.generation === g.value ? 'sidebar__filter-btn--active' : ''}`}
            onClick={() => set({ generation: g.value })}
          >
            {g.label}
          </button>
        ))}
      </section>

      <section className="sidebar__section">
        <h4 className="sidebar__heading">Sort</h4>
        <select
          className="sidebar__select"
          value={filters.sort}
          onChange={e => set({ sort: e.target.value as SidebarFilters['sort'] })}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </section>
    </aside>
  )
}
