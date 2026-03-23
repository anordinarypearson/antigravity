"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Flag, Copy, Check, Dices, RefreshCw,
    Timer, Clock, Calculator, Palette, Search, Globe, ExternalLink,
    Sparkles, Shield, BookOpen, ArrowRight } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────
export type ToolName = "timer" | "stopwatch" | "calculator" | "colorpicker" | "dice" | "websearch";

// Types mirrored from web-scraper.ts for client use (avoids importing server-only module)
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

// Simple markdown renderer that handles basic formatting without react-markdown import
function SimpleMarkdown({ children }: { children: string }) {
    if (!children) return null;
    const lines = children.split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={i} />;
                if (trimmed.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3">{trimmed.slice(4)}</h4>;
                if (trimmed.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3">{trimmed.slice(3)}</h3>;
                if (trimmed.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3">{trimmed.slice(2)}</h2>;
                if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <p key={i} className="font-semibold text-sm">{trimmed.slice(2, -2)}</p>;
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) return <p key={i} className="text-sm pl-3">• {trimmed.slice(2)}</p>;
                if (trimmed.startsWith('---')) return <hr key={i} className="border-border/30 my-2" />;
                if (trimmed.startsWith('*') && trimmed.endsWith('*')) return <p key={i} className="text-xs text-muted-foreground italic">{trimmed.slice(1, -1)}</p>;
                const parts = trimmed.split(/\*\*(.*?)\*\*/g);
                if (parts.length > 1) {
                    return <p key={i} className="text-sm">{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>;
                }
                const linkParts = trimmed.split(/\[(.*?)\]\((.*?)\)/g);
                if (linkParts.length > 1) {
                    return <p key={i} className="text-sm">{linkParts.map((part, j) => {
                        if (j % 3 === 1) return <a key={j} href={linkParts[j + 1]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a>;
                        if (j % 3 === 2) return null;
                        return part;
                    })}</p>;
                }
                return <p key={i} className="text-sm">{trimmed}</p>;
            })}
        </div>
    );
}

// ─── TIMER WIDGET ─────────────────────────────────────────────────────
function parseTimerInput(input: string): number {
    const lower = input.toLowerCase().trim();
    let totalSeconds = 0;

    // Match patterns like "5 minutes", "2 hours 30 minutes", "90 seconds", "1h 30m 15s", "5m", "10 min"
    const hourMatch = lower.match(/(\d+)\s*(?:hours?|hrs?|h)/);
    const minMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m(?!s))/);
    const secMatch = lower.match(/(\d+)\s*(?:seconds?|secs?|s)/);

    if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
    if (secMatch) totalSeconds += parseInt(secMatch[1]);

    // If just a number, treat as minutes
    if (totalSeconds === 0) {
        const num = parseInt(lower.replace(/[^0-9]/g, ""));
        if (!isNaN(num) && num > 0) totalSeconds = num * 60;
    }

    return totalSeconds;
}

