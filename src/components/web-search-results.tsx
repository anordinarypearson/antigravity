"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ExternalLink, Image as ImageIcon, BookOpen, Globe, Shield, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        <div className="space-y-5 mb-4 w-full">
            {/* Images Section */}
            {images && images.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <ImageIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span>Images</span>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-2.5 pb-2">
                            {images.map((image, index) => (
                                <motion.a
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    href={image.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative overflow-hidden rounded-xl border border-border/30 hover:border-primary/30 bg-muted/10 transition-all w-[170px] h-[110px] flex-shrink-0 hover:shadow-lg hover:shadow-primary/10"
                                >
                                    <img
                                        src={image.thumbnail}
                                        alt={image.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1a1a2e/666?text=IMG';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute inset-x-0 bottom-0 p-2.5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-[10px] text-white font-medium truncate">{image.title}</p>
                                        <p className="text-[9px] text-white/60">{image.source}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}

            {/* Sources Section */}
            {results && results.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Globe className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span>Sources</span>
                        <span className="text-[10px] text-muted-foreground/30 font-normal ml-1">({results.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {results.slice(0, 6).map((result, index) => (
                            <motion.a
                                key={index}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "group flex flex-col p-3 rounded-xl border transition-all h-full",
                                    "border-border/25 bg-background/30 backdrop-blur-sm",
                                    "hover:bg-primary/[0.04] hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
                                    "hover:-translate-y-0.5"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {result.favicon && (
                                        <img
                                            src={result.favicon}
                                            alt=""
                                            className="w-4 h-4 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                        />
                                    )}
                                    <span className="text-[10px] text-muted-foreground/50 truncate flex-1 font-medium group-hover:text-muted-foreground transition-colors">
                                        {result.source || (() => { try { return new URL(result.link).hostname.replace('www.', ''); } catch { return result.link; } })()}
                                    </span>
                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                                <p className="text-xs font-medium leading-snug line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors" title={result.title}>
                                    {result.title}
                                </p>
                            </motion.a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
