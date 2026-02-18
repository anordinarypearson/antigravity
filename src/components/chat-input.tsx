
"use client";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Brush, Paperclip, FileText, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
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
    const hasContent = input.trim().length > 0 || !!imageDataUri || !!fileContent;

    return (
        <div className="max-sm:p-0 sm:p-6 border-t bg-background pb-safe">
            <div className="mx-auto max-w-5xl">
                {isOcrProcessing && (
                    <div className="mb-2">
                        <Progress value={ocrProgress} className="w-full h-1" />
                        <p className="text-xs text-muted-foreground text-center mt-1">Extracting text from image...</p>
                    </div>
                )}
                {imageDataUri && !isOcrProcessing && (
                    <div className="relative mb-3 w-fit group">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-xl" />
                        <Image src={imageDataUri} alt="Image preview" width={100} height={100} className="rounded-xl border border-border shadow-sm object-cover" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md hover:scale-110 transition-transform" onClick={() => setImageDataUri(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {fileContent && fileName && !isOcrProcessing && (
                    <div className="relative mb-3 flex items-center gap-3 text-sm text-foreground bg-muted/50 p-3 rounded-xl border border-border/50 shadow-sm max-w-md">
                        <div className="p-2 bg-background rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <span className="flex-1 truncate font-medium">{fileName}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => { setFileContent(null); setFileName(null); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form
                    onSubmit={handleFormSubmit}
                    className={cn(
                        "relative flex items-end gap-2 p-2 max-sm:rounded-none sm:rounded-[2rem] max-sm:border-0 border border-black dark:border-border max-sm:bg-transparent bg-muted/30 max-sm:shadow-none shadow-sm transition-all duration-300 focus-within:shadow-md focus-within:border-black dark:focus-within:border-border focus-within:bg-background",
                        hasContent ? "ring-2 ring-primary/5 border-black dark:border-border" : ""
                    )}
                >
                    <div className="flex items-center gap-1 pb-1 pl-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" disabled={isInputDisabled}>
                                    <Paperclip className="h-5 w-5" />
                                    <span className="sr-only">Attach file</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 p-2">
                                <DropdownMenuItem onSelect={handleOpenImageDialog} className="p-2 cursor-pointer gap-2 rounded-lg">
                                    <div className="p-1 bg-primary/10 rounded-md"><Image className="h-4 w-4 text-primary" /></div>
                                    <span>Image</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleOpenFileDialog} className="p-2 cursor-pointer gap-2 rounded-lg">
                                    <div className="p-1 bg-primary/10 rounded-md"><FileText className="h-4 w-4 text-primary" /></div>
                                    <span>Text File</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>


                    <div className="flex-1 py-1 min-h-[50px] flex items-center">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isOcrProcessing ? "Processing image..." : "Message SearnAI..."}
                            disabled={isInputDisabled}
                            className="h-auto py-2 border-0 bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 shadow-none focus-visible:ring-0 px-2"
                        />
                    </div>

                    <div className="flex items-center gap-2 pb-1 pr-1">
                        {input.length > 0 && (
                            <div className="hidden sm:block text-[10px] uppercase font-bold text-muted-foreground/50 select-none mr-2">
                                {input.length} chars
                            </div>
                        )}

                        {toggleEditor && (
                            <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden" onClick={toggleEditor} disabled={isInputDisabled}>
                                <Brush className="h-5 w-5" />
                                <span className="sr-only">Open AI Editor</span>
                            </Button>
                        )}
                        <Button type="button" size="icon" variant={isRecording ? "destructive" : "ghost"} className={cn("h-10 w-10 rounded-full transition-all duration-300", isRecording ? "animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-muted")} onClick={handleToggleRecording} disabled={isInputDisabled}>
                            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
                        </Button>
                        <Button
                            type="submit"
                            size="icon"
                            className={cn(
                                "h-11 w-11 rounded-full shadow-sm transition-all duration-300",
                                hasContent
                                    ? "bg-primary text-primary-foreground hover:scale-105 hover:shadow-md"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            disabled={isInputDisabled || !hasContent}
                        >
                            <Send className={cn("h-5 w-5", hasContent && "translate-x-0.5")} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </form>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-muted-foreground/40 font-medium">AI can make mistakes. Check important info.</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" />
            </div>
        </div>
    );
}

