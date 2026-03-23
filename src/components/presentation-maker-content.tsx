
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Presentation, Wand2, Download, Milestone, Lightbulb, ListOrdered, CheckCircle, Sparkles } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { SidebarTrigger } from "./ui/sidebar";
import { BackButton } from "./back-button";
import { SharedHeader } from "./shared-header";
import { generatePresentationAction, GeneratePresentationOutput } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const SlideIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'title': return <Sparkles className="w-8 h-8" />;
        case 'overview': return <ListOrdered className="w-8 h-8" />;
        case 'content': return <Milestone className="w-8 h-8" />;
        case 'summary': return <CheckCircle className="w-8 h-8" />;
        case 'closing': return <Sparkles className="w-8 h-8" />;
        default: return <Presentation className="w-8 h-8" />;
    }
}

export function PresentationMakerContent() {
    const [topic, setTopic] = useState("");
    const [numSlides, setNumSlides] = useState("7");
    const [style, setStyle] = useState("colorful");
    const [colors, setColors] = useState("");

    const [presentation, setPresentation] = useState<GeneratePresentationOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startGenerating] = useTransition();
    const { toast } = useToast();

    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)

    React.useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
    }, [api]);

    const handleGenerate = () => {
        if (!topic) {
            toast({
                title: "Missing Topic",
                description: "Please enter a topic to generate a presentation.",
                variant: "destructive",
            });
            return;
        }
        setError(null);
        setPresentation(null);
        startGenerating(async () => {
            const result = await generatePresentationAction({ topic, numSlides: parseInt(numSlides), style, colors });
            if (result.error) {
                setError(result.error);
                toast({ title: "Generation Failed", description: result.error, variant: "destructive" });
            } else if (result.data) {
                setPresentation(result.data);
                toast({ title: "Presentation Generated!", description: "Your presentation is ready to view." });
            }
        });
    };

    const handleDownload = () => {
        if (!presentation) return;
        const content = `# ${presentation.title}\n\n` + presentation.slides.map(slide => {
            return `---
## ${slide.title} (${slide.slideType})

${slide.content.map(point => `- ${point}`).join('\n')}

### Speaker Notes:
${slide.speakerNotes}
`;
        }).join('\n\n');

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${topic.replace(/\s+/g, '_')}_presentation.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <SharedHeader
                title="AI Presentation Maker"
                leftElement={<BackButton />}
                rightElement={presentation && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPresentation(null)}>New Presentation</Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download MD
                        </Button>
                    </div>
                )}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <WavyLoader className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg font-semibold">Generating your presentation...</p>
                        <p className="text-muted-foreground">The AI is crafting your slides. Please wait a moment.</p>
                    </div>
                ) : !presentation ? (
                    <div className="mx-auto max-w-xl">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create a New Presentation</CardTitle>
                                <CardDescription>Enter a topic and customize the options, and our AI will generate a slide deck for you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="topic">1. Presentation Topic</Label>
                                    <Input id="topic" placeholder="e.g., The Future of Renewable Energy" value={topic} onChange={e => setTopic(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="num-slides">2. Number of Slides</Label>
                                        <Select value={numSlides} onValueChange={setNumSlides}>
                                            <SelectTrigger id="num-slides">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 Slides</SelectItem>
                                                <SelectItem value="7">7 Slides</SelectItem>
                                                <SelectItem value="10">10 Slides</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>3. Style Preference</Label>
                                        <RadioGroup value={style} onValueChange={setStyle} className="flex gap-4 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="colorful" id="colorful" />
                                                <Label htmlFor="colorful">Colorful</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="simple" id="simple" />
                                                <Label htmlFor="simple">Simple</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="colors">4. Preferred Colors (Optional)</Label>
                                    <Input id="colors" placeholder="e.g., blue and yellow" value={colors} onChange={e => setColors(e.target.value)} />
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="mt-4">
                                        <AlertTitle>Generation Failed</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleGenerate} disabled={isGenerating}>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generate Presentation
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                ) : (
                    <div className="mx-auto max-w-5xl" style={{
                        '--slide-bg': presentation.colorTheme.background,
                        '--slide-text': presentation.colorTheme.primary,
                        '--slide-accent': presentation.colorTheme.accent,
                    } as React.CSSProperties}>
                        <h2 className="text-3xl font-bold text-center mb-2">{presentation.title}</h2>
                        <p className="text-center text-muted-foreground mb-8">A presentation on "{topic}" generated by Easy Learn AI</p>

                        <Carousel setApi={setApi} className="w-full">
                            <CarouselContent>
                                {presentation.slides.map((slide, index) => (
                                    <CarouselItem key={index}>
                                        <Card className="min-h-[60vh] flex flex-col shadow-lg overflow-hidden border-2" style={{ backgroundColor: 'var(--slide-bg)', borderColor: 'var(--slide-accent)' }}>

                                            {slide.slideType === 'title' || slide.slideType === 'closing' ? (
                                                <CardContent className="flex flex-col flex-1 items-center justify-center text-center p-6" style={{ color: 'var(--slide-text)' }}>
                                                    <div className="p-4 rounded-full mb-6" style={{ backgroundColor: 'var(--slide-accent)' }}>
                                                        <SlideIcon type={slide.slideType} />
                                                    </div>
                                                    <h2 className="text-4xl font-bold">{slide.title}</h2>
                                                    <p className="text-xl mt-2 max-w-xl" style={{ color: 'var(--slide-accent)' }}>{slide.content[0]}</p>
                                                </CardContent>
                                            ) : (
                                                <>
                                                    <CardHeader>
                                                        <CardTitle style={{ color: 'var(--slide-text)' }}>{index + 1}. {slide.title}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6 flex-1 grid md:grid-cols-3 gap-6">
                                                        <div className="md:col-span-2 prose prose-lg max-w-none" style={{ '--tw-prose-body': 'var(--slide-text)', '--tw-prose-bullets': 'var(--slide-accent)' } as React.CSSProperties}>
                                                            <ul>
                                                                {slide.content.map((point, i) => <li key={i}>{point}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="md:col-span-1 space-y-4">
                                                            <div className="bg-background/20 p-4 rounded-lg backdrop-blur-sm">
                                                                <h4 className="font-semibold mb-2" style={{ color: 'var(--slide-accent)' }}>Speaker Notes</h4>
                                                                <p className="text-sm italic" style={{ color: 'var(--slide-text)' }}>{slide.speakerNotes}</p>
                                                            </div>
                                                            <div className="bg-background/20 p-4 rounded-lg backdrop-blur-sm">
                                                                <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--slide-accent)' }}><Lightbulb />Visual Suggestion</h4>
                                                                <p className="text-sm" style={{ color: 'var(--slide-text)' }}>{slide.visualSuggestion}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </>
                                            )}
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                        <div className="py-2 text-center text-sm text-muted-foreground">
                            Slide {current} of {count}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

