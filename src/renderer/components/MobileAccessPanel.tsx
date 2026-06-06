import { useEffect, useState } from 'react'

type TunnelStatus = 'connected' | 'connecting' | 'not-configured'

interface ServerStatus {
  running: boolean
  port: number
}

export function MobileAccessPanel({ onClose }: { onClose: () => void }) {
  const [server, setServer] = useState<ServerStatus | null>(null)
  const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>('not-configured')
  const [tunnelUrl, setTunnelUrl] = useState('')
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [tunnelName, setTunnelName] = useState('')
  const [tunnelUrlInput, setTunnelUrlInput] = useState('')
  const [tunnelMsg, setTunnelMsg] = useState('')

  useEffect(() => {
    void (async () => {
      const [sv, ts, tu] = await Promise.all([
        window.electronAPI.mobileGetServerStatus(),
        window.electronAPI.mobileGetTunnelStatus(),
        window.electronAPI.mobileGetTunnelUrl(),
      ])
      setServer(sv)
      setTunnelStatus(ts.status)
      setTunnelUrl(tu.url)
    })()
  }, [])

  async function handleSavePin() {
    if (!pin) return
    await window.electronAPI.mobileSetPin(pin)
    setPin('')
    setPinMsg('PIN saved.')
    setTimeout(() => setPinMsg(''), 3000)
  }

  async function handleSaveTunnel() {
    if (!tunnelName || !tunnelUrlInput) return
    await window.electronAPI.mobileSetTunnelConfig({ tunnelName, tunnelUrl: tunnelUrlInput })
    setTunnelMsg('Saved. Restart app to apply tunnel.')
    setTimeout(() => setTunnelMsg(''), 4000)
  }

  function copyUrl() {
    void navigator.clipboard.writeText(tunnelUrl)
  }

  const statusDot = (ok: boolean) => (
    <span style={{ color: ok ? '#86efac' : '#f87171', marginRight: 6 }}>●</span>
  )

  const tunnelColor: Record<TunnelStatus, string> = {
    connected: '#86efac',
    connecting: '#fcd34d',
    'not-configured': '#f87171',
  }

  return (
    <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel" style={{ maxWidth: 480 }}>
        <div className="detail-header">
          <h2 className="detail-title">Mobile Access</h2>
          <button className="detail-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Server status */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Server</h3>
            {server ? (
              <p style={{ fontSize: 14 }}>{statusDot(server.running)}{server.running ? `Running on port ${server.port}` : 'Stopped'}</p>
            ) : (
              <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>
            )}
          </section>

          {/* Tunnel status */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tunnel</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>
              <span style={{ color: tunnelColor[tunnelStatus], marginRight: 6 }}>●</span>
              {tunnelStatus === 'connected' ? 'Connected' : tunnelStatus === 'connecting' ? 'Connecting…' : 'Not configured'}
            </p>
            {tunnelUrl && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={tunnelUrl}
                  style={{ flex: 1, background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#7dd3fc', fontSize: 13, padding: '7px 10px' }}
                />
                <button onClick={copyUrl} style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '7px 12px', fontSize: 13 }}>Copy</button>
              </div>
            )}
          </section>

          {/* Tunnel config (shown when not configured) */}
          {tunnelStatus === 'not-configured' && (
            <section>
              <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Configure Tunnel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  placeholder="Tunnel name (e.g. nanoblock)"
                  value={tunnelName}
                  onChange={e => setTunnelName(e.target.value)}
                  style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
                />
                <input
                  placeholder="https://your-url.example.com"
                  value={tunnelUrlInput}
                  onChange={e => setTunnelUrlInput(e.target.value)}
                  style={{ background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
                />
                <button onClick={handleSaveTunnel} aria-label="Save tunnel" style={{ background: '#7dd3fc', border: 'none', borderRadius: 6, color: '#0f1923', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '9px 0' }}>Save Tunnel Config</button>
                {tunnelMsg && <p style={{ color: '#86efac', fontSize: 13 }}>{tunnelMsg}</p>}
              </div>
            </section>
          )}

          {/* PIN management */}
          <section>
            <h3 style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>PIN</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="New PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                style={{ flex: 1, background: '#1a2a3a', border: '1px solid #2a3a50', borderRadius: 6, color: '#e2e8f0', fontSize: 13, padding: '8px 10px' }}
              />
              <button onClick={handleSavePin} aria-label="Save PIN" style={{ background: '#7dd3fc', border: 'none', borderRadius: 6, color: '#0f1923', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 14px' }}>Save PIN</button>
            </div>
            {pinMsg && <p style={{ color: '#86efac', fontSize: 13, marginTop: 6 }}>{pinMsg}</p>}
          </section>

        </div>
      </div>
    </div>
  )
}
