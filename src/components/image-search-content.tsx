
"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Image as ImageIcon, AlertTriangle, Download,
    ExternalLink, X, ZoomIn, Filter, Sparkles, Grid3X3, LayoutGrid,
    ChevronDown, Heart, Share2, Copy, Check } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import Image from "next/image";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { z } from "zod";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const ImageSearchInputSchema = z.object({
    query: z.string().describe('The search query for images.'),
});
export type ImageSearchInput = z.infer<typeof ImageSearchInputSchema>;

export const ImageSearchOutputSchema = z.object({
    images: z.array(z.any()),
});
export type ImageSearchOutput = z.infer<typeof ImageSearchOutputSchema>;

interface ImageResult {
    id: string;
    url: string;
    thumbnailUrl: string;
    title: string;
    author: string;
    source: 'unsplash' | 'pexels' | 'wikimedia' | 'web';
    license: string;
    sourceUrl: string;
    width: number;
    height: number;
}

const TRENDING_TAGS = [
    { label: "🌌 Space", query: "space nebula galaxy" },
    { label: "🏔️ Mountains", query: "mountains landscape" },
    { label: "🌊 Ocean", query: "ocean waves" },
    { label: "🌆 City", query: "city skyline night" },
    { label: "🌸 Flowers", query: "flowers bloom" },
    { label: "🐺 Wildlife", query: "wildlife nature" },
    { label: "🎨 Abstract", query: "abstract art colors" },
    { label: "🏛️ Architecture", query: "modern architecture" },
    { label: "🌅 Sunset", query: "sunset golden hour" },
    { label: "🍃 Nature", query: "nature forest green" },
];

const SOURCE_FILTERS = [
    { label: "All", value: "all" },
    { label: "Web Search", value: "web" },
    { label: "Unsplash", value: "unsplash" },
    { label: "Pexels", value: "pexels" },
    { label: "Wikimedia", value: "wikimedia" },
];

