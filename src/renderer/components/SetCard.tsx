import type { NanoblockSet } from '../../shared/types'

interface Props {
  set: NanoblockSet
  isOwned: boolean
  onClick: (set: NanoblockSet) => void
}

export function SetCard({ set, isOwned, onClick }: Props) {
  const fallbackImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${set.pokemonNumber}.png`

  return (
    <button
      className={`set-card ${isOwned ? 'set-card--owned' : 'set-card--missing'}`}
      onClick={() => onClick(set)}
    >
      <div className="set-card__image-wrapper">
        <img
          src={set.imageUrl ?? fallbackImage}
          alt={set.pokemonName}
          className="set-card__image"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImage }}
        />
      </div>
      <div className="set-card__info">
        <span className="set-card__number">{set.setCode}</span>
        <span className="set-card__name">{set.pokemonName}</span>
        <span className={`set-card__status ${isOwned ? 'set-card__status--owned' : 'set-card__status--missing'}`}>
          {isOwned ? '✓ Owned' : 'Missing'}
        </span>
      </div>
    </button>
  )
}
