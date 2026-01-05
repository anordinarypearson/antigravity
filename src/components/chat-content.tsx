
"use client";

import { chatAction, generateImageAction } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, Share2, Volume2, RefreshCw, FileText, X, Edit, Save, Download, StopCircle, Paperclip, Mic, MicOff, Send, Layers, Plus, Search, ArrowUp, Wand2, Music, Youtube, MoreVertical, Play, Pause, Rewind, FastForward, Presentation, Video, Image as ImageIcon, ChevronDown, Globe, FileUp, FileAudio, File as FileIcon, Sparkles, Code, ChevronRight, Palette, Terminal, Zap, Square, ThumbsUp, ThumbsDown, ArrowDown, Pencil } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ShareDialog } from "./share-dialog";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { LimitExhaustedDialog } from "./limit-exhausted-dialog";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "./ui/progress";
import Tesseract from 'tesseract.js';
import { ModelSwitcher } from "./model-switcher";
import { create } from 'zustand';
import { YoutubeChatCard } from "./youtube-chat-card";
import { WebsiteChatCard } from "./website-chat-card";
import { textToSpeechAction } from "@/app/actions";
import { CoreMessage } from "ai";
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from "@/lib/models";
import { GeneratedImageCard } from "./generated-image-card";
import { ThinkingIndicator } from "./thinking-indicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { BrowserView } from "./browser-view";
import { motion } from "framer-motion";
import * as pdfjs from 'pdfjs-dist';
import wav from 'wav';
import { Buffer } from 'buffer';
import { useAuth } from "@/hooks/use-auth";
import { memo } from "react";
import remarkGfm from "remark-gfm";
import { ChatWelcomeScreen } from "./chat-welcome-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamingTypewriter } from "./typewriter-text";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// Required for pdf.js to work
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

export type Message = {
  id: string;
  role: "user" | "model" | "tool" | "browser";
  content: string;
  image?: string | null;
  duration?: number;
};

const CHAT_HISTORY_STORAGE_KEY = 'chatHistory';
const USER_NAME_STORAGE_KEY = 'userName';


type ChatStore = {
  activeVideoId: string | null;
  activeVideoTitle: string | null;
  isPlaying: boolean;
  showPlayer: boolean;
  setActiveVideoId: (id: string | null, title: string | null) => void;
  togglePlay: () => void;
  setShowPlayer: (show: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  activeVideoId: null,
  activeVideoTitle: null,
  isPlaying: false,
  showPlayer: false,
  setActiveVideoId: (id, title) => set({ activeVideoId: id, activeVideoTitle: title, isPlaying: !!id, showPlayer: !!id }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setShowPlayer: (show) => set({ showPlayer: show }),
}));


// Helper to decode audio
class AudioDecoder {
  static async decode(file: File): Promise<Float32Array> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
    return decodedAudio.getChannelData(0);
  }
}


const CodeBox = ({ language, code: initialCode }: { language: string, code: string }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(initialCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code has been copied to clipboard." });
  };

  const handleDownload = () => {
    const fileExtensions: { [key: string]: string } = {
      javascript: 'js',
      python: 'py',
      html: 'html',
      css: 'css',
      typescript: 'ts',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      php: 'php',
      ruby: 'rb',
      perl: 'pl',
      shell: 'sh',
      sql: 'sql',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      markdown: 'md',
    };
    const extension = fileExtensions[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded!", description: `Code saved as code.${extension}` });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="code-box">
      <div className="code-box-header">
        <span className="code-box-language">{language}</span>
        <div className="code-box-actions">
          <Button type="button" variant="ghost" size="sm" onClick={handleCopy}><Copy className="mr-1 h-4 w-4" /> Copy</Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleEditToggle}>
            {isEditing ? <Save className="mr-1 h-4 w-4" /> : <Edit className="mr-1 h-4 w-4" />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDownload}><Download className="mr-1 h-4 w-4" /> Download</Button>
          <Button type="button" variant="ghost" size="sm" disabled>Run</Button>
        </div>
      </div>
      {isEditing ? (
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono text-sm bg-black/50 border-0 rounded-t-none h-64"
        />
      ) : (
        <pre><code>{code}</code></pre>
      )}
    </div>
  );
};

