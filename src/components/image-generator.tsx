import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Download } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";

interface ImageGeneratorProps {
    onImageGenerated?: (imageUrl: string) => void;
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateImage = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Using Pollinations AI (free image generation API)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;

            // Preload image to check if it works
            const img = new Image();
            img.onload = () => {
                setGeneratedImage(imageUrl);
                onImageGenerated?.(imageUrl);
                setLoading(false);
            };
            img.onerror = () => {
                setError('Failed to generate image');
                setLoading(false);
            };
            img.src = imageUrl;
        } catch (err) {
            setError('Failed to generate image');
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    onKeyPress={(e) => e.key === 'Enter' && generateImage()}
                    disabled={loading}
                />
                <Button
                    onClick={generateImage}
                    disabled={loading || !prompt.trim()}
                    className="gap-2"
                >
                    {loading ? (
                        <>
                            <WavyLoader className="h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Generate
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="text-sm text-destructive">{error}</div>
            )}

            {generatedImage && (
                <div className="relative">
                    <img
                        src={generatedImage}
                        alt={prompt}
                        className="w-full rounded-lg border"
                    />
                    <Button
                        onClick={downloadImage}
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                </div>
            )}
        </div>
    );
}
