// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => ({ spawn: vi.fn() }))

import { spawn } from 'child_process'
import { TunnelManager } from '../../src/main/tunnel'

function makeMockProc() {
  const proc = new EventEmitter() as any
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TunnelManager', () => {
  it('starts with connecting status and spawns cloudflared', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    expect(mgr.status).toBe('connecting')
    expect(spawn).toHaveBeenCalledWith('cloudflared', ['tunnel', 'run', '--', 'nanoblock'], expect.any(Object))
  })

  it('transitions to connected when stdout contains registration message', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    const events: string[] = []
    mgr.on('status', s => events.push(s))

    proc.stdout.emit('data', Buffer.from('INF Registered tunnel connection to edge'))

    expect(mgr.status).toBe('connected')
    expect(events).toContain('connected')
  })

  it('also detects connection via stderr', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    proc.stderr.emit('data', Buffer.from('Registered tunnel connection'))
    expect(mgr.status).toBe('connected')
  })

  it('kills the process and sets stopped status on stop()', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    mgr.stop()

    expect(proc.kill).toHaveBeenCalled()
    expect(mgr.status).toBe('stopped')
  })

  it('restarts after 5 seconds on unexpected exit', () => {
    const proc1 = makeMockProc()
    const proc2 = makeMockProc()
    vi.mocked(spawn).mockReturnValueOnce(proc1 as any).mockReturnValueOnce(proc2 as any)

    new TunnelManager('nanoblock')
    proc1.emit('exit', 1)

    expect(spawn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5000)
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('does NOT restart after stop() when process exits', () => {
    const proc = makeMockProc()
    vi.mocked(spawn).mockReturnValue(proc as any)

    const mgr = new TunnelManager('nanoblock')
    mgr.stop()
    proc.emit('exit', 0)

    vi.advanceTimersByTime(6000)
    expect(spawn).toHaveBeenCalledTimes(1)
  })
})
