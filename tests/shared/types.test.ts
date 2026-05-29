// @vitest-environment node
import { describe, it, expect } from 'vitest'
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
