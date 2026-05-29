import { describe, it, expect } from 'vitest'
import { CATALOG } from '../../../src/renderer/data/catalog'

describe('CATALOG', () => {
  it('has at least 20 sets', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(20)
  })

  it('every set has a unique id', () => {
    const ids = CATALOG.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every set has a unique pokemonNumber', () => {
    const nums = CATALOG.map(s => s.pokemonNumber)
    expect(new Set(nums).size).toBe(nums.length)
  })

  it('every set has a valid generation (1–9)', () => {
    CATALOG.forEach(s => {
      expect(s.generation).toBeGreaterThanOrEqual(1)
      expect(s.generation).toBeLessThanOrEqual(9)
    })
  })

  it('every set has a non-empty pokemonName', () => {
    CATALOG.forEach(s => {
      expect(s.pokemonName.trim().length).toBeGreaterThan(0)
    })
  })
})
