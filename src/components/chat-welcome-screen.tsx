"use client";


import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ChatWelcomeScreenProps {
    userName: string | null;
    setActiveButton: (button: 'tools' | 'music' | 'image' | null) => void;
    handleSendMessage: (message: string) => void;
    onUpdateName: (name: string) => void;
    chatBar?: React.ReactNode;
}

const ACTION_CHIPS = [
    { label: "Create image", action: "/image A beautiful landscape" },
    { label: "Write anything", icon: null, action: "Write anything" },
    { label: "Build an idea", icon: null, action: "Build an idea" },
];



export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage, onUpdateName, chatBar }: ChatWelcomeScreenProps) {


    return (
        <div className="relative flex h-full flex-col justify-between overflow-hidden">

            {/* ── SCROLLABLE HERO CONTENT ─────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 overflow-y-auto no-scrollbar pb-4">
                <div className="mx-auto w-full max-w-2xl">

                    {/* ── Hero ────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-10"
                    >
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 text-foreground">
                            SearnAI
                        </h1>
                        <div className="space-y-1">
                            <p className="text-xl sm:text-2xl font-medium text-muted-foreground">
                                Hi {userName || 'Creator'},
                            </p>
                            <p className="text-[28px] sm:text-[34px] font-black leading-tight tracking-tight text-foreground">
                                Where should we<br />start?
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Action Chips ─────────────── */}
                    <div className="space-y-3">
                        {ACTION_CHIPS.map((chip, i) => (
                            <motion.button
                                key={chip.label}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.08, duration: 0.45, ease: "easeOut" }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSendMessage(chip.action)}
                                className={cn(
                                    "flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold",
                                    "bg-card/60 border border-border/40 backdrop-blur-sm",
                                    "text-foreground/90 hover:bg-card hover:border-border/60",
                                    "active:scale-[0.97] transition-all duration-200 text-left w-fit",
                                    "touch-manipulation"
                                )}
                            >
                                {chip.icon}
                                {chip.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── BOTTOM SECTION: CHAT BAR ─────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0"
            >
                {/* ── Chat Input Bar ────────────── */}
                <div className="px-1 pb-1">
                    {chatBar}
                </div>
            </motion.div>
        </div>
    );
}
