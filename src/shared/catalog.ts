import type { NanoblockSet } from './types'

// Merlinsbricks (Diamond Blocks) CDN — main source for standard retail sets.
// Pattern: https://cdn.merlinsbricks.com/images/{CODE}/main/{CODE}.webp
// SetCard.tsx onError fallback fires for any 404, showing PokéAPI artwork instead.
const nbImage = (code: string) =>
  `https://cdn.merlinsbricks.com/images/${code}/main/${code}.webp`

// Kawada official catalog — 1400×1400 product photos, used for RS series.
// Pattern: wp-content/uploads/{YYYY}/{MM}/{JAN}-1400x1400.jpg
const kawada = (path: string) =>
  `https://www.kawada-toys.com/wp-content/uploads/${path}-1400x1400.jpg`

// Complete catalog of all known Pokémon Nanoblock (NBPM) sets as of mid-2025.
// Sources: Bulbapedia, Shy Gal's Building Blog, Kawada official catalog, retailer listings.
// Multiple sets may share the same pokemonNumber — the id (NBPM code) is the unique key.
export const CATALOG: NanoblockSet[] = [

  // ── NBPM-001 to NBPM-013: Wave 1 (2013-2015) ───────────────────────────────
  { id: 'NBPM-001', pokemonName: 'Pikachu',              pokemonNumber: 25,   generation: 1, setCode: 'NBPM-001', imageUrl: nbImage('NBPM-001') },
  { id: 'NBPM-002', pokemonName: 'Charmander',           pokemonNumber: 4,    generation: 1, setCode: 'NBPM-002', imageUrl: nbImage('NBPM-002') },
  { id: 'NBPM-003', pokemonName: 'Bulbasaur',            pokemonNumber: 1,    generation: 1, setCode: 'NBPM-003', imageUrl: nbImage('NBPM-003') },
  { id: 'NBPM-004', pokemonName: 'Squirtle',             pokemonNumber: 7,    generation: 1, setCode: 'NBPM-004', imageUrl: nbImage('NBPM-004') },
  { id: 'NBPM-005', pokemonName: 'Eevee',                pokemonNumber: 133,  generation: 1, setCode: 'NBPM-005', imageUrl: nbImage('NBPM-005') },
  { id: 'NBPM-006', pokemonName: 'Mewtwo',               pokemonNumber: 150,  generation: 1, setCode: 'NBPM-006', imageUrl: nbImage('NBPM-006') },
  { id: 'NBPM-007', pokemonName: 'Gengar',               pokemonNumber: 94,   generation: 1, setCode: 'NBPM-007', imageUrl: nbImage('NBPM-007') },
  { id: 'NBPM-008', pokemonName: 'Charizard',            pokemonNumber: 6,    generation: 1, setCode: 'NBPM-008', imageUrl: nbImage('NBPM-008') },
  { id: 'NBPM-009', pokemonName: 'Lapras',               pokemonNumber: 131,  generation: 1, setCode: 'NBPM-009', imageUrl: nbImage('NBPM-009') },
  { id: 'NBPM-010', pokemonName: 'Caterpie & Poké Ball', pokemonNumber: 10,   generation: 1, setCode: 'NBPM-010', imageUrl: nbImage('NBPM-010') },
  { id: 'NBPM-011', pokemonName: 'Dragonite',            pokemonNumber: 149,  generation: 1, setCode: 'NBPM-011', imageUrl: nbImage('NBPM-011') },
  { id: 'NBPM-012', pokemonName: 'Snorlax',              pokemonNumber: 143,  generation: 1, setCode: 'NBPM-012', imageUrl: nbImage('NBPM-012') },
  { id: 'NBPM-013', pokemonName: "Farfetch'd",           pokemonNumber: 83,   generation: 1, setCode: 'NBPM-013', imageUrl: nbImage('NBPM-013') },

  // ── NBPM-014 to NBPM-017: 20th Anniversary Monotone Edition (2016) ─────────
  // nanoblock.com.sg Shopify CDN — direct HTTPS, CDN allows cross-origin (no CORP header).
  { id: 'NBPM-014', pokemonName: 'Pikachu (20th Anniversary)',    pokemonNumber: 25, generation: 1, setCode: 'NBPM-014', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nbpm_014_pikachu_monotone_large.jpg' },
  { id: 'NBPM-015', pokemonName: 'Charmander (20th Anniversary)', pokemonNumber: 4,  generation: 1, setCode: 'NBPM-015', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nbpm_015_charmander_monotone_large.jpg' },
  { id: 'NBPM-016', pokemonName: 'Bulbasaur (20th Anniversary)',  pokemonNumber: 1,  generation: 1, setCode: 'NBPM-016', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nbpm_016_bulbasaur_monotone_large.jpg' },
  { id: 'NBPM-017', pokemonName: 'Squirtle (20th Anniversary)',   pokemonNumber: 7,  generation: 1, setCode: 'NBPM-017', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nbpm_017_squirtle_monotone_large.jpg' },

  // ── NBPM-018 to NBPM-024: Wave 2 (2016-2017) ───────────────────────────────
  { id: 'NBPM-018', pokemonName: 'Venusaur',    pokemonNumber: 3,   generation: 1, setCode: 'NBPM-018', imageUrl: nbImage('NBPM-018') },
  { id: 'NBPM-019', pokemonName: 'Blastoise',   pokemonNumber: 9,   generation: 1, setCode: 'NBPM-019', imageUrl: nbImage('NBPM-019') },
  { id: 'NBPM-020', pokemonName: 'Vaporeon',    pokemonNumber: 134, generation: 1, setCode: 'NBPM-020', imageUrl: nbImage('NBPM-020') },
  { id: 'NBPM-021', pokemonName: 'Jolteon',     pokemonNumber: 135, generation: 1, setCode: 'NBPM-021', imageUrl: nbImage('NBPM-021') },
  { id: 'NBPM-022', pokemonName: 'Flareon',     pokemonNumber: 136, generation: 1, setCode: 'NBPM-022', imageUrl: nbImage('NBPM-022') },
  { id: 'NBPM-023', pokemonName: 'Gyarados',    pokemonNumber: 130, generation: 1, setCode: 'NBPM-023', imageUrl: nbImage('NBPM-023') },
  { id: 'NBPM-024', pokemonName: 'Psyduck',     pokemonNumber: 54,  generation: 1, setCode: 'NBPM-024', imageUrl: nbImage('NBPM-024') },

  // ── NBPM-025 to NBPM-027: Alola Starters (Pokémon Center JP exclusive) ─────
  // Merlinsbricks 404. Bulbapedia 403 in Electron (Cloudflare blocks Chrome-like UA).
  // CDN URL pattern used (nbImage) — renderer falls back to PokéAPI artwork on 404.
  { id: 'NBPM-025', pokemonName: 'Litten',  pokemonNumber: 725, generation: 7, setCode: 'NBPM-025', imageUrl: nbImage('NBPM-025') },
  { id: 'NBPM-026', pokemonName: 'Popplio', pokemonNumber: 728, generation: 7, setCode: 'NBPM-026', imageUrl: nbImage('NBPM-026') },
  { id: 'NBPM-027', pokemonName: 'Rowlet',  pokemonNumber: 722, generation: 7, setCode: 'NBPM-027', imageUrl: nbImage('NBPM-027') },

  // ── NBPM-028 to NBPM-035: Gen II Wave (2017-2018) ──────────────────────────
  { id: 'NBPM-028', pokemonName: 'Pichu',     pokemonNumber: 172, generation: 2, setCode: 'NBPM-028', imageUrl: nbImage('NBPM-028') },
  { id: 'NBPM-029', pokemonName: 'Cyndaquil', pokemonNumber: 155, generation: 2, setCode: 'NBPM-029', imageUrl: nbImage('NBPM-029') },
  { id: 'NBPM-030', pokemonName: 'Chikorita', pokemonNumber: 152, generation: 2, setCode: 'NBPM-030', imageUrl: nbImage('NBPM-030') },
  { id: 'NBPM-031', pokemonName: 'Totodile',  pokemonNumber: 158, generation: 2, setCode: 'NBPM-031', imageUrl: nbImage('NBPM-031') },
  { id: 'NBPM-032', pokemonName: 'Lugia',     pokemonNumber: 249, generation: 2, setCode: 'NBPM-032', imageUrl: nbImage('NBPM-032') },
  { id: 'NBPM-033', pokemonName: 'Ho-Oh',     pokemonNumber: 250, generation: 2, setCode: 'NBPM-033', imageUrl: nbImage('NBPM-033') },
  { id: 'NBPM-034', pokemonName: 'Chansey',   pokemonNumber: 113, generation: 1, setCode: 'NBPM-034', imageUrl: nbImage('NBPM-034') },
  { id: 'NBPM-035', pokemonName: 'Magikarp',  pokemonNumber: 129, generation: 1, setCode: 'NBPM-035', imageUrl: nbImage('NBPM-035') },

  // ── NBPM-036: Pikachu Deluxe Edition (2018) ────────────────────────────────
  { id: 'NBPM-036', pokemonName: 'Pikachu (Deluxe)', pokemonNumber: 25, generation: 1, setCode: 'NBPM-036', imageUrl: nbImage('NBPM-036') },

  // ── NBPM-037 to NBPM-042: Pokémon Quest Edition (2018) ─────────────────────
  // Cube-art style sets — HLJ blocks hotlinking; photos from PlazaJapan BigCommerce CDN & japan-figure.com.
  // PlazaJapan BigCommerce CDN (access-control-allow-origin: *) and japan-figure Shopify CDN.
  { id: 'NBPM-037', pokemonName: 'Pikachu (Pokémon Quest)',    pokemonNumber: 25,  generation: 1, setCode: 'NBPM-037', imageUrl: 'https://cdn11.bigcommerce.com/s-89ffd/products/49083/images/166614/Kawada_NBPM-037__09271.1541486377.350.350.jpg?c=2' },
  { id: 'NBPM-038', pokemonName: 'Charmander (Pokémon Quest)', pokemonNumber: 4,   generation: 1, setCode: 'NBPM-038', imageUrl: 'https://cdn11.bigcommerce.com/s-89ffd/images/stencil/728x728/products/49082/166616/pb-1__53560.1541486578.jpg?c=2' },
  { id: 'NBPM-039', pokemonName: 'Bulbasaur (Pokémon Quest)',  pokemonNumber: 1,   generation: 1, setCode: 'NBPM-039', imageUrl: 'https://cdn11.bigcommerce.com/s-89ffd/images/stencil/728x728/products/49081/166617/pb-3__53193.1541486787.jpg?c=2' },
  { id: 'NBPM-040', pokemonName: 'Squirtle (Pokémon Quest)',   pokemonNumber: 7,   generation: 1, setCode: 'NBPM-040', imageUrl: 'https://cdn11.bigcommerce.com/s-89ffd/images/stencil/1280x1280/products/49080/166619/pb-5__63077.1541486953.jpg?c=2' },
  { id: 'NBPM-041', pokemonName: 'Eevee (Pokémon Quest)',      pokemonNumber: 133, generation: 1, setCode: 'NBPM-041', imageUrl: 'https://cdn11.bigcommerce.com/s-89ffd/images/stencil/728x728/products/49079/166622/pb-9__69538.1541487061.jpg?c=2' },
  { id: 'NBPM-042', pokemonName: 'Magikarp (Pokémon Quest)',   pokemonNumber: 129, generation: 1, setCode: 'NBPM-042', imageUrl: 'https://japan-figure.com/cdn/shop/products/Nanoblock-Pokemon-Quest-Magikarp-Nbpm042-Japan-Figure-4972825211977-0.jpg?v=1661082884&width=1500' },

  // ── NBPM-043 to NBPM-048: Eeveelutions & Legendaries (2019) ────────────────
  { id: 'NBPM-043', pokemonName: 'Espeon',   pokemonNumber: 196, generation: 2, setCode: 'NBPM-043', imageUrl: nbImage('NBPM-043') },
  { id: 'NBPM-044', pokemonName: 'Umbreon',  pokemonNumber: 197, generation: 2, setCode: 'NBPM-044', imageUrl: nbImage('NBPM-044') },
  { id: 'NBPM-045', pokemonName: 'Mew',      pokemonNumber: 151, generation: 1, setCode: 'NBPM-045', imageUrl: nbImage('NBPM-045') },
  { id: 'NBPM-046', pokemonName: 'Zapdos',   pokemonNumber: 145, generation: 1, setCode: 'NBPM-046', imageUrl: nbImage('NBPM-046') },
  { id: 'NBPM-047', pokemonName: 'Moltres',  pokemonNumber: 146, generation: 1, setCode: 'NBPM-047', imageUrl: nbImage('NBPM-047') },
  { id: 'NBPM-048', pokemonName: 'Articuno', pokemonNumber: 144, generation: 1, setCode: 'NBPM-048', imageUrl: nbImage('NBPM-048') },

  // ── NBPM-049 to NBPM-051: Alola Starters re-release (Kawada, 2019) ─────────
  { id: 'NBPM-049', pokemonName: 'Litten (re-release)',  pokemonNumber: 725, generation: 7, setCode: 'NBPM-049', imageUrl: nbImage('NBPM-049') },
  { id: 'NBPM-050', pokemonName: 'Popplio (re-release)', pokemonNumber: 728, generation: 7, setCode: 'NBPM-050', imageUrl: nbImage('NBPM-050') },
  { id: 'NBPM-051', pokemonName: 'Rowlet (re-release)',  pokemonNumber: 722, generation: 7, setCode: 'NBPM-051', imageUrl: nbImage('NBPM-051') },

  // ── NBPM-052 to NBPM-056: Alola & Crystal Edition (2019-2020) ──────────────
  // NBPM-054/055/056 are Pokémon Center Singapore exclusives; official nanoblock.com.sg Shopify CDN.
  { id: 'NBPM-052', pokemonName: 'Mimikyu',            pokemonNumber: 778, generation: 7, setCode: 'NBPM-052', imageUrl: nbImage('NBPM-052') },
  { id: 'NBPM-053', pokemonName: 'Bewear',             pokemonNumber: 760, generation: 7, setCode: 'NBPM-053', imageUrl: nbImage('NBPM-053') },
  { id: 'NBPM-054', pokemonName: 'Celebi',             pokemonNumber: 251, generation: 2, setCode: 'NBPM-054', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nanoblock_celebi_nbpm_054_large.jpg' },
  { id: 'NBPM-055', pokemonName: 'Gyarados (Crystal)', pokemonNumber: 130, generation: 1, setCode: 'NBPM-055', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nanoblock_gyarados_nbpm_055_large.jpg' },
  { id: 'NBPM-056', pokemonName: 'Lapras (Crystal)',   pokemonNumber: 131, generation: 1, setCode: 'NBPM-056', imageUrl: 'https://www.nanoblock.com.sg/cdn/shop/products/nanoblock_laplace_nbpm_056_large.jpg' },

  // ── NBPM-057 to NBPM-058: Mega Charizard (2020) ────────────────────────────
  { id: 'NBPM-057', pokemonName: 'Charizard (Mega X)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-057', imageUrl: nbImage('NBPM-057') },
  { id: 'NBPM-058', pokemonName: 'Charizard (Mega Y)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-058', imageUrl: nbImage('NBPM-058') },

  // ── NBPM-059 to NBPM-061: Galar Starters (2020) ────────────────────────────
  { id: 'NBPM-059', pokemonName: 'Grookey',   pokemonNumber: 810, generation: 8, setCode: 'NBPM-059', imageUrl: nbImage('NBPM-059') },
  { id: 'NBPM-060', pokemonName: 'Scorbunny', pokemonNumber: 813, generation: 8, setCode: 'NBPM-060', imageUrl: nbImage('NBPM-060') },
  { id: 'NBPM-061', pokemonName: 'Sobble',    pokemonNumber: 816, generation: 8, setCode: 'NBPM-061', imageUrl: nbImage('NBPM-061') },

  // ── NBPM-062 to NBPM-064: Hoenn Weather Trio (2020) ────────────────────────
  { id: 'NBPM-062', pokemonName: 'Groudon',  pokemonNumber: 383, generation: 3, setCode: 'NBPM-062', imageUrl: nbImage('NBPM-062') },
  { id: 'NBPM-063', pokemonName: 'Kyogre',   pokemonNumber: 382, generation: 3, setCode: 'NBPM-063', imageUrl: nbImage('NBPM-063') },
  { id: 'NBPM-064', pokemonName: 'Rayquaza', pokemonNumber: 384, generation: 3, setCode: 'NBPM-064', imageUrl: nbImage('NBPM-064') },

  // ── NBPM-065 to NBPM-070: Galar Wave (2020-2021) ───────────────────────────
  { id: 'NBPM-065', pokemonName: 'Slowpoke',              pokemonNumber: 79,  generation: 1, setCode: 'NBPM-065', imageUrl: nbImage('NBPM-065') },
  { id: 'NBPM-066', pokemonName: "Farfetch'd (Galarian)", pokemonNumber: 83,  generation: 8, setCode: 'NBPM-066', imageUrl: nbImage('NBPM-066') },
  { id: 'NBPM-067', pokemonName: 'Ponyta (Galarian)',     pokemonNumber: 77,  generation: 8, setCode: 'NBPM-067', imageUrl: nbImage('NBPM-067') },
  { id: 'NBPM-068', pokemonName: 'Lucario',               pokemonNumber: 448, generation: 4, setCode: 'NBPM-068', imageUrl: nbImage('NBPM-068') },
  { id: 'NBPM-069', pokemonName: 'Yamper',                pokemonNumber: 835, generation: 8, setCode: 'NBPM-069', imageUrl: nbImage('NBPM-069') },
  { id: 'NBPM-070', pokemonName: 'Greninja',              pokemonNumber: 658, generation: 6, setCode: 'NBPM-070', imageUrl: nbImage('NBPM-070') },

  // ── NBPM-071 to NBPM-073: Eeveelutions Wave 2 (2021) ──────────────────────
  { id: 'NBPM-071', pokemonName: 'Leafeon', pokemonNumber: 470, generation: 4, setCode: 'NBPM-071', imageUrl: nbImage('NBPM-071') },
  { id: 'NBPM-072', pokemonName: 'Glaceon', pokemonNumber: 471, generation: 4, setCode: 'NBPM-072', imageUrl: nbImage('NBPM-072') },
  { id: 'NBPM-073', pokemonName: 'Sylveon', pokemonNumber: 700, generation: 6, setCode: 'NBPM-073', imageUrl: nbImage('NBPM-073') },

  // ── NBPM-074: Rayquaza Extreme DX (2020) ───────────────────────────────────
  { id: 'NBPM-074', pokemonName: 'Rayquaza (Extreme DX)', pokemonNumber: 384, generation: 3, setCode: 'NBPM-074', imageUrl: nbImage('NBPM-074') },

  // ── NBPM-075 to NBPM-076: Sinnoh & Galar (2021) ────────────────────────────
  { id: 'NBPM-075', pokemonName: 'Garchomp', pokemonNumber: 445, generation: 4, setCode: 'NBPM-075', imageUrl: nbImage('NBPM-075') },
  { id: 'NBPM-076', pokemonName: 'Kubfu',    pokemonNumber: 891, generation: 8, setCode: 'NBPM-076', imageUrl: nbImage('NBPM-076') },

  // ── NBPM-077 to NBPM-079: Sinnoh Starters (2021) ───────────────────────────
  { id: 'NBPM-077', pokemonName: 'Turtwig',  pokemonNumber: 387, generation: 4, setCode: 'NBPM-077', imageUrl: nbImage('NBPM-077') },
  { id: 'NBPM-078', pokemonName: 'Chimchar', pokemonNumber: 390, generation: 4, setCode: 'NBPM-078', imageUrl: nbImage('NBPM-078') },
  { id: 'NBPM-079', pokemonName: 'Piplup',   pokemonNumber: 393, generation: 4, setCode: 'NBPM-079', imageUrl: nbImage('NBPM-079') },

  // ── NBPM-080: Charizard Deluxe Edition (2021) ──────────────────────────────
  { id: 'NBPM-080', pokemonName: 'Charizard (Deluxe)', pokemonNumber: 6, generation: 1, setCode: 'NBPM-080', imageUrl: nbImage('NBPM-080') },

  // ── NBPM-081: Pikachu Lunar New Year (2022) ────────────────────────────────
  // Confirmed 404 on Merlinsbricks; product photo sourced from Bombuyman.
  { id: 'NBPM-081', pokemonName: 'Pikachu (Lunar New Year)', pokemonNumber: 25, generation: 1, setCode: 'NBPM-081', imageUrl: 'https://www.bombuyman.com/c/image/600/gallery/9711/1.jpg' },

  // ── NBPM-082 to NBPM-088: Brilliant Shining Edition (2022) ─────────────────
  { id: 'NBPM-082', pokemonName: 'Lucario (Brilliant Shining)',  pokemonNumber: 448, generation: 4, setCode: 'NBPM-082', imageUrl: nbImage('NBPM-082') },
  { id: 'NBPM-083', pokemonName: 'Leafeon (Brilliant Shining)',  pokemonNumber: 470, generation: 4, setCode: 'NBPM-083', imageUrl: nbImage('NBPM-083') },
  { id: 'NBPM-084', pokemonName: 'Glaceon (Brilliant Shining)',  pokemonNumber: 471, generation: 4, setCode: 'NBPM-084', imageUrl: nbImage('NBPM-084') },
  { id: 'NBPM-085', pokemonName: 'Garchomp (Brilliant Shining)', pokemonNumber: 445, generation: 4, setCode: 'NBPM-085', imageUrl: nbImage('NBPM-085') },
  { id: 'NBPM-086', pokemonName: 'Turtwig (Brilliant Shining)',  pokemonNumber: 387, generation: 4, setCode: 'NBPM-086', imageUrl: nbImage('NBPM-086') },
  { id: 'NBPM-087', pokemonName: 'Chimchar (Brilliant Shining)', pokemonNumber: 390, generation: 4, setCode: 'NBPM-087', imageUrl: nbImage('NBPM-087') },
  { id: 'NBPM-088', pokemonName: 'Piplup (Brilliant Shining)',   pokemonNumber: 393, generation: 4, setCode: 'NBPM-088', imageUrl: nbImage('NBPM-088') },

  // ── NBPM-089 to NBPM-091: Johto Beasts (2022) ──────────────────────────────
  { id: 'NBPM-089', pokemonName: 'Raikou',  pokemonNumber: 243, generation: 2, setCode: 'NBPM-089', imageUrl: nbImage('NBPM-089') },
  { id: 'NBPM-090', pokemonName: 'Entei',   pokemonNumber: 244, generation: 2, setCode: 'NBPM-090', imageUrl: nbImage('NBPM-090') },
  { id: 'NBPM-091', pokemonName: 'Suicune', pokemonNumber: 245, generation: 2, setCode: 'NBPM-091', imageUrl: nbImage('NBPM-091') },

  // ── NBPM-092 to NBPM-093: Mega Kanto Starters (2022) ──────────────────────
  { id: 'NBPM-092', pokemonName: 'Venusaur (Mega)',  pokemonNumber: 3, generation: 1, setCode: 'NBPM-092', imageUrl: nbImage('NBPM-092') },
  { id: 'NBPM-093', pokemonName: 'Blastoise (Mega)', pokemonNumber: 9, generation: 1, setCode: 'NBPM-093', imageUrl: nbImage('NBPM-093') },

  // ── NBPM-094 to NBPM-095: Sinnoh Legendaries Deluxe (2022) ─────────────────
  { id: 'NBPM-094', pokemonName: 'Dialga (Deluxe)', pokemonNumber: 483, generation: 4, setCode: 'NBPM-094', imageUrl: nbImage('NBPM-094') },
  { id: 'NBPM-095', pokemonName: 'Palkia (Deluxe)', pokemonNumber: 484, generation: 4, setCode: 'NBPM-095', imageUrl: nbImage('NBPM-095') },

  // ── NBPM-096 to NBPM-100: Hoenn Wave (2023) ────────────────────────────────
  { id: 'NBPM-096', pokemonName: 'Gardevoir', pokemonNumber: 282, generation: 3, setCode: 'NBPM-096', imageUrl: nbImage('NBPM-096') },
  { id: 'NBPM-097', pokemonName: 'Milotic',   pokemonNumber: 350, generation: 3, setCode: 'NBPM-097', imageUrl: nbImage('NBPM-097') },
  { id: 'NBPM-098', pokemonName: 'Metagross', pokemonNumber: 376, generation: 3, setCode: 'NBPM-098', imageUrl: nbImage('NBPM-098') },
  { id: 'NBPM-099', pokemonName: 'Tyranitar', pokemonNumber: 248, generation: 2, setCode: 'NBPM-099', imageUrl: nbImage('NBPM-099') },
  { id: 'NBPM-100', pokemonName: 'Salamence', pokemonNumber: 373, generation: 3, setCode: 'NBPM-100', imageUrl: nbImage('NBPM-100') },

  // ── NBPM-101: Mewtwo Deluxe Edition (2023) ─────────────────────────────────
  { id: 'NBPM-101', pokemonName: 'Mewtwo (Deluxe)', pokemonNumber: 150, generation: 1, setCode: 'NBPM-101', imageUrl: nbImage('NBPM-101') },

  // ── NBPM-102 to NBPM-104: Paldea Legendaries DX & Black Rayquaza (2024) ────
  { id: 'NBPM-102', pokemonName: 'Koraidon (Deluxe)',   pokemonNumber: 1007, generation: 9, setCode: 'NBPM-102', imageUrl: nbImage('NBPM-102') },
  { id: 'NBPM-103', pokemonName: 'Miraidon (Deluxe)',   pokemonNumber: 1008, generation: 9, setCode: 'NBPM-103', imageUrl: nbImage('NBPM-103') },
  { id: 'NBPM-104', pokemonName: 'Rayquaza (Black DX)', pokemonNumber: 384,  generation: 3, setCode: 'NBPM-104', imageUrl: nbImage('NBPM-104') },

  // ── NBPM-105 to NBPM-106: Kanto Wave (2024) ────────────────────────────────
  { id: 'NBPM-105', pokemonName: 'Raichu',   pokemonNumber: 26, generation: 1, setCode: 'NBPM-105', imageUrl: nbImage('NBPM-105') },
  { id: 'NBPM-106', pokemonName: 'Arcanine', pokemonNumber: 59, generation: 1, setCode: 'NBPM-106', imageUrl: nbImage('NBPM-106') },

  // ── NBPM-107 to NBPM-109: Johto Beasts Deluxe Edition (2025) ───────────────
  { id: 'NBPM-107', pokemonName: 'Raikou (Deluxe)',  pokemonNumber: 243, generation: 2, setCode: 'NBPM-107', imageUrl: nbImage('NBPM-107') },
  { id: 'NBPM-108', pokemonName: 'Entei (Deluxe)',   pokemonNumber: 244, generation: 2, setCode: 'NBPM-108', imageUrl: nbImage('NBPM-108') },
  { id: 'NBPM-109', pokemonName: 'Suicune (Deluxe)', pokemonNumber: 245, generation: 2, setCode: 'NBPM-109', imageUrl: nbImage('NBPM-109') },

  // ── NBPM-110 to NBPM-111: Kanto Wave 2 (2025) ──────────────────────────────
  { id: 'NBPM-110', pokemonName: 'Jigglypuff', pokemonNumber: 39, generation: 1, setCode: 'NBPM-110', imageUrl: nbImage('NBPM-110') },
  { id: 'NBPM-111', pokemonName: 'Machamp',    pokemonNumber: 68, generation: 1, setCode: 'NBPM-111', imageUrl: nbImage('NBPM-111') },

  // ── RS Series (Round Style — new diagonal/curved piece format, 2024-2026) ───
  // Merlinsbricks doesn't carry the RS series — product photos from Kawada official catalog.
  // Paldea Starters Wave (July 2024)
  { id: 'NBPM-R01', pokemonName: 'Sprigatito (RS)', pokemonNumber: 906, generation: 9, setCode: 'NBPM-R01', imageUrl: kawada('2024/03/4972825224540') },
  { id: 'NBPM-R02', pokemonName: 'Fuecoco (RS)',    pokemonNumber: 909, generation: 9, setCode: 'NBPM-R02', imageUrl: kawada('2024/03/4972825224557') },
  { id: 'NBPM-R03', pokemonName: 'Quaxly (RS)',     pokemonNumber: 912, generation: 9, setCode: 'NBPM-R03', imageUrl: kawada('2024/03/4972825224564') },
  // Paldea Wave 2 (September 2024)
  { id: 'NBPM-R04', pokemonName: 'Armarouge (RS)',  pokemonNumber: 936, generation: 9, setCode: 'NBPM-R04', imageUrl: kawada('2024/07/4972825228920') },
  { id: 'NBPM-R05', pokemonName: 'Ceruledge (RS)',  pokemonNumber: 937, generation: 9, setCode: 'NBPM-R05', imageUrl: kawada('2024/07/4972825228937') },
  { id: 'NBPM-R06', pokemonName: 'Tinkaton (RS)',   pokemonNumber: 959, generation: 9, setCode: 'NBPM-R06', imageUrl: kawada('2024/07/4972825228944') },
  // Paldea Wave 3 (January 2025)
  { id: 'NBPM-R07', pokemonName: 'Pawmi (RS)',      pokemonNumber: 921, generation: 9, setCode: 'NBPM-R07', imageUrl: kawada('2024/11/4972825229033') },
  { id: 'NBPM-R08', pokemonName: 'Tandemaus (RS)',  pokemonNumber: 924, generation: 9, setCode: 'NBPM-R08', imageUrl: kawada('2024/11/4972825229040') },
  { id: 'NBPM-R09', pokemonName: 'Clodsire (RS)',   pokemonNumber: 980, generation: 9, setCode: 'NBPM-R09', imageUrl: kawada('2024/11/4972825229057') },
  // RS Mega Wave (October 2025)
  { id: 'NBPM-R10', pokemonName: 'Gengar (Mega RS)',      pokemonNumber: 94,  generation: 1, setCode: 'NBPM-R10', imageUrl: kawada('2025/07/4972825234211') },
  { id: 'NBPM-R11', pokemonName: 'Lucario (Mega RS)',     pokemonNumber: 448, generation: 4, setCode: 'NBPM-R11', imageUrl: kawada('2025/07/4972825234204') },
  // RS Mega Wave 2 (January 2026)
  { id: 'NBPM-R12', pokemonName: 'Charizard (Mega X RS)', pokemonNumber: 6,   generation: 1, setCode: 'NBPM-R12', imageUrl: kawada('2025/12/4972825234532') },
  { id: 'NBPM-R13', pokemonName: 'Charizard (Mega Y RS)', pokemonNumber: 6,   generation: 1, setCode: 'NBPM-R13', imageUrl: kawada('2025/12/4972825234549') },
]
