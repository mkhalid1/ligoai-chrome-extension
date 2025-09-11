#!/usr/bin/env node

/**
 * Post-build cleanup script
 * Removes localhost references from production builds
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function cleanupManifest(buildDir, env) {
  const manifestPath = path.join(__dirname, `../build/${buildDir}/manifest.json`)
  
  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️ Manifest not found at ${manifestPath}`)
    return
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    if (env === 'production' || env === 'staging') {
      // Remove localhost from externally_connectable
      if (manifest.externally_connectable && manifest.externally_connectable.matches) {
        manifest.externally_connectable.matches = manifest.externally_connectable.matches.filter(
          match => !match.includes('localhost')
        )
        console.log(`🧹 Removed localhost from externally_connectable in ${env} build`)
      }
      
      // Remove localhost from web_accessible_resources
      if (manifest.web_accessible_resources) {
        manifest.web_accessible_resources.forEach(resource => {
          if (resource.matches) {
            resource.matches = resource.matches.filter(match => !match.includes('localhost'))
          }
        })
        console.log(`🧹 Removed localhost from web_accessible_resources in ${env} build`)
      }
      
      // Remove localhost from host_permissions
      if (manifest.host_permissions) {
        manifest.host_permissions = manifest.host_permissions.filter(
          permission => !permission.includes('localhost')
        )
        console.log(`🧹 Removed localhost from host_permissions in ${env} build`)
      }
    }
    
    // Write the cleaned manifest back
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`✅ Cleaned up manifest for ${env} build`)
    
  } catch (error) {
    console.error(`❌ Failed to cleanup manifest for ${env}:`, error.message)
  }
}

// Export for use in build script
export { cleanupManifest }

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const [buildDir, env] = process.argv.slice(2)
  if (!buildDir || !env) {
    console.error('Usage: node post-build-cleanup.js <buildDir> <env>')
    process.exit(1)
  }
  cleanupManifest(buildDir, env)
}
