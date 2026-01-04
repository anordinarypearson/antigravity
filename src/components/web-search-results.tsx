"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ExternalLink, Image as ImageIcon, BookOpen } from "lucide-react";

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    favicon?: string;
    source?: string;
}

interface ImageResult {
    title: string;
    link: string;
    thumbnail: string;
    source: string;
}

interface WebSearchResultsProps {
    results: SearchResult[];
    images: ImageResult[];
}

export function WebSearchResults({ results, images }: WebSearchResultsProps) {
    if (!results?.length && !images?.length) return null;

    return (
        <div className="space-y-6 mb-4 w-full">
            {/* Images Section */}
            {images && images.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <ImageIcon className="h-3 w-3" />
                        Images
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-3 pb-2">
                            {images.map((image, index) => (
                                <a
                                    key={index}
                                    href={image.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative overflow-hidden rounded-xl border border-border/40 hover:border-primary/50 bg-muted/20 transition-all w-[160px] h-[100px] flex-shrink-0"
                                >
                                    <img
                                        src={image.thumbnail}
                                        alt={image.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1a1a1a/666?text=IMG';
                                        }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white font-medium truncate">{image.title}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}

            {/* Sources Section */}
            {results && results.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <BookOpen className="h-3 w-3" />
                        Sources
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {results.slice(0, 4).map((result, index) => (
                            <a
                                key={index}
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col p-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-accent/50 hover:border-primary/20 transition-all h-full"
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    {result.favicon && (
                                        <img
                                            src={result.favicon}
                                            alt=""
                                            className="w-3.5 h-3.5 rounded-full opacity-70"
                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                        />
                                    )}
                                    <span className="text-[10px] text-muted-foreground truncate flex-1 font-medium">
                                        {result.source || new URL(result.link).hostname.replace('www.', '')}
                                    </span>
                                </div>
                                <p className="text-xs font-medium leading-snug line-clamp-2 text-card-foreground/90" title={result.title}>
                                    {result.title}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
