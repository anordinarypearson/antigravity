
"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GeneratedImageCardProps = {
    imageDataUri: string;
    prompt: string;
};

export function GeneratedImageCard({ imageDataUri, prompt }: GeneratedImageCardProps) {
    const { toast } = useToast();

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageDataUri;
        link.download = `${prompt.substring(0, 20).replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Image downloaded!" });
    };

    const handleShare = () => {
        if (navigator.share) {
            fetch(imageDataUri)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'generated_image.png', { type: 'image/png' });
                    navigator.share({
                        title: 'Image from SearnAI',
                        text: `Image generated from prompt: "${prompt}"`,
                        files: [file],
                    }).catch(error => console.log('Error sharing', error));
                });
        } else {
            navigator.clipboard.writeText(imageDataUri);
            toast({ title: "Copied!", description: "Image data URL copied to clipboard." });
        }
    };

    return (
        <div className="generated-image-card group relative w-full max-w-[120px] sm:max-w-[150px] md:max-w-[200px] aspect-square rounded-2xl border border-border/20 bg-background overflow-hidden transition-all hover:shadow-xl hover:border-primary/50">
            <Image
                src={imageDataUri}
                alt={prompt}
                fill
                sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 200px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-[10px] font-bold line-clamp-2 mb-3 leading-tight uppercase tracking-tight">
                    {prompt}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-white/20 hover:bg-white text-white hover:text-black border-0 transition-colors"
                        onClick={handleDownload}
                    >
                        <Download className="mr-1.5 h-3 w-3" />
                        Save
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black border-0 transition-colors"
                        onClick={handleShare}
                    >
                        <Share2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
