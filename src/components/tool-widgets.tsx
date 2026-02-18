"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
    Play, Pause, RotateCcw, Flag, Copy, Check, Dices, RefreshCw,
    Timer, Clock, Calculator, Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────
export type ToolName = "timer" | "stopwatch" | "calculator" | "colorpicker" | "dice";

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
                {isRunning && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full border-teal-500/30 hover:bg-teal-500/10"
                        onClick={() => setLaps((prev) => [elapsed, ...prev])}
                    >
                        <Flag className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Laps */}
            {laps.length > 0 && (
                <div className="w-full max-h-32 overflow-y-auto space-y-1 mt-2">
                    {laps.map((lap, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between text-sm font-mono text-muted-foreground px-4 py-1 rounded bg-muted/30"
                        >
                            <span>Lap {laps.length - i}</span>
                            <span>{format(lap)}</span>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}


// ─── CALCULATOR WIDGET ────────────────────────────────────────────────
function safeEval(expr: string): string {
    try {
        // Sanitize: only allow digits, operators, parens, dots, spaces
        const sanitized = expr.replace(/[^0-9+\-*/().%\s^]/g, "");
        if (!sanitized.trim()) return "No expression";
        // Replace ^ with ** for exponents
        const jsExpr = sanitized.replace(/\^/g, "**");
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${jsExpr})`)();
        if (typeof result === "number" && !isNaN(result)) {
            return Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, "");
        }
        return "Invalid expression";
    } catch {
        return "Error";
    }
}

export function CalculatorWidget({ userMessage }: { userMessage: string }) {
    const expression = userMessage.trim();
    const result = safeEval(expression);
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        toast({ title: "Copied!", description: "Result copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 border border-orange-500/20 backdrop-blur-sm min-w-[280px]"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
                <Calculator className="h-4 w-4" />
                <span>Calculator</span>
            </div>

            <div className="w-full text-right px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="text-sm text-muted-foreground font-mono truncate">{expression}</div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold font-mono text-foreground mt-1"
                >
                    = {result}
                </motion.div>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-orange-500/30 hover:bg-orange-500/10"
            >
                {copied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                {copied ? "Copied" : "Copy result"}
            </Button>
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

export function ColorPickerWidget({ userMessage }: { userMessage: string }) {
    const [colors, setColors] = useState<string[]>(() => generatePalette(userMessage));
    const { toast } = useToast();
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const handleCopy = (color: string, idx: number) => {
        navigator.clipboard.writeText(color);
        setCopiedIdx(idx);
        toast({ title: "Copied!", description: `${color} copied to clipboard.` });
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-fuchsia-500/10 border border-pink-500/20 backdrop-blur-sm"
        >
            <div className="flex items-center gap-2 text-sm font-medium text-pink-400">
                <Palette className="h-4 w-4" />
                <span>Color Palette</span>
            </div>

            <div className="flex gap-3">
                {colors.map((color, idx) => (
                    <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.15, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-14 h-14 rounded-xl shadow-lg cursor-pointer border-2 border-white/20 transition-shadow hover:shadow-xl"
                        style={{ backgroundColor: color }}
                        onClick={() => handleCopy(color, idx)}
                        title={`Copy ${color}`}
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

            <div className="flex gap-2 flex-wrap justify-center">
                {colors.map((color, idx) => (
                    <span key={idx} className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/30">
                        {color}
                    </span>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setColors(generatePalette(userMessage + Math.random()))}
                className="border-pink-500/30 hover:bg-pink-500/10"
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
        default:
            return null;
    }
}