export function ImageSearchContent() {
    const [query, setQuery] = useState("");
    const [images, setImages] = useState<ImageResult[]>([]);
    const [isSearching, startSearching] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [searchedQuery, setSearchedQuery] = useState<string>("");
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Focus search on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Load favorites from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('image-search-favorites');
            if (saved) setFavorites(new Set(JSON.parse(saved)));
        } catch { }
    }, []);

    const saveFavorite = (imageId: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(imageId)) {
                next.delete(imageId);
            } else {
                next.add(imageId);
            }
            try {
                localStorage.setItem('image-search-favorites', JSON.stringify([...next]));
            } catch { }
            return next;
        });
    };

    const handleSearchImages = useCallback((searchQuery?: string) => {
        const q = (searchQuery || query).trim();
        if (!q) {
            toast({ title: "Query is empty", description: "Please enter what you're looking for.", variant: "destructive" });
            return;
        }

        setSearchedQuery(q);
        setPage(1);
        setHasMore(true);

        startSearching(async () => {
            setImages([]);
            setError(null);
            try {
                const response = await fetch('/api/search-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: q, maxResults: 30, page: 1 })
                });
                const result = await response.json();

                if (!result.success || result.error) {
                    setError(result.error || 'Failed to search images');
                    toast({ title: "Search Failed", description: result.error, variant: "destructive" });
                } else {
                    setImages(result.results || []);
                    if (result.results?.length < 15) setHasMore(false);
                    if (result.results?.length > 0) {
                        toast({ title: `Found ${result.results.length} images`, description: "High-quality, legal images ready to use" });
                    }
                }
            } catch (err: any) {
                setError(err.message);
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    }, [query, toast]);

    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || !searchedQuery) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            const response = await fetch('/api/search-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchedQuery, maxResults: 30, page: nextPage })
            });
            const result = await response.json();

            if (result.success && result.results) {
                if (result.results.length < 10) setHasMore(false);
                setImages(prev => [...prev, ...result.results]);
                setPage(nextPage);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Load more failed:', err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, searchedQuery, page]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && images.length > 0) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [handleLoadMore, hasMore, isLoadingMore, images.length]);

    const handleTagClick = (tagQuery: string) => {
        setQuery(tagQuery);
        handleSearchImages(tagQuery);
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast({ title: "Copied!", description: "Image URL copied to clipboard" });
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchImages();
        }
    };

    // Filter images by source
    const filteredImages = sourceFilter === "all"
        ? images
        : images.filter(img => img.source === sourceFilter);

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'unsplash': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
            case 'pexels': return 'bg-sky-500/15 text-sky-400 border-sky-500/20';
            case 'wikimedia': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
            case 'web': return 'bg-violet-500/15 text-violet-400 border-violet-500/20';
            default: return 'bg-primary/15 text-primary border-primary/20';
        }
    };

    const getSourceDot = (source: string) => {
        switch (source) {
            case 'unsplash': return 'bg-emerald-400';
            case 'pexels': return 'bg-sky-400';
            case 'wikimedia': return 'bg-amber-400';
            case 'web': return 'bg-violet-400';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />

            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                            <ImageIcon className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-xl font-semibold tracking-tight">Image Search</h1>
                    </div>
                </div>
                {images.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('masonry')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-6">

                    {/* Search Bar — Premium Glassmorphic */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-focus-within:border-primary/30">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Search for stunning images..."
                                            className="w-full bg-transparent rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder-muted-foreground/60 focus:outline-none text-[15px] transition-all"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleSearchImages()}
                                        disabled={isSearching || !query.trim()}
                                        className="px-6 py-3.5 h-auto rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:shadow-none transition-all duration-300"
                                    >
                                        {isSearching ? (
                                            <WavyLoader className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-2" />
                                                Search
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trending Tags */}
                    {images.length === 0 && !isSearching && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium text-muted-foreground">Trending</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_TAGS.map((tag) => (
                                    <button
                                        key={tag.query}
                                        onClick={() => handleTagClick(tag.query)}
                                        className="px-3.5 py-2 text-sm rounded-xl border border-border/50 bg-card/50 hover:bg-accent hover:border-primary/20 text-foreground/80 hover:text-foreground transition-all duration-200 hover:shadow-sm"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Source Filters */}
                    {images.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-wrap items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <div className="flex gap-1">
                                    {SOURCE_FILTERS.map((filter) => {
                                        const count = filter.value === "all"
                                            ? images.length
                                            : images.filter(img => img.source === filter.value).length;
                                        return (
                                            <button
                                                key={filter.value}
                                                onClick={() => setSourceFilter(filter.value)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                                                    sourceFilter === filter.value
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                {filter.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Showing {filteredImages.length} of {images.length} results for "{searchedQuery}"
                            </p>
                        </motion.div>
                    )}

                    {/* Loading Skeletons */}
                    {isSearching && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Skeleton
                                        className="rounded-2xl"
                                        style={{
                                            aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '4/3' : '1/1',
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Alert variant="destructive" className="max-w-2xl mx-auto rounded-2xl">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Search Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* Image Grid / Masonry */}
                    {!isSearching && filteredImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                viewMode === 'masonry'
                                    ? "columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
                                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                            )}
                        >
                            {filteredImages.map((img, index) => (
                                <motion.div
                                    key={img.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.4 }}
                                    className={cn(
                                        "group relative overflow-hidden rounded-2xl border border-border/30 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer",
                                        viewMode === 'masonry' ? "break-inside-avoid mb-0" : ""
                                    )}
                                    style={viewMode === 'masonry' ? { marginTop: 0 } : {}}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    {/* Image */}
                                    <div
                                        className={cn(
                                            "relative overflow-hidden bg-muted",
                                            viewMode === 'grid' ? "aspect-square" : ""
                                        )}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.thumbnailUrl || img.url}
                                            alt={img.title || 'Image'}
                                            className={cn(
                                                "w-full object-cover transition-transform duration-700 group-hover:scale-110",
                                                viewMode === 'grid' ? "h-full" : "min-h-[160px]"
                                            )}
                                            loading="lazy"
                                        />

                                        {/* Hover Overlay - Desktop / Clickable Label - Mobile */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            {/* Top Actions */}
                                            <div className="absolute top-3 right-3 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saveFavorite(img.id); }}
                                                    className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                                                >
                                                    <Heart className={cn("h-4 w-4", favorites.has(img.id) ? "fill-red-500 text-red-500" : "text-white")} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCopyUrl(img.url); }}
                                                    className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                                                >
                                                    {copiedUrl === img.url ? (
                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 text-white" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Bottom Info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                                                <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{img.title}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn("h-1.5 w-1.5 rounded-full", getSourceDot(img.source))} />
                                                        <span className="text-white/70 text-[11px] capitalize">{img.source}</span>
                                                        {img.author && (
                                                            <span className="text-white/50 text-[11px]">· {img.author}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <a
                                                            href={img.url}
                                                            download
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                                                        >
                                                            <Download className="h-3.5 w-3.5 text-white" />
                                                        </a>
                                                        <a
                                                            href={img.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 text-white" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Source Badge (always visible) */}
                                        <div className="absolute top-3 left-3 group-hover:opacity-0 transition-opacity duration-200">
                                            <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full border backdrop-blur-sm capitalize", getSourceColor(img.source))}>
                                                {img.source}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!isSearching && images.length === 0 && !error && searchedQuery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">No images found</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                No results for "{searchedQuery}". Try different keywords or browse trending topics above.
                            </p>
                        </motion.div>
                    )}

                    {/* Initial State */}
                    {!isSearching && images.length === 0 && !error && !searchedQuery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center py-16"
                        >
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 mb-4">
                                <ImageIcon className="h-10 w-10 text-violet-500/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Discover stunning images</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                Search millions of free, high-quality images from Unsplash, Pexels & Wikimedia Commons
                            </p>
                        </motion.div>
                    )}
                    {/* Load More Trigger */}
                    {!isSearching && images.length > 0 && hasMore && (
                        <div ref={loadMoreRef} className="py-12 flex flex-col items-center justify-center gap-4">
                            {isLoadingMore ? (
                                <div className="flex flex-col items-center gap-2">
                                    <WavyLoader className="h-8 w-8" />
                                    <p className="text-sm text-muted-foreground animate-pulse">Fetching more stunning visuals...</p>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 text-primary"
                                >
                                    Load More Images
                                </Button>
                            )}
                        </div>
                    )}

                    {!hasMore && images.length > 0 && (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground text-sm italic">You've reached the end of the collection.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="relative max-w-5xl w-full h-[95vh] sm:max-h-[85vh] flex flex-col sm:rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors z-50 border border-white/10"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>

                            {/* Image Container */}
                            <div className="relative bg-[#0a0a0a] flex-1 min-h-0 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                            </div>

                            {/* Info Bar */}
                            <div className="bg-card/95 backdrop-blur-2xl border-t border-border/30 p-4 sm:p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-1.5 text-center sm:text-left">
                                        <h3 className="font-bold text-foreground text-lg sm:text-xl leading-snug line-clamp-2">{selectedImage.title}</h3>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                                            {selectedImage.author && <span className="font-medium text-foreground/80">by {selectedImage.author}</span>}
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", getSourceColor(selectedImage.source))}>
                                                    {selectedImage.source}
                                                </span>
                                                <span className="text-xs opacity-60">{selectedImage.license}</span>
                                            </div>
                                            {selectedImage.width && selectedImage.height && (
                                                <span className="text-xs hidden sm:inline opacity-60 px-2 py-0.5 bg-muted rounded-md">{selectedImage.width} × {selectedImage.height}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:flex sm:items-center justify-center sm:justify-end gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl h-10 sm:h-9"
                                            onClick={() => handleCopyUrl(selectedImage.url)}
                                        >
                                            {copiedUrl === selectedImage.url ? (
                                                <><Check className="h-4 w-4 mr-2 text-emerald-500" /> Copied</>
                                            ) : (
                                                <><Copy className="h-4 w-4 mr-2" /> URL</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl h-10 sm:h-9"
                                            onClick={() => window.open(selectedImage.sourceUrl, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Source
                                        </Button>
                                        <Button
                                            className="col-span-2 sm:col-auto rounded-xl h-12 sm:h-9 bg-gradient-to-r from-violet-600 to-fuchsia-600 border-none text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-transform"
                                            onClick={() => window.open(selectedImage.url, '_blank')}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download High-Res
                                        </Button>
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
