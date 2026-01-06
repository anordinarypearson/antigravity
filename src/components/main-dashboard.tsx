
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


import { motion } from "framer-motion";

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

  const views = [
    { id: 'searnai', label: 'SearnAI', icon: MessageSquare },
    { id: 'stories', label: 'Stories', icon: Newspaper },
    { id: 'browser', label: 'Browser', icon: Globe },
  ];

  return (
    <div className="flex h-full flex-col font-sans">
      <PricingDialog isOpen={showPricingDialog} onOpenChange={setShowPricingDialog} />
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 sm:px-6 transition-all duration-300">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="lg:hidden" />
        </div>

        {activeVideoId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-card border shadow-sm w-full max-w-md mx-4"
          >
            <div className="flex-1 min-w-0 px-2">
              <p className="text-sm font-medium truncate text-foreground">{activeVideoTitle || 'Now Playing'}</p>
              <div className="flex items-center justify-between text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary">
                    <Rewind className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary">
                    <FastForward className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0 gap-1 pr-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowPlayer(!showPlayer)}>
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setActiveVideoId(null, null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}



        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowPricingDialog(true)}
            className="relative overflow-hidden group bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hidden sm:flex"
          >
            <motion.div
              className="absolute top-0 -left-[100%] h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1 }}
            />
            <Star className="mr-2 h-4 w-4 fill-current animate-[pulse_3s_ease-in-out_infinite]" />
            <span className="font-semibold tracking-tight">Get Pro</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={handleNewChat} className="rounded-full hover:bg-muted/60" title="New Chat">
            <FileEdit className="h-5 w-5" />
            <span className="sr-only">New Chat</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-muted/60">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      <div className="flex justify-center items-center py-3 bg-transparent z-10">
        <div className="flex items-center p-1 bg-muted/40 rounded-full border shadow-sm backdrop-blur-md">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={cn(
                  "relative px-4 py-1.5 text-xs font-semibold transition-all duration-200 rounded-full flex items-center gap-2",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary rounded-full shadow-md"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {view.label}
                </span>
              </button>
            );
          })}
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
