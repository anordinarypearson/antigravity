"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Globe, ExternalLink, Sparkles, Shield, BookOpen,
    ArrowRight,  Copy, Check, Clock, TrendingUp,
    X, Zap, ChevronRight, RotateCcw, Mic, MicOff,
    Image as ImageIcon, Hash, Star, ArrowUpRight,
    Newspaper, Brain, Lightbulb, RefreshCw, Share2,
    ThumbsUp, ThumbsDown, Bookmark, Filter, LayoutGrid,
    List, Eye, Timer, AlertCircle, ChevronDown, ChevronUp,
    Compass, MousePointerClick, Flame, Wand2 } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

// ─── TYPES ────────────────────────────────────────────────────
type ScrapedSource = {
    title: string; url: string; snippet: string; domain: string; favicon?: string;
    wordCount: number; headings: string[]; links: { text: string; url: string }[];
    meta?: { description?: string; author?: string; publishedDate?: string; ogImage?: string };
    qualityScore: number; trustScore: number; readingTimeMin: number;
    contentType: 'article' | 'docs' | 'forum' | 'wiki' | 'news' | 'other'; scrapeTimeMs: number;
};

type WebScraperOutput = {
    answer: string; quickSummary: string; keyTakeaways: string[]; relatedQuestions: string[];
    sources: ScrapedSource[]; responseTime: number;
    stats: {
        totalSourcesFound: number; sourcesScraped: number; totalWords: number;
        averageResponseMs: number; averageQuality: number;
        searchEngines: { duckduckgo: number; brave: number; wikipedia: number; googleNews: number };
    };
    error?: string;
};

type SearchHistoryItem = { query: string; timestamp: number; resultCount: number };

// ─── CONSTANTS ────────────────────────────────────────────────
const SEARCH_HISTORY_KEY = 'searnai_search_history';
const MAX_HISTORY = 15;

const TRENDING_QUERIES = [
    { query: "Latest AI breakthroughs 2026", icon: Brain, color: "from-violet-500 to-purple-600" },
    { query: "World news today", icon: Newspaper, color: "from-blue-500 to-cyan-600" },
    { query: "Best programming languages", icon: Hash, color: "from-emerald-500 to-teal-600" },
    { query: "Space exploration news", icon: Star, color: "from-amber-500 to-orange-600" },
];

const QUICK_CHIPS = [
    { query: "What is quantum computing?", icon: "⚛️" },
    { query: "Today's top news", icon: "📰" },
    { query: "Best React frameworks 2026", icon: "⚡" },
    { query: "How does AI work?", icon: "🤖" },
    { query: "Latest tech innovations", icon: "🔬" },
    { query: "Climate change updates", icon: "🌍" },
];

const SEARCH_LOADING_STAGES = [
    { text: "Searching 5 engines...", sub: "DuckDuckGo • Brave • Bing • Wikipedia • Google News", progress: 15, icon: Search },
    { text: "Scraping top sources...", sub: "Extracting content from web pages", progress: 40, icon: Globe },
    { text: "Analyzing quality...", sub: "Trust scoring • Deduplication • Quality checks", progress: 65, icon: Shield },
    { text: "Synthesizing answer...", sub: "Building AI-powered response", progress: 90, icon: Sparkles },
];

const CATEGORY_FILTERS = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'article', label: 'Articles', icon: BookOpen },
    { id: 'wiki', label: 'Wiki', icon: Globe },
    { id: 'docs', label: 'Docs', icon: Hash },
];

