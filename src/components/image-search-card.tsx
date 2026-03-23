"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink,  Download, X, Copy, Check, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ImageResult {
    url: string;
    thumbnailUrl: string;
    source: string;
    title: string;
    author?: string;
    width?: number;
    height?: number;
}

interface ImageSearchCardProps {
    query: string;
    images: ImageResult[];
    loading: {
        status: 'completed' | 'loading' | 'error';
        loaded: number;
        total: number;
        percentage: number;
    };
}

export function ImageSearchCard({ query, images, loading }: ImageSearchCardProps) {
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const checkScrollButtons = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const scrollBy = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.7;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        setTimeout(checkScrollButtons, 400);
    };

    const getSourceColor = (source: string) => {
        switch (source?.toLowerCase()) {
            case 'unsplash': return 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400';
            case 'pexels': return 'bg-sky-500/15 text-sky-500 dark:text-sky-400';
            case 'wikimedia':
            case 'wikimedia commons': return 'bg-amber-500/15 text-amber-500 dark:text-amber-400';
            default: return 'bg-primary/15 text-primary';
        }
    };

    const getSourceDot = (source: string) => {
        switch (source?.toLowerCase()) {
            case 'unsplash': return 'bg-emerald-400';
            case 'pexels': return 'bg-sky-400';
            case 'wikimedia':
            case 'wikimedia commons': return 'bg-amber-400';
            default: return 'bg-primary';
        }
    };

    if (loading.status === 'loading') {
        return (
            <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl overflow-hidden rounded-2xl border-border/30">
                <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                            <WavyLoader className="h-4 w-4 animate-spin text-violet-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                Searching images for "{query}"
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${loading.percentage}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {loading.loaded}/{loading.total}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading.status === 'error' || images.length === 0) {
        return (
            <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl overflow-hidden rounded-2xl border-border/30">
                <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No images found for "{query}". Try a different search term.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl overflow-hidden rounded-2xl border-border/30">
                <CardContent className="p-4 sm:p-5">
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                    <ImageIcon className="h-3.5 w-3.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground leading-none">
                                        Images for "{query}"
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {images.length} results from multiple sources
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <button
                                    onClick={() => scrollBy('left')}
                                    disabled={!canScrollLeft}
                                    className="h-7 w-7 rounded-full border border-border/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => scrollBy('right')}
                                    disabled={!canScrollRight}
                                    className="h-7 w-7 rounded-full border border-border/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Image Strip */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={checkScrollButtons}
                            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {images.map((image, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.04, duration: 0.3 }}
                                    className="group relative flex-shrink-0 w-[140px] sm:w-[180px] cursor-pointer"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-transparent group-hover:border-primary/20 transition-all duration-300 group-hover:shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`/api/image-proxy?url=${encodeURIComponent(image.thumbnailUrl || image.url)}`}
                                            alt={image.title || 'Image'}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                // Try the full URL if thumbnail fails
                                                const fallbackUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
                                                if (!target.src.includes(encodeURIComponent(image.url)) && image.url !== image.thumbnailUrl) {
                                                    target.src = fallbackUrl;
                                                } else {
                                                    // Show placeholder
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent && !parent.querySelector('.img-fallback')) {
                                                        const fallback = document.createElement('div');
                                                        fallback.className = 'img-fallback w-full h-full flex items-center justify-center bg-muted';
                                                        fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                        parent.appendChild(fallback);
                                                    }
                                                }
                                            }}
                                        />

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                                <p className="text-white text-[11px] font-medium line-clamp-1 leading-snug">{image.title}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className={cn("h-1 w-1 rounded-full", getSourceDot(image.source))} />
                                                    <span className="text-white/60 text-[10px] capitalize">
                                                        {image.source?.replace('Wikimedia Commons', 'Wikimedia')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Source tag */}
                                        <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
                                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm capitalize", getSourceColor(image.source))}>
                                                {image.source?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Full Image Lightbox */}
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
                            className="relative max-w-4xl w-full max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>

                            <div className="relative bg-black rounded-t-2xl overflow-hidden">
                                <div className="flex items-center justify-center" style={{ minHeight: '40vh' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/api/image-proxy?url=${encodeURIComponent(selectedImage.url)}`}
                                        alt={selectedImage.title}
                                        className="max-w-full max-h-[65vh] object-contain"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            // Try thumbnail as fallback
                                            if (selectedImage.thumbnailUrl && !target.src.includes(encodeURIComponent(selectedImage.thumbnailUrl))) {
                                                target.src = `/api/image-proxy?url=${encodeURIComponent(selectedImage.thumbnailUrl)}`;
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-card/95 backdrop-blur-xl rounded-b-2xl border border-t-0 border-border/30 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">{selectedImage.title}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize", getSourceColor(selectedImage.source))}>
                                                {selectedImage.source}
                                            </span>
                                            {selectedImage.author && <span className="text-xs truncate">by {selectedImage.author}</span>}
                                            {selectedImage.width && selectedImage.height && (
                                                <span className="text-xs hidden sm:inline">{selectedImage.width}×{selectedImage.height}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl text-xs"
                                            onClick={() => handleCopyUrl(selectedImage.url)}
                                        >
                                            {copiedUrl === selectedImage.url ? (
                                                <><Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Copied</>
                                            ) : (
                                                <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl text-xs"
                                            onClick={() => window.open(selectedImage.url, '_blank')}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                            Source
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="rounded-xl text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                                            onClick={() => window.open(`/api/image-proxy?url=${encodeURIComponent(selectedImage.url)}`, '_blank')}
                                        >
                                            <Download className="h-3.5 w-3.5 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
