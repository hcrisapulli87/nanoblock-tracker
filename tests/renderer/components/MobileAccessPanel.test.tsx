import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MobileAccessPanel } from '../../../src/renderer/components/MobileAccessPanel'

const mockApi = {
  mobileGetServerStatus: vi.fn(),
  mobileGetTunnelStatus: vi.fn(),
  mobileGetTunnelUrl: vi.fn(),
  mobileSetPin: vi.fn(),
  mobileSetTunnelConfig: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  window.electronAPI = { ...window.electronAPI, ...mockApi } as typeof window.electronAPI
})

function renderRunning() {
  mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
  mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'connected' })
  mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: 'https://nanoblock.example.com' })
  return render(<MobileAccessPanel onClose={() => {}} />)
}

describe('MobileAccessPanel', () => {
  it('shows running status and port number', async () => {
    renderRunning()
    await waitFor(() => expect(screen.getByText(/45678/)).toBeInTheDocument())
  })

  it('shows tunnel URL when connected', async () => {
    renderRunning()
    await waitFor(() =>
      expect(screen.getByDisplayValue('https://nanoblock.example.com')).toBeInTheDocument()
    )
  })

  it('shows "Not configured" when tunnel status is not-configured', async () => {
    mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
    mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'not-configured' })
    mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: '' })
    render(<MobileAccessPanel onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/not configured/i)).toBeInTheDocument())
  })

  it('calls mobileSetPin when PIN form is submitted', async () => {
    mockApi.mobileSetPin.mockResolvedValue({ success: true })
    renderRunning()
    await waitFor(() => screen.getByPlaceholderText(/new pin/i))
    fireEvent.change(screen.getByPlaceholderText(/new pin/i), { target: { value: '5678' } })
    fireEvent.click(screen.getByRole('button', { name: /save pin/i }))
    await waitFor(() => expect(mockApi.mobileSetPin).toHaveBeenCalledWith('5678'))
  })

  it('calls mobileSetTunnelConfig when tunnel form is saved', async () => {
    mockApi.mobileGetServerStatus.mockResolvedValue({ running: true, port: 45678 })
    mockApi.mobileGetTunnelStatus.mockResolvedValue({ status: 'not-configured' })
    mockApi.mobileGetTunnelUrl.mockResolvedValue({ url: '' })
    mockApi.mobileSetTunnelConfig.mockResolvedValue({ success: true })
    render(<MobileAccessPanel onClose={() => {}} />)

    await waitFor(() => screen.getByPlaceholderText(/tunnel name/i))
    fireEvent.change(screen.getByPlaceholderText(/tunnel name/i), { target: { value: 'nanoblock' } })
    fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), { target: { value: 'https://nanoblock.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save tunnel/i }))

    await waitFor(() =>
      expect(mockApi.mobileSetTunnelConfig).toHaveBeenCalledWith({
        tunnelName: 'nanoblock',
        tunnelUrl: 'https://nanoblock.example.com',
      })
    )
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    renderRunning()
    await waitFor(() => screen.getByRole('button', { name: /close/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).not.toHaveBeenCalled() // sanity: ensure we're testing correct element
    // Re-render with the spy
    const onClose2 = vi.fn()
    render(<MobileAccessPanel onClose={onClose2} />)
    await waitFor(() => screen.getAllByRole('button', { name: /close/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /close/i })[1])
    expect(onClose2).toHaveBeenCalled()
  })
})
