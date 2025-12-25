"use client";

import { Image as ImageIcon, Code, Wand2, Zap, Palette, Terminal, Sparkles, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWelcomeScreenProps {
    userName: string | null;
    setActiveButton: (button: 'deepthink' | 'music' | 'image' | null) => void;
    handleSendMessage: (message: string) => void;
}

export function ChatWelcomeScreen({ userName, setActiveButton, handleSendMessage }: ChatWelcomeScreenProps) {
    return (
        <div className="flex h-full flex-col justify-start p-6 pt-12 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl space-y-12">

                {/* Hero Section */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        <span className="text-foreground">Hello, </span>
                        <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">{userName || 'User'}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl">
                        Ready to explore? Create images, write code, or just chat.
                    </p>
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onClick={() => setActiveButton('image')} className="group flex flex-col p-6 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-accent transition-all text-left space-y-3">
                        <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <ImageIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Generate Images</h3>
                            <p className="text-sm text-muted-foreground">Turn text into art</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Create a modern React component')} className="group flex flex-col p-6 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-accent transition-all text-left space-y-3">
                        <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Code className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Write Code</h3>
                            <p className="text-sm text-muted-foreground">Debug and build</p>
                        </div>
                    </button>

                    <button onClick={() => setActiveButton('deepthink')} className="group flex flex-col p-6 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-accent transition-all text-left space-y-3">
                        <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Deep Think</h3>
                            <p className="text-sm text-muted-foreground">Complex reasoning</p>
                        </div>
                    </button>

                    <button onClick={() => handleSendMessage('Give me 5 creative startup ideas')} className="group flex flex-col p-6 rounded-2xl bg-card border border-border/50 hover:bg-accent/50 hover:border-accent transition-all text-left space-y-3">
                        <div className="p-3 w-fit rounded-xl bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Brainstorm</h3>
                            <p className="text-sm text-muted-foreground">Get new ideas</p>
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
}
