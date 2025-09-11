# LiGoAI Chrome Extension

A powerful Chrome extension for AI-powered social media engagement on LinkedIn and other platforms.

## Features

- **Smart Comments**: Generate personalized comments for LinkedIn posts
- **Bulk Reply Generation**: Analyze and reply to multiple comments on your posts
- **Content Writing**: Create engaging posts with AI assistance
- **CRM Integration**: Save and manage LinkedIn prospects
- **Analytics**: Track your social media performance
- **Content Extraction**: Extract content from Medium, Substack, Reddit, and YouTube
- **Inspirations**: Save and repurpose content ideas

## Installation

### Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

### Production Build

```bash
npm run build:prod
npm run package:prod
```

This creates a production-ready zip file in the `build/` directory.

## Build Environments

- **Development**: `npm run build:dev` - Uses localhost APIs
- **Staging**: `npm run build:staging` - Uses staging environment
- **Production**: `npm run build:prod` - Uses production APIs

## Architecture

Built with:
- **Plasmo Framework** - Modern Chrome extension development
- **React** - UI components
- **Tailwind CSS** - Styling
- **Chrome Manifest V3** - Latest extension standards

## Key Components

- `background.ts` - Service worker handling API calls and messaging
- `popup.tsx` - Extension popup interface
- `sidepanel.tsx` - Main sidebar interface
- `contents/` - Content scripts for different platforms
- `src/components/` - React components organized by feature
- `src/hooks/` - Custom React hooks for state management

## Content Scripts

- **LinkedIn** (`contents/linkedin.js`) - Profile extraction, comment generation
- **Content Extraction** (`contents/extraction-sites.ts`) - Medium, Substack, Reddit, YouTube
- **Shared** (`contents/shared.js`) - Common functionality across platforms

## Configuration

Environment-specific configurations:
- `manifest.development.json` - Development manifest
- `manifest.staging.json` - Staging manifest  
- `manifest.production.json` - Production manifest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Proprietary - All rights reserved by LiGoAI

## Support

For support and feature requests, visit [ligo.ertiqah.com](https://ligo.ertiqah.com)
