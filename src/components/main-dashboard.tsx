
"use client";

import { Button } from "@/components/ui/button";
import { FileEdit, Moon, Sun, X, MoreVertical, Play, Pause, Rewind, FastForward, Video, Newspaper, MessageSquare, Star, Globe, Users, FlaskConical, Copy, Trash2, PlayCircle, Pilcrow, Check } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";
import { ChatContent, useChatStore } from "./chat-content";
import { SidebarTrigger } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NewsContent } from "./news-content";
import { PricingDialog } from "./pricing-dialog";
import { WebBrowserContent } from "./web-browser-content";
import { AiEditorContent } from "./ai-editor-content";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";


export const MainDashboard = React.memo(function MainDashboard() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const {
    activeVideoId, activeVideoTitle, setActiveVideoId, isPlaying, togglePlay, showPlayer, setShowPlayer
  } = useChatStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeView, setActiveView] = useState('searnai');
  const [showPricingDialog, setShowPricingDialog] = useState(false);

  const [answerTypes, setAnswerTypes] = useState({
    auto: true,
    long: false,
    short: false,
    funny: false,
    sad: false,
    education: false,
  });

  const handleAnswerTypeChange = React.useCallback((type: keyof typeof answerTypes) => {
    setAnswerTypes(prev => {
      const isAuto = type === 'auto';
      const newTypes = {
        ...prev,
        auto: isAuto ? true : false,
        [type]: isAuto ? false : !prev[type],
      };

      // If all other types are unchecked, default back to auto
      const otherTypesChecked = Object.entries(newTypes).some(([key, value]) => key !== 'auto' && value);
      if (!otherTypesChecked) {
        newTypes.auto = true;
      }

      return newTypes;
    });
  }, []);


  const handleNewChat = React.useCallback(() => {
    try {
      localStorage.removeItem('chatHistory');
      sessionStorage.removeItem('chatScrollPosition');
      window.location.reload();
    } catch (e) {
      console.error("Could not clear storage", e);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const handleCopyToClipboard = React.useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Video URL copied to clipboard." });
  }, [toast]);

  const postPlayerMessage = React.useCallback((command: 'playVideo' | 'pauseVideo') => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: command, args: '' }),
      'https://www.youtube.com'
    );
  }, []);

  const handlePlayPause = React.useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  useEffect(() => {
    if (activeVideoId) {
      if (isPlaying) {
        postPlayerMessage('playVideo');
      } else {
        postPlayerMessage('pauseVideo');
      }
    }
  }, [isPlaying, activeVideoId, postPlayerMessage]);

  return (
    <div className="flex h-full flex-col">
      <PricingDialog isOpen={showPricingDialog} onOpenChange={setShowPricingDialog} />
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="lg:hidden" />
        </div>

        {activeVideoId && (
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-card border w-full max-w-md">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{activeVideoTitle || 'Now Playing'}</p>
              <div className="flex items-center text-muted-foreground -ml-2">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Rewind className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FastForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPlayer(!showPlayer)}>
                <Video className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleCopyToClipboard(`https://www.youtube.com/watch?v=${activeVideoId}`)}>Copy video URL</DropdownMenuItem>
                  <DropdownMenuItem asChild><a href={`https://www.youtube.com/watch?v=${activeVideoId}`} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveVideoId(null, null)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">

          <Button onClick={() => setShowPricingDialog(true)}>
            <Star className="mr-2 h-4 w-4" />
            Get Pro
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNewChat}>
            <FileEdit className="h-5 w-5" />
            <span className="sr-only">New Chat</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>
      <div className="flex justify-center items-center py-2 border-b bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 rounded-none px-4 hover:bg-transparent hover:text-foreground/80", activeView === 'searnai' ? "text-foreground font-bold" : "text-muted-foreground")}
            onClick={() => setActiveView('searnai')}
          >
            <MessageSquare className="h-4 w-4" />
            SearnAI
          </Button>

          <div className="h-4 w-[1px] bg-border/50" />

          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 rounded-none px-4 hover:bg-transparent hover:text-foreground/80", activeView === 'stories' ? "text-foreground font-bold" : "text-muted-foreground")}
            onClick={() => setActiveView('stories')}
          >
            <Newspaper className="h-4 w-4" />
            Stories
          </Button>

          <div className="h-4 w-[1px] bg-border/50" />

          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 rounded-none px-4 hover:bg-transparent hover:text-foreground/80", activeView === 'browser' ? "text-foreground font-bold" : "text-muted-foreground")}
            onClick={() => setActiveView('browser')}
          >
            <Globe className="h-4 w-4" />
            Browser
          </Button>

          <div className="h-4 w-[1px] bg-border/50" />

          <Button
            variant='ghost'
            size="sm"
            className="gap-2 rounded-none px-4 text-muted-foreground hover:bg-transparent hover:text-foreground/80"
            onClick={() => router.push('/playground')}
          >
            <FlaskConical className="h-4 w-4" />
            Playground
          </Button>
        </div>
      </div>
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'searnai' ? (
          <div className="h-full flex flex-col">
            <ChatContent
              answerTypes={answerTypes}
              onMessageSent={() => {
                if (localStorage.getItem('isGuest') === 'true') {
                  localStorage.setItem('has_tested_app', 'true');
                }
              }}
            />
          </div>
        ) : activeView === 'stories' ? (
          <NewsContent />
        ) : (
          <WebBrowserContent />
        )}
        {activeVideoId && showPlayer && (
          <div className="fixed bottom-4 right-4 z-50 group">
            <iframe
              ref={iframeRef}
              className="w-full max-w-sm aspect-video rounded-lg shadow-xl"
              src={`https://www.youtube.com/embed/${activeVideoId}?enablejsapi=1&autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube music player"
            ></iframe>
            <Button variant="secondary" size="icon" className="absolute -top-3 -right-3 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setShowPlayer(false)}><X className="h-4 w-4" /></Button>
          </div>
        )}
        {activeVideoId && !showPlayer && (
          // Hidden iframe to control playback even when floating player is not visible
          <iframe
            ref={iframeRef}
            className="hidden"
            src={`https://www.youtube.com/embed/${activeVideoId}?enablejsapi=1&autoplay=1`}
            allow="autoplay; encrypted-media"
            title="YouTube music player"
          ></iframe>
        )}
      </main>
    </div>
  );
});
