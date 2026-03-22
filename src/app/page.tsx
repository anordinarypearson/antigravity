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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden relative font-sans">
      {/* Black & White Grid / Landscape */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60vh] border-t border-white/20 pointer-events-none"
        style={{ perspective: '1000px' }}
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            transform: 'rotateX(75deg)',
            transformOrigin: 'top center',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        >
          {/* Moving effect on the landscape */}
          <motion.div
            animate={{ y: [0, 60] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </motion.div>
      </div>

      {/* Random lines going here and there */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical lines */}
        {[10, 30, 50, 70, 90].map((pos, i) => (
          <motion.div
            key={`vLine-${i}`}
            initial={{ height: 0, opacity: 0, top: '100%' }}
            animate={{ height: "100vh", opacity: [0, 1, 0], top: '-100%' }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
            className="absolute w-[1px] bg-gradient-to-b from-transparent via-white to-transparent"
            style={{ left: `${pos}%` }}
          />
        ))}
        {/* Horizontal lines */}
        {[20, 40, 60, 80].map((pos, i) => (
          <motion.div
            key={`hLine-${i}`}
            initial={{ width: 0, opacity: 0, left: '-100%' }}
            animate={{ width: "100vw", opacity: [0, 1, 0], left: '100%' }}
            transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "linear", delay: i * 0.6 }}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ top: `${pos}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center h-full justify-center">
        <svg viewBox="0 0 800 400" className="w-[90vw] max-w-[800px] h-[300px]">
          {/* Main line coming from down to here */}
          <motion.path
             d="M400,400 L400,220"
             fill="none"
             stroke="white"
             strokeWidth="3"
             initial={{ pathLength: 0, opacity: 1 }}
             animate={{ pathLength: 1, opacity: [1, 1, 0] }}
             transition={{ duration: 2.5, times: [0, 0.8, 1], ease: "easeInOut" }}
          />

          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 1.5 }}
          >
            {/* Outline drawing of Searn AI */}
            <motion.text
              x="400"
              y="180"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-7xl md:text-[100px] font-black uppercase tracking-[0.15em]"
              style={{ stroke: 'white', strokeWidth: 3, fill: 'transparent', strokeDasharray: 2000 }}
              initial={{ strokeDashoffset: 2000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 3, delay: 1.5, ease: "easeInOut" }}
            >
              Searn AI
            </motion.text>

            <motion.text
              x="400"
              y="180"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-7xl md:text-[100px] font-black uppercase tracking-[0.15em]"
              style={{ fill: 'white' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 3.5 }}
            >
              Searn AI
            </motion.text>
          </motion.g>
        </svg>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: [0, 1, 0.4, 1] }}
           transition={{ duration: 2.5, delay: 4, repeat: Infinity }}
           className="mt-6 text-white/70 text-sm md:text-base uppercase tracking-[0.5em] font-medium"
        >
          Connecting Landscape
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
