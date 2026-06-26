"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";



function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden font-sans">
      
      {/* Central Animation Sequence */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-4 md:gap-8">
        
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        >
          <AppLogo className="h-20 w-20 text-primary loading-screen-logo" />
        </motion.div>

        {/* Text Animation */}
        <div className="relative w-full max-w-2xl h-32 md:h-48 flex items-center justify-center">
            <svg viewBox="0 0 1000 300" className="w-full h-full pointer-events-none">
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1, delay: 0.2 }}
              >
                {/* Outline Text Drawing */}
                <motion.text
                  x="500"
                  y="150"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-[0.2em]"
                  style={{ stroke: 'white', strokeWidth: 2, fill: 'transparent' }}
                  initial={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                >
                  Searn AI
                </motion.text>
                
                {/* Glow Text Filling */}
                <motion.text
                  x="500"
                  y="150"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-[0.2em]"
                  style={{ fill: 'white', filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.8))' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                >
                  Searn AI
                </motion.text>
              </motion.g>
            </svg>
        </div>

        {/* Professional Status — minimal progress bar + text */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.6, delay: 1.8 }}
           className="flex flex-col items-center gap-3 mt-4 md:mt-0"
        >
          <span className="text-white/50 text-xs md:text-sm uppercase tracking-[0.5em] font-light">
            Initializing
          </span>
          {/* Thin progress bar */}
          <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white/50 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, delay: 2.0, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>

    </div>
  );
}

import dynamic from "next/dynamic";

const MainDashboard = dynamic(() => import("@/components/main-dashboard").then(mod => mod.MainDashboard), {
  loading: () => <LoadingScreen />
});
const LoginContent = dynamic(() => import("@/components/login-content").then(mod => mod.LoginContent), {
  loading: () => <LoadingScreen />
});

export default function Home() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !isGuest) {
    return <LoginContent />;
  }

  return (
    <MainLayout>
      <MainDashboard />
    </MainLayout>
  );
}
