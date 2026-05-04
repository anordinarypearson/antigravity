
"use client";

import { ChevronDown, Brain, Zap, Search, Globe } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Collapsible, CollapsibleTrigger } from "./ui/collapsible";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// ─── Status labels that cycle for the thinking state ──────────────────────────
const THINKING_LABELS = [
    "Thinking…",
    "Analyzing…",
    "Processing…",
];

const DEEP_THINKING_LABELS = [
    "Analyzing multiple factors…",
    "Evaluating context…",
    "Reasoning through the problem…",
];

const SEARCH_LABELS = [
    "Searching the web…",
    "Fetching results…",
    "Reading sources…",
    "Synthesizing answer…",
];

// ─── Minimal progress dots (no blink, just opacity fade) ──────────────────────
function ProgressDots() {
    return (
        <span className="inline-flex items-center gap-0.5 ml-1.5" aria-hidden="true">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="block w-1 h-1 rounded-full bg-muted-foreground/50"
                    style={{
                        animation: `thinking-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
        </span>
    );
}

// ─── Search progress ──────────────────────────────────────────────────────────
function SearchingStatus() {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStage(s => (s + 1) % SEARCH_LABELS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2.5 py-2.5 px-3">
            <Globe className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
            <div className="flex flex-col gap-1 min-w-0">
                <p className="text-sm text-foreground/80 font-medium leading-none">
                    {SEARCH_LABELS[stage]}
                </p>
                {/* Simple linear progress bar */}
                <div className="flex gap-0.5 w-full max-w-[180px]">
                    {SEARCH_LABELS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-0.5 flex-1 rounded-full transition-colors duration-500",
                                i <= stage ? "bg-foreground/30" : "bg-muted/40"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Summarize thinking text to a single line ─────────────────────────────────
function summarizeThinking(text: string): string {
    if (!text) return "";
    // Take the first meaningful sentence/line, cap at ~80 chars
    const firstLine = text.split(/[\n.!?]/).find(s => s.trim().length > 10)?.trim() || text.trim();
    if (firstLine.length <= 80) return firstLine;
    return firstLine.slice(0, 77) + "…";
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
    const [labelIndex, setLabelIndex] = useState(0);

    const effectiveIsDeepThink = isDeepThink || !!text;

    useEffect(() => {
        if (duration !== null) {
            const totalDuration = duration * 1000 + 500;
            const timer = setTimeout(() => setIsAnimating(false), totalDuration);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(true);
        }
    }, [duration]);

    // Cycle through labels while animating
    useEffect(() => {
        if (!isAnimating) return;
        const labels = effectiveIsDeepThink ? DEEP_THINKING_LABELS : THINKING_LABELS;
        const interval = setInterval(() => {
            setLabelIndex(i => (i + 1) % labels.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isAnimating, effectiveIsDeepThink]);

    const statusLabels = effectiveIsDeepThink ? DEEP_THINKING_LABELS : THINKING_LABELS;
    const summary = useMemo(() => text ? summarizeThinking(text) : null, [text]);

    // ── Searching mode ────────────────────────────────────────────────────────
    if (isSearching) {
        return (
            <div className="rounded-lg border border-border/40 bg-muted/20 mb-3">
                <SearchingStatus />
            </div>
        );
    }

    // ── Normal thinking (non-DeepThink) ──────────────────────────────────────
    if (!effectiveIsDeepThink) {
        return (
            <div className="flex items-center gap-2 py-3 pl-1 text-muted-foreground">
                <span className="text-sm font-medium">
                    {isAnimating ? statusLabels[labelIndex] : "Done"}
                </span>
                {isAnimating && <ProgressDots />}
            </div>
        );
    }

    // ── DeepThink mode — single-line summary, expandable ─────────────────────
    return (
        <div className="rounded-lg border border-border/30 bg-muted/10 mb-3 p-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-foreground/70">
                        {isAnimating ? statusLabels[labelIndex] : "Thought complete"}
                    </span>
                    {isAnimating && <ProgressDots />}
                    {duration && !isAnimating && (
                        <span className="text-xs text-muted-foreground/60 ml-1">
                            ({duration.toFixed(1)}s)
                        </span>
                    )}
                </div>
                {!isAnimating && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500/80 font-medium">
                        <Zap className="h-3 w-3" />Done
                    </span>
                )}
            </div>

            {/* Summary line — only one line, no raw chain-of-thought */}
            {summary && (
                <div className="mt-2 pl-5.5">
                    <p className="text-xs text-muted-foreground/70 leading-relaxed truncate">
                        {summary}
                    </p>
                    {/* Expandable full text (collapsed by default) */}
                    {text && text.length > 80 && !isAnimating && (
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            {isExpanded && (
                                <div className="mt-2 text-xs text-muted-foreground/60 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {text}
                                </div>
                            )}
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-[10px] mt-1 text-muted-foreground/50 hover:text-foreground hover:bg-transparent"
                                >
                                    {isExpanded ? "Hide" : "Show reasoning"}
                                    <ChevronDown className={cn("h-3 w-3 ml-0.5 transition-transform", isExpanded && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                </div>
            )}
        </div>
    );
}
