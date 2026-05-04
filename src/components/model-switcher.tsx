

"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS } from "@/lib/models";

interface ModelSwitcherProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

const OpenAILogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a1.5545 1.5545 0 0 1 .3281.2662v5.9256a4.5124 4.5124 0 0 1-4.7846 3.9372zm-7.9056-3.4839a4.5124 4.5124 0 0 1-1.321-6.1005l.6171.3556 4.7783 2.7582a.7773.7773 0 0 0 .7862 0l5.8365-3.3685v2.3323a1.5273 1.5273 0 0 1-.0333.3274l-5.1221 2.9559a4.4533 4.4533 0 0 1-5.5417-5.2604zm-.5062-11.8596a4.522 4.522 0 0 1 5.4851-1.3934l-.1419.0804-4.7783 2.7582a.7862.7862 0 0 0-.3927.6813v6.7369l-2.02-1.1686a1.5545 1.5545 0 0 1-.3283-.2662V9.9482a4.4939 4.4939 0 0 1 2.1761-4.8667zm7.9056 3.4838a4.5124 4.5124 0 0 1 1.321 6.1005l-.6171-.3556-4.7783-2.7582a.7862.7862 0 0 0-.7862 0l-5.8365 3.3685v-2.3323a1.5273 1.5273 0 0 1 .0333-.3274l5.1221-2.9559a4.4533 4.4533 0 0 1 5.5417 5.2604zm7.9482 6.7849a4.5124 4.5124 0 0 1-5.4851 1.3934l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a1.5545 1.5545 0 0 1 .3283.2662v5.9257a4.4939 4.4939 0 0 1-2.1761 4.8667z" />
    </svg>
)

const GoogleLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
    </svg>
)

const AnthropicLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.42 22h3.5L12 3 3.08 22h3.5l1.62-3.8h7.6l1.62 3.8zm-6.68-15.6L14.7 16H9.3l1.44-9.6z" />
    </svg>
)

const MetaLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16.14 2.22c-1.34 0-2.5.54-3.56 1.52a6.34 6.34 0 0 0-.58.62 6.34 6.34 0 0 0-.58-.62c-1.06-.98-2.22-1.52-3.56-1.52C3.12 2.22 0 6.64 0 12s3.12 9.78 7.86 9.78c1.34 0 2.5-.54 3.56-1.52.2-.18.4-.38.58-.62.18.24.38.44.58.62 1.06.98 2.22 1.52 3.56 1.52 4.74 0 7.86-4.42 7.86-9.78s-3.12-9.78-7.86-9.78zM7.86 19.1c-2.4 0-4.06-2.6-4.06-5.52 0-2.42 1.18-4.32 2.94-4.88 1.96-.64 3.86.58 4.74 2.56.54 1.22.54 2.68 0 3.9-.88 1.98-2.78 3.2-4.74 2.56-2.5.8-3.32 1.38-3.32 1.38.88 0 1.66-.58 1.66-1.38zM16.14 19.1c-1.96.64-3.86-.58-4.74-2.56-.54-1.22-.54-2.68 0-3.9.88-1.98 2.78-3.2 4.74-2.56 1.76.56 2.94 2.46 2.94 4.88 0 2.92-1.66 5.52-4.06 5.52-1.66 0-3.32-.58-3.32-1.38 0 0 .82.58 3.32-.58.88 0 1.66 1.38 1.66 1.38z" />
    </svg>
)

const DeepSeekLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
    </svg>
)


export function ModelSwitcher({ selectedModel, onModelChange, disabled }: ModelSwitcherProps) {
    const currentModelDetails = AVAILABLE_MODELS.find(m => m.id === selectedModel);

    const getModelIcon = (modelId: string) => {
        const id = modelId.toLowerCase();
        if (id.includes('deepseek')) return <DeepSeekLogo className="h-4 w-4 text-blue-400" />;
        if (id.includes('llama') || id.includes('meta') || id.includes('maverick')) return <MetaLogo className="h-4 w-4 text-blue-500" />;
        if (id.includes('gemma') || id.includes('google')) return <GoogleLogo className="h-4 w-4 text-blue-600" />;
        if (id.includes('gpt') || id.includes('oss')) return <OpenAILogo className="h-4 w-4 text-green-600" />;
        if (id.includes('minimax')) return <BrainCircuit className="h-4 w-4 text-purple-500" />;
        if (id === 'auto') return <BrainCircuit className="h-4 w-4 text-amber-500" />;
        return <BrainCircuit className="h-4 w-4 text-muted-foreground" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-shrink-0 h-9 gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={disabled}
                >
                    {getModelIcon(selectedModel)}
                    <span className="hidden sm:inline font-medium">{currentModelDetails?.name || selectedModel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 max-h-[300px] overflow-y-auto">
                <DropdownMenuRadioGroup value={selectedModel} onValueChange={onModelChange}>
                    {AVAILABLE_MODELS.map(model => (
                        <DropdownMenuRadioItem key={model.id} value={model.id} className="items-start py-3 cursor-pointer">
                            <div className="flex gap-3">
                                <div className="mt-0.5 shrink-0">
                                    {getModelIcon(model.id)}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{model.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{model.description}</p>
                                </div>
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
