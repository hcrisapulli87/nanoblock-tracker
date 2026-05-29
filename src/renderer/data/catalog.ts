import type { NanoblockSet } from '../../shared/types'

const artwork = (n: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`

export const CATALOG: NanoblockSet[] = [
  // Gen 1
  { id: 'NBPM-001', pokemonName: 'Bulbasaur',   pokemonNumber: 1,   generation: 1, setCode: 'NBPM-001', imageUrl: artwork(1)   },
  { id: 'NBPM-002', pokemonName: 'Charmander',  pokemonNumber: 4,   generation: 1, setCode: 'NBPM-002', imageUrl: artwork(4)   },
  { id: 'NBPM-003', pokemonName: 'Squirtle',    pokemonNumber: 7,   generation: 1, setCode: 'NBPM-003', imageUrl: artwork(7)   },
  { id: 'NBPM-004', pokemonName: 'Pikachu',     pokemonNumber: 25,  generation: 1, setCode: 'NBPM-004', imageUrl: artwork(25)  },
  { id: 'NBPM-005', pokemonName: 'Clefairy',    pokemonNumber: 35,  generation: 1, setCode: 'NBPM-005', imageUrl: artwork(35)  },
  { id: 'NBPM-006', pokemonName: 'Jigglypuff',  pokemonNumber: 39,  generation: 1, setCode: 'NBPM-006', imageUrl: artwork(39)  },
  { id: 'NBPM-007', pokemonName: 'Psyduck',     pokemonNumber: 54,  generation: 1, setCode: 'NBPM-007', imageUrl: artwork(54)  },
  { id: 'NBPM-008', pokemonName: 'Gengar',      pokemonNumber: 94,  generation: 1, setCode: 'NBPM-008', imageUrl: artwork(94)  },
  { id: 'NBPM-009', pokemonName: 'Lapras',      pokemonNumber: 131, generation: 1, setCode: 'NBPM-009', imageUrl: artwork(131) },
  { id: 'NBPM-010', pokemonName: 'Eevee',       pokemonNumber: 133, generation: 1, setCode: 'NBPM-010', imageUrl: artwork(133) },
  { id: 'NBPM-011', pokemonName: 'Snorlax',     pokemonNumber: 143, generation: 1, setCode: 'NBPM-011', imageUrl: artwork(143) },
  { id: 'NBPM-012', pokemonName: 'Mewtwo',      pokemonNumber: 150, generation: 1, setCode: 'NBPM-012', imageUrl: artwork(150) },
  { id: 'NBPM-013', pokemonName: 'Mew',         pokemonNumber: 151, generation: 1, setCode: 'NBPM-013', imageUrl: artwork(151) },
  // Gen 2
  { id: 'NBPM-014', pokemonName: 'Chikorita',   pokemonNumber: 152, generation: 2, setCode: 'NBPM-014', imageUrl: artwork(152) },
  { id: 'NBPM-015', pokemonName: 'Cyndaquil',   pokemonNumber: 155, generation: 2, setCode: 'NBPM-015', imageUrl: artwork(155) },
  { id: 'NBPM-016', pokemonName: 'Totodile',    pokemonNumber: 158, generation: 2, setCode: 'NBPM-016', imageUrl: artwork(158) },
  { id: 'NBPM-017', pokemonName: 'Togepi',      pokemonNumber: 175, generation: 2, setCode: 'NBPM-017', imageUrl: artwork(175) },
  { id: 'NBPM-018', pokemonName: 'Lugia',       pokemonNumber: 249, generation: 2, setCode: 'NBPM-018', imageUrl: artwork(249) },
  // Gen 3
  { id: 'NBPM-019', pokemonName: 'Treecko',     pokemonNumber: 252, generation: 3, setCode: 'NBPM-019', imageUrl: artwork(252) },
  { id: 'NBPM-020', pokemonName: 'Torchic',     pokemonNumber: 255, generation: 3, setCode: 'NBPM-020', imageUrl: artwork(255) },
  { id: 'NBPM-021', pokemonName: 'Mudkip',      pokemonNumber: 258, generation: 3, setCode: 'NBPM-021', imageUrl: artwork(258) },
  // Gen 4+
  { id: 'NBPM-022', pokemonName: 'Turtwig',     pokemonNumber: 387, generation: 4, setCode: 'NBPM-022', imageUrl: artwork(387) },
  { id: 'NBPM-023', pokemonName: 'Chimchar',    pokemonNumber: 390, generation: 4, setCode: 'NBPM-023', imageUrl: artwork(390) },
  { id: 'NBPM-024', pokemonName: 'Piplup',      pokemonNumber: 393, generation: 4, setCode: 'NBPM-024', imageUrl: artwork(393) },
  { id: 'NBPM-025', pokemonName: 'Lucario',     pokemonNumber: 448, generation: 4, setCode: 'NBPM-025', imageUrl: artwork(448) },
]

// NOTE: Verify and extend this list against nanoblock.com before shipping.
// Navigate to nanoblock.com, filter by Pokémon, and add any missing sets
// using the same structure above.
