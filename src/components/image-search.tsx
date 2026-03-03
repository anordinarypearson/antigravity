'use client';

/**
 * Image Search Component (Standalone)
 * 
 * Premium UI for searching legal, CC-licensed images
 * Features glassmorphism, micro-animations, and responsive grid
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Download, ExternalLink, Loader2, Image as ImageIcon, Sparkles, X, Copy, Check, Heart, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ImageResult {
    id: string;
    url: string;
    thumbnailUrl: string;
    title: string;
    author: string;
    source: 'unsplash' | 'pexels' | 'wikimedia';
    license: string;
    sourceUrl: string;
    width: number;
    height: number;
}

const TRENDING_TAGS = [
    { label: "🌌 Space", query: "space nebula galaxy" },
    { label: "🏔️ Mountains", query: "mountains landscape" },
    { label: "🌊 Ocean", query: "ocean deep blue" },
    { label: "🌆 City", query: "city skyline night" },
    { label: "🌸 Flowers", query: "flowers bloom macro" },
    { label: "🐺 Wildlife", query: "wildlife safari animals" },
    { label: "🎨 Abstract", query: "abstract art digital" },
    { label: "🌅 Sunset", query: "sunset golden hour" },
];

export default function ImageSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ImageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const handleSearch = useCallback(async (searchQuery?: string) => {
        const q = (searchQuery || query).trim();
        if (!q) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/search-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, maxResults: 20 })
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            setError('Failed to search images. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filteredResults = sourceFilter === 'all'
        ? results
        : results.filter(img => img.source === sourceFilter);

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'unsplash': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
            case 'pexels': return 'bg-sky-500/15 text-sky-400 border-sky-500/20';
            case 'wikimedia': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
            default: return 'bg-primary/15 text-primary border-primary/20';
        }
    };

    const getSourceDot = (source: string) => {
        switch (source) {
            case 'unsplash': return 'bg-emerald-400';
            case 'pexels': return 'bg-sky-400';
            case 'wikimedia': return 'bg-amber-400';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground">
                            Image Search
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        Search millions of Creative Commons images from Unsplash, Pexels & Wikimedia
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-lg transition-all duration-300 group-focus-within:border-primary/30">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Search for nebula, mountains, ocean..."
                                        className="w-full bg-transparent rounded-xl pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground/60 focus:outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSearch()}
                                    disabled={loading || !query.trim()}
                                    className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-muted disabled:to-muted disabled:text-muted-foreground text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/20 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trending Tags */}
                {results.length === 0 && !loading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="max-w-2xl mx-auto mb-10"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Trending</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {TRENDING_TAGS.map((tag) => (
                                <button
                                    key={tag.query}
                                    onClick={() => { setQuery(tag.query); handleSearch(tag.query); }}
                                    className="px-3.5 py-2 text-sm rounded-xl border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/20 text-foreground/80 hover:text-foreground transition-all duration-200 hover:shadow-sm"
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-2xl mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Source Filters */}
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 mb-6"
                    >
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        {['all', 'unsplash', 'pexels', 'wikimedia'].map(source => {
                            const count = source === 'all' ? results.length : results.filter(r => r.source === source).length;
                            return (
                                <button
                                    key={source}
                                    onClick={() => setSourceFilter(source)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 capitalize",
                                        sourceFilter === source
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {source} ({count})
                                </button>
                            );
                        })}
                    </motion.div>
                )}

                {/* Results Grid (Masonry) */}
                <AnimatePresence mode="wait">
                    {filteredResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4"
                        >
                            {filteredResults.map((image, index) => (
                                <motion.div
                                    key={image.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.4 }}
                                    className="group relative break-inside-avoid"
                                    style={{ marginTop: 0 }}
                                >
                                    <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        {/* Image */}
                                        <div className="relative overflow-hidden bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={image.thumbnailUrl}
                                                alt={image.title}
                                                className="w-full object-cover transition-transform duration-700 group-hover:scale-110 min-h-[160px]"
                                                loading="lazy"
                                            />

                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                {/* Top actions */}
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(image.id); }}
                                                        className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                                                    >
                                                        <Heart className={cn("h-4 w-4", favorites.has(image.id) ? "fill-red-500 text-red-500" : "text-white")} />
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                                                    <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{image.title}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", getSourceDot(image.source))} />
                                                            <span className="text-white/70 text-[11px] capitalize">{image.source}</span>
                                                            {image.author && <span className="text-white/50 text-[11px]">· {image.author}</span>}
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <a
                                                                href={image.url}
                                                                download
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                                            >
                                                                <Download className="w-3.5 h-3.5 text-white" />
                                                            </a>
                                                            <a
                                                                href={image.sourceUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Source badge */}
                                            <div className="absolute top-3 left-3 group-hover:opacity-0 transition-opacity duration-200">
                                                <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full border backdrop-blur-sm capitalize", getSourceColor(image.source))}>
                                                    {image.source}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty State */}
                {!loading && results.length === 0 && query && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">No results found</h3>
                        <p className="text-muted-foreground text-sm">Try a different search term</p>
                    </motion.div>
                )}

                {/* Initial State */}
                {!loading && results.length === 0 && !query && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-20"
                    >
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 mb-4">
                            <ImageIcon className="w-10 h-10 text-violet-500/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Discover stunning images</h3>
                        <p className="text-muted-foreground text-sm">Enter a search term to find beautiful, legal images</p>
                    </motion.div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="relative max-w-5xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>

                            <div className="relative bg-black rounded-t-2xl overflow-hidden">
                                <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={selectedImage.url}
                                        alt={selectedImage.title}
                                        className="max-w-full max-h-[70vh] object-contain"
                                    />
                                </div>
                            </div>

                            <div className="bg-card/95 backdrop-blur-xl rounded-b-2xl border border-t-0 border-border/30 p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-foreground text-lg">{selectedImage.title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>by {selectedImage.author}</span>
                                            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", getSourceColor(selectedImage.source))}>
                                                {selectedImage.source}
                                            </span>
                                            <span className="text-xs">{selectedImage.license}</span>
                                            {selectedImage.width && selectedImage.height && (
                                                <span className="text-xs">{selectedImage.width} × {selectedImage.height}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopyUrl(selectedImage.url)}
                                            className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors flex items-center gap-1.5"
                                        >
                                            {copiedUrl === selectedImage.url ? (
                                                <><Check className="h-4 w-4 text-emerald-500" /> Copied</>
                                            ) : (
                                                <><Copy className="h-4 w-4" /> Copy URL</>
                                            )}
                                        </button>
                                        <a
                                            href={selectedImage.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="h-4 w-4" /> Source
                                        </a>
                                        <a
                                            href={selectedImage.url}
                                            download
                                            className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl shadow-lg shadow-violet-500/20 flex items-center gap-1.5 font-medium transition-all"
                                        >
                                            <Download className="h-4 w-4" /> Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
