import type { NanoblockSet } from '../../shared/types'

// Official Pokémon artwork from PokéAPI (used as placeholder until real Nanoblock
// packaging images are sourced). For variant sets, the base Pokémon's artwork is used.
const artwork = (n: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`

// Complete catalog of all known Pokémon Nanoblock (NBPM) sets as of mid-2025.
// Sources: Bulbapedia, Shy Gal's Building Blog, Kawada official catalog, retailer listings.
// Multiple sets may share the same pokemonNumber — the id (NBPM code) is the unique key.
// To add new sets: use the same structure below and extend the array.
export const CATALOG: NanoblockSet[] = [

  // ── NBPM-001 to NBPM-013: Wave 1 (2013-2015) ───────────────────────────────
  { id: 'NBPM-001', pokemonName: 'Pikachu',              pokemonNumber: 25,   generation: 1, setCode: 'NBPM-001', imageUrl: artwork(25)   },
  { id: 'NBPM-002', pokemonName: 'Charmander',           pokemonNumber: 4,    generation: 1, setCode: 'NBPM-002', imageUrl: artwork(4)    },
  { id: 'NBPM-003', pokemonName: 'Bulbasaur',            pokemonNumber: 1,    generation: 1, setCode: 'NBPM-003', imageUrl: artwork(1)    },
  { id: 'NBPM-004', pokemonName: 'Squirtle',             pokemonNumber: 7,    generation: 1, setCode: 'NBPM-004', imageUrl: artwork(7)    },
  { id: 'NBPM-005', pokemonName: 'Eevee',                pokemonNumber: 133,  generation: 1, setCode: 'NBPM-005', imageUrl: artwork(133)  },
  { id: 'NBPM-006', pokemonName: 'Mewtwo',               pokemonNumber: 150,  generation: 1, setCode: 'NBPM-006', imageUrl: artwork(150)  },
  { id: 'NBPM-007', pokemonName: 'Gengar',               pokemonNumber: 94,   generation: 1, setCode: 'NBPM-007', imageUrl: artwork(94)   },
  { id: 'NBPM-008', pokemonName: 'Charizard',            pokemonNumber: 6,    generation: 1, setCode: 'NBPM-008', imageUrl: artwork(6)    },
  { id: 'NBPM-009', pokemonName: 'Lapras',               pokemonNumber: 131,  generation: 1, setCode: 'NBPM-009', imageUrl: artwork(131)  },
  { id: 'NBPM-010', pokemonName: 'Caterpie & Poké Ball', pokemonNumber: 10,   generation: 1, setCode: 'NBPM-010', imageUrl: artwork(10)   },
  { id: 'NBPM-011', pokemonName: 'Dragonite',            pokemonNumber: 149,  generation: 1, setCode: 'NBPM-011', imageUrl: artwork(149)  },
  { id: 'NBPM-012', pokemonName: 'Snorlax',              pokemonNumber: 143,  generation: 1, setCode: 'NBPM-012', imageUrl: artwork(143)  },
  { id: 'NBPM-013', pokemonName: "Farfetch'd",           pokemonNumber: 83,   generation: 1, setCode: 'NBPM-013', imageUrl: artwork(83)   },

  // ── NBPM-014 to NBPM-017: 20th Anniversary Monotone Edition (2016) ─────────
  { id: 'NBPM-014', pokemonName: 'Pikachu (20th Anniversary)',    pokemonNumber: 25, generation: 1, setCode: 'NBPM-014', imageUrl: artwork(25) },
  { id: 'NBPM-015', pokemonName: 'Charmander (20th Anniversary)', pokemonNumber: 4,  generation: 1, setCode: 'NBPM-015', imageUrl: artwork(4)  },
  { id: 'NBPM-016', pokemonName: 'Bulbasaur (20th Anniversary)',  pokemonNumber: 1,  generation: 1, setCode: 'NBPM-016', imageUrl: artwork(1)  },
  { id: 'NBPM-017', pokemonName: 'Squirtle (20th Anniversary)',   pokemonNumber: 7,  generation: 1, setCode: 'NBPM-017', imageUrl: artwork(7)  },

  // ── NBPM-018 to NBPM-024: Wave 2 (2016-2017) ───────────────────────────────
  { id: 'NBPM-018', pokemonName: 'Venusaur',    pokemonNumber: 3,   generation: 1, setCode: 'NBPM-018', imageUrl: artwork(3)   },
  { id: 'NBPM-019', pokemonName: 'Blastoise',   pokemonNumber: 9,   generation: 1, setCode: 'NBPM-019', imageUrl: artwork(9)   },
  { id: 'NBPM-020', pokemonName: 'Vaporeon',    pokemonNumber: 134, generation: 1, setCode: 'NBPM-020', imageUrl: artwork(134) },
  { id: 'NBPM-021', pokemonName: 'Jolteon',     pokemonNumber: 135, generation: 1, setCode: 'NBPM-021', imageUrl: artwork(135) },
  { id: 'NBPM-022', pokemonName: 'Flareon',     pokemonNumber: 136, generation: 1, setCode: 'NBPM-022', imageUrl: artwork(136) },
  { id: 'NBPM-023', pokemonName: 'Gyarados',    pokemonNumber: 130, generation: 1, setCode: 'NBPM-023', imageUrl: artwork(130) },
  { id: 'NBPM-024', pokemonName: 'Psyduck',     pokemonNumber: 54,  generation: 1, setCode: 'NBPM-024', imageUrl: artwork(54)  },

  // ── NBPM-025 to NBPM-027: Alola Starters (Pokémon Center JP exclusive) ─────
  { id: 'NBPM-025', pokemonName: 'Litten',  pokemonNumber: 725, generation: 7, setCode: 'NBPM-025', imageUrl: artwork(725) },
  { id: 'NBPM-026', pokemonName: 'Popplio', pokemonNumber: 728, generation: 7, setCode: 'NBPM-026', imageUrl: artwork(728) },
  { id: 'NBPM-027', pokemonName: 'Rowlet',  pokemonNumber: 722, generation: 7, setCode: 'NBPM-027', imageUrl: artwork(722) },

  // ── NBPM-028 to NBPM-035: Gen II Wave (2017-2018) ──────────────────────────
  { id: 'NBPM-028', pokemonName: 'Pichu',     pokemonNumber: 172, generation: 2, setCode: 'NBPM-028', imageUrl: artwork(172) },
  { id: 'NBPM-029', pokemonName: 'Cyndaquil', pokemonNumber: 155, generation: 2, setCode: 'NBPM-029', imageUrl: artwork(155) },
  { id: 'NBPM-030', pokemonName: 'Chikorita', pokemonNumber: 152, generation: 2, setCode: 'NBPM-030', imageUrl: artwork(152) },
  { id: 'NBPM-031', pokemonName: 'Totodile',  pokemonNumber: 158, generation: 2, setCode: 'NBPM-031', imageUrl: artwork(158) },
  { id: 'NBPM-032', pokemonName: 'Lugia',     pokemonNumber: 249, generation: 2, setCode: 'NBPM-032', imageUrl: artwork(249) },
  { id: 'NBPM-033', pokemonName: 'Ho-Oh',     pokemonNumber: 250, generation: 2, setCode: 'NBPM-033', imageUrl: artwork(250) },
  { id: 'NBPM-034', pokemonName: 'Chansey',   pokemonNumber: 113, generation: 1, setCode: 'NBPM-034', imageUrl: artwork(113) },
  { id: 'NBPM-035', pokemonName: 'Magikarp',  pokemonNumber: 129, generation: 1, setCode: 'NBPM-035', imageUrl: artwork(129) },

  // ── NBPM-036: Pikachu Deluxe Edition (2018) ────────────────────────────────
  { id: 'NBPM-036', pokemonName: 'Pikachu (Deluxe)', pokemonNumber: 25, generation: 1, setCode: 'NBPM-036', imageUrl: artwork(25) },

  // ── NBPM-037 to NBPM-042: Pokémon Quest Edition (2018) ─────────────────────
  { id: 'NBPM-037', pokemonName: 'Pikachu (Pokémon Quest)',    pokemonNumber: 25,  generation: 1, setCode: 'NBPM-037', imageUrl: artwork(25)  },
  { id: 'NBPM-038', pokemonName: 'Charmander (Pokémon Quest)', pokemonNumber: 4,   generation: 1, setCode: 'NBPM-038', imageUrl: artwork(4)   },
  { id: 'NBPM-039', pokemonName: 'Bulbasaur (Pokémon Quest)',  pokemonNumber: 1,   generation: 1, setCode: 'NBPM-039', imageUrl: artwork(1)   },
  { id: 'NBPM-040', pokemonName: 'Squirtle (Pokémon Quest)',   pokemonNumber: 7,   generation: 1, setCode: 'NBPM-040', imageUrl: artwork(7)   },
  { id: 'NBPM-041', pokemonName: 'Eevee (Pokémon Quest)',      pokemonNumber: 133, generation: 1, setCode: 'NBPM-041', imageUrl: artwork(133) },
  { id: 'NBPM-042', pokemonName: 'Magikarp (Pokémon Quest)',   pokemonNumber: 129, generation: 1, setCode: 'NBPM-042', imageUrl: artwork(129) },

  // ── NBPM-043 to NBPM-048: Eeveelutions & Legendaries (2019) ────────────────
  { id: 'NBPM-043', pokemonName: 'Espeon',   pokemonNumber: 196, generation: 2, setCode: 'NBPM-043', imageUrl: artwork(196) },
  { id: 'NBPM-044', pokemonName: 'Umbreon',  pokemonNumber: 197, generation: 2, setCode: 'NBPM-044', imageUrl: artwork(197) },
  { id: 'NBPM-045', pokemonName: 'Mew',      pokemonNumber: 151, generation: 1, setCode: 'NBPM-045', imageUrl: artwork(151) },
  { id: 'NBPM-046', pokemonName: 'Zapdos',   pokemonNumber: 145, generation: 1, setCode: 'NBPM-046', imageUrl: artwork(145) },
  { id: 'NBPM-047', pokemonName: 'Moltres',  pokemonNumber: 146, generation: 1, setCode: 'NBPM-047', imageUrl: artwork(146) },
  { id: 'NBPM-048', pokemonName: 'Articuno', pokemonNumber: 144, generation: 1, setCode: 'NBPM-048', imageUrl: artwork(144) },

  // ── NBPM-049 to NBPM-051: Alola Starters re-release (Kawada, 2019) ─────────
  { id: 'NBPM-049', pokemonName: 'Litten (re-release)',  pokemonNumber: 725, generation: 7, setCode: 'NBPM-049', imageUrl: artwork(725) },
  { id: 'NBPM-050', pokemonName: 'Popplio (re-release)', pokemonNumber: 728, generation: 7, setCode: 'NBPM-050', imageUrl: artwork(728) },
  { id: 'NBPM-051', pokemonName: 'Rowlet (re-release)',  pokemonNumber: 722, generation: 7, setCode: 'NBPM-051', imageUrl: artwork(722) },

  // ── NBPM-052 to NBPM-056: Alola & Crystal Edition (2019-2020) ──────────────
  { id: 'NBPM-052', pokemonName: 'Mimikyu',            pokemonNumber: 778, generation: 7, setCode: 'NBPM-052', imageUrl: artwork(778) },
  { id: 'NBPM-053', pokemonName: 'Bewear',             pokemonNumber: 760, generation: 7, setCode: 'NBPM-053', imageUrl: artwork(760) },
  { id: 'NBPM-054', pokemonName: 'Celebi',             pokemonNumber: 251, generation: 2, setCode: 'NBPM-054', imageUrl: artwork(251) },
  { id: 'NBPM-055', pokemonName: 'Gyarados (Crystal)', pokemonNumber: 130, generation: 1, setCode: 'NBPM-055', imageUrl: artwork(130) },
  { id: 'NBPM-056', pokemonName: 'Lapras (Crystal)',   pokemonNumber: 131, generation: 1, setCode: 'NBPM-056', imageUrl: artwork(131) },

  // ── NBPM-057 to NBPM-058: Mega Charizard (2020) ────────────────────────────
  { id: 'NBPM-057', pokemonName: 'Charizard (Mega X)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-057', imageUrl: artwork(6) },
  { id: 'NBPM-058', pokemonName: 'Charizard (Mega Y)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-058', imageUrl: artwork(6) },

  // ── NBPM-059 to NBPM-061: Galar Starters (2020) ────────────────────────────
  { id: 'NBPM-059', pokemonName: 'Grookey',  pokemonNumber: 810, generation: 8, setCode: 'NBPM-059', imageUrl: artwork(810) },
  { id: 'NBPM-060', pokemonName: 'Scorbunny', pokemonNumber: 813, generation: 8, setCode: 'NBPM-060', imageUrl: artwork(813) },
  { id: 'NBPM-061', pokemonName: 'Sobble',   pokemonNumber: 816, generation: 8, setCode: 'NBPM-061', imageUrl: artwork(816) },

  // ── NBPM-062 to NBPM-064: Hoenn Weather Trio (2020) ────────────────────────
  { id: 'NBPM-062', pokemonName: 'Groudon',  pokemonNumber: 383, generation: 3, setCode: 'NBPM-062', imageUrl: artwork(383) },
  { id: 'NBPM-063', pokemonName: 'Kyogre',   pokemonNumber: 382, generation: 3, setCode: 'NBPM-063', imageUrl: artwork(382) },
  { id: 'NBPM-064', pokemonName: 'Rayquaza', pokemonNumber: 384, generation: 3, setCode: 'NBPM-064', imageUrl: artwork(384) },

  // ── NBPM-065 to NBPM-070: Galar Wave (2020-2021) ───────────────────────────
  { id: 'NBPM-065', pokemonName: 'Slowpoke',               pokemonNumber: 79,  generation: 1, setCode: 'NBPM-065', imageUrl: artwork(79)  },
  { id: 'NBPM-066', pokemonName: "Farfetch'd (Galarian)",  pokemonNumber: 83,  generation: 8, setCode: 'NBPM-066', imageUrl: artwork(83)  },
  { id: 'NBPM-067', pokemonName: 'Ponyta (Galarian)',      pokemonNumber: 77,  generation: 8, setCode: 'NBPM-067', imageUrl: artwork(77)  },
  { id: 'NBPM-068', pokemonName: 'Lucario',                pokemonNumber: 448, generation: 4, setCode: 'NBPM-068', imageUrl: artwork(448) },
  { id: 'NBPM-069', pokemonName: 'Yamper',                 pokemonNumber: 835, generation: 8, setCode: 'NBPM-069', imageUrl: artwork(835) },
  { id: 'NBPM-070', pokemonName: 'Greninja',               pokemonNumber: 658, generation: 6, setCode: 'NBPM-070', imageUrl: artwork(658) },

  // ── NBPM-071 to NBPM-073: Eeveelutions Wave 2 (2021) ──────────────────────
  { id: 'NBPM-071', pokemonName: 'Leafeon',  pokemonNumber: 470, generation: 4, setCode: 'NBPM-071', imageUrl: artwork(470) },
  { id: 'NBPM-072', pokemonName: 'Glaceon',  pokemonNumber: 471, generation: 4, setCode: 'NBPM-072', imageUrl: artwork(471) },
  { id: 'NBPM-073', pokemonName: 'Sylveon',  pokemonNumber: 700, generation: 6, setCode: 'NBPM-073', imageUrl: artwork(700) },

  // ── NBPM-074: Rayquaza Extreme DX (2020) ───────────────────────────────────
  { id: 'NBPM-074', pokemonName: 'Rayquaza (Extreme DX)', pokemonNumber: 384, generation: 3, setCode: 'NBPM-074', imageUrl: artwork(384) },

  // ── NBPM-075 to NBPM-076: Sinnoh & Galar (2021) ────────────────────────────
  { id: 'NBPM-075', pokemonName: 'Garchomp', pokemonNumber: 445, generation: 4, setCode: 'NBPM-075', imageUrl: artwork(445) },
  { id: 'NBPM-076', pokemonName: 'Kubfu',    pokemonNumber: 891, generation: 8, setCode: 'NBPM-076', imageUrl: artwork(891) },

  // ── NBPM-077 to NBPM-079: Sinnoh Starters (2021) ───────────────────────────
  { id: 'NBPM-077', pokemonName: 'Turtwig',  pokemonNumber: 387, generation: 4, setCode: 'NBPM-077', imageUrl: artwork(387) },
  { id: 'NBPM-078', pokemonName: 'Chimchar', pokemonNumber: 390, generation: 4, setCode: 'NBPM-078', imageUrl: artwork(390) },
  { id: 'NBPM-079', pokemonName: 'Piplup',   pokemonNumber: 393, generation: 4, setCode: 'NBPM-079', imageUrl: artwork(393) },

  // ── NBPM-080: Charizard Deluxe Edition (2021) ──────────────────────────────
  { id: 'NBPM-080', pokemonName: 'Charizard (Deluxe)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-080', imageUrl: artwork(6) },

  // ── NBPM-081: Pikachu Lunar New Year (2022) ────────────────────────────────
  { id: 'NBPM-081', pokemonName: 'Pikachu (Lunar New Year)', pokemonNumber: 25, generation: 1, setCode: 'NBPM-081', imageUrl: artwork(25) },

  // ── NBPM-082 to NBPM-088: Brilliant Shining Edition (2022) ─────────────────
  // Special color variants released alongside Pokémon Brilliant Diamond / Shining Pearl
  { id: 'NBPM-082', pokemonName: 'Lucario (Brilliant Shining)',  pokemonNumber: 448, generation: 4, setCode: 'NBPM-082', imageUrl: artwork(448) },
  { id: 'NBPM-083', pokemonName: 'Leafeon (Brilliant Shining)',  pokemonNumber: 470, generation: 4, setCode: 'NBPM-083', imageUrl: artwork(470) },
  { id: 'NBPM-084', pokemonName: 'Glaceon (Brilliant Shining)',  pokemonNumber: 471, generation: 4, setCode: 'NBPM-084', imageUrl: artwork(471) },
  { id: 'NBPM-085', pokemonName: 'Garchomp (Brilliant Shining)', pokemonNumber: 445, generation: 4, setCode: 'NBPM-085', imageUrl: artwork(445) },
  { id: 'NBPM-086', pokemonName: 'Turtwig (Brilliant Shining)',  pokemonNumber: 387, generation: 4, setCode: 'NBPM-086', imageUrl: artwork(387) },
  { id: 'NBPM-087', pokemonName: 'Chimchar (Brilliant Shining)', pokemonNumber: 390, generation: 4, setCode: 'NBPM-087', imageUrl: artwork(390) },
  { id: 'NBPM-088', pokemonName: 'Piplup (Brilliant Shining)',   pokemonNumber: 393, generation: 4, setCode: 'NBPM-088', imageUrl: artwork(393) },

  // ── NBPM-089 to NBPM-091: Johto Beasts (2022) ──────────────────────────────
  { id: 'NBPM-089', pokemonName: 'Raikou',  pokemonNumber: 243, generation: 2, setCode: 'NBPM-089', imageUrl: artwork(243) },
  { id: 'NBPM-090', pokemonName: 'Entei',   pokemonNumber: 244, generation: 2, setCode: 'NBPM-090', imageUrl: artwork(244) },
  { id: 'NBPM-091', pokemonName: 'Suicune', pokemonNumber: 245, generation: 2, setCode: 'NBPM-091', imageUrl: artwork(245) },

  // ── NBPM-092 to NBPM-093: Mega Kanto Starters (2022) ──────────────────────
  { id: 'NBPM-092', pokemonName: 'Venusaur (Mega)',  pokemonNumber: 3, generation: 1, setCode: 'NBPM-092', imageUrl: artwork(3) },
  { id: 'NBPM-093', pokemonName: 'Blastoise (Mega)', pokemonNumber: 9, generation: 1, setCode: 'NBPM-093', imageUrl: artwork(9) },

  // ── NBPM-094 to NBPM-095: Sinnoh Legendaries Deluxe (2022) ─────────────────
  { id: 'NBPM-094', pokemonName: 'Dialga (Deluxe)', pokemonNumber: 483, generation: 4, setCode: 'NBPM-094', imageUrl: artwork(483) },
  { id: 'NBPM-095', pokemonName: 'Palkia (Deluxe)', pokemonNumber: 484, generation: 4, setCode: 'NBPM-095', imageUrl: artwork(484) },

  // ── NBPM-096 to NBPM-100: Hoenn Wave (2023) ────────────────────────────────
  { id: 'NBPM-096', pokemonName: 'Gardevoir',  pokemonNumber: 282, generation: 3, setCode: 'NBPM-096', imageUrl: artwork(282) },
  { id: 'NBPM-097', pokemonName: 'Milotic',    pokemonNumber: 350, generation: 3, setCode: 'NBPM-097', imageUrl: artwork(350) },
  { id: 'NBPM-098', pokemonName: 'Metagross',  pokemonNumber: 376, generation: 3, setCode: 'NBPM-098', imageUrl: artwork(376) },
  { id: 'NBPM-099', pokemonName: 'Tyranitar',  pokemonNumber: 248, generation: 2, setCode: 'NBPM-099', imageUrl: artwork(248) },
  { id: 'NBPM-100', pokemonName: 'Salamence',  pokemonNumber: 373, generation: 3, setCode: 'NBPM-100', imageUrl: artwork(373) },

  // ── NBPM-101: Mewtwo Deluxe Edition (2023) ─────────────────────────────────
  { id: 'NBPM-101', pokemonName: 'Mewtwo (Deluxe)', pokemonNumber: 150, generation: 1, setCode: 'NBPM-101', imageUrl: artwork(150) },

  // ── NBPM-102 to NBPM-104: Paldea Legendaries DX & Black Rayquaza (2024) ────
  { id: 'NBPM-102', pokemonName: 'Koraidon (Deluxe)',       pokemonNumber: 1007, generation: 9, setCode: 'NBPM-102', imageUrl: artwork(1007) },
  { id: 'NBPM-103', pokemonName: 'Miraidon (Deluxe)',       pokemonNumber: 1008, generation: 9, setCode: 'NBPM-103', imageUrl: artwork(1008) },
  { id: 'NBPM-104', pokemonName: 'Rayquaza (Black DX)',     pokemonNumber: 384,  generation: 3, setCode: 'NBPM-104', imageUrl: artwork(384)  },

  // ── NBPM-105 to NBPM-106: Kanto Wave (2024) ────────────────────────────────
  { id: 'NBPM-105', pokemonName: 'Raichu',   pokemonNumber: 26,  generation: 1, setCode: 'NBPM-105', imageUrl: artwork(26)  },
  { id: 'NBPM-106', pokemonName: 'Arcanine', pokemonNumber: 59,  generation: 1, setCode: 'NBPM-106', imageUrl: artwork(59)  },

  // ── NBPM-107 to NBPM-109: Johto Beasts Deluxe Edition (2025) ───────────────
  { id: 'NBPM-107', pokemonName: 'Raikou (Deluxe)',  pokemonNumber: 243, generation: 2, setCode: 'NBPM-107', imageUrl: artwork(243) },
  { id: 'NBPM-108', pokemonName: 'Entei (Deluxe)',   pokemonNumber: 244, generation: 2, setCode: 'NBPM-108', imageUrl: artwork(244) },
  { id: 'NBPM-109', pokemonName: 'Suicune (Deluxe)', pokemonNumber: 245, generation: 2, setCode: 'NBPM-109', imageUrl: artwork(245) },

  // ── NBPM-110 to NBPM-111: Kanto Wave 2 (2025) ──────────────────────────────
  { id: 'NBPM-110', pokemonName: 'Jigglypuff', pokemonNumber: 39, generation: 1, setCode: 'NBPM-110', imageUrl: artwork(39)  },
  { id: 'NBPM-111', pokemonName: 'Machamp',    pokemonNumber: 68, generation: 1, setCode: 'NBPM-111', imageUrl: artwork(68)  },

  // ── RS Series (Round Style — new diagonal/curved piece format, 2024-2026) ───
  // Paldea Starters Wave (July 2024)
  { id: 'NBPM-R01', pokemonName: 'Sprigatito (RS)', pokemonNumber: 906, generation: 9, setCode: 'NBPM-R01', imageUrl: artwork(906) },
  { id: 'NBPM-R02', pokemonName: 'Fuecoco (RS)',    pokemonNumber: 909, generation: 9, setCode: 'NBPM-R02', imageUrl: artwork(909) },
  { id: 'NBPM-R03', pokemonName: 'Quaxly (RS)',     pokemonNumber: 912, generation: 9, setCode: 'NBPM-R03', imageUrl: artwork(912) },
  // Paldea Wave 2 (September 2024)
  { id: 'NBPM-R04', pokemonName: 'Armarouge (RS)',  pokemonNumber: 936, generation: 9, setCode: 'NBPM-R04', imageUrl: artwork(936) },
  { id: 'NBPM-R05', pokemonName: 'Ceruledge (RS)',  pokemonNumber: 937, generation: 9, setCode: 'NBPM-R05', imageUrl: artwork(937) },
  { id: 'NBPM-R06', pokemonName: 'Tinkaton (RS)',   pokemonNumber: 959, generation: 9, setCode: 'NBPM-R06', imageUrl: artwork(959) },
  // Paldea Wave 3 (January 2025)
  { id: 'NBPM-R07', pokemonName: 'Pawmi (RS)',      pokemonNumber: 921, generation: 9, setCode: 'NBPM-R07', imageUrl: artwork(921) },
  { id: 'NBPM-R08', pokemonName: 'Tandemaus (RS)',  pokemonNumber: 924, generation: 9, setCode: 'NBPM-R08', imageUrl: artwork(924) },
  { id: 'NBPM-R09', pokemonName: 'Clodsire (RS)',   pokemonNumber: 980, generation: 9, setCode: 'NBPM-R09', imageUrl: artwork(980) },
  // RS Mega Wave (October 2025)
  { id: 'NBPM-R10', pokemonName: 'Gengar (Mega RS)',       pokemonNumber: 94,  generation: 1, setCode: 'NBPM-R10', imageUrl: artwork(94)  },
  { id: 'NBPM-R11', pokemonName: 'Lucario (Mega RS)',      pokemonNumber: 448, generation: 4, setCode: 'NBPM-R11', imageUrl: artwork(448) },
  // RS Mega Wave 2 (January 2026)
  { id: 'NBPM-R12', pokemonName: 'Charizard (Mega X RS)',  pokemonNumber: 6,   generation: 1, setCode: 'NBPM-R12', imageUrl: artwork(6)   },
  { id: 'NBPM-R13', pokemonName: 'Charizard (Mega Y RS)',  pokemonNumber: 6,   generation: 1, setCode: 'NBPM-R13', imageUrl: artwork(6)   },
]
