import { copyFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Copy the desktop's shared catalog + types into mobile/src/shared at build time so the
// phone's set list can never drift from the desktop's. src/shared/ is gitignored (derived).
const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', '..', 'src', 'shared')
const outDir = join(here, '..', 'src', 'shared')
mkdirSync(outDir, { recursive: true })
for (const f of ['catalog.ts', 'types.ts']) copyFileSync(join(srcDir, f), join(outDir, f))
console.log('[mobile] synced shared catalog.ts + types.ts')
