import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { MobileConfig } from '../shared/types'

const CONFIG_FILE = 'mobile-config.json'

function defaultConfig(): MobileConfig {
  return {
    pinHash: '',
    cookieSecret: randomUUID(),
    tunnelName: '',
    tunnelUrl: '',
  }
}

export function loadConfig(userDataPath: string): MobileConfig {
  mkdirSync(userDataPath, { recursive: true })
  const filePath = join(userDataPath, CONFIG_FILE)
  if (!existsSync(filePath)) {
    const config = defaultConfig()
    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8')
    return config
  }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as MobileConfig
}

export function saveConfig(config: MobileConfig, userDataPath: string): void {
  mkdirSync(userDataPath, { recursive: true })
  writeFileSync(join(userDataPath, CONFIG_FILE), JSON.stringify(config, null, 2), 'utf-8')
}
