import { describe, it, expect } from 'vitest'
import { CATALOG } from '../../../src/renderer/data/catalog'

describe('CATALOG', () => {
  it('has at least 100 sets', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(100)
  })

  it('every set has a unique id (NBPM code)', () => {
    const ids = CATALOG.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // Note: pokemonNumber is NOT unique — multiple sets share the same Pokémon
  // (e.g., Pikachu appears as standard, Deluxe, Quest, Lunar New Year, etc.)
  it('every set has a positive pokemonNumber', () => {
    CATALOG.forEach(s => {
      expect(s.pokemonNumber).toBeGreaterThan(0)
    })
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

  it('includes sets from multiple generations', () => {
    const gens = new Set(CATALOG.map(s => s.generation))
    expect(gens.size).toBeGreaterThanOrEqual(5)
  })

  it('includes the RS series (Gen 9)', () => {
    const rsSets = CATALOG.filter(s => s.id.startsWith('NBPM-R'))
    expect(rsSets.length).toBeGreaterThanOrEqual(13)
  })
})
