# Web Search AI Feature

## Overview
The Web Search AI feature provides powerful web search capabilities directly within your Xren AI chat interface. It combines traditional web search results with rich image results, all formatted beautifully in markdown.

## How to Use

### Method 1: Select Web Search Model
1. Open the chat interface (Home page)
2. Click on the model selector (brain icon) in the chat input bar
3. Select "🔍 Web Search" from the list of available models
4. Type your search query and press Enter
5. Get beautifully formatted results with:
   - Related images
   - Top web results with snippets
   - Source links for each result

### Method 2: Dedicated Web Search Page
1. Navigate to **Resources** in the sidebar
2. Click on **Web Search AI**
3. Use the dedicated search interface with:
   - Tabbed view (All, Web, Images)
   - Grid layout for images
   - Card-based web results
   - Easy filtering between content types

## Features

### 🔍 **Comprehensive Search Results**
- Up to 10 web results per search
- Rich snippets from each source
- Favicon icons for visual recognition
- Direct links to source websites

### 📸 **Image Search**
- Up to 8 related images
- High-quality thumbnails
- Source attribution
- Click to view full size

### 🎨 **Beautiful Presentation**
- Modern, gradient-based UI
- Responsive grid layouts
- Hover effects and animations
- Dark mode support

### ⚡ **Fast & Reliable**
- Uses DuckDuckGo for privacy-focused search
- Fallback to Unsplash for images
- Edge runtime for optimal performance
- Caching and optimization

## Technical Details

### API Endpoint
`POST /api/web-search`

**Request Body:**
```json
{
  "query": "your search query"
}
```

**Response:**
```json
{
  "success": true,
  "query": "your search query",
  "results": [
    {
      "title": "Result Title",
      "link": "https://example.com",
      "snippet": "Result description...",
      "favicon": "https://favicon.url"
    }
  ],
  "images": [
    {
      "title": "Image Title",
      "link": "https://image-source.com",
      "thumbnail": "https://image.url",
      "source": "source.com"
    }
  ],
  "timestamp": "2026-01-04T01:32:22.000Z"
}
```

### Integration with Chat
When you select the Web Search model in the chat:
- Your query is automatically sent to the search API
- Results are formatted in markdown
- Images and web results are displayed inline
- All links are clickable and open in new tabs

## Privacy & Safety
- Uses DuckDuckGo (privacy-focused search engine)
- No search history stored
- No tracking or cookies
- Edge runtime - processed at the edge for security

## Tips for Better Results
1. **Be Specific**: Use detailed search queries for better results
2. **Use Keywords**: Include important keywords relevant to your search
3. **Try Variations**: If you don't find what you want, try rephrasing
4. **Explore Images**: The image results can provide quick visual context
5. **Check Sources**: Always verify information from source links

## Examples

### Example 1: General Search
**Query:** "Latest developments in AI technology"
**Result:** News articles, research papers, and images about AI

### Example 2: How-To Search
**Query:** "How to make chocolate chip cookies"
**Result:** Recipe websites, tutorial images, step-by-step guides

### Example 3: Product Search
**Query:** "Best gaming laptops 2026"
**Result:** Review sites, product images, comparison articles

### Example 4: Educational Search
**Query:** "Photosynthesis process"
**Result:** Educational resources, diagrams, scientific explanations

## Troubleshooting

**No Results Found:**
- Try a different query
- Use more general terms
- Check your internet connection

**Images Not Loading:**
- Images use external sources
- Some sources may be blocked by your network
- Try refreshing the page

**Search Taking Too Long:**
- The search typically completes in 2-5 seconds
- If it's taking longer, check your network
- Try a simpler query

## Future Enhancements
- [ ] Advanced search filters (date, region, etc.)
- [ ] Save favorite searches
- [ ] Search history
- [ ] More image sources
- [ ] Video search integration
- [ ] News-specific search tab
- [ ] Shopping search results

---

**Powered by:** DuckDuckGo Search API & Unsplash
**Built for:** Xren AI / SearnAI
**Version:** 1.0.0