// ─── SEARCH HISTORY HELPERS ───────────────────────────────────
function getSearchHistory(): SearchHistoryItem[] {
    try { const raw = localStorage.getItem(SEARCH_HISTORY_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function addToHistory(query: string, resultCount: number) {
    try {
        const history = getSearchHistory().filter(h => h.query.toLowerCase() !== query.toLowerCase());
        history.unshift({ query, timestamp: Date.now(), resultCount });
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch { }
}
function clearHistory() {
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch { }
}

// ─── SIMPLE MARKDOWN RENDERER ────────────────────────────────
function RichMarkdown({ children }: { children: string }) {
    if (!children) return null;
    const lines = children.split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={i} />;
                if (trimmed.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 text-foreground">{trimmed.slice(4)}</h4>;
                if (trimmed.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-4 text-foreground">{trimmed.slice(3)}</h3>;
                if (trimmed.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 text-foreground">{trimmed.slice(2)}</h2>;
                if (trimmed.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-primary/40 pl-4 py-1.5 text-sm text-foreground/80 italic bg-primary/5 rounded-r-lg">{trimmed.slice(2)}</blockquote>;
                if (trimmed.startsWith('---')) return <hr key={i} className="border-border/30 my-3" />;
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) return <p key={i} className="text-sm pl-3 flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" /><span>{trimmed.slice(2)}</span></p>;
                if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) return <p key={i} className="text-xs text-muted-foreground italic">{trimmed.slice(1, -1)}</p>;

                const parts = trimmed.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
                if (parts.length > 1) {
                    return <p key={i} className="text-sm leading-relaxed">{parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (linkMatch) return <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">{linkMatch[1]}<ArrowUpRight className="h-3 w-3" /></a>;
                        return part;
                    })}</p>;
                }
                return <p key={i} className="text-sm leading-relaxed text-foreground/90">{trimmed}</p>;
            })}
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export function HomeSearchWidget({
    onSearchStarted,
    className,
}: {
    onSearchStarted?: (query: string) => void;
    className?: string;
}) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [result, setResult] = useState<WebScraperOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [expandedSource, setExpandedSource] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFullAnswer, setShowFullAnswer] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [savedQueries, setSavedQueries] = useState<string[]>([]);
    const [answerFeedback, setAnswerFeedback] = useState<'up' | 'down' | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchHistory(getSearchHistory());
        try {
            const saved = localStorage.getItem('searnai_saved_queries');
            if (saved) setSavedQueries(JSON.parse(saved));
        } catch { }
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Voice
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.onresult = (event: any) => {
                    const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
                    setQuery(transcript);
                };
                recognitionRef.current.onend = () => setIsListening(false);
                recognitionRef.current.onerror = () => setIsListening(false);
            }
        }
    }, []);

    const toggleVoice = useCallback(async () => {
        if (!recognitionRef.current) {
            toast({ title: "Not supported", description: "Voice search not supported." });
            return;
        }
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
        else {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                recognitionRef.current.start();
                setIsListening(true);
            } catch {
                toast({ title: "Microphone blocked", description: "Allow microphone access.", variant: "destructive" });
            }
        }
    }, [isListening, toast]);

    // Search
    const handleSearch = useCallback(async (searchQuery?: string) => {
        const q = (searchQuery || query).trim();
        if (!q) return;
        setQuery(q);
        setIsSearching(true);
        setLoadingStage(0);
        setResult(null);
        setError(null);
        setExpandedSource(null);
        setHasSearched(true);
        setShowSuggestions(false);
        setShowFullAnswer(false);
        setAnswerFeedback(null);
        setActiveFilter('all');

        onSearchStarted?.(q);

        let stage = 0;
        loadingIntervalRef.current = setInterval(() => {
            stage = Math.min(stage + 1, SEARCH_LOADING_STAGES.length - 1);
            setLoadingStage(stage);
        }, 2200);

        try {
            const res = await fetch('/api/web-scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, maxSources: 10 }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error || 'Search failed.');
            } else if (json.data) {
                setResult(json.data);
                addToHistory(q, json.data.stats.sourcesScraped);
                setSearchHistory(getSearchHistory());
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        } catch (e: any) {
            setError(e.message || 'Search failed.');
        } finally {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
            setIsSearching(false);
        }
    }, [query, onSearchStarted]);

    // Helpers
    const handleCopyAnswer = () => {
        if (!result?.answer) return;
        navigator.clipboard.writeText(result.answer);
        setCopied(true);
        toast({ title: "Copied!", description: "Answer copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const saveQuery = (q: string) => {
        const updated = savedQueries.includes(q) ? savedQueries.filter(s => s !== q) : [...savedQueries, q];
        setSavedQueries(updated);
        try { localStorage.setItem('searnai_saved_queries', JSON.stringify(updated)); } catch { }
    };

    const handleShare = async () => {
        if (!result) return;
        const text = `${query}\n\n${result.quickSummary}\n\nKey Takeaways:\n${result.keyTakeaways.map(t => `• ${t}`).join('\n')}`;
        try {
            if (navigator.share) await navigator.share({ title: `Search: ${query}`, text });
            else { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: "Results copied." }); }
        } catch { }
    };

    const getTrustColor = (score: number) => score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-blue-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
    const getTrustBg = (score: number) => score >= 85 ? 'bg-emerald-500/10 border-emerald-500/20' : score >= 70 ? 'bg-blue-500/10 border-blue-500/20' : score >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
    const getTrustLabel = (score: number) => score >= 85 ? 'Highly Trusted' : score >= 70 ? 'Trusted' : score >= 50 ? 'Moderate' : 'Low';
    const getContentIcon = (type: string) => {
        switch (type) { case 'news': return Newspaper; case 'wiki': return Globe; case 'docs': return Hash; case 'article': return BookOpen; case 'forum': return Brain; default: return Globe; }
    };

    const filteredSources = result?.sources.filter(s => {
        if (activeFilter === 'all') return s.qualityScore > 10;
        return s.contentType === activeFilter && s.qualityScore > 10;
    }) || [];

    const timeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'just now'; if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; return `${Math.floor(diff / 86400000)}d`;
    };

    const matchingHistory = query.trim()
        ? searchHistory.filter(h => h.query.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
        : searchHistory.slice(0, 5);

    // ═══════════════════════════════════════════════════════════════
    return (
        <div className={cn("w-full max-w-4xl mx-auto", className)}>
            {/* ────────────── SEARCH BAR ────────────── */}
            <div ref={searchContainerRef} className="relative z-20">
                {/* Glow effect behind search bar */}
                <div className={cn(
                    "absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 blur-xl transition-opacity duration-500",
                    isFocused || isSearching ? "opacity-100" : "opacity-0"
                )} />

                <motion.div
                    layout
                    className={cn(
                        "relative rounded-2xl border transition-all duration-500",
                        isSearching
                            ? "border-primary/40 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.4)]"
                            : isFocused
                                ? "border-primary/30 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)]"
                                : "border-border/40 shadow-lg hover:border-border/60 hover:shadow-xl",
                        "bg-background/70 backdrop-blur-2xl"
                    )}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex items-center">
                        <div className="flex items-center justify-center w-14 h-[56px]">
                            {isSearching ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                    <WavyLoader className="h-5 w-5 text-primary" />
                                </motion.div>
                            ) : (
                                <Search className={cn("h-5 w-5 transition-colors", isFocused ? "text-primary" : "text-muted-foreground/50")} />
                            )}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim()) setShowSuggestions(true); }}
                            onFocus={() => { setShowSuggestions(true); setIsFocused(true); }}
                            placeholder="Search the web with AI — get instant answers..."
                            className="flex-1 h-[56px] bg-transparent border-0 text-[15px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
                            disabled={isSearching}
                            autoComplete="off"
                        />

                        <div className="flex items-center gap-1.5 pr-2.5">
                            {query && (
                                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                    className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground/50 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </motion.button>
                            )}
                            <button type="button" onClick={toggleVoice}
                                className={cn("p-2 rounded-full transition-all", isListening ? "bg-red-500/15 text-red-400 animate-pulse" : "hover:bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground")}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>
                            <Button type="submit" disabled={isSearching || !query.trim()} size="sm"
                                className={cn(
                                    "h-10 px-5 rounded-xl font-medium shadow-md transition-all",
                                    "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500 text-white",
                                    "hover:shadow-lg hover:shadow-primary/25"
                                )}
                            >
                                {isSearching ? (
                                    <span className="flex items-center gap-2">
                                        <WavyLoader className="h-4 w-4 animate-spin" />
                                        <span className="text-xs">{SEARCH_LOADING_STAGES[loadingStage].progress}%</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <Wand2 className="h-4 w-4" />
                                        Search
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* ─── SUGGESTIONS DROPDOWN ──────────────────── */}
                    <AnimatePresence>
                        {showSuggestions && !isSearching && !result && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-border/20 overflow-hidden"
                            >
                                <div className="p-3 max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {matchingHistory.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between px-2 mb-2">
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" /> Recent
                                                </span>
                                                <button onClick={() => { clearHistory(); setSearchHistory([]); }}
                                                    className="text-[10px] text-muted-foreground/30 hover:text-destructive transition-colors">Clear</button>
                                            </div>
                                            {matchingHistory.map((item, i) => (
                                                <button key={i} onClick={() => handleSearch(item.query)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 text-left group transition-colors">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                                                    <span className="text-sm text-foreground/70 flex-1 truncate">{item.query}</span>
                                                    <span className="text-[10px] text-muted-foreground/30">{timeAgo(item.timestamp)}</span>
                                                    <ArrowUpRight className="h-3 w-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 px-2 mb-2">
                                            <Flame className="h-3 w-3 text-orange-400" /> Trending
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                            {TRENDING_QUERIES.map((item, i) => (
                                                <button key={i} onClick={() => handleSearch(item.query)}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/40 text-left transition-colors group">
                                                    <div className={cn("h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center", item.color)}>
                                                        <item.icon className="h-3 w-3 text-white" />
                                                    </div>
                                                    <span className="text-sm text-foreground/60 group-hover:text-foreground transition-colors truncate">{item.query}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ─── Quick Chips + Keyboard shortcut ───── */}
                {!hasSearched && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 space-y-3"
                    >
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {QUICK_CHIPS.map((chip, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 + i * 0.05 }}
                                    whileHover={{ scale: 1.04, y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleSearch(chip.query)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium",
                                        "bg-background/50 backdrop-blur-sm border border-border/30",
                                        "text-foreground/60 hover:text-foreground",
                                        "hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10",
                                        "transition-all duration-200"
                                    )}
                                >
                                    <span>{chip.icon}</span>
                                    {chip.query}
                                </motion.button>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/30">
                            <span className="flex items-center gap-1">
                                <MousePointerClick className="h-3 w-3" /> Click to search
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Mic className="h-3 w-3" /> Voice search
                            </span>
                            <span>•</span>
                            <span>Powered by 5 search engines</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ─── LOADING STATE ──────────────────────────────────── */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8 space-y-5"
                    >
                        {/* Animated progress */}
                        <div className="relative">
                            <div className="h-1 rounded-full bg-muted/20 overflow-hidden">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${SEARCH_LOADING_STAGES[loadingStage].progress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        </div>

                        {/* Stage cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {SEARCH_LOADING_STAGES.map((stage, idx) => {
                                const StageIcon = stage.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: idx <= loadingStage ? 1 : 0.3, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                                        className={cn(
                                            "relative p-4 rounded-xl border text-center overflow-hidden transition-all",
                                            idx < loadingStage
                                                ? "bg-emerald-500/5 border-emerald-500/20"
                                                : idx === loadingStage
                                                    ? "bg-primary/5 border-primary/20"
                                                    : "bg-muted/10 border-border/20"
                                        )}
                                    >
                                        {idx === loadingStage && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                                                animate={{ x: ['-100%', '100%'] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                        <div className="relative">
                                            <div className={cn(
                                                "h-8 w-8 mx-auto rounded-lg flex items-center justify-center mb-2",
                                                idx < loadingStage ? "bg-emerald-500/15" : idx === loadingStage ? "bg-primary/15" : "bg-muted/20"
                                            )}>
                                                {idx < loadingStage ? (
                                                    <Check className="h-4 w-4 text-emerald-400" />
                                                ) : idx === loadingStage ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                                                        <StageIcon className="h-4 w-4 text-primary" />
                                                    </motion.div>
                                                ) : (
                                                    <StageIcon className="h-4 w-4 text-muted-foreground/30" />
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-foreground/80 truncate">{stage.text}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-xl bg-muted/10 border border-border/15 p-4 space-y-3 animate-pulse">
                                    <div className="h-3 w-3/4 bg-muted/30 rounded" />
                                    <div className="h-2 w-full bg-muted/20 rounded" />
                                    <div className="h-2 w-2/3 bg-muted/20 rounded" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── ERROR STATE ────────────────────────────────────── */}
            {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-400">Search failed</p>
                        <p className="text-xs text-muted-foreground mt-1">{error}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleSearch()}
                            className="mt-2 h-7 text-xs text-red-400 hover:text-red-300">
                            <RotateCcw className="h-3 w-3 mr-1" /> Try again
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ─── RESULTS ────────────────────────────────────────── */}
            <AnimatePresence>
                {result && !isSearching && (
                    <motion.div
                        ref={resultsRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mt-8 space-y-6"
                    >
                        {/* ─── Result Header ──────────────────── */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/25 to-violet-600/15 flex items-center justify-center border border-primary/10">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">AI-Powered Answer</h3>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        {result.stats.sourcesScraped} sources • {result.stats.totalWords.toLocaleString()} words • {result.responseTime.toFixed(1)}s
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground" onClick={handleShare}>
                                    <Share2 className="h-3 w-3 mr-1.5" /> Share
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground" onClick={() => saveQuery(query)}>
                                    <Bookmark className={cn("h-3 w-3 mr-1.5", savedQueries.includes(query) && "fill-primary text-primary")} />
                                    {savedQueries.includes(query) ? 'Saved' : 'Save'}
                                </Button>
                            </div>
                        </div>

                        {/* ─── Quick Summary ── */}
                        {result.quickSummary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative p-5 rounded-2xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, transparent 50%, hsl(var(--primary) / 0.03) 100%)',
                                    border: '1px solid hsl(var(--primary) / 0.12)',
                                }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                                            <Zap className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Quick Answer</span>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">{result.quickSummary}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Key Takeaways ──────────────────── */}
                        {result.keyTakeaways.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Lightbulb className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Key Takeaways</span>
                                </div>
                                <div className="grid gap-2">
                                    {result.keyTakeaways.map((takeaway, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.06 }}
                                            className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/10 hover:bg-amber-500/[0.08] transition-colors"
                                        >
                                            <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 text-[10px] font-bold flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-foreground/85 leading-relaxed">{takeaway}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Detailed Answer ────────────────── */}
                        {result.answer && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="rounded-2xl border border-border/30 overflow-hidden bg-background/40 backdrop-blur-sm">
                                <div className="flex items-center justify-between p-4 border-b border-border/20 bg-muted/10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                            <BookOpen className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Detailed Analysis</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                            onClick={() => { setAnswerFeedback('up'); toast({ title: "Thanks!", description: "Feedback noted." }); }}>
                                            <ThumbsUp className={cn("h-3 w-3", answerFeedback === 'up' && "fill-emerald-400 text-emerald-400")} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                            onClick={() => { setAnswerFeedback('down'); toast({ title: "Thanks!", description: "We'll improve." }); }}>
                                            <ThumbsDown className={cn("h-3 w-3", answerFeedback === 'down' && "fill-red-400 text-red-400")} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopyAnswer}>
                                            {copied ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </Button>
                                    </div>
                                </div>
                                <div className={cn("p-5 transition-all duration-300 overflow-hidden", !showFullAnswer && "max-h-[280px]")}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                                        <RichMarkdown>{result.answer}</RichMarkdown>
                                    </div>
                                </div>
                                {!showFullAnswer && result.answer.length > 600 && (
                                    <div className="relative">
                                        <div className="absolute -top-16 inset-x-0 h-16 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
                                        <button onClick={() => setShowFullAnswer(true)}
                                            className="relative w-full flex items-center justify-center gap-1.5 py-3 border-t border-border/15 text-xs text-primary hover:bg-primary/5 transition-colors font-medium">
                                            <ChevronDown className="h-3.5 w-3.5" /> Read full analysis
                                        </button>
                                    </div>
                                )}
                                {showFullAnswer && result.answer.length > 600 && (
                                    <button onClick={() => setShowFullAnswer(false)}
                                        className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-border/15 text-xs text-primary hover:bg-primary/5 transition-colors font-medium">
                                        <ChevronUp className="h-3.5 w-3.5" /> Show less
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* ─── Sources ─────────────────────────── */}
                        {result.sources.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <Shield className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                                            Sources ({filteredSources.length})
                                        </span>
                                    </div>
                                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                        className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground/40 transition-colors">
                                        {viewMode === 'grid' ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                                    </button>
                                </div>

                                {/* Filters */}
                                <ScrollArea className="w-full">
                                    <div className="flex gap-1.5 pb-1">
                                        {CATEGORY_FILTERS.map((filter) => {
                                            const count = filter.id === 'all'
                                                ? result.sources.filter(s => s.qualityScore > 10).length
                                                : result.sources.filter(s => s.contentType === filter.id && s.qualityScore > 10).length;
                                            if (count === 0 && filter.id !== 'all') return null;
                                            return (
                                                <button key={filter.id} onClick={() => setActiveFilter(filter.id)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                                                        activeFilter === filter.id
                                                            ? "bg-primary/10 text-primary border border-primary/20"
                                                            : "bg-muted/20 text-muted-foreground/60 hover:bg-muted/40 border border-transparent"
                                                    )}
                                                >
                                                    <filter.icon className="h-3 w-3" /> {filter.label}
                                                    <span className="text-[10px] opacity-50">{count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>

                                {/* Source cards */}
                                <div className={cn(
                                    viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid gap-2"
                                )}>
                                    {filteredSources.slice(0, 8).map((source, i) => {
                                        const ContentIcon = getContentIcon(source.contentType);
                                        const isExpanded = expandedSource === i;
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * i }}
                                                className={cn(
                                                    "rounded-xl border transition-all duration-200 cursor-pointer",
                                                    isExpanded
                                                        ? "bg-background/70 border-primary/20 shadow-lg shadow-primary/5"
                                                        : "bg-background/30 border-border/20 hover:bg-background/50 hover:border-border/40 hover:shadow-md"
                                                )}
                                                onClick={() => setExpandedSource(isExpanded ? null : i)}
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            {source.favicon ? (
                                                                <img src={source.favicon} alt="" className="h-5 w-5 rounded"
                                                                    onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                            ) : (
                                                                <ContentIcon className="h-5 w-5 text-muted-foreground/40" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{source.title}</h4>
                                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                <span className="text-[11px] text-muted-foreground/60">{source.domain}</span>
                                                                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border", getTrustBg(source.trustScore), getTrustColor(source.trustScore))}>
                                                                    {getTrustLabel(source.trustScore)}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">
                                                                    <ContentIcon className="h-2.5 w-2.5" /> {source.contentType}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-muted-foreground/20 transition-transform flex-shrink-0",
                                                            isExpanded && "rotate-90 text-primary/50"
                                                        )} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-border/15 space-y-3 overflow-hidden">
                                                                <p className="text-xs text-muted-foreground leading-relaxed">{source.snippet}</p>
                                                                {source.meta?.ogImage && (
                                                                    <img src={source.meta.ogImage} alt="" className="w-full h-32 object-cover rounded-lg border border-border/15"
                                                                        onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                                )}
                                                                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/50">
                                                                    {source.meta?.author && <span>By {source.meta.author}</span>}
                                                                    {source.meta?.publishedDate && <span>{new Date(source.meta.publishedDate).toLocaleDateString()}</span>}
                                                                    {source.wordCount > 0 && <span>{source.wordCount.toLocaleString()} words</span>}
                                                                    {source.readingTimeMin > 0 && <span>{source.readingTimeMin}m read</span>}
                                                                </div>
                                                                <a href={source.url} target="_blank" rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <ExternalLink className="h-3 w-3" /> Visit source
                                                                </a>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Related Questions ──────────────── */}
                        {result.relatedQuestions.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                        <Compass className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">People Also Ask</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {result.relatedQuestions.map((q, i) => (
                                        <motion.button key={i}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.06 }}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSearch(q)}
                                            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-background/30 border border-border/20 text-left hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all group"
                                        >
                                            <Search className="h-3.5 w-3.5 text-cyan-400/50 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                                            <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">{q}</span>
                                            <ArrowUpRight className="h-3 w-3 text-muted-foreground/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Stats & Actions ─────────────── */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 border-t border-border/15">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/40">
                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{result.stats.sourcesScraped}/{result.stats.totalSourcesFound} sources</span>
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{result.stats.totalWords.toLocaleString()} words</span>
                                <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{result.responseTime.toFixed(1)}s</span>
                                <span className="flex items-center gap-1"><Star className="h-3 w-3" />Quality: {result.stats.averageQuality}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-muted-foreground/50 hover:text-foreground"
                                    onClick={() => { setResult(null); setHasSearched(false); setQuery(''); inputRef.current?.focus(); }}>
                                    <X className="h-3 w-3 mr-1" /> Clear
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-muted-foreground/50 hover:text-foreground"
                                    onClick={() => handleSearch()}>
                                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
