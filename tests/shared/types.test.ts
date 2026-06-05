// @vitest-environment node
import { describe, it, expect } from 'vitest'
import type { MobileConfig } from '../../src/shared/types'
import { IPC } from '../../src/shared/types'

describe('IPC channel constants', () => {
  it('has no duplicate channel names', () => {
    const values = Object.values(IPC)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('all channels are non-empty strings', () => {
    Object.values(IPC).forEach(channel => {
      expect(typeof channel).toBe('string')
      expect(channel.length).toBeGreaterThan(0)
    })
  })
})

describe('MobileConfig', () => {
  it('IPC has all five mobile channel constants', () => {
    expect(IPC.MOBILE_GET_SERVER_STATUS).toBe('mobile:getServerStatus')
    expect(IPC.MOBILE_GET_TUNNEL_STATUS).toBe('mobile:getTunnelStatus')
    expect(IPC.MOBILE_GET_TUNNEL_URL).toBe('mobile:getTunnelUrl')
    expect(IPC.MOBILE_SET_PIN).toBe('mobile:setPin')
    expect(IPC.MOBILE_SET_TUNNEL_CONFIG).toBe('mobile:setTunnelConfig')
  })
})
