"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, Code, Youtube, FileText, Brain, Zap, Shield } from "lucide-react";

const features = [
    {
        title: "Advanced Web Search",
        description: "Access real-time information with AI-powered synthesis and reputable sourcing.",
        icon: Search,
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-48 h-48 rounded-full border border-white/10 border-dashed"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-32 h-32 rounded-full border border-white/20"
                />
                <Search className="w-16 h-16 text-white/80" />
            </div>
        )
    },
    {
        title: "Code Intelligence",
        description: "Analyze, debug, and generate complex code structures with deep context awareness.",
        icon: Code,
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-2 opacity-20">
                    {Array.from({ length: 36 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.1 }}
                            animate={{ opacity: [0.1, 0.5, 0.1] }}
                            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                            className="bg-white rounded-sm"
                        />
                    ))}
                </div>
                <Code className="w-16 h-16 text-white/80 z-10" />
            </div>
        )
    },
    {
        title: "YouTube Insights",
        description: "Extract knowledge from videos instantly with summarized key points and timestamps.",
        icon: Youtube,
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute w-40 h-40 bg-white/5 rounded-full blur-xl"
                />
                <Youtube className="w-16 h-16 text-white/80 z-10" />
                <motion.div
                    className="absolute -right-8 -top-8 text-white/20"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {/* Sparkles removed */}
                </motion.div>
            </div>
        )
    },
    {
        title: "Deep Analysis",
        description: "Upload detailed documents and get comprehensive insights and data extraction.",
        icon: FileText,
        visual: (
            <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                    className="absolute w-32 h-40 border border-white/20 rounded-md"
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <FileText className="w-16 h-16 text-white/80" />
            </div>
        )
    }
];

export function AuthShowcase() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full w-full bg-zinc-950 px-12 py-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            {/* Logo area */}
            <div className="relative z-10 flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-black" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Searn AI</span>
            </div>

            {/* Main Content Carousel */}
            <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        {/* Abstract Visual */}
                        <div className="h-64 w-full flex items-center justify-start">
                            {features[currentIndex].visual}
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10"
                            >
                                {(() => {
                                    const IconComponent = features[currentIndex].icon;
                                    return <IconComponent className="w-3 h-3" />;
                                })()}
                                <span>{features[currentIndex].title}</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-bold text-white leading-tight"
                            >
                                {features[currentIndex].title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-zinc-400 leading-relaxed max-w-md"
                            >
                                {features[currentIndex].description}
                            </motion.p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress / Grid of features */}
            <div className="relative z-10 pt-12">
                <div className="flex gap-3">
                    {features.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className="group relative h-1 flex-1 bg-white/10 rounded-full overflow-hidden transition-all hover:h-2"
                        >
                            <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${idx === currentIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                            {idx === currentIndex && (
                                <motion.div
                                    layoutId="activeProgress"
                                    className="h-full bg-white w-full origin-left"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
