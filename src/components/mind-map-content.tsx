
"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, BrainCircuit, AlertTriangle, Download, ZoomIn, ZoomOut, Maximize2, ChevronRight, ChevronDown, Copy, RefreshCw } from "lucide-react";
import { BackButton } from "./back-button";
import { generateMindMapAction, GenerateMindMapOutput } from "@/app/actions";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { cn } from "@/lib/utils";
import { SharedHeader } from "./shared-header";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";

// ─── Mind Map Node Parser ──────────────────────────────────────────────────
interface MindMapNode {
    id: string;
    text: string;
    level: number;
    children: MindMapNode[];
    color?: string;
}

const NODE_COLORS = [
    { bg: "bg-violet-500/20 border-violet-500/40", text: "text-violet-300", dot: "bg-violet-400", glow: "shadow-violet-500/20" },
    { bg: "bg-cyan-500/20 border-cyan-500/40", text: "text-cyan-300", dot: "bg-cyan-400", glow: "shadow-cyan-500/20" },
    { bg: "bg-emerald-500/20 border-emerald-500/40", text: "text-emerald-300", dot: "bg-emerald-400", glow: "shadow-emerald-500/20" },
    { bg: "bg-rose-500/20 border-rose-500/40", text: "text-rose-300", dot: "bg-rose-400", glow: "shadow-rose-500/20" },
    { bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-300", dot: "bg-amber-400", glow: "shadow-amber-500/20" },
    { bg: "bg-pink-500/20 border-pink-500/40", text: "text-pink-300", dot: "bg-pink-400", glow: "shadow-pink-500/20" },
    { bg: "bg-blue-500/20 border-blue-500/40", text: "text-blue-300", dot: "bg-blue-400", glow: "shadow-blue-500/20" },
    { bg: "bg-orange-500/20 border-orange-500/40", text: "text-orange-300", dot: "bg-orange-400", glow: "shadow-orange-500/20" },
];

function parseMindMap(text: string): MindMapNode[] {
    const lines = text.split("\n").filter(l => l.trim());
    const nodes: MindMapNode[] = [];
    const stack: MindMapNode[] = [];
    let counter = 0;

    for (const line of lines) {
        const stripped = line.replace(/^[\s\-*#>]+/, "").replace(/\*\*/g, "").trim();
        if (!stripped) continue;

        // Determine level from indentation or markdown symbols
        let level = 0;
        if (line.match(/^#{1,6}\s/)) {
            level = (line.match(/^(#+)/)?.[1].length ?? 1) - 1;
        } else {
            const spaces = line.match(/^(\s*)/)?.[1].length ?? 0;
            level = Math.floor(spaces / 2);
        }

        const node: MindMapNode = {
            id: `node-${counter++}`,
            text: stripped,
            level,
            children: [],
        };

        // Pop stack to find parent
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length === 0) {
            nodes.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
        }
        stack.push(node);
    }
    return nodes;
}

// ─── Mind Map Node Component ────────────────────────────────────────────────
function MindMapNodeComponent({ node, depth = 0, colorIdx = 0 }: { node: MindMapNode; depth?: number; colorIdx?: number }) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children.length > 0;
    const colors = NODE_COLORS[colorIdx % NODE_COLORS.length];
    const isRoot = depth === 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: depth * 0.05 }}
            className="relative"
        >
            <div className="flex items-start gap-2">
                {/* Vertical line connector */}
                {depth > 0 && (
                    <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-border/40" />
                )}
                {/* Horizontal connector */}
                {depth > 0 && (
                    <div className="absolute left-[-16px] top-[14px] w-4 h-px bg-border/40" />
                )}

                <div className="flex items-center gap-1 min-w-0 flex-1">
                    {hasChildren && (
                        <button
                            onClick={() => setIsOpen(o => !o)}
                            className="flex-shrink-0 h-5 w-5 rounded-full border border-border/50 bg-background/80 hover:bg-muted transition-colors flex items-center justify-center"
                        >
                            {isOpen
                                ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            }
                        </button>
                    )}
                    {!hasChildren && <div className={cn("h-2 w-2 rounded-full flex-shrink-0 ml-1.5", colors.dot)} />}

                    <div className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm leading-snug transition-all duration-200 hover:shadow-md cursor-default",
                        isRoot
                            ? "px-4 py-2 rounded-xl font-bold text-base bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 border-violet-500/40 text-foreground shadow-lg shadow-violet-500/10"
                            : `${colors.bg} ${colors.text} hover:${colors.glow}`,
                    )}>
                        {node.text}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 mt-2 space-y-2 relative border-l border-border/30 pl-4"
                    >
                        {node.children.map((child, i) => (
                            <MindMapNodeComponent
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                colorIdx={depth === 0 ? i : colorIdx}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Interactive Mind Map Viewer ────────────────────────────────────────────
function MindMapViewer({ mindMap, rawText }: { mindMap: GenerateMindMapOutput; rawText: string }) {
    const { toast } = useToast();
    const [zoom, setZoom] = useState(100);
    const [view, setView] = useState<"tree" | "raw">("tree");
    const nodes = parseMindMap(mindMap.mindmapText);

    const handleCopy = () => {
        navigator.clipboard.writeText(mindMap.mindmapText);
        toast({ title: "Copied!", description: "Mind map text copied to clipboard." });
    };

    const countNodes = (nodes: MindMapNode[]): number =>
        nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
    const totalNodes = countNodes(nodes);

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
                    <button
                        onClick={() => setView("tree")}
                        className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all", view === "tree" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                        <BrainCircuit className="h-3 w-3 inline mr-1" />Visual Tree
                    </button>
                    <button
                        onClick={() => setView("raw")}
                        className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all", view === "raw" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                        Raw Text
                    </button>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                    <Badge variant="secondary" className="text-xs">
                        {totalNodes} nodes
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {nodes.length} branches
                    </Badge>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(60, z - 10))}>
                        <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(150, z + 10))}>
                        <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(100)}>
                        <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* View */}
            <div className="flex-1 rounded-xl border border-border/30 bg-muted/20 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-22rem)]">
                    <div className="p-4" style={{ fontSize: `${zoom}%`, transformOrigin: "top left" }}>
                        {view === "tree" ? (
                            <div className="space-y-3">
                                {nodes.map((node, i) => (
                                    <MindMapNodeComponent key={node.id} node={node} depth={0} colorIdx={i} />
                                ))}
                            </div>
                        ) : (
                            <pre className="font-mono text-xs whitespace-pre-wrap break-words text-foreground/80 leading-relaxed">
                                {mindMap.mindmapText}
                            </pre>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
const EXAMPLE_TOPICS = [
    { label: "Machine Learning", text: "Machine Learning is a subset of AI that learns from data. Key concepts include supervised learning, unsupervised learning, neural networks, decision trees, and model evaluation metrics. Applications span computer vision, NLP, and recommendation systems." },
    { label: "Cell Biology", text: "Cell biology studies the structure and function of cells. Topics include cell membrane, organelles like mitochondria and nucleus, DNA replication, protein synthesis, cell division, and cellular respiration." },
    { label: "World War II", text: "World War II was a global conflict from 1939-1945. Key events include the Battle of Britain, D-Day invasion, Holocaust, Pacific Theater, atomic bombings, and allied victory." },
];

export function MindMapContent() {
    const [content, setContent] = useState("");
    const [mindMap, setMindMap] = useState<GenerateMindMapOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startGenerating] = useTransition();
    const { toast } = useToast();

    const handleGenerate = (text?: string) => {
        const inputText = text ?? content;
        if (inputText.trim().length < 50) {
            toast({
                title: "Content too short",
                description: "Please provide at least 50 characters to generate a mind map.",
                variant: "destructive",
            });
            return;
        }
        setError(null);
        setMindMap(null);
        startGenerating(async () => {
            const result = await generateMindMapAction({ content: inputText });
            if (result.error) {
                setError(result.error);
                toast({ title: "Mind Map Generation Failed", description: "Please check the panel for details.", variant: "destructive" });
            } else {
                setMindMap(result.data ?? null);
                toast({ title: "✨ Mind Map Generated!", description: "Your interactive mind map is ready." });
            }
        });
    };

    const charCount = content.trim().length;
    const isReady = charCount >= 50;

    return (
        <div className="flex h-full flex-col bg-muted/20 dark:bg-transparent">
            <SharedHeader
                title="Mind Map Creator"
                leftElement={<BackButton />}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 h-full items-start">

                    {/* Input Panel */}
                    <Card className="flex flex-col xl:col-span-1 border-border/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BrainCircuit className="h-4 w-4 text-violet-400" />
                                Enter Your Content
                            </CardTitle>
                            <CardDescription>Paste study material, lecture notes, or any topic to generate a visual mind map.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3">
                            <Textarea
                                placeholder="Paste your content here (minimum 50 characters)..."
                                className="h-full min-h-[280px] resize-none font-mono text-sm"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />

                            {/* Character counter */}
                            <div className="flex items-center justify-between text-xs">
                                <span className={cn("text-muted-foreground", charCount < 50 && charCount > 0 && "text-amber-400")}>
                                    {charCount < 50 ? `Need ${50 - charCount} more characters` : `${charCount} characters`}
                                </span>
                                {isReady && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400">
                                        ✓ Ready to generate
                                    </motion.span>
                                )}
                            </div>

                            {/* Quick example pills */}
                            <div className="space-y-1.5">
                                <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wide">Try an example:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {EXAMPLE_TOPICS.map((ex) => (
                                        <button
                                            key={ex.label}
                                            onClick={() => { setContent(ex.text); }}
                                            className="text-xs px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors"
                                        >
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating || !isReady}
                                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/20"
                            >
                                {isGenerating
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                                    : <><Wand2 className="mr-2 h-4 w-4" />Generate Mind Map</>
                                }
                            </Button>
                            {mindMap && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => { setMindMap(null); setContent(""); setError(null); }}
                                    className="border-border/40"
                                    title="Clear"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Output Panel */}
                    <div className="xl:col-span-2 h-full">
                        <Card className="h-full border-border/40">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                                    Generated Mind Map
                                </CardTitle>
                                <CardDescription>Interactive visual representation of your content hierarchy.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center h-[calc(100vh-22rem)] gap-4">
                                        <div className="relative">
                                            <div className="h-20 w-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                                            <BrainCircuit className="absolute inset-0 m-auto h-8 w-8 text-violet-400" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="font-medium text-foreground">Building your mind map...</p>
                                            <p className="text-sm text-muted-foreground">Organizing concepts into a visual hierarchy</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {["Analyzing", "Structuring", "Connecting"].map((step, i) => (
                                                <motion.span
                                                    key={step}
                                                    initial={{ opacity: 0.3 }}
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.5 }}
                                                    className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                                >
                                                    {step}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                ) : error ? (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Generation Failed</AlertTitle>
                                        <AlertDescription>
                                            The AI model could not generate a mind map. Please check your API key or network connection.
                                            <p className="text-xs font-mono mt-2 bg-destructive/10 p-2 rounded">Error: {error}</p>
                                        </AlertDescription>
                                    </Alert>
                                ) : mindMap ? (
                                    <MindMapViewer mindMap={mindMap} rawText={content} />
                                ) : (
                                    <div className="flex h-[calc(100vh-22rem)] items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/20">
                                        <div className="text-center p-8 space-y-3">
                                            <motion.div
                                                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                            >
                                                <BrainCircuit className="mx-auto h-14 w-14 text-violet-400/40" />
                                            </motion.div>
                                            <h3 className="text-lg font-semibold text-foreground/60">Your mind map will appear here</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Enter content on the left and click <strong>Generate Mind Map</strong> to begin.
                                            </p>
                                            <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground/50">
                                                <span>✦ Visual Tree View</span>
                                                <span>✦ Expandable Nodes</span>
                                                <span>✦ Color Coded</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
