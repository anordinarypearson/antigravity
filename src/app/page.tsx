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
      
      {/* Immersive 3D Grid Landscape */}
      <div className="absolute inset-0 pointer-events-none perspective-[1200px] flex items-end justify-center">
        <motion.div 
          initial={{ opacity: 0, rotateX: 80, scale: 1 }}
          animate={{ opacity: [0, 1, 1], rotateX: 75, scale: 1.5 }}
          transition={{ duration: 5, ease: "easeOut" }}
          className="absolute w-[200vw] h-[150vh] origin-bottom border-t-2 border-white/40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.2) 2px, transparent 2px)
            `,
            backgroundSize: '80px 80px',
            bottom: '-20vh'
          }}
        >
          {/* Moving Floor Effect */}
          <motion.div
            animate={{ y: [0, 80] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.2) 2px, transparent 2px)
              `,
              backgroundSize: '80px 80px',
            }}
          />
        </motion.div>
      </div>

      {/* Chaotic Lines flying everywhere */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Horizontal Lasers */}
        {[10, 25, 45, 65, 85].map((pos, i) => (
          <motion.div
            key={`h-${i}`}
            initial={{ scaleX: 0, opacity: 0, left: i % 2 === 0 ? '-100%' : '100%' }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            className="absolute h-[1px] bg-white top-0"
            style={{ 
              top: `${pos}%`, 
              width: '100vw', 
              transformOrigin: i % 2 === 0 ? 'left' : 'right',
              left: 0
            }}
          />
        ))}
        {/* Vertical Lasers */}
        {[15, 30, 50, 70, 85].map((pos, i) => (
          <motion.div
            key={`v-${i}`}
            initial={{ scaleY: 0, opacity: 0, top: i % 2 === 0 ? '-100%' : '100%' }}
            animate={{ scaleY: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 1.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            className="absolute w-[1px] bg-white left-0"
            style={{ 
              left: `${pos}%`, 
              height: '100vh', 
              transformOrigin: i % 2 === 0 ? 'top' : 'bottom',
              top: 0
            }}
          />
        ))}
      </div>

      {/* Central Animation Sequence */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <svg viewBox="0 0 1000 600" className="w-[100vw] h-[100vh] absolute inset-0 pointer-events-none">
          {/* Main Connector Line coming from bottom to center */}
          <motion.path
             d="M500,600 L500,350"
             fill="none"
             stroke="white"
             strokeWidth="4"
             initial={{ pathLength: 0, opacity: 1 }}
             animate={{ pathLength: 1, opacity: [1, 1, 0] }}
             transition={{ duration: 1.5, ease: "easeIn" }}
          />
          {/* Branching Lines connecting out from the center */}
          <motion.path
             d="M500,350 L200,350 M500,350 L800,350 M500,350 L500,200"
             fill="none"
             stroke="white"
             strokeWidth="2"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: 1, opacity: [0, 1, 0] }}
             transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
          />

          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 1.5 }}
          >
            {/* Outline Text Drawing */}
            <motion.text
              x="500"
              y="320"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-[0.2em]"
              style={{ stroke: 'white', strokeWidth: 2, fill: 'transparent' }}
              initial={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
            >
              Searn AI
            </motion.text>
            
            {/* Glow Text Filling */}
            <motion.text
              x="500"
              y="320"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-[0.2em]"
              style={{ fill: 'white', filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.8))' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 3 }}
            >
              Searn AI
            </motion.text>
          </motion.g>
        </svg>

        {/* Status Text at bottom */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 3.5 }}
           className="absolute bottom-[20%] text-white/80 text-sm md:text-lg uppercase tracking-[0.4em] font-medium flex items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_white]"
          />
          Initializing Landscape
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
