"use client";

import { MainLayout } from "@/components/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Cpu, Bot, Globe } from "lucide-react";

// SVG logo reused from login-content for consistency
const AppLogo = () => (
  <svg
    className="h-20 w-20 text-primary loading-screen-logo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L90 28V72L50 95L10 72V28L50 5Z"
      fill="currentColor"
      className="opacity-10"
    />
    <path
      d="M63 40.5C63 36.3579 59.6421 33 55.5 33H44.5C40.3579 33 37 36.3579 37 40.5V43.5C37 47.6421 40.3579 51 44.5 51H55.5C59.6421 51 63 54.3579 63 58.5V61.5C63 65.6421 59.6421 69 55.5 69H44.5C40.3579 69 37 65.6421 37 61.5"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    />
  </svg>
);

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden font-sans">
      
      {/* Central Animation Sequence */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-4 md:gap-8">
        
        {/* Animated Logo */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease: "easeOut" }}
           className="mt-[-10vh]"
        >
          <AppLogo />
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

        {/* Status Text at bottom */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 2.0 }}
           className="text-white/80 text-sm md:text-lg uppercase tracking-[0.4em] font-medium flex items-center justify-center gap-4 text-center mt-4 md:mt-0"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 bg-white mask-wavy shadow-[0_0_15px_white] shrink-0"
          />
          Preparing Searn AI for you...
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
