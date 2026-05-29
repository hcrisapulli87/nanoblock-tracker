import { describe, it, expect } from 'vitest'
import { ebaySearchUrl, amazonSearchUrl, amiAmiSearchUrl, nanoblockSearchUrl } from '../../../src/renderer/data/buyLinks'

describe('buy link generators', () => {
  it('ebaySearchUrl encodes pokemonName and includes Nanoblock', () => {
    const url = ebaySearchUrl('Bulbasaur')
    expect(url).toContain('ebay.com')
    expect(url).toContain('Bulbasaur')
    expect(url).toContain('Nanoblock')
  })

  it('amazonSearchUrl encodes pokemonName', () => {
    const url = amazonSearchUrl('Mr. Mime')
    expect(url).toContain('amazon.com')
    expect(url).toContain('Mr.')
  })

  it('amiAmiSearchUrl encodes pokemonName', () => {
    const url = amiAmiSearchUrl('Pikachu')
    expect(url).toContain('amiami.com')
    expect(url).toContain('Pikachu')
  })

  it('nanoblockSearchUrl omits "Nanoblock" from query', () => {
    const url = nanoblockSearchUrl('Eevee')
    expect(url).toContain('nanoblock.com')
    expect(url).toContain('Eevee')
  })
})
