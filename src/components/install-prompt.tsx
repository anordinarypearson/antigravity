"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, PlusSquare, Smartphone, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if we are on a mobile device and NOT in standalone mode
    const checkIsMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      const isSmallScreen = window.innerWidth <= 1024;
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
      
      // Only trap if they are on mobile AND have not installed the app yet
      setIsMobile((mobile || isSmallScreen) && !isStandalone);
      
      const ios = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(ios);
    };
    
    checkIsMobile();
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isMobile) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Fallback: If mobile but beforeinstallprompt doesn't fire (like iOS or Safari)
    if (isMobile) {
      setTimeout(() => setShowPrompt(true), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isMobile]);

  const handleInstallClick = async () => {
    // Simulate "processing and downloading" alive feel immediately so the user sees feedback
    setIsGenerating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 300);

    setTimeout(async () => {
      clearInterval(interval);
      setProgress(100);
      
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            setShowPrompt(false);
          } else {
            setIsGenerating(false);
          }
        } catch (error) {
          setIsGenerating(false);
        }
      } else {
        // Fallback if the browser doesn't natively support programmatic installation prompt
        alert("To complete installation, please tap 'Add to Home screen' or 'Install App' from your browser's menu at the top right!");
        setIsGenerating(false);
        
        // Check if Safari on Android or something weird
        // We'll just let them clear the generation state and wait.
      }
    }, 2500);
  };

  if (!showPrompt || !isMobile) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
          className="w-full max-w-sm bg-card border border-primary/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] rounded-3xl overflow-hidden relative font-sans"
        >
          {/* Header Graphic */}
          <div className="h-40 bg-gradient-to-br from-blue-900/40 via-blue-600/20 to-primary/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            
            <motion.div 
               animate={isGenerating ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] relative z-10 overflow-hidden"
            >
               <img src="/logo.png" alt="SearnAI App Logo" className="w-full h-full object-cover" />
            </motion.div>
          </div>
          
          <div className="p-8 text-center">
            <h3 className="text-2xl font-black tracking-tight mb-3">Install SearnAI App</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              SearnAI is designed exclusively as a mobile application. Please download and install the app to your device to continue using our premium features.
            </p>
            
            {isIOS ? (
              <div className="bg-muted/30 rounded-2xl p-5 text-sm text-left flex flex-col gap-4 border border-border/50">
                <p className="font-semibold text-foreground flex items-center gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> 
                  Tap the share button <Share className="h-4 w-4 inline ml-auto" />
                </p>
                <div className="h-[1px] bg-border/50 w-full"></div>
                <p className="font-semibold text-foreground flex items-center gap-3">
                  <span className="bg-primary/20 text-primary w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span> 
                  Select "Add to Home Screen" <PlusSquare className="h-4 w-4 inline ml-auto" />
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary">
                      <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin"/> Compiling App...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstallClick} 
                    className="w-full h-14 text-lg font-bold tracking-wide rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02]"
                  >
                    <Download className="mr-2 h-5 w-5" /> Download App
                  </Button>
                )}
              </div>
            )}
            
            <p className="mt-8 text-[11px] text-muted-foreground/60 font-medium">
              V 0.1.0 • Secure & Offline Ready
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
