#!/usr/bin/env node

/**
 * Sync version from package.json to manifest.json
 * This ensures both files always have the same version number
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  // Read package.json
  const packagePath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  // Read manifest.json
  const manifestPath = path.join(__dirname, '../manifest.json')
  const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  
  // Update manifest version
  manifestJson.version = packageJson.version
  
  // Write back to manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n')
  
  console.log(`✅ Synced version ${packageJson.version} to manifest.json`)
  
} catch (error) {
  console.error('❌ Error syncing version:', error.message)
  process.exit(1)
}
