
"use client";

import { Bot, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { TypewriterText } from "./typewriter-text";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";

const customThinkingText = `Wait, let me think... okay, starting from the beginning. No, wait, I think I've got the main concept. The user is asking for a simple explanation... or should I go deeper? Let me think one more time to be sure. Okay, I've got it. Let's dive into the core of the topic.`;

export function ThinkingIndicator({ text, duration, isDeepThink = false, isSearching = false }: { text: string | null, duration: number | null, isDeepThink?: boolean, isSearching?: boolean }) {
    const [isAnimating, setIsAnimating] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const displayText = text || customThinkingText;

    const handleAnimationComplete = () => {
        // This function will be called when the typewriter effect finishes.
        // We no longer need a fixed timeout here.
    };

    useEffect(() => {
        // This effect runs when the component mounts or `duration` changes.
        // It sets a timeout to stop the animation only after the real duration has passed.
        if (duration !== null) {
            const totalDuration = (duration * 1000) + 500; // Add a small buffer
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, totalDuration);

            return () => clearTimeout(timer);
        } else {
            // If duration isn't passed (e.g., for the initial "isTyping" state), keep animating.
            setIsAnimating(true);
        }
    }, [duration]);

    const previewLines = displayText.split('\n').slice(0, 3).join('\n');

    // For searching mode, show "Searching Internet..." with blinking icon
    if (isSearching) {
        return (
            <div className="flex items-center gap-2 p-3">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm text-muted-foreground animate-pulse">🔍 Searching Internet...</span>
            </div>
        );
    }

    // For normal chat (not DeepThink), show ChatGPT-style blinking "Thinking" text
    if (!isDeepThink) {
        return (
            <div className="flex items-center gap-2 p-3">
                <span className="text-sm text-muted-foreground">
                    Thinking
                    <span className="inline-block w-[2px] h-4 ml-0.5 bg-foreground animate-pulse" style={{ animationDuration: '0.8s' }}></span>
                </span>
            </div>
        );
    }

    // For DeepThink mode, show the full thinking text UI
    return (
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm mb-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    Thinking Process {duration && <span className="text-muted-foreground font-normal">({duration.toFixed(1)}s)</span>}
                </p>
            </div>
            <div className="relative pl-7">
                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 to-transparent rounded-full"></div>
                {isAnimating ? (
                    <div className="text-xs text-muted-foreground/90 font-mono leading-relaxed">
                        <TypewriterText text={displayText} onComplete={handleAnimationComplete} />
                    </div>
                ) : (
                    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                        <div className="font-mono text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {isExpanded ? displayText : previewLines}
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] mt-2 text-muted-foreground hover:text-foreground hover:bg-primary/5">
                                {isExpanded ? 'Show less' : 'Show more'}
                                <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isExpanded && "rotate-180")} />
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>
                )}
            </div>
        </div>
    );
}
