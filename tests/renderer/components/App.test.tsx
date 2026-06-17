import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../../src/renderer/App'

vi.mock('../../../src/renderer/hooks/useCollection', () => ({
  useCollection: () => ({
    entries: [],
    ownedIds: new Set(),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    removeEntry: vi.fn(),
  }),
}))

vi.mock('../../../src/renderer/hooks/usePriceLookup', () => ({
  usePriceLookup: () => ({ ebay: null, nanoblock: null }),
}))

const auth = vi.hoisted(() => ({
  value: { session: null as unknown, loading: false },
}))
vi.mock('../../../src/renderer/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => auth.value,
}))

describe('App auth gate', () => {
  it('shows the login screen when there is no session', () => {
    auth.value = { session: null, loading: false }
    render(<App />)
    expect(screen.getByText('Pokémon Nanoblock Tracker')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
  })

  it('shows the tracker when signed in', () => {
    auth.value = { session: { user: { id: 'u1' } }, loading: false }
    render(<App />)
    expect(screen.getByText('Pokémon Nanoblock Tracker')).toBeInTheDocument()
    // The tracker renders the progress bar / set grid, not the login form.
    expect(screen.queryByPlaceholderText(/you@example.com/i)).not.toBeInTheDocument()
  })
})
