
"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Brush, Paperclip, FileText, X } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Image from "next/image";
import { Progress } from "./ui/progress";

type ChatInputProps = {
    input: string;
    setInput: (value: string) => void;
    isTyping: boolean;
    isRecording: boolean;
    isOcrProcessing: boolean;
    ocrProgress: number;
    handleSendMessage: (message?: string) => void;
    handleToggleRecording: () => void;
    toggleEditor?: () => void;
    imageDataUri: string | null;
    setImageDataUri: (uri: string | null) => void;
    fileContent: string | null;
    setFileContent: (content: string | null) => void;
    fileName: string | null;
    setFileName: (name: string | null) => void;
    handleImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};


export function ChatInput({
    input, setInput, isTyping, isRecording, isOcrProcessing, ocrProgress, handleSendMessage, handleToggleRecording, toggleEditor,
    imageDataUri, setImageDataUri, fileContent, setFileContent, fileName, setFileName, handleImageFileChange
}: ChatInputProps) {

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFileContent(e.target?.result as string);
                    setFileName(file.name);
                    setImageDataUri(null);
                };
                reader.readAsText(file);
            } else {
                toast({ title: "Invalid file type", description: "Please upload a .txt file.", variant: "destructive" });
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleOpenFileDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = ".txt";
            fileInputRef.current.onchange = handleFileChange;
            fileInputRef.current.click();
        }
    };

    const handleOpenImageDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = "image/*";
            fileInputRef.current.onchange = handleImageFileChange;
            fileInputRef.current.click();
        }
    };

    const isInputDisabled = isTyping || isOcrProcessing;

    return (
        <div className="p-4 border-t bg-background">
            <div className="mx-auto max-w-3xl">
                {isOcrProcessing && (
                    <div className="mb-2">
                        <Progress value={ocrProgress} className="w-full h-1" />
                        <p className="text-xs text-muted-foreground text-center mt-1">Extracting text from image...</p>
                    </div>
                )}
                {imageDataUri && !isOcrProcessing && (
                    <div className="relative mb-2 w-fit">
                        <Image src={imageDataUri} alt="Image preview" width={80} height={80} className="rounded-md border object-cover" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => setImageDataUri(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {fileContent && fileName && !isOcrProcessing && (
                    <div className="relative mb-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md border">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 truncate">{fileName}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFileContent(null); setFileName(null); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form
                    onSubmit={handleFormSubmit}
                    className="relative flex items-center rounded-xl border bg-card p-2 shadow-lg focus-within:border-primary"
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0" disabled={isInputDisabled}>
                                <Paperclip className="h-5 w-5" />
                                <span className="sr-only">Attach file</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={handleOpenImageDialog}>Image</DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleOpenFileDialog}>Text File</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isOcrProcessing ? "Processing image..." : "Message SearnAI..."}
                        disabled={isInputDisabled}
                        className="h-10 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                    />
                    <input type="file" ref={fileInputRef} className="hidden" />
                    <div className="flex items-center gap-1">
                        {toggleEditor && (
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0 lg:hidden" onClick={toggleEditor} disabled={isInputDisabled}>
                                <Brush className="h-5 w-5" />
                                <span className="sr-only">Open AI Editor</span>
                            </Button>
                        )}
                        <Button type="button" size="icon" variant={isRecording ? "destructive" : "ghost"} className="h-9 w-9 flex-shrink-0" onClick={handleToggleRecording} disabled={isInputDisabled}>
                            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
                        </Button>
                        <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={isInputDisabled || (!input.trim() && !imageDataUri && !fileContent)}>
                            <Send className="h-5 w-5" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

