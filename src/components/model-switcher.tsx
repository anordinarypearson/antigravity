

"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import { BrainCircuit, Zap, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS } from "@/lib/models";

interface ModelSwitcherProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSwitcher({ selectedModel, onModelChange, disabled }: ModelSwitcherProps) {

    const currentModelDetails = AVAILABLE_MODELS.find(m => m.id === selectedModel);

    const getModelIcon = (modelId: string) => {
        if (modelId.includes('gpt-4') || modelId.includes('claude-3-opus')) return <Sparkles className="h-4 w-4 text-purple-500" />;
        if (modelId.includes('turbo') || modelId.includes('flash')) return <Zap className="h-4 w-4 text-yellow-500" />;
        return <Brain className="h-4 w-4 text-blue-500" />;
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
                    <BrainCircuit className="h-4 w-4" />
                    <span className="hidden sm:inline font-medium">{currentModelDetails?.name || selectedModel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                <DropdownMenuRadioGroup value={selectedModel} onValueChange={onModelChange}>
                    {AVAILABLE_MODELS.map(model => (
                        <DropdownMenuRadioItem key={model.id} value={model.id} className="items-start py-2 cursor-pointer">
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    {getModelIcon(model.id)}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{model.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
                                </div>
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
