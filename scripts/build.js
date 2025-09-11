#!/usr/bin/env node

/**
 * Enhanced build script for LiGo Extension
 * Builds multiple environment versions with proper configuration
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { cleanupManifest } from './post-build-cleanup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const environments = ['development', 'staging', 'production']

function buildEnvironment(env) {
  console.log(`\n🔨 Building ${env} environment...`)
  
  try {
    // Copy environment file to .env for plasmo to pick up
    const envFile = path.join(__dirname, `../env.${env}`)
    const dotEnvFile = path.join(__dirname, '../.env')
    
    if (fs.existsSync(envFile)) {
      fs.copyFileSync(envFile, dotEnvFile)
      console.log(`📋 Copied env.${env} to .env`)
    }
    
    // Copy environment-specific manifest
    const manifestFile = path.join(__dirname, `../manifest.${env}.json`)
    const targetManifestFile = path.join(__dirname, '../manifest.json')
    
    if (fs.existsSync(manifestFile)) {
      fs.copyFileSync(manifestFile, targetManifestFile)
      console.log(`📋 Copied manifest.${env}.json to manifest.json`)
    } else {
      console.warn(`⚠️ No manifest.${env}.json found, using default manifest.json`)
    }
    
    // Build with plasmo
    const buildDirName = env === 'production' ? 'chrome-mv3-prod' : 
                        env === 'development' ? 'chrome-mv3-dev' : 
                        'chrome-mv3-staging'
    
    // Set environment variables for the build
    const buildEnv = { 
      ...process.env, 
      PLASMO_ENV: env,
      NODE_ENV: env === 'development' ? 'development' : 'production',
      PLASMO_TAG: env === 'development' ? 'dev' : env === 'staging' ? 'staging' : 'prod'
    }
    
    const buildCommand = `plasmo build --src-path=. --target=chrome-mv3 --out-dir=build/${buildDirName}`
    console.log(`🔧 Building with env: PLASMO_ENV=${env}, NODE_ENV=${buildEnv.NODE_ENV}, PLASMO_TAG=${buildEnv.PLASMO_TAG}`)
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      env: buildEnv,
      shell: true
    })
    
    // Post-build cleanup
    cleanupManifest(buildDirName, env)
    
    console.log(`✅ ${env} build completed`)
    
    // Clean up .env file after build is complete
    if (fs.existsSync(dotEnvFile)) {
      fs.unlinkSync(dotEnvFile)
    }
    
    // Restore original manifest (development is our default)
    const originalManifest = path.join(__dirname, '../manifest.development.json')
    const restoreTargetManifest = path.join(__dirname, '../manifest.json')
    
    if (fs.existsSync(originalManifest)) {
      fs.copyFileSync(originalManifest, restoreTargetManifest)
      console.log(`🔄 Restored manifest.json to development version`)
    }
    
  } catch (error) {
    console.error(`❌ Failed to build ${env}:`, error.message)
    process.exit(1)
  }
}

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    // Build all environments
    console.log('🚀 Building all environments...')
    environments.forEach(buildEnvironment)
    
    // Create production zip
    console.log('\n📦 Creating production package...')
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      const version = packageJson.version
      const zipCommand = `cd build && zip -r chrome-mv3-prod-v${version}.zip chrome-mv3-production/`
      execSync(zipCommand, { stdio: 'inherit' })
      console.log(`✅ Created chrome-mv3-prod-v${version}.zip`)
    } catch (error) {
      console.error('❌ Failed to create production package:', error.message)
    }
    
  } else {
    // Build specific environment
    const env = args[0]
    if (environments.includes(env)) {
      buildEnvironment(env)
    } else {
      console.error(`❌ Unknown environment: ${env}`)
      console.log(`Available environments: ${environments.join(', ')}`)
      process.exit(1)
    }
  }
  
  console.log('\n🎉 Build process completed!')
}

main()
