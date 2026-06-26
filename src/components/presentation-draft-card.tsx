"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Presentation, Download, Loader2, Image as ImageIcon, Layout, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Slide {
    title: string;
    bullets: string[];
    imageQuery?: string;
}

interface PresentationData {
    title: string;
    subtitle: string;
    slides: Slide[];
}

export function PresentationDraftCard({ draftJson }: { draftJson: string }) {
    const { toast } = useToast();
    const [data, setData] = useState<PresentationData | null>(() => {
        try {
            return JSON.parse(draftJson);
        } catch (e) {
            console.error("Failed to parse presentation draft:", e);
            return null;
        }
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    if (!data) return null;

    const handleTitleChange = (val: string) => setData({ ...data, title: val });
    const handleSubtitleChange = (val: string) => setData({ ...data, subtitle: val });

    const handleSlideChange = (index: number, field: keyof Slide, val: any) => {
        const newSlides = [...data.slides];
        newSlides[index] = { ...newSlides[index], [field]: val };
        setData({ ...data, slides: newSlides });
    };

    const handleBulletsChange = (index: number, val: string) => {
        const bullets = val.split('\n').filter(b => b.trim() !== '');
        handleSlideChange(index, 'bullets', bullets);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-pptx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (result.url) {
                setDownloadUrl(result.url);
                window.open(result.url, '_blank');
                toast({ title: "Success!", description: "Your PowerPoint is ready." });
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (downloadUrl) {
        return (
            <Card className="mt-4 max-w-md border-orange-500/30 bg-orange-500/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Presentation className="h-5 w-5 text-orange-500" />
                        PowerPoint Successfully Created
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground mb-4">Your interactive PowerPoint has been generated with images and downloaded.</p>
                    <Button className="w-full gap-2" onClick={() => window.open(downloadUrl, '_blank')}>
                        <Download className="h-4 w-4" /> Download Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4 max-w-2xl border-border/50 shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    Presentation Editor
                </CardTitle>
                <p className="text-xs text-muted-foreground">Review and edit your slides before generating the file.</p>
            </CardHeader>
            <CardContent className="p-4 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Main Title</label>
                        <Input value={data.title} onChange={e => handleTitleChange(e.target.value)} className="font-bold text-lg" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Subtitle</label>
                        <Input value={data.subtitle} onChange={e => handleSubtitleChange(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-6">
                    {data.slides.map((slide, i) => (
                        <div key={i} className="p-4 rounded-xl border bg-card space-y-4 relative">
                            <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-br-lg rounded-tl-xl uppercase tracking-widest">
                                Slide {i + 1}
                            </div>
                            <div className="pt-2 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                        <Type className="h-3 w-3" /> Slide Title
                                    </label>
                                    <Input value={slide.title} onChange={e => handleSlideChange(i, 'title', e.target.value)} className="font-semibold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                        <Layout className="h-3 w-3" /> Bullet Points (One per line)
                                    </label>
                                    <Textarea 
                                        value={slide.bullets.join('\n')} 
                                        onChange={e => handleBulletsChange(i, e.target.value)}
                                        rows={4}
                                        className="text-sm resize-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" /> Auto-Image Search Query
                                    </label>
                                    <Input 
                                        value={slide.imageQuery || ''} 
                                        onChange={e => handleSlideChange(i, 'imageQuery', e.target.value)} 
                                        placeholder="E.g. space telescope orbiting earth"
                                        className="text-sm bg-muted/50"
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-1">We will automatically find and embed an image matching this query.</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-border/50 bg-muted/20">
                <Button 
                    className="w-full gap-2 font-semibold" 
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Compiling PPTX with Images...</>
                    ) : (
                        <><Download className="h-5 w-5" /> Generate & Download PowerPoint</>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
