# LiGo Extension Build System

## Overview

This extension now supports multiple build environments with automatic configuration switching.

## Environments

- **Development** (`development`): Uses `localhost:5001` for API calls
- **Staging** (`staging`): Uses `stage-ligo.ertiqah.com` for API calls  
- **Production** (`production`): Uses `ligo.ertiqah.com` for API calls

## Build Commands

### Development
```bash
# Start development server (uses localhost)
npm run dev

# Build development version only
npm run build:dev
```

### Staging
```bash
# Build staging version only
npm run build:staging
```

### Production
```bash
# Build production version only
npm run build:prod

# Build all environments
npm run build:all
# or simply
npm run build

# Package production build for Chrome Web Store
npm run package:prod
# Creates: build/chrome-mv3-prod-v{version}.zip
```

### Utility Commands
```bash
# Clean all builds
npm run clean

# Version management
npm run version:patch  # 2.0.1 -> 2.0.2
npm run version:minor  # 2.0.1 -> 2.1.0
npm run version:major  # 2.0.1 -> 3.0.0

# Sync version between package.json and manifest.json
npm run sync-version

# Package builds into zip files
npm run package:dev      # Package development build
npm run package:staging  # Package staging build
npm run package:prod     # Package production build
npm run package:all      # Package all builds
npm run package          # Alias for package:prod
```

## Build Output

After running builds, you'll have:

```
build/
├── chrome-mv3-dev/             # For local testing (localhost APIs)
├── chrome-mv3-staging/         # For staging environment  
├── chrome-mv3-prod/            # For Chrome Web Store (production APIs)
└── chrome-mv3-prod-v2.0.1.zip  # Ready-to-upload zip file
```

## Workflow

### For Development
1. Use `npm run dev` for local development
2. Extension will connect to `localhost:5001`

### For Production Release
1. Update version: `npm run version:patch`
2. Build all environments: `npm run build`
3. Upload `chrome-mv3-prod-v{version}.zip` to Chrome Web Store
4. Test locally with `chrome-mv3-development/` folder

## Environment Configuration

Each environment has its own configuration in `background.ts`:

- **Development**: `http://localhost:5001` + `http://localhost:3000`
- **Staging**: `https://stage-ligo.ertiqah.com`
- **Production**: `https://ligo.ertiqah.com`

## Version Sync

The build system automatically keeps `package.json` and `manifest.json` versions in sync.

## Chrome Web Store Deployment

1. Run `npm run version:patch` (or minor/major)
2. Run `npm run build:prod` 
3. Upload the generated zip file from `build/chrome-mv3-prod-v{version}.zip`

The production build will always use the correct production URLs.
