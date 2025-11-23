# Deployment Guide for Scholar Sage (SearnAI)

## Prerequisites

- Node.js 18+ installed
- SambaNova API key
- Firebase project set up
- npm or yarn package manager

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# SambaNova AI API
SAMBANOVA_API_KEY=your_sambanova_api_key
SAMBANOVA_BASE_URL=https://api.sambanova.ai/v1

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings
4. Deploy!

### Manual Deployment

```bash
# Build the application
npm run build

# Start the server
npm start
```

The app will run on port 3000 by default.

## Features

- ✅ AI-powered chat with streaming responses
- ✅ Flashcard & quiz generation
- ✅ Image analysis
- ✅ Web scraper
- ✅ Dark/light theme support
- ✅ Export conversations (PDF, Markdown)
- ✅ Keyboard shortcuts

## Performance Optimizations

- Code splitting for faster loads
- React memoization to prevent unnecessary re-renders
- Lazy loading for heavy components
- Streaming AI responses for better UX

## Security

- All API keys stored in environment variables
- Input validation with Zod
- Secure headers configured
- Error boundaries for graceful failures

## Monitoring

Check the browser console for:
- [INFO] logs for normal operations
- [WARN] logs for potential issues
- [ERROR] logs for failures

## Support

For issues, check:
1. Environment variables are set correctly
2. API keys are valid
3. Firebase configuration is correct
4. Node.js version is 18+
