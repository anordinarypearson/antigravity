"use client";

import { useChatStore } from "./chat-content";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { useTheme } from "next-themes";
import { Sun, Moon, Search, Command, LogOut, Settings, User } from "lucide-react";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface SharedHeaderProps {
    title?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
}

export function SharedHeader({ title, leftElement, rightElement }: SharedHeaderProps) {
    const { theme, setTheme } = useTheme();
    const { getUsageStats, usageData, subscription } = useUsageLimits();
    const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
    const auth = useAuth();
    const user = auth?.user;
    const { setCommandOpen } = useChatStore();

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

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-black dark:border-border bg-sidebar px-4 sm:px-6 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    {leftElement}
                </div>

                <div className="flex items-center gap-3">
                    {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}

                    {remainingMessages !== null && remainingMessages !== -1 && (
                        <div className="flex h-7 items-center gap-2 px-3 rounded-full bg-muted/50 border border-border/50 transition-colors hover:bg-muted">
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

            <div className="flex items-center gap-2 sm:gap-3">
                {rightElement}

                {/* Search hint */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex items-center gap-1.5 h-8 rounded-lg text-muted-foreground hover:text-foreground px-2.5"
                    onClick={() => setCommandOpen(true)}
                >
                    <Search className="h-3.5 w-3.5" />
                    <span className="text-xs">Search</span>
                    <kbd className="ml-1 flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="rounded-full hover:bg-muted/60 h-10 w-10 touch-manipulation"
                    title="Toggle theme"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* User Avatar */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 cursor-pointer border border-border/50 hover:border-foreground/30 transition-colors">
                                <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                                    {getInitials(user.displayName || user.email)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
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
