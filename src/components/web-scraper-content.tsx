"use client";

import { useState, useCallback, FormEvent, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2, Search, ExternalLink, Clock, AlertCircle, Copy, Check,
    Globe, BarChart3, FileText, Link2, ChevronDown, ChevronUp,
    Sparkles, Zap, X, History, ArrowRight, BookOpen, Hash,
    Shield, Download, Star, TrendingUp, Lightbulb, Timer,
    Database, Layers, Award, Activity, Eye, RefreshCw,
    Info, ChevronLeft, ChevronRight, Newspaper
} from "lucide-react";
import { webScraperAction, WebScraperOutput, ScrapedSource } from "@/app/web-scraper";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const SEARCH_HISTORY_KEY = 'webScraperHistory';
const MAX_HISTORY = 15;

const CONTENT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    article: { icon: <FileText className="h-3 w-3" />, label: 'Article', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    docs: { icon: <BookOpen className="h-3 w-3" />, label: 'Docs', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    forum: { icon: <Layers className="h-3 w-3" />, label: 'Forum', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    wiki: { icon: <Globe className="h-3 w-3" />, label: 'Wiki', color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
    news: { icon: <Newspaper className="h-3 w-3" />, label: 'News', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    other: { icon: <Globe className="h-3 w-3" />, label: 'Web', color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/20' },
};

const LOADING_STAGES = [
    { text: "Querying 5 search engines...", icon: <Search className="h-4 w-4" />, sub: "DuckDuckGo • Brave • Wikipedia • Google News • Bing" },
    { text: "Scraping 12 web pages...", icon: <Globe className="h-4 w-4" />, sub: "Parallel fetching & parsing" },
    { text: "Extracting content & images...", icon: <Layers className="h-4 w-4" />, sub: "Headings, text, OG images, AI fallbacks" },
    { text: "Scoring & ranking sources...", icon: <Shield className="h-4 w-4" />, sub: "Quality + trust analysis" },
    { text: "Synthesizing answer...", icon: <Sparkles className="h-4 w-4" />, sub: "Building response with takeaways" },
];

export function WebScraperContent() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<WebScraperOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [expandedSource, setExpandedSource] = useState<number | null>(null);
    const [searchHistory, setSearchHistory] = useState<{ query: string; timestamp: number }[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingStageIndex, setLoadingStageIndex] = useState(0);
    const [showTakeaways, setShowTakeaways] = useState(true);
    const [sortBy, setSortBy] = useState<'quality' | 'speed' | 'words'>('quality');
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'summary' | 'answer' | 'sources'>('summary');
    const [expandAll, setExpandAll] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
            if (e.key === 'Escape' && document.activeElement === inputRef.current) { setQuery(''); inputRef.current?.blur(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (saved) setSearchHistory(JSON.parse(saved));
        } catch { }
    }, []);

    useEffect(() => {
        if (loading) {
            setElapsedTime(0);
            const interval = setInterval(() => setElapsedTime(p => p + 0.1), 100);
            return () => clearInterval(interval);
        }
    }, [loading]);

    const saveToHistory = useCallback((q: string) => {
        setSearchHistory(prev => {
            const updated = [{ query: q, timestamp: Date.now() }, ...prev.filter(h => h.query !== q)].slice(0, MAX_HISTORY);
            try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)); } catch { }
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setSearchHistory([]);
        try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch { }
    }, []);

    const EXAMPLE_QUERIES = [
        { icon: "🔬", text: "How does quantum computing work?", cat: "Science" },
        { icon: "🚀", text: "Latest features in Next.js 15", cat: "Tech" },
        { icon: "🧠", text: "What is artificial general intelligence?", cat: "AI" },
        { icon: "🌍", text: "Climate change effects on oceans", cat: "Environment" },
        { icon: "💻", text: "React performance best practices", cat: "Dev" },
        { icon: "🏏", text: "Who won the 2024 T20 World Cup?", cat: "Sports" },
    ];

    const handleCopy = (text?: string) => {
        const content = text || result?.answer || '';
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleExportMarkdown = () => {
        if (!result) return;
        const md = [
            `# Web Scraper Results: ${query}`,
            `*Generated on ${new Date().toLocaleString()}*\n`,
            `## Quick Summary\n${result.quickSummary}`,
            `\n## Key Takeaways`,
            ...(result.keyTakeaways?.map(t => `- ${t}`) || []),
            `\n## Detailed Answer\n${result.answer}`,
            `\n## Sources (${result.sources.length})`,
            ...result.sources.map((s, i) =>
                `${i + 1}. [${s.title}](${s.url}) — ${s.domain} | ${s.wordCount} words | Quality: ${s.qualityScore}/100`
            ),
            `\n---`,
            `${result.responseTime.toFixed(1)}s | ${result.stats.sourcesScraped}/${result.stats.totalSourcesFound} scraped | ${result.stats.totalWords.toLocaleString()} words`,
        ].join('\n');
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scraper-${query.slice(0, 30).replace(/\s+/g, '-')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setExpandedSource(null);
        setShowHistory(false);
        setLoadingStageIndex(0);
        setCarouselIndex(0);

        let stageIdx = 0;
        loadingTimerRef.current = setInterval(() => {
            stageIdx++;
            if (stageIdx < LOADING_STAGES.length) setLoadingStageIndex(stageIdx);
        }, 1000);

        try {
            const response = await webScraperAction({ query: trimmed, maxSources: 12 });
            if (response.error) setError(response.error);
            else if (response.data) { setResult(response.data); saveToHistory(trimmed); }
        } catch (err: any) { setError(err.message || "An unexpected error occurred"); }
        finally {
            setLoading(false);
            setLoadingStageIndex(0);
            if (loadingTimerRef.current) { clearInterval(loadingTimerRef.current); loadingTimerRef.current = null; }
        }
    };

    const handleExampleClick = (text: string) => {
        setQuery(text);
        setTimeout(() => { (document.getElementById('scraper-form') as HTMLFormElement)?.requestSubmit(); }, 100);
    };

    const getResponseTimeColor = (t: number) => t < 3 ? "text-emerald-500" : t < 6 ? "text-amber-500" : "text-orange-500";
    const getResponseTimeBg = (t: number) => t < 3 ? "bg-emerald-500/10 border-emerald-500/20" : t < 6 ? "bg-amber-500/10 border-amber-500/20" : "bg-orange-500/10 border-orange-500/20";
    const getQualityColor = (s: number) => s >= 80 ? "text-emerald-500" : s >= 60 ? "text-blue-500" : s >= 40 ? "text-amber-500" : "text-red-500";
    const getQualityBg = (s: number) => s >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 60 ? "bg-blue-500/10 border-blue-500/20" : s >= 40 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

    // Confidence score: how many sources scraped vs found + avg quality
    const confidenceScore = useMemo(() => {
        if (!result) return 0;
        const scrapeRatio = result.stats.sourcesScraped / Math.max(result.stats.totalSourcesFound, 1);
        const qualityFactor = result.stats.averageQuality / 100;
        const sourceBonus = Math.min(result.stats.sourcesScraped / 8, 1);
        return Math.round((scrapeRatio * 30 + qualityFactor * 40 + sourceBonus * 30));
    }, [result]);

    const getConfidenceLabel = (s: number) => s >= 80 ? 'High' : s >= 55 ? 'Medium' : 'Low';
    const getConfidenceColor = (s: number) => s >= 80 ? 'text-emerald-500' : s >= 55 ? 'text-amber-500' : 'text-red-500';

    // Answer reading time
    const answerReadingTime = useMemo(() => {
        if (!result?.answer) return 0;
        return Math.max(1, Math.round(result.answer.split(/\s+/).length / 200));
    }, [result?.answer]);

    // Sources with OG images for the carousel
    const sourcesWithImages = useMemo(() => {
        if (!result?.sources) return [];
        return result.sources.filter(s => s.meta?.ogImage);
    }, [result?.sources]);

    // Sorted sources for the list
    const sortedSources = useMemo(() => {
        if (!result?.sources) return [];
        const sources = [...result.sources];
        switch (sortBy) {
            case 'quality': return sources.sort((a, b) => b.qualityScore - a.qualityScore);
            case 'speed': return sources.sort((a, b) => a.scrapeTimeMs - b.scrapeTimeMs);
            case 'words': return sources.sort((a, b) => b.wordCount - a.wordCount);
            default: return sources;
        }
    }, [result?.sources, sortBy]);

    const formatTimeAgo = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    // Carousel navigation
    const CAROUSEL_VISIBLE = 3;
    const canScrollLeft = carouselIndex > 0;
    const canScrollRight = carouselIndex + CAROUSEL_VISIBLE < sourcesWithImages.length;

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-b from-primary/5 via-background to-background">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-10 right-1/4 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

                <header className="relative px-4 md:px-6 lg:px-8 pt-8 pb-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                                <Globe className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Web Intelligence</span>
                                <span className="text-[10px] font-medium text-primary/60 border-l border-primary/20 pl-2">v2.0</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">
                                Web Scraper
                            </h1>
                            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                                Scrapes <span className="text-primary font-semibold">10-12 sources</span> across{' '}
                                <span className="font-medium">DuckDuckGo</span>, <span className="text-violet-500 font-medium">Brave</span>,{' '}
                                <span className="text-blue-500 font-medium">Wikipedia</span>,{' '}
                                <span className="text-rose-500 font-medium">Google News</span> &{' '}
                                <span className="text-cyan-500 font-medium">Bing</span> in under 5 seconds.
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">Ctrl+K to focus • Enter to scrape</p>
                        </div>

                        {/* Search Form */}
                        <form id="scraper-form" onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/10 to-primary/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center gap-2 bg-background border rounded-xl shadow-lg group-focus-within:border-primary/50 transition-colors">
                                    <Search className="ml-4 h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <Input
                                        ref={inputRef}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onFocus={() => searchHistory.length > 0 && !query && setShowHistory(true)}
                                        onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                        placeholder="Ask anything — scrapes 12 sources in parallel..."
                                        className="flex-1 h-12 text-base border-0 shadow-none focus-visible:ring-0 bg-transparent"
                                        disabled={loading}
                                    />
                                    {query && !loading && (
                                        <button type="button" onClick={() => setQuery('')} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <Button type="submit" size="sm" className="mr-2 rounded-lg h-9 px-4 font-semibold gap-2" disabled={loading || !query.trim()}>
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-3.5 w-3.5" /> Scrape</>}
                                    </Button>
                                </div>

                                {/* Search History */}
                                <AnimatePresence>
                                    {showHistory && searchHistory.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                            className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border rounded-xl shadow-xl overflow-hidden backdrop-blur-xl"
                                        >
                                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><History className="h-3 w-3" /> Recent</span>
                                                <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Clear</button>
                                            </div>
                                            {searchHistory.slice(0, 6).map((h, i) => (
                                                <button key={i} onClick={() => { setQuery(h.query); setShowHistory(false); }}
                                                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                                                >
                                                    <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate flex-1">{h.query}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{formatTimeAgo(h.timestamp)}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </form>
                    </div>
                </header>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-12">
                <AnimatePresence mode="wait">
                    {/* ═══ LOADING ═══ */}
                    {loading && (
                        <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-12">
                            <div className="flex flex-col items-center gap-8">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 via-violet-500/10 to-primary/5 flex items-center justify-center border border-primary/10">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                                            <Globe className="h-8 w-8 text-primary" />
                                        </motion.div>
                                    </div>
                                    <div className="absolute -inset-3 rounded-3xl border-2 border-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                                </div>

                                <p className="text-xs text-muted-foreground font-mono tabular-nums">{elapsedTime.toFixed(1)}s elapsed</p>

                                <div className="w-full max-w-md space-y-2">
                                    {LOADING_STAGES.map((stage, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: i <= loadingStageIndex ? 1 : 0.3, x: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.3 }}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-500",
                                                i === loadingStageIndex ? "bg-primary/5 border-primary/20 shadow-sm"
                                                    : i < loadingStageIndex ? "bg-emerald-500/5 border-emerald-500/10"
                                                        : "bg-transparent border-transparent"
                                            )}
                                        >
                                            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                                i === loadingStageIndex ? "bg-primary/10 text-primary"
                                                    : i < loadingStageIndex ? "bg-emerald-500/10 text-emerald-500" : "text-muted-foreground/30"
                                            )}>
                                                {i < loadingStageIndex ? <Check className="h-3.5 w-3.5" />
                                                    : i === loadingStageIndex ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>{stage.icon}</motion.div>
                                                        : stage.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn("text-sm font-medium", i <= loadingStageIndex ? "text-foreground" : "text-muted-foreground/40")}>{stage.text}</p>
                                                <p className={cn("text-[10px]", i <= loadingStageIndex ? "text-muted-foreground" : "text-muted-foreground/20")}>{stage.sub}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="w-full max-w-md h-1 bg-muted rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${Math.min(95, (loadingStageIndex + 1) / LOADING_STAGES.length * 100)}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ ERROR ═══ */}
                    {error && !loading && (
                        <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-6">
                            <Card className="border-destructive/30 bg-destructive/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><AlertCircle className="h-5 w-5 text-destructive" /></div>
                                        <div>
                                            <p className="font-semibold text-destructive">Something went wrong</p>
                                            <p className="text-sm text-destructive/80 mt-1">{error}</p>
                                            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => { setError(null); handleSubmit(); }}><RefreshCw className="h-3.5 w-3.5" /> Retry</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ═══ RESULTS ═══ */}
                    {result && !loading && (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 py-4">

                            {/* ── Stats Dashboard ── */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", getResponseTimeBg(result.responseTime))}>
                                    <Timer className={cn("h-3 w-3", getResponseTimeColor(result.responseTime))} />
                                    <span className={getResponseTimeColor(result.responseTime)}>{result.responseTime.toFixed(1)}s</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 border border-primary/10 text-primary">
                                    <Globe className="h-3 w-3" />
                                    {result.stats.sourcesScraped}/{result.stats.totalSourcesFound} scraped
                                </div>
                                {result.stats.totalWords > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted border border-border/50 text-muted-foreground">
                                        <FileText className="h-3 w-3" />{result.stats.totalWords.toLocaleString()} words
                                    </div>
                                )}
                                {result.stats.averageQuality > 0 && (
                                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", getQualityBg(result.stats.averageQuality))}>
                                        <Award className={cn("h-3 w-3", getQualityColor(result.stats.averageQuality))} />
                                        <span className={getQualityColor(result.stats.averageQuality)}>Q:{result.stats.averageQuality}</span>
                                    </div>
                                )}
                                {result.stats.searchEngines && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/5 border border-violet-500/10 text-violet-600 dark:text-violet-400">
                                        <Database className="h-3 w-3" />
                                        {result.stats.searchEngines.duckduckgo > 0 && <span>DDG:{result.stats.searchEngines.duckduckgo}</span>}
                                        {result.stats.searchEngines.brave > 0 && <span>Brave:{result.stats.searchEngines.brave}</span>}
                                        {result.stats.searchEngines.wikipedia > 0 && <span>Wiki:{result.stats.searchEngines.wikipedia}</span>}
                                        {(result.stats.searchEngines as any).googleNews > 0 && <span>News:{(result.stats.searchEngines as any).googleNews}</span>}
                                        {(result.stats.searchEngines as any).bing > 0 && <span>Bing:{(result.stats.searchEngines as any).bing}</span>}
                                    </div>
                                )}
                                {confidenceScore > 0 && (
                                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border", confidenceScore >= 80 ? "bg-emerald-500/5 border-emerald-500/10" : confidenceScore >= 55 ? "bg-amber-500/5 border-amber-500/10" : "bg-red-500/5 border-red-500/10")}>
                                        <Activity className={cn("h-3 w-3", getConfidenceColor(confidenceScore))} />
                                        <span className={getConfidenceColor(confidenceScore)}>{getConfidenceLabel(confidenceScore)} Confidence</span>
                                    </div>
                                )}
                                {answerReadingTime > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 border border-border/30 text-muted-foreground">
                                        <BookOpen className="h-3 w-3" />{answerReadingTime}m read
                                    </div>
                                )}
                            </div>

                            {/* ── Tab Navigation ── */}
                            <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/30 max-w-md mx-auto">
                                {([
                                    { key: 'summary' as const, icon: <Lightbulb className="h-3.5 w-3.5" />, label: 'Summary' },
                                    { key: 'answer' as const, icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Full Answer' },
                                    { key: 'sources' as const, icon: <BookOpen className="h-3.5 w-3.5" />, label: `Sources (${result.sources.length})` },
                                ]).map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={cn("flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                                            activeTab === tab.key ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"
                                        )}>{tab.icon}{tab.label}</button>
                                ))}
                            </div>

                            {/* ═══ SUMMARY TAB ═══ */}
                            {(activeTab === 'summary' || activeTab === 'answer') && sourcesWithImages.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Newspaper className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Top Coverage</h3>
                                        <span className="text-xs text-muted-foreground">({sourcesWithImages.length} with images)</span>
                                    </div>

                                    <div className="relative">
                                        {/* Carousel track */}
                                        <div className="overflow-hidden rounded-xl">
                                            <motion.div
                                                className="flex gap-3"
                                                animate={{ x: -carouselIndex * (100 / CAROUSEL_VISIBLE + 1.2) + '%' }}
                                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                                                style={{ width: `${(sourcesWithImages.length / CAROUSEL_VISIBLE) * 100}%` }}
                                            >
                                                {sourcesWithImages.map((source, i) => (
                                                    <a
                                                        key={source.url}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 group cursor-pointer"
                                                        style={{ width: `calc(${100 / sourcesWithImages.length * (sourcesWithImages.length / CAROUSEL_VISIBLE)}% - 12px)` }}
                                                    >
                                                        <div className="relative rounded-xl overflow-hidden border border-border/40 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                                                            {/* OG Image */}
                                                            <div className="relative h-36 overflow-hidden bg-muted">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={source.meta?.ogImage}
                                                                    alt={source.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x200/1a1a2e/eee?text=${encodeURIComponent(source.domain)}`; }}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                                                {/* Content type badge overlay */}
                                                                {source.contentType && (
                                                                    <div className="absolute top-2 left-2">
                                                                        <Badge variant="secondary" className={cn("text-[9px] h-4 px-1.5 backdrop-blur-sm bg-black/40 text-white border-0")}>
                                                                            {CONTENT_TYPE_CONFIG[source.contentType]?.label || 'Web'}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Source info */}
                                                            <div className="p-3 space-y-2">
                                                                {/* Favicon + Domain */}
                                                                <div className="flex items-center gap-1.5">
                                                                    {source.favicon && (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img src={source.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                                    )}
                                                                    <span className="text-[10px] font-medium text-muted-foreground">{source.domain}</span>
                                                                </div>

                                                                {/* Title */}
                                                                <h4 className="text-xs font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                                                    {source.title}
                                                                </h4>

                                                                {/* Date */}
                                                                {source.meta?.publishedDate ? (
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        {new Date(source.meta.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[10px] text-muted-foreground">Recent</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </motion.div>
                                        </div>

                                        {/* Nav arrows */}
                                        {canScrollLeft && (
                                            <button
                                                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur border shadow-lg flex items-center justify-center hover:bg-background transition-colors z-10"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canScrollRight && (
                                            <button
                                                onClick={() => setCarouselIndex(Math.min(sourcesWithImages.length - CAROUSEL_VISIBLE, carouselIndex + 1))}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur border shadow-lg flex items-center justify-center hover:bg-background transition-colors z-10"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Quick Summary (TL;DR) ── */}
                            {activeTab === 'summary' && result.quickSummary && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 overflow-hidden">
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Lightbulb className="h-4 w-4 text-primary" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">TL;DR</p>
                                                    <p className="text-sm text-foreground/80 leading-relaxed">{result.quickSummary}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* ── Key Takeaways ── */}
                            {activeTab === 'summary' && result.keyTakeaways && result.keyTakeaways.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                    <div className="cursor-pointer" onClick={() => setShowTakeaways(!showTakeaways)}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="h-4 w-4 text-amber-500" />
                                            <h3 className="text-sm font-semibold">Key Takeaways</h3>
                                            <span className="text-xs text-muted-foreground">({result.keyTakeaways.length})</span>
                                            {showTakeaways ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {showTakeaways && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="grid gap-2">
                                                    {result.keyTakeaways.map((takeaway, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
                                                        >
                                                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{i + 1}</span>
                                                            </div>
                                                            <p className="text-sm text-foreground/80 leading-relaxed">{takeaway}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ── Full Answer ── */}
                            {(activeTab === 'summary' || activeTab === 'answer') && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card className="border-border/40 shadow-lg overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-primary/20" />
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/10 flex items-center justify-center border border-primary/10"><Sparkles className="h-4 w-4 text-primary" /></div>
                                            <div>
                                                <CardTitle className="text-lg">Detailed Answer</CardTitle>
                                                <CardDescription className="text-xs">From {result.stats?.sourcesScraped || 0} scraped sources</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleCopy()} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Copy">
                                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={handleExportMarkdown} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Export MD">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose dark:prose-invert prose-sm max-w-none
                                            prose-headings:font-semibold prose-headings:text-foreground
                                            prose-p:text-foreground/80 prose-p:leading-relaxed
                                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                            prose-strong:text-foreground prose-strong:font-semibold
                                            prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
                                            prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                        ">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>}

                            {/* ── Sources List ── */}
                            {(activeTab === 'summary' || activeTab === 'sources') && result.sources.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> All Sources ({result.sources.length})</h2>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setExpandAll(!expandAll)}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mr-1"
                                            >{expandAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}{expandAll ? 'Collapse All' : 'Expand All'}</button>
                                            <span className="text-[10px] text-muted-foreground mr-1">Sort:</span>
                                            {([
                                                { key: 'quality' as const, icon: <Award className="h-3 w-3" />, label: 'Quality' },
                                                { key: 'speed' as const, icon: <Zap className="h-3 w-3" />, label: 'Speed' },
                                                { key: 'words' as const, icon: <FileText className="h-3 w-3" />, label: 'Words' },
                                            ]).map(opt => (
                                                <button key={opt.key} onClick={() => setSortBy(opt.key)}
                                                    className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                                                        sortBy === opt.key ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    )}>{opt.icon}{opt.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {sortedSources.map((source, index) => (
                                            <SourceCard key={source.url} source={source} index={index}
                                                isExpanded={expandAll || expandedSource === index} onToggle={() => setExpandedSource(expandedSource === index ? null : index)} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Related Questions ── */}
                            {result.relatedQuestions && result.relatedQuestions.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Related Questions</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {result.relatedQuestions.map((rq, i) => (
                                            <button key={i} onClick={() => { setQuery(rq.replace(/\?$/, '')); setTimeout(() => { (document.getElementById('scraper-form') as HTMLFormElement)?.requestSubmit(); }, 100); }}
                                                className="group flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                                            >
                                                <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors truncate">{rq}</span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary ml-auto flex-shrink-0 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ EMPTY STATE ═══ */}
                    {!loading && !result && !error && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12">
                            <div className="text-center mb-10">
                                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-violet-500/10 border border-primary/10 mb-4">
                                    <Search className="h-7 w-7 text-primary" />
                                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-white">12</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold mb-1.5">Scrape 12 sources in seconds</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    3 search engines • parallel scraping • OG image extraction • quality scoring • smart synthesis
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">Try asking</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {EXAMPLE_QUERIES.map((q, i) => (
                                        <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => handleExampleClick(q.text)}
                                            className="group flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                                        >
                                            <span className="text-lg flex-shrink-0">{q.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors block truncate">{q.text}</span>
                                                <span className="text-[10px] text-muted-foreground/50">{q.cat}</span>
                                            </div>
                                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
                                {[
                                    { icon: <Database className="h-3.5 w-3.5" />, label: "5 Search Engines" },
                                    { icon: <Zap className="h-3.5 w-3.5" />, label: "12 Sources Parallel" },
                                    { icon: <Eye className="h-3.5 w-3.5" />, label: "OG Images" },
                                    { icon: <Shield className="h-3.5 w-3.5" />, label: "Quality Scoring" },
                                    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Smart Synthesis" },
                                ].map((f, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">{f.icon} {f.label}</span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


// ═══ Source Card Component ═══
function SourceCard({ source, index, isExpanded, onToggle }: {
    source: ScrapedSource; index: number; isExpanded: boolean; onToggle: () => void;
}) {
    const typeConfig = CONTENT_TYPE_CONFIG[source.contentType] || CONTENT_TYPE_CONFIG.other;
    const qColor = source.qualityScore >= 80 ? "text-emerald-500" : source.qualityScore >= 60 ? "text-blue-500" : source.qualityScore >= 40 ? "text-amber-500" : "text-red-500";
    const qBg = source.qualityScore >= 80 ? "bg-emerald-500" : source.qualityScore >= 60 ? "bg-blue-500" : source.qualityScore >= 40 ? "bg-amber-500" : "bg-red-500";

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
            <Card className={cn("border-border/40 transition-all duration-200 overflow-hidden", isExpanded ? "shadow-md border-primary/20" : "hover:border-border/60 hover:shadow-sm")}>
                <div className="h-0.5 bg-muted"><div className={cn("h-full transition-all", qBg)} style={{ width: `${source.qualityScore}%` }} /></div>

                <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
                    <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <div className="h-7 w-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-xs font-bold text-primary">{index + 1}</div>
                            {source.favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={source.favicon} alt="" className="h-4 w-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm leading-snug">{source.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">{source.domain}</Badge>
                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 gap-0.5 font-normal border", typeConfig.bg, typeConfig.color)}>{typeConfig.icon}{typeConfig.label}</Badge>
                                <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium", qColor)}><Award className="h-2.5 w-2.5" />{source.qualityScore}</span>
                                {source.trustScore >= 85 && <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 font-normal border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400">⭐ Trusted</Badge>}
                                {source.trustScore >= 70 && source.trustScore < 85 && <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 font-normal border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">✓ Known</Badge>}
                                {source.wordCount > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Hash className="h-2.5 w-2.5" />{source.wordCount.toLocaleString()}</span>}
                                {source.readingTimeMin > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{source.readingTimeMin}m</span>}
                                {source.scrapeTimeMs > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" />{source.scrapeTimeMs}ms</span>}
                            </div>
                            <CardDescription className="mt-2 text-xs line-clamp-2">{source.meta?.description || source.snippet}</CardDescription>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(source.url, '_blank'); }} title="Open"><ExternalLink className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggle(); }}>{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</Button>
                        </div>
                    </div>
                </CardHeader>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Separator />
                            <CardContent className="pt-4 space-y-4">
                                {(source.meta?.author || source.meta?.publishedDate) && (
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        {source.meta?.author && <span className="flex items-center gap-1"><Info className="h-3 w-3" />By {source.meta.author}</span>}
                                        {source.meta?.publishedDate && <span>Published: {new Date(source.meta.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                                    </div>
                                )}

                                {/* OG Image */}
                                {source.meta?.ogImage && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Preview</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={source.meta.ogImage} alt={source.title} className="rounded-lg border max-h-44 object-cover w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    </div>
                                )}

                                {source.headings.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Page Structure</p>
                                        <div className="space-y-1">
                                            {source.headings.slice(0, 8).map((heading, i) => {
                                                const level = (heading.match(/^#+/) || [''])[0].length;
                                                const text = heading.replace(/^#+\s*/, '');
                                                return (
                                                    <div key={i} className="text-xs text-foreground/70 flex items-center gap-1.5" style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                                                        <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", level === 1 ? "bg-primary" : level === 2 ? "bg-primary/60" : "bg-primary/30")} />
                                                        <span className="truncate">{text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {source.links.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Related Links</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {source.links.slice(0, 6).map((link, i) => (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground/70 hover:text-primary transition-colors truncate max-w-[200px]"
                                                ><Link2 className="h-2.5 w-2.5 flex-shrink-0" />{link.text}</a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate">
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />{source.url}
                                </a>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}
