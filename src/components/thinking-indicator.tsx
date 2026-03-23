
"use client";

import { ChevronDown, Brain, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { TypewriterText } from "./typewriter-text";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SunAIThinkingIndicator } from "./ui/sun-ai-thinking";

const customThinkingText = `Wait, let me think... okay, starting from the beginning. No, wait, I think I've got the main concept. The user is asking for a simple explanation... or should I go deeper? Let me think one more time to be sure. Okay, I've got it. Let's dive into the core of the topic.`;

// ─── Brain wave animation ─────────────────────────────────────────────────────
function BrainWaves() {
    return (
        <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                    key={i}
                    className="w-0.5 rounded-full bg-primary/60"
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: "easeInOut",
                    }}
                    style={{ height: 12 }}
                />
            ))}
        </div>
    );
}

// ─── Search animation ─────────────────────────────────────────────────────────
function SearchingAnimation() {
    const stages = ["Querying search engines", "Fetching results", "Analyzing sources", "Synthesizing answer"];
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStage(s => (s + 1) % stages.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3 py-2 px-3">
            {/* Animated globe */}
            <div className="relative h-8 w-8 flex-shrink-0">
                <motion.div
                    className="absolute inset-0 mask-wavy border-2 border-blue-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-0 m-auto h-5 w-5 mask-wavy border-t-2 border-blue-400"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs">🔍</div>
            </div>
            <div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={stage}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-sm text-foreground/80 font-medium"
                    >
                        {stages[stage]}…
                    </motion.p>
                </AnimatePresence>
                <div className="flex gap-1 mt-1">
                    {stages.map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-0.5 flex-1 rounded-full bg-muted/40 overflow-hidden"
                        >
                            <motion.div
                                className="h-full bg-blue-400 rounded-full"
                                animate={{ x: i <= stage ? "0%" : "-100%" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ThinkingIndicator({
    text,
    duration,
    isDeepThink = false,
    isSearching = false,
}: {
    text: string | null;
    duration: number | null;
    isDeepThink?: boolean;
    isSearching?: boolean;
}) {
    const [isAnimating, setIsAnimating] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const displayText = text || customThinkingText;

    useEffect(() => {
        if (duration !== null) {
            const totalDuration = duration * 1000 + 500;
            const timer = setTimeout(() => setIsAnimating(false), totalDuration);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(true);
        }
    }, [duration]);

    const previewLines = displayText.split("\n").slice(0, 3).join("\n");
    const effectiveIsDeepThink = isDeepThink || !!text;

    // ── Searching mode ────────────────────────────────────────────────────────
    if (isSearching) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/8 to-cyan-500/5 backdrop-blur-sm mb-3"
            >
                <SearchingAnimation />
            </motion.div>
        );
    }

    // ── Normal thinking (non-DeepThink) ──────────────────────────────────────
    if (!effectiveIsDeepThink) {
        return (
            <div className="flex items-center justify-start p-3 pl-4 transition-all duration-500 animate-in fade-in slide-in-from-left-2">
                <SunAIThinkingIndicator isThinking={true} color="currentColor" scale={0.5} />
            </div>
        );
    }

    // ── DeepThink mode ────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-[1px] rounded-xl mb-4 overflow-hidden group"
        >
            {/* Animated gradient border */}
            <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                    background: "linear-gradient(90deg, hsl(var(--primary)/0.4), hsl(280,80%,60%,0.4), hsl(var(--primary)/0.4))",
                    backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
            <div className="relative rounded-xl bg-background/95 backdrop-blur-xl border border-white/5 shadow-sm p-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center mask-wavy bg-primary/10">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                            Deep Thinking
                            {duration && (
                                <span className="text-muted-foreground font-normal">({duration.toFixed(1)}s)</span>
                            )}
                        </p>
                        {isAnimating && <BrainWaves />}
                    </div>
                    {!isAnimating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-medium"
                        >
                            <Zap className="h-3 w-3" />Complete
                        </motion.div>
                    )}
                </div>

                {/* Thinking text */}
                <div className="relative pl-6">
                    <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent rounded-full" />

                    {isAnimating && text ? (
                        <div className="text-xs text-muted-foreground/80 font-mono leading-relaxed whitespace-pre-wrap max-h-24 overflow-hidden">
                            {displayText}
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.7 }}
                                className="inline-block w-[2px] h-3 bg-primary/60 ml-0.5 align-middle"
                            />
                        </div>
                    ) : (
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <div className={cn("font-mono text-xs text-muted-foreground/80 leading-relaxed whitespace-pre-wrap", !isExpanded && "line-clamp-3")}>
                                {displayText}
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] mt-2 text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                >
                                    {isExpanded ? "Show less" : "Show more"}
                                    <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isExpanded && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
