import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../../src/renderer/App'

vi.mock('../../../src/renderer/hooks/useCollection', () => ({
  useCollection: () => ({ entries: [], ownedIds: new Set(), addEntry: vi.fn(), updateEntry: vi.fn(), removeEntry: vi.fn() }),
}))

vi.mock('../../../src/renderer/hooks/usePriceLookup', () => ({
  usePriceLookup: () => ({ ebay: null, nanoblock: null }),
}))

window.electronAPI = {
  ...window.electronAPI,
  mobileGetServerStatus: vi.fn().mockResolvedValue({ running: true, port: 45678 }),
  mobileGetTunnelStatus: vi.fn().mockResolvedValue({ status: 'not-configured' }),
  mobileGetTunnelUrl: vi.fn().mockResolvedValue({ url: '' }),
  mobileSetPin: vi.fn(),
  mobileSetTunnelConfig: vi.fn(),
} as typeof window.electronAPI

describe('App mobile access', () => {
  it('opens MobileAccessPanel when Mobile button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    expect(screen.getByText('Mobile Access')).toBeInTheDocument()
  })

  it('closes MobileAccessPanel when close button is clicked', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /mobile/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Mobile Access')).not.toBeInTheDocument()
  })
})
