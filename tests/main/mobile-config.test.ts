// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync, existsSync } from 'fs'
import { loadConfig, saveConfig } from '../../src/main/mobile-config'
import type { MobileConfig } from '../../src/shared/types'

const testDir = join(tmpdir(), 'nb-mobile-config-test-' + Date.now())

afterEach(() => {
  try { rmSync(testDir, { recursive: true }) } catch {}
})

describe('loadConfig', () => {
  it('creates mobile-config.json with defaults when file does not exist', () => {
    const config = loadConfig(testDir)

    expect(config.pinHash).toBe('')
    expect(config.tunnelName).toBe('')
    expect(config.tunnelUrl).toBe('')
    expect(config.cookieSecret).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(existsSync(join(testDir, 'mobile-config.json'))).toBe(true)
  })

  it('returns the same cookieSecret on subsequent calls', () => {
    const first = loadConfig(testDir)
    const second = loadConfig(testDir)
    expect(first.cookieSecret).toBe(second.cookieSecret)
  })

  it('reads values previously written by saveConfig', () => {
    loadConfig(testDir) // initialise file
    const update: MobileConfig = {
      pinHash: 'deadbeef',
      cookieSecret: 'fixed-secret',
      tunnelName: 'nanoblock',
      tunnelUrl: 'https://nanoblock.example.com',
    }
    saveConfig(update, testDir)
    const loaded = loadConfig(testDir)
    expect(loaded).toEqual(update)
  })
})

describe('saveConfig', () => {
  it('persists all fields to disk', () => {
    loadConfig(testDir)
    const config: MobileConfig = {
      pinHash: 'abc123',
      cookieSecret: 'secret',
      tunnelName: 'my-tunnel',
      tunnelUrl: 'https://example.com',
    }
    saveConfig(config, testDir)
    expect(loadConfig(testDir).pinHash).toBe('abc123')
    expect(loadConfig(testDir).tunnelUrl).toBe('https://example.com')
  })
})