export function TimerWidget({ userMessage }: { userMessage: string }) {
    const totalSeconds = parseTimerInput(userMessage) || 300; // default 5 min
    const [remaining, setRemaining] = useState(totalSeconds);
    const [isRunning, setIsRunning] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<AudioContext | null>(null);

    const playAlarm = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioRef.current = ctx;
            // Play a pleasant chime
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.5);
                osc.start(ctx.currentTime + i * 0.3);
                osc.stop(ctx.currentTime + i * 0.3 + 0.5);
            });
        } catch { }
    }, []);

    useEffect(() => {
        if (isRunning && remaining > 0) {
            intervalRef.current = setInterval(() => {
                setRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        setIsRunning(false);
                        setIsComplete(true);
                        playAlarm();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, remaining, playAlarm]);

    const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const hours = Math.floor(mins / 60);
    const displayMins = mins % 60;

    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const reset = () => {
        setRemaining(totalSeconds);
        setIsRunning(false);
        setIsComplete(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-purple-500/20 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
                <Timer className="h-4 w-4" />
                <span>Timer — {hours > 0 ? `${hours}h ${displayMins}m` : `${mins}m ${secs}s`} total</span>
            </div>

            {/* Circular progress */}
            <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.3" />
                    <motion.circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke={isComplete ? "hsl(142, 76%, 50%)" : "hsl(280, 80%, 60%)"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </svg>

                <AnimatePresence mode="wait">
                    {isComplete ? (
                        <motion.div
                            key="done"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-4xl"
                            >
                                🎉
                            </motion.div>
                            <span className="text-sm font-medium text-green-400 mt-2">Time's up!</span>
                        </motion.div>
                    ) : (
                        <motion.span
                            key="time"
                            className="text-4xl font-mono font-bold tabular-nums text-foreground"
                        >
                            {hours > 0
                                ? `${hours}:${String(displayMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
                                : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-purple-500/30 hover:bg-purple-500/10"
                    onClick={reset}
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg transition-all",
                        isRunning
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-purple-500 hover:bg-purple-600"
                    )}
                    onClick={() => {
                        if (isComplete) reset();
                        setIsRunning(!isRunning);
                    }}
                >
                    {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </Button>
            </div>
        </motion.div>
    );
}


// ─── STOPWATCH WIDGET ─────────────────────────────────────────────────
export function StopwatchWidget() {
    const [elapsed, setElapsed] = useState(0); // in ms
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const elapsedAtPauseRef = useRef(0);

    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = Date.now() - elapsedAtPauseRef.current;
            intervalRef.current = setInterval(() => {
                setElapsed(Date.now() - startTimeRef.current);
            }, 10);
        } else {
            elapsedAtPauseRef.current = elapsed;
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning]);

    const format = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
    };

    const reset = () => {
        setIsRunning(false);
        setElapsed(0);
        elapsedAtPauseRef.current = 0;
        setLaps([]);
    };

    // Compute lap deltas
    const lapDeltas = laps.map((lap, i) => {
        const prev = laps[i + 1] ?? 0;
        return lap - prev;
    });
    const fastestDelta = lapDeltas.length > 0 ? Math.min(...lapDeltas) : Infinity;
    const slowestDelta = lapDeltas.length > 1 ? Math.max(...lapDeltas) : -Infinity;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/10 border border-teal-500/20 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-teal-400">
                <Clock className="h-4 w-4" />
                <span>Stopwatch</span>
                {laps.length > 0 && (
                    <span className="text-xs text-muted-foreground/60 font-mono">{laps.length} lap{laps.length > 1 ? 's' : ''}</span>
                )}
            </div>

            <motion.div
                className="text-5xl font-mono font-bold tabular-nums text-foreground"
                animate={isRunning ? { opacity: [1, 0.85, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
            >
                {format(elapsed)}
            </motion.div>

            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-teal-500/30 hover:bg-teal-500/10"
                    onClick={reset}
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg transition-all",
                        isRunning ? "bg-red-500 hover:bg-red-600" : "bg-teal-500 hover:bg-teal-600"
                    )}
                    onClick={() => setIsRunning(!isRunning)}
                >
                    {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </Button>
                {(isRunning || elapsed > 0) && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full border-teal-500/30 hover:bg-teal-500/10"
                        onClick={() => setLaps((prev) => [elapsed, ...prev])}
                        disabled={!isRunning}
                    >
                        <Flag className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Laps */}
            {laps.length > 0 && (
                <div className="w-full max-h-44 overflow-y-auto space-y-1 mt-1 custom-scrollbar">
                    {/* Header */}
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-4 pb-1 border-b border-border/20">
                        <span>Lap</span>
                        <span>Δ Split</span>
                        <span>Total</span>
                    </div>
                    {laps.map((lap, i) => {
                        const lapNum = laps.length - i;
                        const delta = lapDeltas[i];
                        const isFastest = delta === fastestDelta && laps.length > 1;
                        const isSlowest = delta === slowestDelta && laps.length > 1;
                        const medal = lapNum === 1 ? '🥇' : lapNum === 2 ? '🥈' : lapNum === 3 ? '🥉' : null;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "flex justify-between items-center text-xs font-mono px-4 py-1.5 rounded-lg transition-colors",
                                    isFastest ? "bg-emerald-500/10 text-emerald-400" :
                                    isSlowest ? "bg-red-500/10 text-red-400" :
                                    "text-muted-foreground hover:bg-muted/20"
                                )}
                            >
                                <span className="w-16 flex items-center gap-1">
                                    {medal || <span className="text-muted-foreground/40">Lap {lapNum}</span>}
                                    {medal && `Lap ${lapNum}`}
                                </span>
                                <span className={cn(
                                    "tabular-nums font-medium",
                                    isFastest && "text-emerald-400",
                                    isSlowest && "text-red-400"
                                )}>+{format(delta)}</span>
                                <span className="tabular-nums text-foreground/60">{format(lap)}</span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}


// ─── CALCULATOR WIDGET ────────────────────────────────────────────────
function safeEval(expr: string): string {
    try {
        // Replace visual operators
        let sanitized = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, String(Math.PI))
            .replace(/e(?![\d.])/g, String(Math.E))
            .replace(/[^0-9+\-*/().%\s^.]/g, '');
        if (!sanitized.trim()) return '';
        const jsExpr = sanitized.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${jsExpr})`)();
        if (typeof result === 'number' && isFinite(result)) {
            if (Number.isInteger(result)) return result.toString();
            return parseFloat(result.toFixed(10)).toString();
        }
        return 'Error';
    } catch {
        return 'Error';
    }
}

function evalWithSci(expr: string): string {
    try {
        let e = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, String(Math.PI))
            .replace(/(?<![A-Za-z])e(?![A-Za-z0-9(])/g, String(Math.E))
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/asin\(/g, 'Math.asin(')
            .replace(/acos\(/g, 'Math.acos(')
            .replace(/atan\(/g, 'Math.atan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/abs\(/g, 'Math.abs(')
            .replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${e})`)();
        if (typeof result === 'number' && isFinite(result)) {
            if (Number.isInteger(result)) return result.toString();
            return parseFloat(result.toFixed(10)).toString();
        }
        return 'Error';
    } catch {
        return 'Error';
    }
}

type CalcHistoryEntry = { expr: string; result: string };

export function CalculatorWidget({ userMessage }: { userMessage: string }) {
    const { toast } = useToast();
    const [display, setDisplay] = useState('');
    const [preview, setPreview] = useState('');
    const [history, setHistory] = useState<CalcHistoryEntry[]>([]);
    const [isScientific, setIsScientific] = useState(false);
    const [isDeg, setIsDeg] = useState(true); // degrees vs radians
    const [justEvaluated, setJustEvaluated] = useState(false);
    const [copied, setCopied] = useState(false);
    const calcRef = useRef<HTMLDivElement>(null);

    // Pre-fill with user message if it looks like an expression
    useEffect(() => {
        if (userMessage?.trim()) {
            const t = userMessage.trim();
            // Compute immediately if it's a reasonable expression
            const res = evalWithSci(t);
            if (res && res !== 'Error' && res !== t) {
                setDisplay(t);
                setJustEvaluated(true);
                setHistory([{ expr: t, result: res }]);
            }
        }
    }, []);

    // Live preview
    useEffect(() => {
        if (!display || justEvaluated) { setPreview(''); return; }
        const res = evalWithSci(display);
        setPreview(res !== 'Error' && res !== display ? '= ' + res : '');
    }, [display, justEvaluated]);

    const press = (val: string) => {
        setJustEvaluated(false);
        setDisplay(prev => {
            // If we just evaluated and press a digit, start fresh
            if (justEvaluated && /[0-9(π]/.test(val)) return val;
            // If we just evaluated and press an operator, keep result + operator
            if (justEvaluated && /[+\-×÷^%]/.test(val)) {
                const lastRes = history[history.length - 1]?.result || '';
                return lastRes + val;
            }
            return prev + val;
        });
    };

    const pressBackspace = () => {
        setJustEvaluated(false);
        setDisplay(prev => prev.slice(0, -1));
    };

    const pressClear = () => {
        setDisplay('');
        setPreview('');
        setJustEvaluated(false);
    };

    const pressEquals = () => {
        if (!display) return;
        let expr = display;
        if (isDeg) {
            // Convert deg to rad for trig functions
            expr = expr
                .replace(/sin\(/g, 'sin((Math.PI/180)*')
                .replace(/cos\(/g, 'cos((Math.PI/180)*')
                .replace(/tan\(/g, 'tan((Math.PI/180)*');
        }
        const result = evalWithSci(display);
        if (result === 'Error') {
            setDisplay('Error');
            setPreview('');
            setJustEvaluated(true);
            return;
        }
        setHistory(prev => [{ expr: display, result }, ...prev].slice(0, 20));
        setDisplay(result);
        setPreview('');
        setJustEvaluated(true);
    };

    const handleCopy = () => {
        const val = display || preview.replace(/^= /, '');
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopied(true);
        toast({ title: 'Copied!', description: 'Value copied to clipboard.' });
        setTimeout(() => setCopied(false), 2000);
    };

    const pressPercent = () => {
        if (!display) return;
        const res = evalWithSci(display);
        if (res !== 'Error') {
            const pct = parseFloat(res) / 100;
            setDisplay(pct.toString());
            setJustEvaluated(true);
        }
    };

    const pressPlusMinus = () => {
        if (!display) return;
        if (display.startsWith('-')) setDisplay(display.slice(1));
        else setDisplay('-' + display);
    };

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!calcRef.current?.contains(document.activeElement) && document.activeElement?.tagName === 'INPUT') return;
            if (e.key >= '0' && e.key <= '9') { e.preventDefault(); press(e.key); }
            else if (e.key === '+') { e.preventDefault(); press('+'); }
            else if (e.key === '-') { e.preventDefault(); press('-'); }
            else if (e.key === '*') { e.preventDefault(); press('×'); }
            else if (e.key === '/') { e.preventDefault(); press('÷'); }
            else if (e.key === '.') { e.preventDefault(); press('.'); }
            else if (e.key === '(') { e.preventDefault(); press('('); }
            else if (e.key === ')') { e.preventDefault(); press(')'); }
            else if (e.key === '%') { e.preventDefault(); pressPercent(); }
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); pressEquals(); }
            else if (e.key === 'Backspace') { e.preventDefault(); pressBackspace(); }
            else if (e.key === 'Escape') { e.preventDefault(); pressClear(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [display, justEvaluated, history, isDeg]);

    type BtnStyle = 'digit' | 'op' | 'fn' | 'equals' | 'clear' | 'dark';
    const btnBase = 'flex items-center justify-center h-10 rounded-xl font-mono text-sm font-semibold cursor-pointer transition-all duration-150 select-none active:scale-95';
    const btnStyles: Record<BtnStyle, string> = {
        digit:  'bg-background/70 border border-border/40 text-foreground hover:bg-background hover:border-orange-400/40 hover:shadow-sm',
        op:     'bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 hover:shadow-orange-500/20 hover:shadow-sm',
        fn:     'bg-violet-500/12 border border-violet-500/25 text-violet-400 hover:bg-violet-500/22 text-xs',
        equals: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:from-orange-400 hover:to-amber-400 col-span-1',
        clear:  'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25',
        dark:   'bg-muted/50 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground',
    };

    const Btn = ({ label, action, style = 'digit', wide = false }: { label: React.ReactNode; action: () => void; style?: BtnStyle; wide?: boolean }) => (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={action}
            className={cn(btnBase, btnStyles[style], wide && 'col-span-2')}
        >
            {label}
        </motion.button>
    );

    const basicButtons = [
        { label: 'C',   action: pressClear,          style: 'clear'  as BtnStyle },
        { label: '±',   action: pressPlusMinus,       style: 'dark'   as BtnStyle },
        { label: '%',   action: pressPercent,          style: 'dark'   as BtnStyle },
        { label: '÷',   action: () => press('÷'),      style: 'op'     as BtnStyle },
        { label: '7',   action: () => press('7'),      style: 'digit'  as BtnStyle },
        { label: '8',   action: () => press('8'),      style: 'digit'  as BtnStyle },
        { label: '9',   action: () => press('9'),      style: 'digit'  as BtnStyle },
        { label: '×',   action: () => press('×'),      style: 'op'     as BtnStyle },
        { label: '4',   action: () => press('4'),      style: 'digit'  as BtnStyle },
        { label: '5',   action: () => press('5'),      style: 'digit'  as BtnStyle },
        { label: '6',   action: () => press('6'),      style: 'digit'  as BtnStyle },
        { label: '-',   action: () => press('-'),      style: 'op'     as BtnStyle },
        { label: '1',   action: () => press('1'),      style: 'digit'  as BtnStyle },
        { label: '2',   action: () => press('2'),      style: 'digit'  as BtnStyle },
        { label: '3',   action: () => press('3'),      style: 'digit'  as BtnStyle },
        { label: '+',   action: () => press('+'),      style: 'op'     as BtnStyle },
    ];

    const sciButtons = [
        { label: 'sin', action: () => press('sin('),   style: 'fn' as BtnStyle },
        { label: 'cos', action: () => press('cos('),   style: 'fn' as BtnStyle },
        { label: 'tan', action: () => press('tan('),   style: 'fn' as BtnStyle },
        { label: 'π',   action: () => press('π'),       style: 'fn' as BtnStyle },
        { label: '√',   action: () => press('sqrt('),  style: 'fn' as BtnStyle },
        { label: 'x²',  action: () => press('^2'),     style: 'fn' as BtnStyle },
        { label: 'log', action: () => press('log('),   style: 'fn' as BtnStyle },
        { label: 'ln',  action: () => press('ln('),    style: 'fn' as BtnStyle },
        { label: '(',   action: () => press('('),      style: 'dark' as BtnStyle },
        { label: ')',   action: () => press(')'),      style: 'dark' as BtnStyle },
        { label: 'e',   action: () => press('e'),      style: 'fn' as BtnStyle },
        { label: '^',   action: () => press('^'),      style: 'op' as BtnStyle },
    ];

    return (
        <motion.div
            ref={calcRef}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="flex flex-col gap-3 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 border border-orange-500/20 backdrop-blur-sm w-full max-w-sm mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
                    <Calculator className="h-4 w-4" />
                    <span>Calculator</span>
                </div>
                <div className="flex items-center gap-2">
                    {isScientific && (
                        <button
                            onClick={() => setIsDeg(d => !d)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                        >
                            {isDeg ? 'DEG' : 'RAD'}
                        </button>
                    )}
                    <button
                        onClick={() => setIsScientific(s => !s)}
                        className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors',
                            isScientific
                                ? 'border-orange-500/40 bg-orange-500/15 text-orange-400'
                                : 'border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted'
                        )}
                    >
                        {isScientific ? 'SCI ✓' : 'SCI'}
                    </button>
                </div>
            </div>

            {/* Display */}
            <div className="relative rounded-xl bg-background/70 border border-border/50 px-4 py-3 min-h-[72px] flex flex-col justify-end overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-background/70 to-transparent pointer-events-none" />
                <div className="text-xs text-muted-foreground/60 font-mono h-4 text-right truncate">
                    {preview}
                </div>
                <div className={cn(
                    'text-right font-mono font-bold transition-all duration-200 truncate',
                    display.length > 16 ? 'text-lg' : display.length > 10 ? 'text-2xl' : 'text-3xl',
                    display === 'Error' ? 'text-red-400' : 'text-foreground'
                )}>
                    {display || '0'}
                </div>
            </div>

            {/* Scientific Buttons */}
            <AnimatePresence>
                {isScientific && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-4 gap-1.5 overflow-hidden"
                    >
                        {sciButtons.map((btn, i) => (
                            <Btn key={i} label={btn.label} action={btn.action} style={btn.style} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Basic Button Grid */}
            <div className="grid grid-cols-4 gap-1.5">
                {basicButtons.map((btn, i) => (
                    <Btn key={i} label={btn.label} action={btn.action} style={btn.style} />
                ))}
                {/* Bottom row: 0, ., ⌫, = */}
                <Btn label="0" action={() => press('0')} style="digit" wide />
                <Btn label="." action={() => press('.')} style="digit" />
                <Btn label={<RefreshCw className="h-3.5 w-3.5" />} action={pressBackspace} style="dark" />
                <Btn label="=" action={pressEquals} style="equals" />
            </div>

            {/* Footer: copy + history */}
            <div className="flex items-center justify-between border-t border-border/20 pt-2">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
                {history.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60 text-right overflow-hidden">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{history[0].expr} = {history[0].result}</span>
                    </div>
                )}
            </div>

            {/* History drawer (up to 5 entries) */}
            {history.length > 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar border-t border-border/20 pt-2"
                >
                    {history.slice(1, 6).map((h, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { setDisplay(h.result); setJustEvaluated(true); }}
                            className="flex items-center justify-between w-full text-xs text-muted-foreground/70 hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/30 transition-colors font-mono"
                        >
                            <span className="truncate text-left">{h.expr}</span>
                            <span className="ml-2 flex-shrink-0 text-foreground/80 font-semibold">= {h.result}</span>
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}


// ─── COLOR PICKER WIDGET ──────────────────────────────────────────────
function generatePalette(input: string): string[] {
    const namedColors: Record<string, string[]> = {
        red: ["#FF6B6B", "#EE5A24", "#E55039", "#FC427B", "#FD7272"],
        blue: ["#3B82F6", "#60A5FA", "#2563EB", "#1D4ED8", "#93C5FD"],
        green: ["#22C55E", "#16A34A", "#4ADE80", "#86EFAC", "#15803D"],
        purple: ["#A855F7", "#9333EA", "#C084FC", "#7C3AED", "#DDD6FE"],
        pink: ["#EC4899", "#F472B6", "#DB2777", "#FBCFE8", "#BE185D"],
        orange: ["#F97316", "#FB923C", "#EA580C", "#FDBA74", "#C2410C"],
        warm: ["#F87171", "#FB923C", "#FBBF24", "#FCA5A1", "#FDE68A"],
        cool: ["#67E8F9", "#60A5FA", "#818CF8", "#A78BFA", "#C084FC"],
        pastel: ["#FDE2E4", "#E2ECE9", "#BEE1E6", "#FAD2E1", "#DFE7FD"],
        neon: ["#39FF14", "#FF073A", "#00FFFF", "#FF00FF", "#FFFF00"],
        dark: ["#1E293B", "#334155", "#475569", "#0F172A", "#1E1B4B"],
        sunset: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A659E"],
    };

    const lower = input.toLowerCase();
    for (const [name, colors] of Object.entries(namedColors)) {
        if (lower.includes(name)) return colors;
    }

    // Generate random vibrant palette
    const hue = Math.floor(Math.random() * 360);
    return Array.from({ length: 5 }, (_, i) => {
        const h = (hue + i * 30) % 360;
        return `hsl(${h}, 75%, 55%)`;
    });
}

type ColorFormat = 'HEX' | 'RGB' | 'HSL';

function hexToRgb(hex: string): string {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex: string): string {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    let r = parseInt(clean.slice(0, 2), 16) / 255;
    let g = parseInt(clean.slice(2, 4), 16) / 255;
    let b = parseInt(clean.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function formatColor(color: string, format: ColorFormat): string {
    if (!color.startsWith('#')) return color; // For hsl() strings just return as-is
    if (format === 'HEX') return color;
    if (format === 'RGB') return hexToRgb(color);
    return hexToHsl(color);
}

export function ColorPickerWidget({ userMessage }: { userMessage: string }) {
    const [colors, setColors] = useState<string[]>(() => generatePalette(userMessage));
    const { toast } = useToast();
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [format, setFormat] = useState<ColorFormat>('HEX');
    const [customColor, setCustomColor] = useState('#6366f1');

    const handleCopy = (color: string, idx: number) => {
        const formatted = formatColor(color, format);
        navigator.clipboard.writeText(formatted);
        setCopiedIdx(idx);
        toast({ title: "Copied!", description: `${formatted} copied to clipboard.` });
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleCopyAll = () => {
        const all = colors.map(c => formatColor(c, format)).join(', ');
        navigator.clipboard.writeText(all);
        toast({ title: "All colors copied!", description: all.slice(0, 60) + '…' });
    };

    const handleAddCustom = () => {
        if (!colors.includes(customColor)) {
            setColors(prev => [...prev.slice(0, 4), customColor]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-fuchsia-500/10 border border-pink-500/20 backdrop-blur-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-sm font-medium text-pink-400">
                    <Palette className="h-4 w-4" />
                    <span>Color Palette</span>
                </div>
                {/* Format toggle */}
                <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-background/50 p-0.5">
                    {(['HEX', 'RGB', 'HSL'] as ColorFormat[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors',
                                format === f ? 'bg-pink-500/20 text-pink-300' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >{f}</button>
                    ))}
                </div>
            </div>

            {/* Gradient strip preview */}
            <div
                className="w-full h-3 rounded-full shadow-inner"
                style={{ background: `linear-gradient(to right, ${colors.join(', ')})` }}
            />

            {/* Color swatches */}
            <div className="flex gap-3">
                {colors.map((color, idx) => (
                    <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.15, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-14 h-14 rounded-xl shadow-lg cursor-pointer border-2 border-white/20 transition-shadow hover:shadow-xl hover:border-white/40"
                        style={{ backgroundColor: color }}
                        onClick={() => handleCopy(color, idx)}
                        title={`Copy ${formatColor(color, format)}`}
                    >
                        <AnimatePresence>
                            {copiedIdx === idx && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50"
                                >
                                    <Check className="h-5 w-5 text-white" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>

            {/* Color value labels */}
            <div className="flex gap-2 flex-wrap justify-center">
                {colors.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleCopy(color, idx)}
                        className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/30 hover:bg-muted/60 hover:text-foreground transition-colors"
                    >
                        {formatColor(color, format)}
                    </button>
                ))}
            </div>

            {/* Custom color + actions */}
            <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2 flex-1 rounded-lg border border-border/40 bg-background/50 px-2 py-1">
                    <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Pick custom color"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{customColor}</span>
                    <button
                        onClick={handleAddCustom}
                        className="ml-auto text-[10px] font-medium text-pink-400 hover:text-pink-300 transition-colors"
                    >Add</button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="border-pink-500/30 hover:bg-pink-500/10 text-xs h-8 flex-shrink-0"
                >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                </Button>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setColors(generatePalette(userMessage + Math.random()))}
                className="border-pink-500/30 hover:bg-pink-500/10 w-full"
            >
                <RefreshCw className="h-3 w-3 mr-2" />
                New Palette
            </Button>
        </motion.div>
    );
}


// ─── DICE ROLLER WIDGET ───────────────────────────────────────────────
function parseDiceInput(input: string): { count: number; sides: number } {
    const lower = input.toLowerCase().trim();
    // Match patterns like "2d6", "1d20", "d12", "3d8"
    const diceMatch = lower.match(/(\d*)d(\d+)/);
    if (diceMatch) {
        return {
            count: parseInt(diceMatch[1] || "1"),
            sides: parseInt(diceMatch[2]),
        };
    }
    // Match "roll 2 dice"
    const numMatch = lower.match(/(\d+)/);
    return { count: numMatch ? parseInt(numMatch[1]) : 1, sides: 6 };
}

export function DiceRollerWidget({ userMessage }: { userMessage: string }) {
    const config = parseDiceInput(userMessage);
    const [results, setResults] = useState<number[]>([]);
    const [isRolling, setIsRolling] = useState(true);

    const rollDice = useCallback(() => {
        setIsRolling(true);
        // Animate rolling
        let ticks = 0;
        const interval = setInterval(() => {
            setResults(
                Array.from({ length: config.count }, () => Math.floor(Math.random() * config.sides) + 1)
            );
            ticks++;
            if (ticks >= 15) {
                clearInterval(interval);
                setIsRolling(false);
            }
        }, 80);
    }, [config.count, config.sides]);

    // Initial roll
    useEffect(() => {
        rollDice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const total = results.reduce((a, b) => a + b, 0);

    const diceEmoji = (sides: number) => {
        if (sides === 6) {
            const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
            return (val: number) => faces[val - 1] || "🎲";
        }
        return () => "🎲";
    };
    const getEmoji = diceEmoji(config.sides);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-sky-500/10 border border-indigo-500/20 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
                <Dices className="h-4 w-4" />
                <span>{config.count}d{config.sides} Dice Roll</span>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
                {results.map((val, idx) => (
                    <motion.div
                        key={idx}
                        animate={isRolling ? { rotate: [0, 360], scale: [1, 0.8, 1.1, 1] } : { rotate: 0, scale: 1 }}
                        transition={isRolling ? { repeat: Infinity, duration: 0.3 } : { type: "spring", damping: 15 }}
                        className="w-16 h-16 rounded-xl bg-background border-2 border-indigo-500/30 flex items-center justify-center shadow-lg"
                    >
                        {config.sides === 6 ? (
                            <span className="text-3xl">{getEmoji(val)}</span>
                        ) : (
                            <span className="text-2xl font-bold font-mono text-foreground">{val}</span>
                        )}
                    </motion.div>
                ))}
            </div>

            {config.count > 1 && !isRolling && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold text-foreground"
                >
                    Total: <span className="text-indigo-400">{total}</span>
                </motion.div>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={rollDice}
                disabled={isRolling}
                className="border-indigo-500/30 hover:bg-indigo-500/10"
            >
                <Dices className="h-3 w-3 mr-2" />
                Roll Again
            </Button>
        </motion.div>
    );
}


// ─── WEB SEARCH WIDGET ────────────────────────────────────────────────
const SEARCH_LOADING_STAGES = [
    { text: "Searching across engines...", icon: <Search className="h-4 w-4" />, sub: "DuckDuckGo • Brave • Wikipedia • Google News" },
    { text: "Scraping top sources...", icon: <Globe className="h-4 w-4" />, sub: "Extracting structured content" },
    { text: "Analyzing & ranking...", icon: <Shield className="h-4 w-4" />, sub: "Quality + trust scoring" },
    { text: "Synthesizing answer...", icon: <Sparkles className="h-4 w-4" />, sub: "Building comprehensive response" },
];

export function WebSearchWidget({ userMessage }: { userMessage: string }) {
    const [query, setQuery] = useState(userMessage?.trim() || '');
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [result, setResult] = useState<WebScraperOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedSource, setExpandedSource] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = useCallback(async (searchQuery?: string) => {
        const q = (searchQuery || query).trim();
        if (!q) return;
        setQuery(q);
        setIsSearching(true);
        setLoadingStage(0);
        setResult(null);
        setError(null);
        setExpandedSource(null);

        // Animate loading stages
        let stage = 0;
        loadingIntervalRef.current = setInterval(() => {
            stage = Math.min(stage + 1, SEARCH_LOADING_STAGES.length - 1);
            setLoadingStage(stage);
        }, 1800);

        try {
            const res = await fetch('/api/web-scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, maxSources: 8 }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
                setError(json.error || 'Search failed.');
            } else if (json.data) {
                setResult(json.data);
            }
        } catch (e: any) {
            setError(e.message || 'Search failed. Please try again.');
        } finally {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
            setIsSearching(false);
        }
    }, [query]);

    // Auto-search if user message contains a query
    useEffect(() => {
        if (userMessage?.trim() && userMessage.trim().length > 2) {
            handleSearch(userMessage.trim());
        }
        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCopyAnswer = () => {
        if (!result?.answer) return;
        navigator.clipboard.writeText(result.answer);
        setCopied(true);
        toast({ title: "Copied!", description: "Answer copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const getTrustColor = (score: number) => score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : score >= 50 ? 'text-amber-500' : 'text-red-400';
    const getTrustLabel = (score: number) => score >= 85 ? 'Highly Trusted' : score >= 70 ? 'Trusted' : score >= 50 ? 'Moderate' : 'Low Trust';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-emerald-500/8 border border-blue-500/20 backdrop-blur-sm"
        >
            {/* Header */}
            <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                <Search className="h-4 w-4" />
                <span>Web Search</span>
                {result && (
                    <span className="ml-auto text-xs text-muted-foreground">
                        {result.stats.sourcesScraped} sources • {result.responseTime.toFixed(1)}s
                    </span>
                )}
            </div>

            {/* Search input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything... e.g. Who is the PM of India?"
                    className="flex-1 h-10 px-4 rounded-xl bg-background/80 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
                    disabled={isSearching}
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={isSearching || !query.trim()}
                    className="h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                    {isSearching ? <WavyLoader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </form>

            {/* Loading animation */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {SEARCH_LOADING_STAGES.map((stage, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{
                                    opacity: idx <= loadingStage ? 1 : 0.3,
                                    x: 0,
                                }}
                                transition={{ delay: idx * 0.15, duration: 0.3 }}
                                className="flex items-center gap-3"
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                    idx <= loadingStage ? "bg-blue-500/15 text-blue-400" : "bg-muted/30 text-muted-foreground/40"
                                )}>
                                    {idx < loadingStage ? <Check className="h-4 w-4 text-emerald-400" /> : idx === loadingStage ? <WavyLoader className="h-4 w-4 animate-spin" /> : stage.icon}
                                </div>
                                <div>
                                    <p className={cn("text-sm font-medium", idx <= loadingStage ? "text-foreground" : "text-muted-foreground/40")}>{stage.text}</p>
                                    <p className="text-xs text-muted-foreground/60">{stage.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error state */}
            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Quick Summary */}
                        {result.quickSummary && (
                            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-amber-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Quick Summary</span>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{result.quickSummary}</p>
                            </div>
                        )}

                        {/* Key Takeaways */}
                        {result.keyTakeaways.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Key Takeaways</span>
                                </div>
                                <div className="space-y-1.5">
                                    {result.keyTakeaways.map((takeaway, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="flex items-start gap-2 text-sm text-foreground/90"
                                        >
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                            <span>{takeaway}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detailed Answer */}
                        {result.answer && (
                            <div className="p-4 rounded-xl bg-background/60 border border-border/40">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Detailed Answer</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopyAnswer}>
                                        {copied ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                    <SimpleMarkdown>{result.answer}</SimpleMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Sources */}
                        {result.sources.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-violet-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Sources ({result.sources.length})</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar snap-x snap-mandatory">
                                    {result.sources.filter(s => s.qualityScore > 10).slice(0, 8).map((source, i) => (
                                        <motion.a
                                            key={i}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative flex-shrink-0 w-64 h-48 rounded-2xl overflow-hidden group border border-border/30 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all snap-center cursor-pointer bg-background/50"
                                            onMouseEnter={() => setExpandedSource(i)}
                                            onMouseLeave={() => setExpandedSource(null)}
                                        >
                                            {/* Image Background */}
                                            {source.meta?.ogImage ? (
                                                <div 
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                                                    style={{ backgroundImage: `url(${source.meta.ogImage})` }} 
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 transition-transform duration-700 group-hover:scale-110" />
                                            )}
                                            
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 group-hover:from-black via-black/80 transition-colors duration-300" />

                                            {/* Content */}
                                            <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                                                {/* Top Row: Favicon & Domain */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 max-w-[70%] bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full">
                                                        {source.favicon && (
                                                            <img src={source.favicon} alt="" className="h-3.5 w-3.5 rounded-sm bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                        )}
                                                        <span className="text-[10px] font-medium text-white/90 truncate">{source.domain}</span>
                                                    </div>
                                                    <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md border border-white/10", getTrustColor(source.trustScore))}>
                                                        {getTrustLabel(source.trustScore) === 'Low Trust' ? 'Low' : getTrustLabel(source.trustScore).replace(' Trust', '')}
                                                    </div>
                                                </div>

                                                {/* Bottom Row: Title & Expanded Snippet */}
                                                <div className="space-y-1.5 transition-all duration-300">
                                                    <h3 className="text-sm font-semibold text-white/95 leading-tight line-clamp-2 group-hover:line-clamp-none">
                                                        {source.title}
                                                    </h3>
                                                    
                                                    <AnimatePresence>
                                                        {expandedSource === i && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <p className="text-[11px] text-white/70 line-clamp-3 leading-relaxed mt-2 border-t border-white/10 pt-2">
                                                                    {source.snippet}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-2 text-[10px] text-white/50">
                                                                    <span>{source.contentType}</span>
                                                                    {source.readingTimeMin > 0 && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{source.readingTimeMin}m read</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Questions */}
                        {result.relatedQuestions.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Related Questions</span>
                                <div className="flex flex-wrap gap-2">
                                    {result.relatedQuestions.map((q, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.08 }}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleSearch(q)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-background/50 border border-border/40 text-foreground/80 hover:bg-background/80 hover:border-blue-500/30 transition-all"
                                        >
                                            <ArrowRight className="h-3 w-3 text-blue-400" />
                                            {q}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                                <span>{result.stats.totalWords.toLocaleString()} words analyzed</span>
                                <span>Avg quality: {result.stats.averageQuality}%</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => handleSearch()}
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refresh
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Example queries when no results and not loading */}
            {!result && !isSearching && !error && !userMessage?.trim() && (
                <div className="space-y-2">
                    <span className="text-xs text-muted-foreground/50">Try searching for:</span>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "Who is the PM of India?",
                            "Weather in Chennai today",
                            "Latest tech news",
                            "What is quantum computing?",
                        ].map((example, i) => (
                            <button
                                key={i}
                                onClick={() => { setQuery(example); handleSearch(example); }}
                                className="px-3 py-1.5 text-xs rounded-full bg-background/50 border border-border/40 text-foreground/70 hover:bg-background/80 hover:border-blue-500/30 transition-all"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}


// ─── TOOL WIDGET ROUTER ───────────────────────────────────────────────
export function ToolWidgetRouter({ tool, userMessage }: { tool: ToolName; userMessage: string }) {
    switch (tool) {
        case "timer":
            return <TimerWidget userMessage={userMessage} />;
        case "stopwatch":
            return <StopwatchWidget />;
        case "calculator":
            return <CalculatorWidget userMessage={userMessage} />;
        case "colorpicker":
            return <ColorPickerWidget userMessage={userMessage} />;
        case "dice":
            return <DiceRollerWidget userMessage={userMessage} />;
        case "websearch":
            return <WebSearchWidget userMessage={userMessage} />;
        default:
            return null;
    }
}
