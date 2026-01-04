"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Search, Loader2, ExternalLink, Image as ImageIcon, Globe, AlertCircle, BookOpen, AlignLeft } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    image?: string;
    favicon?: string;
    content?: string; // Content extracted from the page
    source?: string;
}

interface ImageResult {
    title: string;
    link: string;
    thumbnail: string;
    source: string;
}

interface SearchResponse {
    success: boolean;
    query: string;
    results: SearchResult[];
    images: ImageResult[];
    timestamp: string;
}

export function WebSearchContent() {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Fake progress loader
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSearching) {
            setLoadingProgress(0);
            interval = setInterval(() => {
                setLoadingProgress((prev) => {
                    if (prev >= 90) return prev;
                    // Slow down as it gets higher
                    const inc = prev < 50 ? 5 : prev < 80 ? 2 : 1;
                    return prev + inc;
                });
            }, 100);
        } else {
            setLoadingProgress(100);
        }
        return () => clearInterval(interval);
    }, [isSearching]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        setSearchResults(null);

        try {
            const response = await fetch("/api/web-search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Search failed");
            }

            setSearchResults(data);
        } catch (err) {
            console.error("Search error:", err);
            setError(err instanceof Error ? err.message : "Failed to perform search");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Search Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                            <Globe className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                            Web Search AI
                        </h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2 relative">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="text"
                                placeholder="Ask anything..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-12 h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-shadow bg-background/50 border-2 focus:border-primary/50"
                                disabled={isSearching}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="h-14 px-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            {isSearching ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {loadingProgress}%
                                </span>
                            ) : (
                                "Search"
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Results Area */}
            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20 space-y-8">
                    {error && (
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <div>
                                    <p className="font-semibold text-destructive">Search Error</p>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!searchResults && !error && !isSearching && (
                        <div className="text-center py-20 opacity-50">
                            <div className="inline-flex p-6 rounded-full bg-muted mb-6">
                                <Search className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">Ready to explore?</h3>
                            <p className="text-sm text-muted-foreground">Search for anything to get started.</p>
                        </div>
                    )}

                    {isSearching && !searchResults && (
                        <div className="space-y-8 animate-pulse">
                            <div className="h-40 bg-muted/50 rounded-xl" />
                            <div className="space-y-4">
                                <div className="h-8 w-1/3 bg-muted/50 rounded" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl" />)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-muted/50 rounded" />
                                <div className="h-4 w-full bg-muted/50 rounded" />
                                <div className="h-4 w-5/6 bg-muted/50 rounded" />
                            </div>
                        </div>
                    )}

                    {searchResults && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* 1. Images First (Perplexity Style) */}
                            {searchResults.images.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <ImageIcon className="h-4 w-4" />
                                        <h3 className="text-sm font-medium uppercase tracking-wider">Images</h3>
                                    </div>
                                    <ScrollArea className="w-full whitespace-nowrap rounded-xl pb-4">
                                        <div className="flex w-max space-x-4">
                                            {searchResults.images.map((image, index) => (
                                                <a
                                                    key={index}
                                                    href={image.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative overflow-hidden rounded-xl border border-border/50 hover:border-primary/50 transition-all w-[240px] h-[160px] flex-shrink-0 shadow-sm hover:shadow-lg"
                                                >
                                                    <img
                                                        src={image.thumbnail}
                                                        alt={image.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1a1a1a/666?text=IMG';
                                                        }}
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[12px] text-white font-medium truncate">{image.title}</p>
                                                        <p className="text-[10px] text-white/80 truncate">{image.source}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                </section>
                            )}

                            {/* 2. Search Summaries */}
                            {searchResults.results.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                                        <AlignLeft className="h-5 w-5 text-primary" />
                                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Search Summaries</h3>
                                    </div>

                                    <div className="grid gap-4">
                                        {searchResults.results.map((result, index) => (
                                            <div key={index} className="group relative bg-card hover:bg-accent/50 border border-border/50 rounded-xl p-5 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-background shadow-sm">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {result.favicon && (
                                                                <img
                                                                    src={result.favicon}
                                                                    className="w-4 h-4 rounded-full shadow-sm"
                                                                    alt=""
                                                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                                />
                                                            )}
                                                            <span className="text-xs font-medium text-muted-foreground">{result.source || new URL(result.link).hostname}</span>
                                                        </div>
                                                        <a href={result.link} target="_blank" rel="noopener noreferrer" className="block group-hover:text-primary transition-colors">
                                                            <h4 className="text-base font-semibold text-foreground mb-3 leading-snug">{result.title}</h4>
                                                        </a>
                                                        <div className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/30">
                                                            {result.content && result.content.length > 80 ? (
                                                                <>
                                                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                                                                        <BookOpen className="w-3 h-3 mr-1" />
                                                                        Extracted Content
                                                                    </span>
                                                                    <p>{result.content}</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                                        <Search className="w-3 h-3 mr-1" />
                                                                        Summary
                                                                    </span>
                                                                    <p>{result.snippet}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={result.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-background text-muted-foreground/30 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                                        title="Open Link"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
