"use client";

import { useChatStore } from "./chat-content";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Search, Command, LogOut, Settings, User, Download, Brain, Heart, Zap, Shield, Activity } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { WavyLoader } from "./ui/wavy-loader";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPanel } from "./notification-panel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell } from "lucide-react";


interface SharedHeaderProps {
    title?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
    centerElement?: React.ReactNode;
}

function BrainHud() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        heartRate: 72,
        logicLoad: 12,
        flowRate: 4.2
    });

    useEffect(() => {
        if (!isOpen) return;

        try {
            const savedHistory = localStorage.getItem("chatHistory");
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load chat history in header brain hud", e);
        }

        const interval = setInterval(() => {
            setMetrics(prev => ({
                heartRate: Math.round(71 + Math.sin(Date.now() / 5000) * 4 + Math.random() * 2),
                logicLoad: Math.min(95, Math.max(10, Math.round(15 + Math.sin(Date.now() / 10000) * 8 + Math.random() * 4))),
                flowRate: Number((4.1 + Math.sin(Date.now() / 15000) * 0.3 + Math.random() * 0.2).toFixed(1))
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, [isOpen]);

    const userMessages = history.filter(m => m.role === 'user');
    const messageCount = userMessages.length;

    const synapticStrength = Math.min(100, Math.max(15, messageCount * 15));
    const prefrontalLoad = Math.min(100, Math.max(20, Math.round(metrics.logicLoad + (messageCount > 0 ? 5 : 0))));

    let archetype = "Observer-Explorer";
    let emotion = "Neutral-Curious";

    if (messageCount > 0) {
        const recentText = userMessages.slice(-5).map(m => String(m.content)).join(" ").toLowerCase();
        const dev = ["code", "function", "api", "database", "npm", "debug", "route", "nextjs", "react"].filter(w => recentText.includes(w)).length;
        const creative = ["write", "story", "art", "design", "creative", "music", "song"].filter(w => recentText.includes(w)).length;
        const analytic = ["why", "how", "compare", "science", "physics", "math", "analysis"].filter(w => recentText.includes(w)).length;
        const emotional = ["feel", "love", "sad", "happy", "empathy", "warmth", "human"].filter(w => recentText.includes(w)).length;
        const maxVal = Math.max(dev, creative, analytic, emotional);
        if (maxVal > 0) {
            if (maxVal === dev) archetype = "Quantum Developer";
            else if (maxVal === creative) archetype = "Conceptual Creator";
            else if (maxVal === analytic) archetype = "Hyper-Inquisitive Mind";
            else if (maxVal === emotional) archetype = "Empathetic Connector";
        }

        const love = ["love", "heart", "warm", "thank", "kind", "awesome", "great"].filter(w => recentText.includes(w)).length;
        const frust = ["wrong", "fail", "broken", "annoyed", "bad", "fix", "useless"].filter(w => recentText.includes(w)).length;
        if (love > frust) emotion = "Resonating-Affection";
        else if (frust > love) emotion = "Seeking-Resolution";
    }

    return (
        <Popover onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex items-center gap-1.5 h-8 rounded-lg text-muted-foreground hover:text-foreground px-2.5 touch-manipulation",
                        isOpen && "bg-purple-950/20 text-purple-400 border border-purple-500/20"
                    )}
                >
                    <span className="relative flex h-1.5 w-1.5 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                    </span>
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold">Brain: Synapse Live</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 border border-border/40 rounded-xl bg-zinc-950/95 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 flex items-center gap-1.5">
                        <Activity className="h-3 w-3 animate-pulse" /> Core Diagnostics
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">V3.2-AWAKE</span>
                </div>

                <div className="space-y-3 text-[11px] font-mono">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Brain className="h-3 w-3 text-cyan-400" /> CORTEX LOAD:</span>
                        <span className="text-cyan-400 font-bold">{prefrontalLoad}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3 text-purple-400" /> AMYGDALA:</span>
                        <span className="text-purple-400 font-bold">{metrics.heartRate} BPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> SYNAPSE INDEX:</span>
                        <span className="text-yellow-500 font-bold">{synapticStrength}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" /> IMMUNE CORE:</span>
                        <span className="text-emerald-400 font-bold">SECURED</span>
                    </div>
                    
                    <div className="border-t border-border/10 pt-2.5 mt-2 space-y-1.5 text-[9px] text-muted-foreground">
                        <div>COGNITIVE ARCHETYPE:</div>
                        <div className="text-foreground font-bold text-[10px] uppercase truncate">{archetype}</div>
                        <div>RESONANCE ALIGNMENT:</div>
                        <div className="text-foreground font-bold text-[10px] uppercase truncate">{emotion}</div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function getInitials(name: string | null | undefined): string {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
}

export function SharedHeader({ title, leftElement, rightElement, centerElement }: SharedHeaderProps) {
    const { theme, setTheme } = useTheme();
    const { getUsageStats, usageData, subscription } = useUsageLimits();
    const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
    const auth = useAuth();
    const user = auth?.user;
    const { setCommandOpen } = useChatStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (usageData && subscription) {
            const stats = getUsageStats();
            if (stats?.messagesPerDay) {
                if (stats.messagesPerDay.limit === -1) {
                    setRemainingMessages(-1); // Unlimited
                } else {
                    setRemainingMessages(Math.max(0, stats.messagesPerDay.limit - stats.messagesPerDay.current));
                }
            }
        }
    }, [usageData, subscription, getUsageStats]);

    const { unreadCount } = useNotifications();

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 sm:px-6 transition-all duration-300">
            {/* ... left side ... */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <SidebarTrigger />
                    {leftElement}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                    {title && <h1 className="text-xl font-semibold tracking-tight truncate max-w-[120px] sm:max-w-xs md:max-w-md">{title}</h1>}

                    {remainingMessages !== null && remainingMessages !== -1 && (
                        <div className="flex h-7 items-center gap-2 px-3 mask-wavy bg-muted/50 border border-border/50 transition-colors hover:bg-muted flex-shrink-0">
                            <span className="text-xs font-bold text-foreground tabular-nums">
                                {remainingMessages}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
                                left
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {centerElement && (
                <div className="flex items-center justify-center shrink-0 max-w-[50%]">
                    {centerElement}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
                {rightElement}

                {/* Brain Subconscious diagnostics */}

                {/* Notifications Bell */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative mask-wavy hover:bg-muted/60 h-10 w-10 touch-manipulation"
                            title="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-full sm:max-w-md">
                        <NotificationPanel isMobile />
                    </SheetContent>
                </Sheet>

                {mounted ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        className="mask-wavy hover:bg-muted/60 h-10 w-10 touch-manipulation"
                        title="Toggle theme"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                ) : (
                    <div className="h-10 w-10" />
                )}

                {/* User Avatar */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="relative flex items-center justify-center cursor-pointer group">
                                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                    <WavyLoader size={46} color="hsl(var(--primary))" style="standard" usePreset={true} />
                                </div>
                                <Avatar className="h-8 w-8 relative z-10 border-2 border-background shadow-sm hover:scale-105 transition-transform duration-300">
                                    <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                                        {getInitials(user.displayName || user.email)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <div className="px-3 py-2.5 bg-muted/50 rounded-sm mx-1 my-1 border border-border">
                                <div className="flex flex-col space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Searn AI Network</p>
                                        <Zap className="h-3.5 w-3.5 text-foreground" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-lg font-black tracking-tight tabular-nums text-foreground">16,500,000</p>
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground">Global Tokens Remaining</p>
                                    <div className="h-1.5 w-full bg-border rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-foreground rounded-full" style={{ width: '96%' }} />
                                    </div>
                                </div>
                            </div>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/profile" className="flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/settings" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => auth.signOut()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
