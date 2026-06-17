import { useState } from 'react'
import type { NanoblockSet, CollectionEntry } from '../shared/types'
import { CATALOG } from '../shared/catalog'
import { useCollection } from '../hooks/useCollection'
import { useAuth } from '../auth/AuthProvider'

const CONDITIONS: CollectionEntry['condition'][] = ['sealed', 'built', 'loose']
const today = () => new Date().toISOString().slice(0, 10)

// The Merlinsbricks CDN sends `Cross-Origin-Resource-Policy: same-site`, which blocks a plain
// cross-origin <img> on the web. It also sends `Access-Control-Allow-Origin: *`, so loading it
// as a CORS request (crossOrigin) bypasses CORP. Other hosts (Kawada, Shopify) send no CORP and
// no CORS header, so they must stay plain — forcing crossOrigin on them would break them.
function corsFor(url?: string): 'anonymous' | undefined {
  return url?.includes('cdn.merlinsbricks.com') ? 'anonymous' : undefined
}

export default function Collection() {
  const { entries, ownedIds, addEntry, updateEntry, removeEntry } = useCollection()
  const { signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [sheetSet, setSheetSet] = useState<NanoblockSet | null>(null)

  const q = query.trim().toLowerCase()
  const visible = q
    ? CATALOG.filter(
        (s) => s.pokemonName.toLowerCase().includes(q) || s.setCode.toLowerCase().includes(q),
      )
    : CATALOG

  const entryFor = (id: string): CollectionEntry | null => entries.find((e) => e.setId === id) ?? null

  const toggleOwned = async (set: NanoblockSet) => {
    if (ownedIds.has(set.id)) await removeEntry(set.id)
    else await addEntry({ setId: set.id, condition: 'built', notes: '', dateAdded: today() })
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__row">
          <h1 className="topbar__title">Nanoblock</h1>
          <button className="link" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <p className="topbar__count">
          {ownedIds.size} <span className="muted">/ {CATALOG.length} owned</span>
        </p>
        <input
          className="search"
          type="search"
          inputMode="search"
          placeholder="Search by name or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <ul className="list">
        {visible.map((set) => {
          const owned = ownedIds.has(set.id)
          return (
            <li key={set.id} className={`row${owned ? ' row--owned' : ''}`}>
              <button className="row__main" onClick={() => setSheetSet(set)}>
                <span className="thumb">
                  {set.imageUrl && (
                    <img
                      src={set.imageUrl}
                      alt=""
                      loading="lazy"
                      crossOrigin={corsFor(set.imageUrl)}
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  )}
                </span>
                <span className="row__text">
                  <span className="row__name">{set.pokemonName}</span>
                  <span className="row__code">{set.setCode}</span>
                </span>
              </button>
              <button
                className={`heart${owned ? ' heart--on' : ''}`}
                aria-label={owned ? 'Remove from collection' : 'Add to collection'}
                aria-pressed={owned}
                onClick={() => void toggleOwned(set)}
              >
                {owned ? '♥' : '♡'}
              </button>
            </li>
          )
        })}
        {visible.length === 0 && <li className="empty">No sets match “{query}”.</li>}
      </ul>

      {sheetSet && (
        <SetSheet
          set={sheetSet}
          entry={entryFor(sheetSet.id)}
          onClose={() => setSheetSet(null)}
          onAdd={(condition) =>
            addEntry({ setId: sheetSet.id, condition, notes: '', dateAdded: today() })
          }
          onUpdate={updateEntry}
          onRemove={() => removeEntry(sheetSet.id)}
        />
      )}
    </div>
  )
}

function SetSheet({
  set,
  entry,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
}: {
  set: NanoblockSet
  entry: CollectionEntry | null
  onClose: () => void
  onAdd: (condition: CollectionEntry['condition']) => Promise<void>
  onUpdate: (entry: CollectionEntry) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [notes, setNotes] = useState(entry?.notes ?? '')

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label={set.pokemonName}>
        <div className="sheet__grip" />
        <div className="sheet__head">
          <span className="thumb thumb--lg">
            {set.imageUrl && (
              <img
                src={set.imageUrl}
                alt=""
                crossOrigin={corsFor(set.imageUrl)}
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden'
                }}
              />
            )}
          </span>
          <div>
            <h2 className="sheet__name">{set.pokemonName}</h2>
            <p className="sheet__code">{set.setCode}</p>
          </div>
        </div>

        {entry ? (
          <>
            <p className="field-label">Condition</p>
            <div className="segmented">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  className={`segmented__btn${entry.condition === c ? ' is-active' : ''}`}
                  onClick={() => void onUpdate({ ...entry, condition: c })}
                >
                  {c}
                </button>
              ))}
            </div>

            <p className="field-label">Notes</p>
            <textarea
              className="notes"
              value={notes}
              placeholder="Anything worth remembering…"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== entry.notes) void onUpdate({ ...entry, notes })
              }}
            />

            <button
              className="btn--danger"
              onClick={async () => {
                await onRemove()
                onClose()
              }}
            >
              Remove from collection
            </button>
          </>
        ) : (
          <button
            className="btn--primary"
            onClick={async () => {
              await onAdd('built')
              onClose()
            }}
          >
            Add to collection
          </button>
        )}
      </div>
    </div>
  )
}
