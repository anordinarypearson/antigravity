"use client";

import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ExternalLink, Clock, AlertCircle, Copy, Check } from "lucide-react";
import { webScraperAction, WebScraperOutput } from "@/app/web-scraper";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

export function WebScraperContent() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<WebScraperOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const EXAMPLE_QUERIES = [
        "What are the latest features in Next.js 15?",
        "Explain the theory of relativity simply",
        "Who won the 2024 T20 World Cup?",
        "Best practices for React performance optimization"
    ];

    const handleCopy = () => {
        if (result?.answer) {
            navigator.clipboard.writeText(result.answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await webScraperAction({ query: query.trim() });

            if (response.error) {
                setError(response.error);
            } else if (response.data) {
                setResult(response.data);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getResponseTimeColor = (time: number) => {
        if (time < 3) return "text-green-500";
        if (time < 5) return "text-yellow-500";
        return "text-orange-500";
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <header className="mb-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
                            Web Scraper
                        </h1>
                        <p className="text-muted-foreground">
                            Get instant answers from the web with AI-powered scraping
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask anything... e.g., What is React Server Components?"
                                className="w-full pl-10 h-12 text-base rounded-full shadow-lg"
                                disabled={loading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 rounded-full text-base font-semibold"
                            disabled={loading || !query.trim()}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Scraping web...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-5 w-5" />
                                    Search & Scrape
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6"
                        >
                            <Card className="border-destructive bg-destructive/10">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-destructive">Error</p>
                                            <p className="text-sm text-destructive/80">{error}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Performance Indicator */}
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <Clock className={`h-4 w-4 ${getResponseTimeColor(result.responseTime)}`} />
                                <span className={`font-semibold ${getResponseTimeColor(result.responseTime)}`}>
                                    Response time: {result.responseTime.toFixed(2)}s
                                </span>
                                {result.responseTime < 3 && (
                                    <span className="text-xs text-muted-foreground">⚡ Lightning fast!</span>
                                )}
                            </div>

                            {/* Answer Card */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        Answer
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCopy}
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {result.answer}
                                        </ReactMarkdown>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sources */}
                            {result.sources.length > 0 && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            <ExternalLink className="h-5 w-5" />
                                            Sources ({result.sources.length})
                                        </h2>
                                        <div className="grid gap-4">
                                            {result.sources.map((source, index) => (
                                                <motion.div
                                                    key={source.url}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-200 group">
                                                        <CardHeader>
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                                                                        {source.title}
                                                                    </CardTitle>
                                                                    <CardDescription className="mt-2 line-clamp-2">
                                                                        {source.snippet}
                                                                    </CardDescription>
                                                                    <a
                                                                        href={source.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        {new URL(source.url).hostname}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {!loading && !result && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                <Search className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Ready to scrape the web</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Enter your query above and get instant answers from multiple web sources,
                                synthesized by AI in seconds.
                            </p>

                            <div className="mt-8 grid gap-2 max-w-lg mx-auto">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Try asking:</p>
                                {EXAMPLE_QUERIES.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(q)}
                                        className="text-sm text-left px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-foreground/80 hover:text-foreground"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
