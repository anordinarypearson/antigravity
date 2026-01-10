/**
 * Image Cache Helper
 * 
 * Manages local caching of images from legal sources.
 * Stores thumbnails in public/cache/images/ for fast retrieval.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

export interface CachedImage {
    id: string;
    url: string;
    localPath: string;
    source: 'unsplash' | 'pexels' | 'wikimedia';
    title: string;
    author?: string;
    license: string;
    cachedAt: number;
}

const CACHE_DIR = path.join(process.cwd(), 'public', 'cache', 'images');
const METADATA_FILE = path.join(CACHE_DIR, 'metadata.json');
const MAX_CACHE_AGE_DAYS = 30;

/**
 * Initialize cache directory
 */
export function initCache(): void {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    if (!fs.existsSync(METADATA_FILE)) {
        fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Generate a unique hash for an image URL
 */
function hashUrl(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Load metadata from cache
 */
function loadMetadata(): CachedImage[] {
    try {
        const data = fs.readFileSync(METADATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * Save metadata to cache
 */
function saveMetadata(metadata: CachedImage[]): void {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

/**
 * Check if an image is already cached
 */
export function isCached(imageUrl: string): CachedImage | null {
    const metadata = loadMetadata();
    const hash = hashUrl(imageUrl);
    const cached = metadata.find(img => img.id === hash);

    if (!cached) return null;

    // Check if cache is still valid
    const ageInDays = (Date.now() - cached.cachedAt) / (1000 * 60 * 60 * 24);
    if (ageInDays > MAX_CACHE_AGE_DAYS) {
        return null;
    }

    // Verify file still exists
    const fullPath = path.join(process.cwd(), 'public', cached.localPath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }

    return cached;
}

/**
 * Download and cache an image
 */
export async function cacheImage(
    imageUrl: string,
    source: CachedImage['source'],
    title: string,
    author?: string,
    license: string = 'CC0'
): Promise<CachedImage> {
    initCache();

    // Check if already cached
    const existing = isCached(imageUrl);
    if (existing) return existing;

    const hash = hashUrl(imageUrl);
    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = `${hash}${ext}`;
    const filepath = path.join(CACHE_DIR, filename);

    try {
        // Download image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImageCache/1.0; +https://yourapp.com)'
            }
        });

        // Save to disk
        fs.writeFileSync(filepath, response.data);

        // Create metadata entry
        const cachedImage: CachedImage = {
            id: hash,
            url: imageUrl,
            localPath: `/cache/images/${filename}`,
            source,
            title,
            author,
            license,
            cachedAt: Date.now()
        };

        // Update metadata
        const metadata = loadMetadata();
        metadata.push(cachedImage);
        saveMetadata(metadata);

        return cachedImage;
    } catch (error) {
        console.error(`Failed to cache image ${imageUrl}:`, error);
        throw error;
    }
}

/**
 * Search cached images by query
 */
export function searchCache(query: string): CachedImage[] {
    const metadata = loadMetadata();
    const lowerQuery = query.toLowerCase();

    return metadata.filter(img => {
        const ageInDays = (Date.now() - img.cachedAt) / (1000 * 60 * 60 * 24);
        if (ageInDays > MAX_CACHE_AGE_DAYS) return false;

        return (
            img.title.toLowerCase().includes(lowerQuery) ||
            img.author?.toLowerCase().includes(lowerQuery)
        );
    });
}

/**
 * Clean old cache entries
 */
export function cleanCache(): number {
    const metadata = loadMetadata();
    const now = Date.now();
    let removed = 0;

    const validMetadata = metadata.filter(img => {
        const ageInDays = (now - img.cachedAt) / (1000 * 60 * 60 * 24);

        if (ageInDays > MAX_CACHE_AGE_DAYS) {
            // Delete file
            const fullPath = path.join(process.cwd(), 'public', img.localPath);
            try {
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
                removed++;
            } catch (error) {
                console.error(`Failed to delete ${fullPath}:`, error);
            }
            return false;
        }

        return true;
    });

    saveMetadata(validMetadata);
    return removed;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    totalImages: number;
    totalSize: number;
    oldestImage: number;
    newestImage: number;
} {
    const metadata = loadMetadata();

    let totalSize = 0;
    let oldest = Date.now();
    let newest = 0;

    metadata.forEach(img => {
        const fullPath = path.join(process.cwd(), 'public', img.localPath);
        try {
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                totalSize += stats.size;
            }
        } catch {
            // Ignore errors
        }

        if (img.cachedAt < oldest) oldest = img.cachedAt;
        if (img.cachedAt > newest) newest = img.cachedAt;
    });

    return {
        totalImages: metadata.length,
        totalSize,
        oldestImage: oldest,
        newestImage: newest
    };
}