const ChatInput = ({ onSendMessage, isTyping, activeButton, setActiveButton, currentModel, setCurrentModel, onStop, isCommandOpen, setIsCommandOpen }: { onSendMessage: (message: string, imageDataUri?: string | null, fileContent?: string | null) => void, isTyping: boolean, activeButton: 'deepthink' | 'music' | 'image' | null, setActiveButton: (button: 'deepthink' | 'music' | 'image' | null) => void, currentModel: string, setCurrentModel: (model: string) => void, onStop?: () => void, isCommandOpen?: boolean, setIsCommandOpen?: (open: boolean) => void }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (input.trim().endsWith('/')) {
      setIsCommandOpen?.(true);
    } else if (!input.includes('/')) {
      setIsCommandOpen?.(false);
    }
  }, [input, setIsCommandOpen]);

  // Handle Slash Command Selection
  const handleCommandSelect = (command: string) => {
    setIsCommandOpen?.(false);
    // Remove the slash
    const newInput = input.replace(/\/$/, '');
    setInput(newInput);

    switch (command) {
      case 'image':
        setActiveButton('image');
        break;
      case 'music':
        setActiveButton('music');
        break;
      case 'deepthink':
        setActiveButton('deepthink');
        break;
      case 'code':
        // Just a mode example, maybe sets a specialized system prompt or model?
        // keeping simple for now
        break;
    }
    textareaRef.current?.focus();
  };

  const handleToolbarButtonClick = (buttonName: 'deepthink' | 'music' | 'image') => {
    if (activeButton === buttonName) {
      setActiveButton(null);
    } else {
      setActiveButton(buttonName);
    }
  };
  const [finalTranscript, setFinalTranscript] = useState('');

  const handleLocalSendMessage = (messageToSend?: string) => {
    const message = (messageToSend || input || finalTranscript).trim();
    if (!message && !imageDataUri && !fileContent) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    onSendMessage(message, imageDataUri, fileContent);

    setInput('');
    setFinalTranscript('');
    setImageDataUri(null);
    setFileContent(null);
    setFileName(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setFinalTranscript('');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      toast({
        title: 'Speech Recognition Error',
        description: event.error,
        variant: 'destructive',
      });
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      if (audioSendTimeoutRef.current) {
        clearTimeout(audioSendTimeoutRef.current);
      }

      let interimTranscript = '';
      let currentFinalTranscript = finalTranscript;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setFinalTranscript(currentFinalTranscript);
      setInput(currentFinalTranscript + interimTranscript);

      audioSendTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          recognitionRef.current?.stop();
        }
        if ((currentFinalTranscript + interimTranscript).trim()) {
          handleLocalSendMessage(currentFinalTranscript + interimTranscript);
        }
      }, 1500); // Send after 1.5 seconds of silence
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript, isRecording]);


  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      setFinalTranscript('');
      recognitionRef.current.start();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLocalSendMessage();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileContent(e.target?.result as string);
          setFileName(file.name);
          setImageDataUri(null);
          toast({ title: "Text File Attached", description: "The content is ready to be sent with your next message." });
        };
        reader.readAsText(file);
      } else if (file.type.startsWith("audio/")) {
        handleAudioFileChange(file);
      } else if (file.type === "application/pdf") {
        handlePdfFileChange(file);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a .txt, audio, or .pdf file.", variant: "destructive" });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePdfFileChange = async (file: File) => {
    setIsOcrProcessing(true); // Re-use OCR state for PDF processing
    setOcrProgress(0);
    setFileName(file.name);
    setImageDataUri(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setOcrProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      setFileContent(fullText);
      toast({ title: "PDF Processed", description: "Text extracted. Ready to send with your next message." });
    } catch (e: any) {
      toast({ title: "PDF Processing Failed", description: e.message || 'Could not extract text.', variant: "destructive" });
      setFileContent(null);
      setFileName(null);
    } finally {
      setIsOcrProcessing(false);
    }
  }

  const handleAudioFileChange = async (file: File) => {
    setIsOcrProcessing(true);
    setOcrProgress(0);
    setFileName(file.name);
    setImageDataUri(null);
    toast({ title: "Transcribing Audio...", description: "This may take a moment." });

    try {
      const { pipeline } = await import('@xenova/transformers');
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');

      const audio = await AudioDecoder.decode(file);

      const transcript = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        callback_function: (beams: any[]) => {
          const progress = beams[0].progress;
          if (progress > ocrProgress) setOcrProgress(Math.round(progress));
        },
      });

      setFileContent((transcript as any).text);
      toast({ title: "Audio Transcribed!", description: "The extracted text will be sent with your next message." });

    } catch (error) {
      console.error("Audio transcription error:", error);
      toast({ title: "Audio Transcription Failed", description: "Could not process the audio file. This may be due to a network issue.", variant: "destructive" });
      setFileContent(null);
      setFileName(null);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Could not get canvas context"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    setIsOcrProcessing(true);
    setOcrProgress(0);

    try {
      const resizedDataUri = await resizeImage(file, 2000);
      setImageDataUri(resizedDataUri);
      setFileContent(null);
      setFileName(file.name);

      const { data: { text } } = await Tesseract.recognize(
        resizedDataUri,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      setFileContent(text);
      toast({
        title: "Image & Text Attached",
        description: `Text has been extracted. You can now ask questions.`,
      });

    } catch (error: any) {
      toast({ title: "OCR or Image processing Failed", description: error.message || "Could not read or process the image file.", variant: "destructive" });
      setFileContent(null);
      setImageDataUri(null);
      setFileName(null);
    } finally {
      setIsOcrProcessing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenFileDialog = (type: 'text' | 'pdf' | 'audio') => {
    if (fileInputRef.current) {
      if (type === 'text') fileInputRef.current.accept = ".txt";
      else if (type === 'pdf') fileInputRef.current.accept = ".pdf";
      else if (type === 'audio') fileInputRef.current.accept = "audio/*";

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

  const isInputDisabled = isOcrProcessing || isTyping;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`; // max-h-48 = 192px
    }
  }, [input]);

  return (
    <div className="relative">
      {(imageDataUri || (fileContent && fileName)) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-fit max-w-sm">
          {isOcrProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-md z-10">
              <p className="text-white font-bold text-sm drop-shadow-md">{Math.round(ocrProgress)}%</p>
              <Progress value={ocrProgress} className="w-16 h-1 mt-1" />
            </div>
          )}
          {imageDataUri && (
            <div className="relative">
              <Image src={imageDataUri} alt={fileName || "Image preview"} width={80} height={80} className="rounded-md border object-cover" />
              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => { setImageDataUri(null); setFileContent(null); setFileName(null); }} disabled={isOcrProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {fileContent && fileName && !imageDataUri && (
            <div className="relative flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md border w-full max-w-sm">
              {fileName.endsWith('.pdf') ? <FileIcon className="h-5 w-5 flex-shrink-0" /> : <FileText className="h-5 w-5 flex-shrink-0" />}
              <span className="flex-1 truncate">{fileName}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFileContent(null); setFileName(null); }} disabled={isOcrProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      <motion.form
        onSubmit={handleFormSubmit}
        initial={false}
        animate={isTyping ? { borderColor: "hsl(var(--primary))", boxShadow: "0 0 15px -3px hsl(var(--primary) / 0.3)" } : { borderColor: "hsla(var(--foreground) / 0.1)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        whileHover={{ borderColor: "hsla(var(--foreground) / 0.3)" }}
        whileFocusWithin={{ borderColor: "hsl(var(--primary))", boxShadow: "0 0 20px -5px hsl(var(--primary) / 0.4)" }}
        transition={{ duration: 0.3 }}
        className="relative flex flex-col gap-2 rounded-2xl border bg-background/80 backdrop-blur-xl p-3 shadow-sm"
      >
        {isCommandOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
            <Command>
              <CommandList>
                <CommandGroup heading="Modes">
                  <CommandItem onSelect={() => handleCommandSelect('image')}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Image Search</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('music')}>
                    <Music className="mr-2 h-4 w-4" />
                    <span>Music Generation</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('deepthink')}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    <span>DeepThink</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message SearnAI... (Type '/' for commands)"
          disabled={isInputDisabled}
          className="min-h-[44px] max-h-48 w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-2 text-base overflow-hidden"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleLocalSendMessage();
            }
          }}
        />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1">
            <ModelSwitcher selectedModel={currentModel} onModelChange={setCurrentModel} disabled={isInputDisabled} />

            <Button
              type="button"
              variant={activeButton === 'deepthink' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-8 w-8 rounded-lg", activeButton === 'deepthink' && "bg-secondary text-secondary-foreground")}
              onClick={() => handleToolbarButtonClick('deepthink')}
              disabled={isInputDisabled}
              title="DeepThink"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeButton === 'music' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-8 w-8 rounded-lg", activeButton === 'music' && "bg-secondary text-secondary-foreground")}
              onClick={() => handleToolbarButtonClick('music')}
              disabled={isInputDisabled}
              title="Music Generation"
            >
              <Music className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={activeButton === 'image' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn("h-8 w-8 rounded-lg", activeButton === 'image' && "bg-secondary text-secondary-foreground")}
              onClick={() => handleToolbarButtonClick('image')}
              disabled={isInputDisabled}
              title="Image Search"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled={isInputDisabled}>
                  <Plus className="h-5 w-5" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={handleOpenImageDialog}><ImageIcon className="mr-2 h-4 w-4" />Image</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleOpenFileDialog('text')}><FileText className="mr-2 h-4 w-4" />Text File</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleOpenFileDialog('pdf')}><FileIcon className="mr-2 h-4 w-4" />PDF File</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleOpenFileDialog('audio')}><FileAudio className="mr-2 h-4 w-4" />Audio File</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input type="file" ref={fileInputRef} className="hidden" />

            <Button type="button" size="icon" variant={isRecording ? "destructive" : "ghost"} className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleToggleRecording} disabled={isInputDisabled}>
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
            </Button>

            <Button
              type={isTyping ? "button" : "submit"}
              size="icon"
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90"
              disabled={isOcrProcessing || (!isTyping && !input.trim() && !imageDataUri && !fileContent)}
              onClick={isTyping ? onStop : undefined}
            >
              {isTyping ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              <span className="sr-only">{isTyping ? "Stop" : "Send"}</span>
            </Button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}


const ChatBar = React.memo(({
  onSendMessage,
  isTyping,
  activeButton,
  setActiveButton,
  currentModel,
  setCurrentModel,
  isPlayground = false,
  onStop,
  isCommandOpen,
  setIsCommandOpen,
}: {
  onSendMessage: (message: string, imageDataUri?: string | null, fileContent?: string | null) => void;
  isTyping: boolean;
  activeButton: 'deepthink' | 'music' | 'image' | null;
  setActiveButton: (button: 'deepthink' | 'music' | 'image' | null) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  isPlayground?: boolean;
  onStop?: () => void;
  isCommandOpen?: boolean;
  setIsCommandOpen?: (open: boolean) => void;
}) => {

  const handleToolbarButtonClick = (buttonName: 'deepthink' | 'music' | 'image') => {
    if (activeButton === buttonName) {
      setActiveButton(null); // Toggle off
    } else {
      setActiveButton(buttonName);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-3xl", isPlayground ? "p-2" : "p-2 pb-4")}>
      <ChatInput
        onSendMessage={onSendMessage}
        isTyping={isTyping}
        activeButton={activeButton}
        setActiveButton={setActiveButton}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        onStop={onStop}
        isCommandOpen={isCommandOpen}
        setIsCommandOpen={setIsCommandOpen}
      />
    </div>
  )
})
ChatBar.displayName = "ChatBar";


type ChatContentProps = {
  isPlayground?: boolean;
  onCanvasContent?: (content: string) => void;
  answerTypes: { [key: string]: boolean };
  onMessageSent?: () => void;
};

type ChatContentHandle = {
  handleReceiveCanvasContent: (content: string) => void;
};


export const ChatContent = forwardRef<ChatContentHandle, ChatContentProps>(({ isPlayground = false, onCanvasContent, answerTypes, onMessageSent }, ref) => {
  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [history, setHistory] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<string | null>(null);

  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { setActiveVideoId } = useChatStore();
  const [userName, setUserName] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<'deepthink' | 'music' | 'image' | null>(null);
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL_ID);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Using generic "editId" to track which message is being edited
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const lastBotMessageId = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (savedName) {
        setUserName(savedName);
      }
    } catch (error) {
      console.error("Failed to load chat state from localStorage", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [history]);

  const isUserNearBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (!viewport) return true; // Default to true if viewport isn't ready
    return viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight) < 150;
  }, []);

  useEffect(() => {
    if (!history?.length || !scrollAreaRef?.current) return;
    const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const latestBotMsg = [...history].reverse().find(m => m.role === "model");

    if (!latestBotMsg || lastBotMessageId.current === latestBotMsg.id) return;

    lastBotMessageId.current = latestBotMsg.id;

    const node = document.querySelector(`[data-message-id="${latestBotMsg.id}"]`);

    if (node && isUserNearBottom()) {
      // Use a timeout to ensure the element is fully rendered before scrolling
      setTimeout(() => {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.classList.add("searn-highlight");
        setTimeout(() => node.classList.remove("searn-highlight"), 800);
      }, 100);
    } else if (isUserNearBottom()) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }

  }, [history, isUserNearBottom]);

  // Handle Scroll to Bottom Visibility
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isBottom = scrollHeight - (scrollTop + clientHeight) < 100;
    setShowScrollBottom(!isBottom);
  };

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, [scrollAreaRef.current]);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleTextToSpeech = useCallback(async (text: string, id: string) => {
    if (isSynthesizing === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setAudioDataUri(null);
      setIsSynthesizing(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSynthesizing(id);
    setAudioDataUri(null);

    try {
      const result = await textToSpeechAction({ text });
      if (result.error) throw new Error(result.error);
      if (result.data?.audioDataUri) {
        setAudioDataUri(result.data.audioDataUri);
      }
    } catch (e: any) {
      toast({ title: 'Audio Generation Failed', description: e.message, variant: 'destructive' });
      setIsSynthesizing(null);
    }
  }, [isSynthesizing, toast]);

  const executeChat = useCallback(async (
    currentHistory: Message[],
    currentImageDataUri?: string | null,
    currentFileContent?: string | null
  ) => {
    setIsTyping(true);
    const startTime = Date.now();

    if (onMessageSent) {
      onMessageSent();
    }

    const genkitHistory: CoreMessage[] = currentHistory.map(h => ({
      role: h.role as 'user' | 'model' | 'tool',
      content: String(h.content),
    }));

    // Create a temporary message ID for streaming
    const modelMessageId = `${Date.now()}-model`;
    let accumulatedContent = '';

    try {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Call the streaming API
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: genkitHistory,
          userName: userName,
          fileContent: currentFileContent,
          imageDataUri: currentImageDataUri,
          model: activeButton === 'deepthink' ? 'gpt-oss-120b' : currentModel,
          isMusicMode: activeButton === 'music',
          isPlayground: isPlayground,
          answerTypes: answerTypes,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429 || errorData.error === '__LIMIT_EXHAUSTED__') {
          setShowLimitDialog(true);
          setIsTyping(false);
          return;
        }

        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle non-streaming responses (search/music modes)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        setGenerationTime(duration);
        setIsTyping(false);

        if (result.type === 'canvas') {
          onCanvasContent?.(result.content);
          const confirmationMessage: Message = {
            id: modelMessageId,
            role: 'model',
            content: "Done. I've placed the content in the canvas.",
            duration: duration,
          };
          setHistory(prev => [...prev, confirmationMessage]);
        } else {
          setHistory(prev => [...prev, { id: modelMessageId, role: "model", content: result.content, duration: duration }]);
        }
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();

      // Add a placeholder message that we'll update
      setHistory(prev => [...prev, { id: modelMessageId, role: "model", content: '' }]);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Update the message in history with the accumulated content
        setHistory(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      setGenerationTime(duration);
      setIsTyping(false);

      // Final update with duration
      setHistory(prev =>
        prev.map(msg =>
          msg.id === modelMessageId
            ? { ...msg, duration: duration }
            : msg
        )
      );

    } catch (error: any) {
      setIsTyping(false);

      if (error.name === 'AbortError') {
        toast({ title: 'Generation Stopped', description: 'You have stopped the AI response.' });
      } else {
        toast({ title: "Chat Error", description: error.message, variant: "destructive" });
      }

      // Remove the placeholder message if streaming failed
      if (accumulatedContent === '') {
        setHistory(prev => prev.filter(msg => msg.id !== modelMessageId));
      }
    } finally {
      abortControllerRef.current = null;
    }

  }, [currentModel, activeButton, toast, userName, onCanvasContent, isPlayground, answerTypes]);


  const handleSendMessage = useCallback((messageContent: string, imageDataUri?: string | null, fileContent?: string | null) => {
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageContent,
      image: imageDataUri
    };

    const newHistory = [...history, userMessage];
    setHistory(newHistory);

    const isImageSearchRequest = activeButton === 'image';

    if (isImageSearchRequest) {
      setIsTyping(true);
      const startTime = Date.now();
      const query = messageContent.trim();

      fetch('/api/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
        .then(res => res.json())
        .then(result => {
          const endTime = Date.now();
          setGenerationTime((endTime - startTime) / 1000);
          setIsTyping(false);

          if (!result.success || result.error) {
            toast({ title: "Image Search Error", description: result.error || 'Failed to search images', variant: "destructive" });
          } else if (result.images && result.images.length > 0) {
            const imagePayload = {
              type: 'image-gallery',
              images: result.images,
              query: query,
              total: result.total
            };
            const modelMessageId = `${Date.now()}-model`;
            setHistory(prev => [...prev, { id: modelMessageId, role: "model", content: JSON.stringify(imagePayload) }]);
          } else {
            toast({ title: "No Images Found", description: `No images found for "${query}"`, variant: "destructive" });
          }
        })
        .catch(error => {
          setIsTyping(false);
          toast({ title: "Image Search Error", description: error.message, variant: "destructive" });
        });
    } else {
      executeChat(newHistory, imageDataUri, fileContent);
    }
  }, [activeButton, executeChat, history, toast]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    handleReceiveCanvasContent(content: string) {
      setHistory(prev => [...prev, { id: `${Date.now()}-model`, role: 'model', content: "Done. I've placed the content in the canvas." }]);
    }
  }));


  const handleRegenerateResponse = async () => {
    const lastUserMessageIndex = history.findLastIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const historyForRegen = history.slice(0, lastUserMessageIndex + 1);
    setHistory(historyForRegen);

    const lastUserMessage = historyForRegen[lastUserMessageIndex];
    // When regenerating, we must pass the same context as the original message
    await executeChat(historyForRegen, lastUserMessage.image, null);
  };


  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "The response has been copied to clipboard." });
  };

  const handleShare = (text: string) => {
    setShareContent(text);
  };

  const handleBrowserToggle = (url: string | null) => {
    setHistory(prev => {
      const filtered = prev.filter(m => m.role !== 'browser');
      if (url) {
        return [...filtered, { id: `browser-${Date.now()}`, role: 'browser', content: url }];
      }
      return filtered;
    });
  };

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Reuse existing file handling logic
      const file = files[0]; // Handle first file for now
      if (file.type.startsWith('image/')) {
        // Mocking event for handleImageFileChange
        // We'd need to refactor handleImageFileChange to accept File directly, 
        // or just recreate logic here. Let's refactor slightly effectively by direct call.
        // Actually, let's just create a synthetic event or call logic directly.
        // Better: extract logic to `processImageFile` and `processOtherFile`.
        // For expediency, we'll manually call the input ref logic or similar.

        // Simulating the file input workflow:
        if (fileInputRef.current) {
          // Create a DataTransfer to set files on the input
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInputRef.current.files = dt.files;
          // Trigger change manually
          const event = { target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>;
          handleImageFileChange(event);
        }
      } else {
        // Determine type for handleFileChange
        if (fileInputRef.current) {
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInputRef.current.files = dt.files;
          const event = { target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>;
          handleFileChange(event);
        }
      }
    }
  }, []);

  // Edit Message Handlers
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    // Find index
    const index = history.findIndex(m => m.id === messageId);
    if (index === -1) return;

    // Truncate history to this point
    const newHistory = history.slice(0, index);
    const newMessage: Message = { ...history[index], content: editedContent };

    // Update UI immediately
    setHistory([...newHistory, newMessage]);
    setEditingMessageId(null);

    // Regenerate from here
    await executeChat([...newHistory, newMessage], newMessage.image, null);
    // Note: passing null for fileContent as we assume it's part of context or re-attached if visible.
    // Ideally we should preserve attachments. For now, text edit is primary.
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const showWelcome = history.length === 0 && !isTyping;


  const renderMessageContent = (message: Message) => {
    if (message.role === 'browser') {
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="h-[60vh] flex flex-col border rounded-2xl bg-card overflow-hidden my-4"
        >
          <div className="flex items-center justify-between p-2 border-b">
            <p className="text-sm font-semibold truncate ml-2">Inline Browser</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleBrowserToggle(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <BrowserView initialUrl={message.content} />
          </div>
        </motion.div>
      )
    }

    const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
    const thinkingText = thinkMatch ? thinkMatch[1].trim() : null;
    let mainContent = thinkMatch ? message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim() : message.content;

    try {
      const data = JSON.parse(mainContent);
      if (data.type === 'youtube' && data.videoId) {
        return <YoutubeChatCard videoData={data} onPin={() => setActiveVideoId(data.videoId, data.title)} />;
      }
      if (data.type === 'website_results' && Array.isArray(data.results)) {
        return (
          <div className="space-y-3">
            <p className="text-sm">I searched the entire internet and found these results:</p>
            {data.results.map((result: any, index: number) => (
              <WebsiteChatCard key={index} websiteData={result} onBrowserToggle={handleBrowserToggle} />
            ))}
          </div>
        );
      }
      if (data.type === 'image' && data.imageDataUri) {
        return (
          <div className="flex flex-wrap gap-3">
            <GeneratedImageCard imageDataUri={data.imageDataUri} prompt={data.prompt} />
          </div>
        );
      }
      if (data.type === 'images' && Array.isArray(data.images)) {
        return (
          <div className="flex flex-wrap gap-3">
            {data.images.map((img: { imageDataUri: string; prompt: string }, idx: number) => (
              <GeneratedImageCard key={idx} imageDataUri={img.imageDataUri} prompt={img.prompt} />
            ))}
          </div>
        );
      }
      if (data.type === 'image-gallery' && Array.isArray(data.images)) {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Found {data.total} images for "{data.query}"</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {data.images.map((img: any) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border/20 hover:border-primary/50 transition-all hover:shadow-xl">
                  <a href={img.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img
                      src={img.thumbnail}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-[10px] text-white/60 font-medium">#{img.index}</p>
                      <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{img.alt}</p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } catch (e) {
      // Not a JSON object, so render as plain text
    }

    // Wrap plain text in Typewriter if it's the latest message and still typing
    if (message.id === history[history.length - 1].id && isTyping && message.role === 'model') {
      // We can use a custom renderer for ReactMarkdown, or just wrap the whole thing.
      // Since ReactMarkdown handles streaming gracefully usually, but user wants "smooth typewriter".
      // We'll wrap the `restOfContent` below for the *response* part.
    }

    // Fallback for single website result for backward compatibility
    try {
      const data = JSON.parse(mainContent);
      if (data.type === 'website' && data.url) {
        mainContent = `I found this website for you: [${data.title || data.url}](${data.url})`;
      }
    } catch (e) {
      // Not a JSON object
    }

    const responseHeaderMatch = mainContent.match(/\*\*Response from (.*?)\*\*\n\n/);
    if (responseHeaderMatch) {
      const modelName = responseHeaderMatch[1];
      const restOfContent = mainContent.substring(responseHeaderMatch[0].length);
      const markdownProps = {
        remarkPlugins: [remarkMath, remarkGfm],
        rehypePlugins: [rehypeKatex],
        className: "prose dark:prose-invert max-w-none text-sm leading-relaxed",
        components: {
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <CodeBox language={match[1]} code={String(children).replace(/\n$/, '')} />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          blockquote({ node, children, ...props }: any) {
            const value = React.Children.toArray(children).map(child =>
              React.isValidElement(child) ? (child.props.children) : child
            ).join('') || '';
            if (value.startsWith('[!NOTE]')) return <blockquote {...props} data-type="note"><strong>💡 Note</strong>{value.replace('[!NOTE]', '')}</blockquote>;
            if (value.startsWith('[!TIP]')) return <blockquote {...props} data-type="tip"><strong>✨ Tip</strong>{value.replace('[!TIP]', '')}</blockquote>;
            if (value.startsWith('[!WARNING]')) return <blockquote {...props} data-type="warning"><strong>⚠️ Warning</strong>{value.replace('[!WARNING]', '')}</blockquote>;
            if (value.startsWith('[!SUCCESS]')) return <blockquote {...props} data-type="success"><strong>✅ Success</strong>{value.replace('[!SUCCESS]', '')}</blockquote>;
            return <blockquote {...props}>{children}</blockquote>;
          },
          img: ({ node, ...props }: any) => (
            <div className="my-4 not-prose inline-block">
              <GeneratedImageCard imageDataUri={String(props.src || '')} prompt={String(props.alt || 'Generated Image')} />
            </div>
          ),
          p: ({ node, ...props }: any) => <div className="mb-4" {...props} />,
          table: ({ node, ...props }: any) => <table className="table-auto w-full my-4" {...props} />,
          thead: ({ node, ...props }: any) => <thead className="bg-muted/50" {...props} />,
          tbody: ({ node, ...props }: any) => <tbody {...props} />,
          tr: ({ node, ...props }: any) => <tr className="border-b border-border" {...props} />,
          th: ({ node, ...props }: any) => <th className="p-2 text-left font-semibold" {...props} />,
          td: ({ node, ...props }: any) => <td className="p-2" {...props} />,
        }
      };

      return (
        <>
          <div className="model-response-header">
            <strong>Response from {modelName}</strong>
          </div>
          {thinkingText && <ThinkingIndicator text={thinkingText} duration={message.duration} />}

          {isTyping && message.id === history[history.length - 1].id ? (
            <StreamingTypewriter content={restOfContent} speed={3} render={(text) => (
              <ReactMarkdown {...markdownProps}>
                {text}
              </ReactMarkdown>
            )} />
          ) : (
            <ReactMarkdown {...markdownProps}>
              {restOfContent}
            </ReactMarkdown>
          )}
        </>
      );
    }
  };

  const chatBar = (
    <ChatBar
      onSendMessage={handleSendMessage}
      isTyping={isTyping}
      activeButton={activeButton}
      setActiveButton={setActiveButton}
      currentModel={currentModel}
      setCurrentModel={setCurrentModel}
      isPlayground={isPlayground}
      onStop={handleStopGeneration}
      isCommandOpen={isCommandOpen}
      setIsCommandOpen={setIsCommandOpen}
    />
  );

  return (
    <div className={cn("flex h-full flex-col", isPlayground ? "" : "relative")}>
      <LimitExhaustedDialog isOpen={showLimitDialog} onOpenChange={setShowLimitDialog} />
      <ShareDialog
        isOpen={!!shareContent}
        onOpenChange={(open) => !open && setShareContent(null)}
        content={shareContent || ""}
      />
      <div
        className={cn("flex-1 relative bg-muted/40", isPlayground ? "h-full flex flex-col" : "")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl">
            <div className="text-center">
              <Paperclip className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
              <p className="text-2xl font-bold text-primary">Drop files here</p>
            </div>
          </div>
        )}
        {isLoadingHistory ? (
          <div className="flex-1 p-4 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-20 w-full max-w-lg rounded-xl" />
              </div>
            ))}
          </div>
        ) : showWelcome && !isPlayground ? (
          <ChatWelcomeScreen
            userName={userName}
            setActiveButton={setActiveButton}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          <ScrollArea className="flex-1" ref={scrollAreaRef} onScrollCapture={handleScroll}>
            <div className={cn("mx-auto w-full max-w-3xl space-y-8 px-4", isPlayground ? "pb-4" : "pb-48")}>
              {history.map((message, index) => (
                <React.Fragment key={`${message.id}-${index}`}>
                  <div
                    data-message-id={message.id}
                    className={cn(
                      "flex w-full items-start gap-4 group", // Added group for hover capability
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="flex flex-col items-end gap-1 max-w-md w-full">
                        {editingMessageId === message.id ? (
                          <div className="w-full bg-muted p-3 rounded-xl border border-primary/50">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[60px] mb-2 bg-transparent border-0 focus-visible:ring-0 p-0 resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                              <Button size="sm" onClick={() => handleSaveEdit(message.id)}>Save & Submit</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/msg">
                            <div className="border bg-transparent inline-block rounded-xl p-3">
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -left-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/msg:opacity-100 transition-opacity"
                              onClick={() => handleEditMessage(message.id, message.content)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        {renderMessageContent(message)}
                        {audioDataUri && isSynthesizing === message.id && (
                          <audio
                            ref={audioRef}
                            src={audioDataUri}
                            autoPlay
                            onEnded={() => setIsSynthesizing(null)}
                            onPause={() => setIsSynthesizing(null)}
                          />
                        )}
                        {message.role === 'model' && message.role !== 'browser' && (
                          <div className="mt-2 flex items-center gap-1 transition-opacity">
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyToClipboard(message.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleShare(message.content)}>
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 hover:text-green-500 transition-colors" onClick={() => {/* TODO: implement like */ }}>
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 hover:text-red-500 transition-colors" onClick={() => {/* TODO: implement unlike */ }}>
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleTextToSpeech(message.content, message.id)}>
                              {isSynthesizing === message.id ? <StopCircle className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleRegenerateResponse} disabled={isTyping}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {index < history.length - 1 && (
                    <Separator className="my-8" />
                  )}
                </React.Fragment>
              )
              )}
              {isTyping && <ThinkingIndicator text={null} duration={generationTime} />}
            </div>
          </ScrollArea>
        )}
      </div>

      {isPlayground ? (
        <div className="border-t">
          {chatBar}
        </div>
      ) : (
        <div className={cn("fixed bottom-0 left-0 lg:left-auto right-0 w-full lg:w-[calc(100%-16rem)] group-data-[collapsible=icon]:lg:w-[calc(100%-3rem)] transition-all bg-transparent")}>
          {showScrollBottom && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-sm animate-bounce"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          )}
          {chatBar}
        </div>
      )}

    </div>
  );
});
ChatContent.displayName = "ChatContent";
