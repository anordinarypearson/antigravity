
"use client";

import { chatAction } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Bot, User, Copy, Share2, Volume2, RefreshCw, FileText, X, Edit, Save,
  Download, StopCircle, Paperclip, Mic, MicOff, Send, Layers, Plus,
  Search, ArrowUp, Wand2, Music, Youtube, MoreVertical, Play, Pause,
  Rewind, FastForward, Presentation, Video, Image as ImageIcon,
  ChevronDown, Globe, FileUp, FileAudio, File as FileIcon, Sparkles,
  Code, ChevronRight, Palette, Terminal, Zap, Square, ThumbsUp,
  ThumbsDown, ArrowDown, Pencil, Check, Clipboard, Edit2,
  Wrench, Timer, Clock, Calculator, Dices
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus';
import prism from 'react-syntax-highlighter/dist/cjs/styles/prism/prism';
import { useTheme } from "next-themes";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageSearchCard } from "./image-search-card";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { ToolWidgetRouter, type ToolName } from "./tool-widgets";





export type Message = {
  id: string;
  role: "user" | "model" | "tool" | "browser";
  content: string;
  image?: string | null;
  duration?: number;
  timestamp?: number;
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
  isCommandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  activeVideoId: null,
  activeVideoTitle: null,
  isPlaying: false,
  showPlayer: false,
  isCommandOpen: false,
  setActiveVideoId: (id, title) => set({ activeVideoId: id, activeVideoTitle: title, isPlaying: !!id, showPlayer: !!id }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setShowPlayer: (show) => set({ showPlayer: show }),
  setCommandOpen: (open) => set({ isCommandOpen: open }),
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
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied!", description: "Code has been copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
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

  const isDark = theme === 'dark';

  return (
    <div className="group relative my-4 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            {language || 'text'}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clipboard className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleEditToggle}
            title={isEditing ? "Save code" : "Edit code"}
          >
            {isEditing ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            title="Download code"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        {isEditing ? (
          <div className="relative">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[300px] w-full resize-none rounded-none border-0 bg-background p-4 font-mono text-sm leading-relaxed focus-visible:ring-0"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto custom-scrollbar">
            {SyntaxHighlighter ? (
              <SyntaxHighlighter
                language={language?.toLowerCase() || 'text'}
                style={isDark ? (vscDarkPlus || {}) : (prism || {})}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  background: 'transparent',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  borderRadius: 0,
                }}
                wrapLines={true}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: '2.5em',
                  paddingRight: '1em',
                  color: 'hsl(var(--muted-foreground))',
                  textAlign: 'right',
                  opacity: 0.5
                }}
              >
                {code}
              </SyntaxHighlighter>
            ) : (
              <pre className="p-6 overflow-auto font-mono text-sm leading-relaxed">
                <code>{code}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatInput = ({ onSendMessage, isTyping, activeButton, setActiveButton, activeTool, setActiveTool, currentModel, setCurrentModel, onStop, isCommandOpen, setIsCommandOpen }: { onSendMessage: (message: string, imageDataUri?: string | null, fileContent?: string | null) => void, isTyping: boolean, activeButton: 'tools' | 'music' | 'image' | null, setActiveButton: (button: 'tools' | 'music' | 'image' | null) => void, activeTool: ToolName | null, setActiveTool: (tool: ToolName | null) => void, currentModel: string, setCurrentModel: (model: string) => void, onStop?: () => void, isCommandOpen?: boolean, setIsCommandOpen?: (open: boolean) => void }) => {
  const [input, setInput] = useState('');
  const { theme } = useTheme();
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
        setActiveTool(null);
        break;
      case 'music':
        setActiveButton('music');
        setActiveTool(null);
        break;
      case 'timer':
        setActiveButton('tools');
        setActiveTool('timer');
        break;
      case 'stopwatch':
        setActiveButton('tools');
        setActiveTool('stopwatch');
        break;
      case 'calculator':
        setActiveButton('tools');
        setActiveTool('calculator');
        break;
      case 'colorpicker':
        setActiveButton('tools');
        setActiveTool('colorpicker');
        break;
      case 'dice':
        setActiveButton('tools');
        setActiveTool('dice');
        break;
      case 'code':
        break;
    }
    textareaRef.current?.focus();
  };

  const handleToolbarButtonClick = (buttonName: 'tools' | 'music' | 'image') => {
    if (activeButton === buttonName) {
      setActiveButton(null);
      if (buttonName === 'tools') setActiveTool(null);
    } else {
      setActiveButton(buttonName);
    }
  };

  const handleSelectTool = (tool: ToolName) => {
    setActiveButton('tools');
    setActiveTool(tool);
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


  const handleToggleRecording = async () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        // Explicitly request permission first to trigger browser prompt reliably
        await navigator.mediaDevices.getUserMedia({ audio: true });

        setInput('');
        setFinalTranscript('');
        recognitionRef.current.start();
      } catch (err: any) {
        console.error("Microphone permission error:", err);
        let errorMessage = "Could not access microphone.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Microphone permission was denied. Please allow microphone access in your browser settings (look for the camera/mic icon in the address bar).";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please ensure your microphone is connected.";
        }

        toast({
          title: "Microphone Access Denied",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
        animate={isTyping ? { borderColor: "hsl(var(--primary))", boxShadow: "0 0 15px -3px hsl(var(--primary) / 0.3)" } : { borderColor: "var(--chat-border-color)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        whileHover={{ borderColor: "var(--chat-border-hover-color)" }}
        whileFocusWithin={{ borderColor: "hsl(var(--primary))", boxShadow: "0 0 20px -5px hsl(var(--primary) / 0.4)" }}
        transition={{ duration: 0.3 }}
        style={{ "--chat-border-color": theme === 'dark' ? "hsla(var(--foreground) / 0.1)" : "black", "--chat-border-hover-color": theme === 'dark' ? "hsla(var(--foreground) / 0.3)" : "black" } as React.CSSProperties}
        className="relative flex flex-col gap-2 max-sm:rounded-none sm:rounded-2xl border max-sm:border-x-0 max-sm:border-b-0 bg-background max-sm:p-2 sm:p-3 max-sm:shadow-none shadow-sm"
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
                </CommandGroup>
                <CommandGroup heading="Tools">
                  <CommandItem onSelect={() => handleCommandSelect('timer')}>
                    <Timer className="mr-2 h-4 w-4" />
                    <span>Timer</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('stopwatch')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Stopwatch</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('calculator')}>
                    <Calculator className="mr-2 h-4 w-4" />
                    <span>Calculator</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('colorpicker')}>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Color Picker</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleCommandSelect('dice')}>
                    <Dices className="mr-2 h-4 w-4" />
                    <span>Dice Roller</span>
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

            <div className={cn("flex items-center h-8 rounded-lg transition-colors border border-transparent", activeButton === 'tools' ? "bg-secondary text-secondary-foreground" : "hover:bg-muted")}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-l-lg rounded-r-none hover:bg-transparent", activeButton === 'tools' && "hover:bg-secondary")}
                onClick={() => { setActiveButton(null); setActiveTool(null); }}
                disabled={isInputDisabled}
                title="Reset Tools"
              >
                <Wrench className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-5 rounded-r-lg rounded-l-none px-0 hover:bg-transparent", activeButton === 'tools' && "hover:bg-secondary")}
                    disabled={isInputDisabled}
                    title="Open Tools"
                  >
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" side="top" align="start">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Tools</p>
                    {[
                      { tool: 'timer' as ToolName, icon: Timer, label: 'Timer' },
                      { tool: 'stopwatch' as ToolName, icon: Clock, label: 'Stopwatch' },
                      { tool: 'calculator' as ToolName, icon: Calculator, label: 'Calculator' },
                      { tool: 'colorpicker' as ToolName, icon: Palette, label: 'Color Picker' },
                      { tool: 'dice' as ToolName, icon: Dices, label: 'Dice Roller' },
                    ].map(({ tool, icon: Icon, label }) => (
                      <button
                        key={tool}
                        onClick={() => handleSelectTool(tool)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                          activeTool === tool && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {activeTool && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                {activeTool === 'colorpicker' ? 'Color Picker' : activeTool}
              </span>
            )}
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
  activeTool,
  setActiveTool,
}: {
  onSendMessage: (message: string, imageDataUri?: string | null, fileContent?: string | null) => void;
  isTyping: boolean;
  activeButton: 'tools' | 'music' | 'image' | null;
  setActiveButton: (button: 'tools' | 'music' | 'image' | null) => void;
  activeTool: ToolName | null;
  setActiveTool: (tool: ToolName | null) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  isPlayground?: boolean;
  onStop?: () => void;
  isCommandOpen?: boolean;
  setIsCommandOpen?: (open: boolean) => void;
}) => {

  const handleToolbarButtonClick = (buttonName: 'tools' | 'music' | 'image') => {
    if (activeButton === buttonName) {
      setActiveButton(null); // Toggle off
      if (buttonName === 'tools') setActiveTool(null);
    } else {
      setActiveButton(buttonName);
    }
  };

  return (
    <div className={cn("mx-auto w-full", isPlayground ? "p-2 max-w-3xl" : "max-sm:p-0 max-sm:max-w-none sm:px-4 sm:pb-4 max-w-3xl")}>
      <ChatInput
        onSendMessage={onSendMessage}
        isTyping={isTyping}
        activeButton={activeButton}
        setActiveButton={setActiveButton}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
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
  const { checkAndIncrementMessageLimit } = useUsageLimits();

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
  const [activeButton, setActiveButton] = useState<'tools' | 'music' | 'image' | null>(null);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL_ID);

  const handleUpdateName = (newName: string) => {
    setUserName(newName);
    localStorage.setItem(USER_NAME_STORAGE_KEY, newName);
  };

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const { isCommandOpen, setCommandOpen: setIsCommandOpen } = useChatStore();
  const [isDragOver, setIsDragOver] = useState(false);
  // Using generic "editId" to track which message is being edited
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const lastBotMessageId = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Initialize PDF.js worker safely
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      } catch (e) {
        console.warn("Failed to set PDF worker source", e);
      }
    }

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
          model: currentModel,
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


  const handleSendMessage = useCallback(async (messageContent: string, imageDataUri?: string | null, fileContent?: string | null) => {
    // Check usage info first
    const allowed = await checkAndIncrementMessageLimit();
    if (!allowed) {
      setShowLimitDialog(true);
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageContent,
      image: imageDataUri,
      timestamp: Date.now()
    };

    const newHistory = [...history, userMessage];
    setHistory(newHistory);

    // Handle tool interaction — render widget instead of AI response
    if (activeButton === 'tools' && activeTool) {
      const toolMessageId = `${Date.now()}-tool`;
      const toolData = JSON.stringify({ type: 'tool_widget', tool: activeTool, userMessage: messageContent });
      setHistory(prev => [...prev, { id: toolMessageId, role: "tool" as any, content: toolData }]);
      return;
    }

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

          if (result.error) {
            toast({ title: "Image Search Error", description: result.error, variant: "destructive" });
          } else if (result.type === 'image_search_result' && result.images && result.images.length > 0) {
            const modelMessageId = `${Date.now()}-model`;
            setHistory(prev => [...prev, { id: modelMessageId, role: "model", content: JSON.stringify(result) }]);
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
  }, [activeButton, activeTool, executeChat, history, toast, checkAndIncrementMessageLimit]);

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
        // TODO: Handle file drop correctly by passing it to ChatInput or processing here
        toast({ title: "Drop detected", description: "File upload via drop is being improved." });
      }
    }
  }, [toast]);

  // Edit Message Handlers
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleDeleteMessage = (messageId: string) => {
    setHistory(prev => prev.filter(msg => msg.id !== messageId));
    toast({ title: "Message Deleted", description: "Your message has been removed from the chat." });
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
    // Handle tool widget messages
    if (message.role === 'tool') {
      try {
        const data = JSON.parse(message.content);
        if (data.type === 'tool_widget' && data.tool) {
          return <ToolWidgetRouter tool={data.tool as ToolName} userMessage={data.userMessage || ''} />;
        }
      } catch { }
    }

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

    // Check for Auto-Injected Image Search Results (Mixed Content)
    const imageSearchMatch = mainContent.match(/:::IMAGE_SEARCH_RESULT=(.*?):::/);
    let injectedImages = null;

    if (imageSearchMatch) {
      try {
        injectedImages = JSON.parse(imageSearchMatch[1]);
        // Remove the marker from the text shown to user
        mainContent = mainContent.replace(imageSearchMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse injected images", e);
      }
    }

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
      // Handle image search results
      if (data.type === 'image_search_result') {
        return (
          <ImageSearchCard
            query={data.query}
            images={data.images}
            loading={data.loading}
          />
        );
      }
    } catch (e) {
      // Not a JSON object, continue
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
    const modelName = responseHeaderMatch ? responseHeaderMatch[1] : null;
    const restOfContent = responseHeaderMatch
      ? mainContent.substring(responseHeaderMatch[0].length)
      : mainContent;


    const markdownProps = {
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [rehypeKatex],
      className: "prose dark:prose-invert prose-sm sm:prose max-w-full text-sm leading-relaxed break-words text-left hyphens-auto overflow-hidden",
      components: {
        pre: ({ children }: any) => {
          const childArray = React.Children.toArray(children);
          if (childArray.length === 1 && React.isValidElement(childArray[0]) && childArray[0].type === CodeBox) {
            return <>{children}</>;
          }
          // Default styled pre for non-codebox content. We remove the background and border here
          // because if a CodeBox IS rendered (and we missed the check), we don't want a double box.
          // IMPORTANT: We use !bg-transparent !p-0 !border-0 to override Tailwind typography (prose) defaults.
          return <pre className="!bg-transparent !p-0 !border-0 !m-0 overflow-x-auto text-sm leading-relaxed">{children}</pre>;
        },
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
          <div className="my-4 not-prose inline-block max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(props.src || '')}
              alt={String(props.alt || 'Image')}
              className="rounded-xl border border-border/30 shadow-sm max-w-full h-auto object-contain cursor-pointer hover:shadow-lg transition-shadow"
              loading="lazy"
              onClick={() => window.open(String(props.src || ''), '_blank')}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {props.alt && props.alt !== 'Image' && (
              <p className="text-xs text-muted-foreground mt-1.5 px-1 truncate">{String(props.alt)}</p>
            )}
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
        {injectedImages && (
          <div className="mb-4">
            <ImageSearchCard
              query={injectedImages.query}
              images={injectedImages.images}
              loading={injectedImages.loading}
            />
          </div>
        )}
        {modelName && (
          <div className="model-response-header">
            <strong>Response from {modelName}</strong>
          </div>
        )}
        {thinkingText && <ThinkingIndicator text={thinkingText} duration={message.duration} />}

        <ReactMarkdown {...markdownProps}>
          {restOfContent}
        </ReactMarkdown>
      </>
    );
  };

  const chatBar = (
    <ChatBar
      onSendMessage={handleSendMessage}
      isTyping={isTyping}
      activeButton={activeButton}
      setActiveButton={setActiveButton}
      activeTool={activeTool}
      setActiveTool={setActiveTool}
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
        className={cn("flex-1 relative bg-background", isPlayground ? "h-full flex flex-col" : "")}
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
            onUpdateName={handleUpdateName}
          />
        ) : (
          <ScrollArea className="flex-1 w-full" ref={scrollAreaRef} onScrollCapture={handleScroll}>
            <div className={cn("mx-auto w-full max-w-3xl space-y-6 px-2 sm:px-4 overflow-x-hidden min-w-0", isPlayground ? "pb-4" : "pb-48")}>
              {history.map((message, index) => (
                <React.Fragment key={`${message.id}-${index}`}>
                  <motion.div
                    data-message-id={message.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "flex w-full items-start gap-4 group",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-md w-full min-w-0">
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
                          <>
                            <div className="relative group/msg">
                              <div className="relative inline-block rounded-2xl px-4 py-3 bg-primary text-primary-foreground shadow-sm">
                                {message.image && (
                                  <div className="mb-2 -mx-1 -mt-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={message.image}
                                      alt="Attached image"
                                      className="rounded-xl max-w-[200px] max-h-[200px] object-cover border border-white/20"
                                    />
                                  </div>
                                )}
                                <p className="text-sm font-medium line-clamp-none leading-relaxed">{message.content}</p>
                              </div>
                              <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg hover:bg-muted/60"
                                  onClick={() => handleEditMessage(message.id, message.content)}
                                  title="Edit message"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg hover:bg-muted/60 hover:text-destructive"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  title="Delete message"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {message.timestamp && (
                              <span className="text-[10px] text-muted-foreground px-2">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="chat-message-content w-full overflow-hidden text-left min-w-0 whitespace-normal break-words overflow-wrap-anywhere">
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
                          <div className="mt-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleCopyToClipboard(message.content)} title="Copy">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleShare(message.content)} title="Share">
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors" onClick={() => {/* TODO: implement like */ }} title="Good response">
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors" onClick={() => {/* TODO: implement unlike */ }} title="Bad response">
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" onClick={() => handleTextToSpeech(message.content, message.id)} title="Read aloud">
                              {isSynthesizing === message.id ? <StopCircle className="h-3.5 w-3.5 text-primary" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" onClick={handleRegenerateResponse} disabled={isTyping} title="Regenerate">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>

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
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-full shadow-lg bg-background/90 backdrop-blur-md border-border/50 hover:shadow-xl transition-all gap-2 animate-bounce"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">New messages</span>
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
