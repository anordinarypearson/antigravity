'use client';

/**
 * Image Search Component
 * 
 * Premium UI for searching legal, CC-licensed images
 * Features glassmorphism, micro-animations, and responsive grid
 */

import { useState, useCallback } from 'react';
import { Search, Download, ExternalLink, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function ImageSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ImageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/search-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, maxResults: 12 })
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

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Sparkles className="w-8 h-8 text-foreground" />
                        <h1 className="text-4xl font-bold text-foreground">
                            Legal Image Search
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
                    className="mb-12"
                >
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl" />
                        <div className="relative bg-card backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search for nebula, mountains, ocean..."
                                        className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading || !query.trim()}
                                    className="px-8 py-4 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium rounded-xl transition-all duration-300 shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
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

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-2xl mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Grid */}
                <AnimatePresence mode="wait">
                    {results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {results.map((image, index) => (
                                <motion.div
                                    key={image.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative"
                                >
                                    <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="relative bg-card backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-foreground/20 transition-all duration-300 shadow-sm hover:shadow-lg">
                                        {/* Image */}
                                        <div className="aspect-square relative overflow-hidden bg-muted">
                                            <img
                                                src={image.thumbnailUrl}
                                                alt={image.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />

                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
                                                    <a
                                                        href={image.url}
                                                        download
                                                        className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </a>
                                                    <a
                                                        href={image.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors flex items-center justify-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="text-foreground font-medium text-sm mb-1 truncate">
                                                {image.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="truncate">by {image.author}</span>
                                                <span className="px-2 py-1 bg-secondary rounded-md capitalize">
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
                        <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-muted-foreground mb-2">No results found</h3>
                        <p className="text-muted-foreground">Try a different search term</p>
                    </motion.div>
                )}

                {/* Initial State */}
                {!loading && results.length === 0 && !query && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-muted-foreground mb-2">Start searching</h3>
                        <p className="text-muted-foreground">Enter a search term to find beautiful, legal images</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
