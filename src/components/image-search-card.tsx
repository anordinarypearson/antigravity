"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface ImageResult {
    url: string;
    thumbnailUrl: string;
    source: string;
    title: string;
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

    if (loading.status === 'loading') {
        return (
            <Card className="w-full max-w-3xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Loading images... {loading.percentage}% ({loading.loaded}/{loading.total} images loaded)
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading.status === 'error' || images.length === 0) {
        return (
            <Card className="w-full max-w-3xl">
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                        No images found for "{query}". Try a different search term.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-3xl">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Image results for "{query}"
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {images.length} {images.length === 1 ? 'image' : 'images'} found
                            </p>
                        </div>

                        <Carousel className="w-full">
                            <CarouselContent>
                                {images.map((image, index) => (
                                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                        <div className="p-1">
                                            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                                <div
                                                    className="relative aspect-video bg-muted"
                                                    onClick={() => setSelectedImage(image)}
                                                >
                                                    <Image
                                                        src={image.thumbnailUrl}
                                                        alt={image.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    <p className="text-xs font-medium line-clamp-1">
                                                        {image.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {image.source}
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </div>
                </CardContent>
            </Card>

            {/* Full Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <Image
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                fill
                                className="object-contain"
                                sizes="90vw"
                            />
                        </div>
                        <div className="mt-4 bg-background rounded-lg p-4 space-y-2">
                            <p className="font-semibold">{selectedImage.title}</p>
                            <p className="text-sm text-muted-foreground">{selectedImage.source}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(selectedImage.url, '_blank');
                                }}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Original
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
