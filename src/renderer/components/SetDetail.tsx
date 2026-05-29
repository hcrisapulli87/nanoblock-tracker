import { useState } from 'react'
import type { NanoblockSet, CollectionEntry, PriceResult } from '../../shared/types'
import { PriceComparison } from './PriceComparison'

interface Props {
  set: NanoblockSet
  entry: CollectionEntry | null
  ebay: PriceResult
  nanoblock: PriceResult
  onClose: () => void
  onUpdate: (entry: CollectionEntry) => void
  onRemove: (setId: string) => void
  onMarkOwned: (entry: CollectionEntry) => void
  onBuyLink: (url: string) => void
}

const CONDITIONS: CollectionEntry['condition'][] = ['sealed', 'built', 'loose']

export function SetDetail({ set, entry, ebay, nanoblock, onClose, onUpdate, onRemove, onMarkOwned, onBuyLink }: Props) {
  const [showMarkForm, setShowMarkForm] = useState(false)
  const [markCondition, setMarkCondition] = useState<CollectionEntry['condition']>('sealed')
  const [markNotes, setMarkNotes] = useState('')
  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${set.pokemonNumber}.png`

  function handleConfirmOwned() {
    onMarkOwned({ setId: set.id, condition: markCondition, notes: markNotes, dateAdded: new Date().toISOString().split('T')[0] })
    setShowMarkForm(false)
  }

  return (
    <div className="set-detail-overlay" onClick={onClose}>
      <aside className="set-detail" onClick={e => e.stopPropagation()}>
        <button className="set-detail__close" onClick={onClose}>✕</button>

        <div className="set-detail__header">
          <img
            src={set.imageUrl ?? fallback}
            alt={set.pokemonName}
            className="set-detail__image"
            onError={e => { (e.currentTarget as HTMLImageElement).src = fallback }}
          />
          <div>
            <p className="set-detail__meta">Gen {set.generation} · #{String(set.pokemonNumber).padStart(3, '0')}</p>
            <h2 className="set-detail__name">{set.pokemonName}</h2>
            <p className="set-detail__code">{set.setCode}</p>
            <span className={`set-detail__badge ${entry ? 'set-detail__badge--owned' : 'set-detail__badge--missing'}`}>
              {entry ? 'OWNED' : 'MISSING'}
            </span>
          </div>
        </div>

        {entry ? (
          <div className="set-detail__owned-body">
            <div className="set-detail__condition">
              <h4>Condition</h4>
              <div className="condition-pills">
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    className={`condition-pill ${entry.condition === c ? 'active' : ''}`}
                    onClick={() => onUpdate({ ...entry, condition: c })}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="set-detail__notes">
              <h4>Notes</h4>
              <textarea
                defaultValue={entry.notes}
                className="set-detail__notes-input"
                onBlur={e => { if (e.target.value !== entry.notes) onUpdate({ ...entry, notes: e.target.value }) }}
              />
            </div>
            <p className="set-detail__date">Added: {entry.dateAdded}</p>
            <button className="set-detail__remove" onClick={() => onRemove(set.id)}>
              Remove from collection
            </button>
          </div>
        ) : (
          <div className="set-detail__missing-body">
            <PriceComparison ebay={ebay} nanoblock={nanoblock} pokemonName={set.pokemonName} onBuyLink={onBuyLink} />

            {!showMarkForm ? (
              <button className="set-detail__mark-owned-btn" onClick={() => setShowMarkForm(true)}>
                + Mark as Owned
              </button>
            ) : (
              <div className="mark-owned-form">
                <h4>Mark as Owned</h4>
                <div className="condition-pills">
                  {CONDITIONS.map(c => (
                    <button
                      key={c}
                      className={`condition-pill ${markCondition === c ? 'active' : ''}`}
                      onClick={() => setMarkCondition(c)}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Notes (optional)"
                  className="set-detail__notes-input"
                  value={markNotes}
                  onChange={e => setMarkNotes(e.target.value)}
                />
                <div className="mark-owned-form__actions">
                  <button className="mark-owned-form__confirm" onClick={handleConfirmOwned}>Confirm</button>
                  <button className="mark-owned-form__cancel" onClick={() => setShowMarkForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
