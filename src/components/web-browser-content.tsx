
"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Globe, X } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const getWebsiteUrl = (command: string): { url: string; newTab: boolean } => {
    // Handle full YouTube URLs by converting them to embed URLs
    if (command.includes("youtube.com/watch")) {
        try {
            const videoId = new URL(command).searchParams.get("v");
            if (videoId) {
                return { url: `https://www.youtube.com/embed/${videoId}`, newTab: false };
            }
        } catch (e) {
            console.error("Invalid YouTube URL");
        }
    }
    
    const mapping: Record<string, {url: string, newTab: boolean}> = {
        "youtube": { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", newTab: false },
        "spotify": { url: "https://open.spotify.com/embed/track/4cOdK2wGvT3alVeDmMvPaT", newTab: false },
        "wikipedia": { url: "https://wikipedia.org", newTab: false },
        "whatsapp": { url: "https://web.whatsapp.com", newTab: true }, // Will open in new tab
        "news": { url: "https://news.google.com", newTab: false } // May be blocked
    };

    const lowerCommand = command.toLowerCase();
    for (const key in mapping) {
        if (lowerCommand.includes(key)) {
            return mapping[key];
        }
    }

    // Fallback to a search engine for other queries
    return { url: `https://duckduckgo.com/?q=${encodeURIComponent(command)}`, newTab: false };
};


export function WebBrowserContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const initialQuery = searchParams.get('q');
    const initialUrlData = initialQuery ? getWebsiteUrl(initialQuery) : { url: "https://www.google.com/webhp?igu=1", newTab: false };

    const [url, setUrl] = useState(initialUrlData.url);
    const [displayUrl, setDisplayUrl] = useState(initialUrlData.url);
    const [iframeError, setIframeError] = useState(false);
    
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if(initialQuery) {
            const newUrlData = getWebsiteUrl(initialQuery);
            if (newUrlData.newTab) {
                window.open(newUrlData.url, "_blank");
                setUrl("about:blank");
                setDisplayUrl("about:blank");
            } else {
                setUrl(newUrlData.url);
                setDisplayUrl(newUrlData.url);
            }
        }
    }, [initialQuery]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        let finalUrlData = { url: url, newTab: false };
        if (!/^(https?:\/\/)/.test(url)) {
            finalUrlData = getWebsiteUrl(url);
        }

        if (finalUrlData.newTab) {
            window.open(finalUrlData.url, '_blank');
        } else {
            setDisplayUrl(finalUrlData.url);
            setIframeError(false);
        }
    };

    const handleGoBack = () => {
        iframeRef.current?.contentWindow?.history.back();
    };

    const handleGoForward = () => {
        iframeRef.current?.contentWindow?.history.forward();
    };

    const handleRefresh = () => {
        iframeRef.current?.contentWindow?.location.reload();
    };
    
    const handleGoHome = () => {
        const homeUrl = "https://www.google.com/webhp?igu=1";
        setDisplayUrl(homeUrl);
        setUrl(homeUrl);
        setIframeError(false);
    }
    
    const handleIframeError = () => {
        setIframeError(true);
    }

    const isSecure = displayUrl.startsWith("https://");

    return (
        <div className="flex h-full flex-col">
            <header className="sticky top-[120px] z-[30] flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-1">
                    <SidebarTrigger className="md:hidden -ml-2" />
                    <Button variant="ghost" size="icon" onClick={handleGoBack}><ArrowLeft className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleGoForward}><ArrowRight className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleRefresh}><RotateCw className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleGoHome}><Home className="h-5 w-5" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 mx-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            {isSecure ? <Lock className="h-4 w-4 text-green-500"/> : <Globe className="h-4 w-4 text-muted-foreground"/>}
                        </div>
                        <Input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full pl-10"
                            placeholder="Enter a URL or search..."
                        />
                    </div>
                </form>
                 <Button variant="ghost" size="icon" onClick={() => router.back()}><X className="h-5 w-5" /></Button>
            </header>
            <main className="flex-1 bg-muted">
                {iframeError ? (
                    <div className="h-full flex items-center justify-center p-4">
                        <Card className="max-w-md text-center">
                            <CardHeader>
                                <CardTitle>Content Cannot Be Displayed</CardTitle>
                                <CardDescription>This website has security policies that prevent it from being loaded inside another app.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    This is a common security feature (called X-Frame-Options) used by sites like YouTube, Spotify, and many others.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        src={displayUrl}
                        className="w-full h-full border-0"
                        title="Web Browser"
                        sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
                        onError={handleIframeError}
                        onLoad={(e) => {
                            try {
                                const iframeLocation = e.currentTarget.contentWindow?.location.href;
                                if (iframeLocation && iframeLocation !== 'about:blank') {
                                    setUrl(iframeLocation);
                                }
                            } catch (error) {
                                console.log("Cross-origin iframe loaded. URL bar will not update on navigation within iframe.");
                            }
                        }}
                    />
                )}
            </main>
        </div>
    );
}
