import type { NanoblockSet } from '../../shared/types'
import type { SidebarFilters } from './Sidebar'
import { SetCard } from './SetCard'

interface Props {
  catalog: NanoblockSet[]
  ownedIds: Set<string>
  filters: SidebarFilters
  onCardClick: (set: NanoblockSet) => void
}

function seriesOf(set: NanoblockSet): 'deluxe' | 'rs' | 'standard' {
  if (set.id.startsWith('NBPM-R')) return 'rs'
  const name = set.pokemonName.toLowerCase()
  if (name.includes('deluxe') || name.includes(' dx)') || name.includes('(dx)')) return 'deluxe'
  return 'standard'
}

function applyFilters(catalog: NanoblockSet[], ownedIds: Set<string>, filters: SidebarFilters): NanoblockSet[] {
  let sets = catalog

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase()
    sets = sets.filter(s => s.pokemonName.toLowerCase().includes(q))
  }

  if (filters.status === 'owned') sets = sets.filter(s => ownedIds.has(s.id))
  if (filters.status === 'missing') sets = sets.filter(s => !ownedIds.has(s.id))

  if (filters.series !== 'all') sets = sets.filter(s => seriesOf(s) === filters.series)

  if (filters.generation > 0) sets = sets.filter(s => s.generation === filters.generation)

  return [...sets].sort((a, b) => {
    if (filters.sort === 'code-asc')    return a.id.localeCompare(b.id)
    if (filters.sort === 'number-desc') return b.pokemonNumber - a.pokemonNumber
    if (filters.sort === 'name-asc')    return a.pokemonName.localeCompare(b.pokemonName)
    return a.pokemonNumber - b.pokemonNumber
  })
}

export function SetGrid({ catalog, ownedIds, filters, onCardClick }: Props) {
  const visible = applyFilters(catalog, ownedIds, filters)

  if (visible.length === 0) {
    return <p className="set-grid__empty">No sets match your filters.</p>
  }

  return (
    <div className="set-grid">
      {visible.map(set => (
        <SetCard
          key={set.id}
          set={set}
          isOwned={ownedIds.has(set.id)}
          onClick={onCardClick}
        />
      ))}
    </div>
  )
}
