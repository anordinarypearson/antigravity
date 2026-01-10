---
description: Set up legal image scraper and cache
---

# Image Scraper Setup Workflow

This workflow walks you through adding a **legal, CC‑licensed image scraper** to the project, caching results locally, and exposing a tiny UI component.

## Prerequisites
- Node.js >= 18
- Yarn or npm installed
- An API key for **Unsplash** (optional but recommended). Sign up at https://unsplash.com/developers.
- An API key for **Pexels** (optional). Sign up at https://www.pexels.com/api/.

## Steps
1. **Install dependencies**
   ```bash
   npm install axios bottleneck
   ```
   // turbo
2. **Create the scraper module** – a new file at `src/lib/file-processors/image-scraper.ts` (see step 3).
3. **Create the cache helper** – a new file at `src/lib/file-processors/image-cache.ts`.
4. **Add a demo UI component** – `src/components/image-search.tsx`.
5. **Configure environment variables** – add the following to `.env.local`:
   ```env
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   PEXELS_API_KEY=your_pexels_key
   ```
6. **Run the dev server** and test the component:
   ```bash
   npm run dev
   ```
   // turbo
7. **Optional**: Adjust rate‑limit settings in `image-scraper.ts` if you need higher throughput.

## Verification
- Open the app, navigate to the page that uses `<ImageSearch />`.
- Search for a term (e.g., "nebula").
- Verify that thumbnails appear quickly and are saved under `public/cache/images/`.
- Inspect the network tab – after the first request the same images should be served from the local cache.

---

*This workflow follows the project's premium UI guidelines and uses only legal image sources.*
