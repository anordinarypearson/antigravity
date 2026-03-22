"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, PlusSquare } from "lucide-react";
import { Button } from "./ui/button";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we are on a mobile device
    const checkIsMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      const isSmallScreen = window.innerWidth <= 1024;
      setIsMobile(mobile || isSmallScreen);
      
      const ios = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(ios);
    };
    
    checkIsMobile();
    
    // Listen for the standard Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isMobile) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // For iOS, there is no event, so we just show the prompt if they are on mobile
    // and haven't installed it yet (standalone mode check)
    if (isMobile && isIOS) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
      if (!isStandalone) {
         // Show it after a small delay naturally
         setTimeout(() => setShowPrompt(true), 1500);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isMobile, isIOS]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    }
  };

  if (!showPrompt || !isMobile) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 px-2 pb-6">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
          className="w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-3xl overflow-hidden relative font-sans"
        >
          {/* Header Graphic */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-blue-500/10 to-primary/5 flex items-center justify-center relative">
            <button 
              onClick={() => setShowPrompt(false)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-black/20 p-1.5 rounded-full backdrop-blur-md"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
               <Download className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold tracking-tight mb-2">Get the SearnAI App</h3>
            <p className="text-sm text-muted-foreground mb-6">
              For the best experience on your phone or tablet, install the app directly to your home screen!
            </p>
            
            {isIOS ? (
              <div className="bg-muted/50 rounded-xl p-4 text-xs text-left flex flex-col gap-3">
                <p className="font-semibold text-foreground/80 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary w-5 h-5 flex items-center justify-center rounded-full">1</span> 
                  Tap the share button <Share className="h-3.5 w-3.5 inline ml-1" />
                </p>
                <p className="font-semibold text-foreground/80 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary w-5 h-5 flex items-center justify-center rounded-full">2</span> 
                  Select "Add to Home Screen" <PlusSquare className="h-3.5 w-3.5 inline ml-1" />
                </p>
                <Button variant="outline" className="mt-2 w-full" onClick={() => setShowPrompt(false)}>
                  Got it
                </Button>
              </div>
            ) : (
              <Button onClick={handleInstallClick} className="w-full h-12 text-md font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                Download App
              </Button>
            )}
            
            {!isIOS && (
              <button 
                onClick={() => setShowPrompt(false)}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Continue in browser
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
