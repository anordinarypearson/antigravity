
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
import { ActionTooltip } from "./ui/action-tooltip";
import { useUsageLimits } from "@/hooks/use-usage-limits";
import { SharedHeader } from "./shared-header";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import dynamic from "next/dynamic";

const StoriesContent = dynamic(() => import("./stories-content").then(mod => mod.StoriesContent), { ssr: false });
const PricingDialog = dynamic(() => import("./pricing-dialog").then(mod => mod.PricingDialog), { ssr: false });
const WebBrowserContent = dynamic(() => import("./web-browser-content").then(mod => mod.WebBrowserContent), { ssr: false });
const CommandPalette = dynamic(() => import("./command-palette").then(mod => mod.CommandPalette), { ssr: false });
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";


import { motion, AnimatePresence } from "framer-motion";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


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
  const { getUsageStats, usageData, subscription } = useUsageLimits();


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
    <div className="flex-1 flex flex-col font-sans h-svh overflow-hidden bg-background min-h-0 relative">
      <PricingDialog isOpen={showPricingDialog} onOpenChange={setShowPricingDialog} />
      <SharedHeader
        rightElement={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex flex-col items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="mask-wavy hover:bg-muted/60 h-10 w-10 touch-manipulation"
                title="New Chat"
              >
                <FileEdit className="h-5 w-5" />
                <span className="sr-only">New Chat</span>
              </Button>
            </div>
          </div>
        }
        centerElement={
          <div className="flex items-center bg-muted/40 rounded-full p-1 gap-1 overflow-x-auto no-scrollbar max-w-full px-1 sm:px-2 shadow-sm border border-border/20">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={cn(
                    "relative px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 rounded-full",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-bg"
                      className="absolute inset-0 bg-background rounded-full shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 transition-colors hidden md:inline-block", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{view.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      {activeVideoId && (
        <div className="px-4 py-2 border-b bg-sidebar/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-card border shadow-sm w-full max-w-md mx-auto"
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
        </div>
      )}


      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 min-h-0">
          {activeView === 'searnai' ? (
            <div className="h-full flex flex-col min-h-0">
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
            <StoriesContent />
          ) : (
            <WebBrowserContent />
          )}
          {activeVideoId && showPlayer && (
            <div className="fixed bottom-24 sm:bottom-4 right-2 sm:right-4 z-50 group">
              <iframe
                ref={iframeRef}
                className="w-[280px] sm:w-full sm:max-w-sm aspect-video rounded-lg shadow-xl"
                src={`https://www.youtube.com/embed/${activeVideoId}?enablejsapi=1&autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="YouTube music player"
              ></iframe>
              <Button variant="secondary" size="icon" className="absolute -top-3 -right-3 h-8 w-8 sm:h-7 sm:w-7 mask-wavy opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation" onClick={() => setShowPlayer(false)}><X className="h-4 w-4" /></Button>
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


      </div >
      <CommandPalette />
    </div >
  );
});
