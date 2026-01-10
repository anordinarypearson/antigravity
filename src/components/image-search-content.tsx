
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Image as ImageIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { BackButton } from "./back-button";
import { SidebarTrigger } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { z } from "zod";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";

export const ImageSearchInputSchema = z.object({
    query: z.string().describe('The search query for images.'),
});
export type ImageSearchInput = z.infer<typeof ImageSearchInputSchema>;

export const ImageSearchOutputSchema = z.object({
    images: z.array(z.any()),
});
export type ImageSearchOutput = z.infer<typeof ImageSearchOutputSchema>;

export function ImageSearchContent() {
    const [query, setQuery] = useState("");
    const [images, setImages] = useState<any[]>([]);
    const [isSearching, startSearching] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const { toast } = useToast();

    const handleSearchImages = () => {
        if (!query.trim()) {
            toast({ title: "Query is empty", description: "Please enter what you're looking for.", variant: "destructive" });
            return;
        }

        startSearching(async () => {
            setImages([]);
            setError(null);
            try {
                const response = await fetch('/api/search-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, maxResults: 30 })
                });
                const result = await response.json();

                if (!result.success || result.error) {
                    setError(result.error || 'Failed to search images');
                    toast({ title: "Search Failed", description: result.error, variant: "destructive" });
                } else {
                    setImages(result.results || []);
                    toast({ title: `Found ${result.results.length} legal images!`, description: "From Unsplash, Pexels & Wikimedia" });
                }
            } catch (err: any) {
                setError(err.message);
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <BackButton />
                    <h1 className="text-xl font-semibold tracking-tight">Image Search</h1>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Search for Images</CardTitle>
                            <CardDescription>Enter a keyword to find high-quality images from across the internet.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Textarea
                                placeholder="e.g., modern workspace, space galaxy, cute puppies"
                                className="h-20"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSearchImages} disabled={isSearching} className="w-full">
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search Images
                            </Button>
                        </CardFooter>
                    </Card>

                    {isSearching ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <Skeleton key={i} className="aspect-square rounded-2xl" />
                            ))}
                        </div>
                    ) : error ? (
                        <Alert variant="destructive" className="max-w-2xl mx-auto">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Search Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((img, index) => (
                                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border/20 hover:border-primary/50 transition-all hover:shadow-xl">
                                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                        <Image
                                            src={img.thumbnailUrl || img.url}
                                            alt={img.title || 'Image'}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-[10px] text-white/60 font-medium">{img.source}</p>
                                            <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{img.title}</p>
                                            {img.author && <p className="text-white/80 text-[10px] mt-1">by {img.author}</p>}
                                        </div>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-12">
                            <ImageIcon className="mx-auto h-16 w-16 opacity-20" />
                            <p className="mt-4 text-lg">Enter a search above to see images.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
