# Legal Image Scraper Setup

This feature allows you to search for images from legal, Creative Commons sources without violating any Terms of Service.

## Supported Sources

- **Unsplash** - High-quality photos (requires free API key)
- **Pexels** - Stock photos and videos (requires free API key)  
- **Wikimedia Commons** - Free media repository (no API key required)

## Setup Instructions

### 1. Get API Keys (Free)

#### Unsplash
1. Go to https://unsplash.com/developers
2. Create a free account
3. Create a new application
4. Copy your "Access Key"

#### Pexels
1. Go to https://www.pexels.com/api/
2. Create a free account
3. Generate an API key
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (if it doesn't exist) and add:

```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
PEXELS_API_KEY=your_pexels_api_key_here
```

Replace the placeholder values with your actual API keys.

### 3. Test the Feature

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/image-search` in your browser

3. Search for any term (e.g., "nebula", "mountains", "ocean")

4. Images will be fetched from all configured sources and cached locally

## How It Works

### Caching System
- Downloaded images are stored in `public/cache/images/`
- Metadata is tracked in `public/cache/images/metadata.json`
- Cache expires after 30 days
- Cached images are served instantly on subsequent searches

### Rate Limiting
- Each source is rate-limited to 1 request per second
- Prevents API throttling and respects service limits
- Requests are queued automatically

### Legal Compliance
- Only fetches from Creative Commons and legal sources
- Respects `robots.txt` and rate limits
- Includes proper attribution for all images
- No scraping of commercial search engines

## API Endpoints

### POST `/api/search-images`
Search for images across all sources.

**Request Body:**
```json
{
  "query": "space galaxy",
  "maxResults": 12,
  "sources": ["unsplash", "pexels", "wikimedia"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "abc123",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "title": "Spiral Galaxy",
      "author": "John Doe",
      "source": "unsplash",
      "license": "Unsplash License",
      "sourceUrl": "https://...",
      "width": 1920,
      "height": 1080
    }
  ],
  "count": 12
}
```

## Troubleshooting

### No results found
- Check that your API keys are correctly set in `.env.local`
- Restart the development server after adding API keys
- Check the console for error messages

### Rate limit errors
- The scraper automatically handles rate limiting
- If you hit API limits, wait a few minutes and try again
- Free tier limits: Unsplash (50 req/hour), Pexels (200 req/hour)

### Images not caching
- Ensure `public/cache/images/` directory exists
- Check file permissions
- Look for errors in the server console

## Cache Management

### View cache stats
The cache helper provides utilities to manage cached images:

```typescript
import { getCacheStats, cleanCache } from '@/lib/file-processors/image-cache';

// Get statistics
const stats = getCacheStats();
console.log(`Total images: ${stats.totalImages}`);
console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);

// Clean old entries (>30 days)
const removed = cleanCache();
console.log(`Removed ${removed} old images`);
```

## License

This implementation respects all source licenses:
- **Unsplash**: Unsplash License (free to use)
- **Pexels**: Pexels License (free to use)
- **Wikimedia**: Various Creative Commons licenses

Always check individual image licenses before commercial use.
