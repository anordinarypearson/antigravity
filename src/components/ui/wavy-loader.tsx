"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

// Define 4 designs of wavy rings
export type WavyStyle = 'standard' | 'ripples' | 'soft' | 'dynamic';

export interface WavyLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: WavyStyle;
  color?: string;
  speed?: number; // Kept as prop for defaults, but removed from UI
  usePreset?: boolean;
}

const WAVY_PATHS: Record<WavyStyle, string> = {
  // Google-like wavy ring (8 soft waves)
  standard: "M 50 5 C 60 5 65 15 75 15 C 85 15 90 25 90 35 C 90 45 85 55 85 65 C 85 75 75 85 65 85 C 55 85 45 95 35 95 C 25 95 15 85 15 75 C 15 65 5 55 5 45 C 5 35 15 25 15 15 C 25 15 35 5 50 5 Z",
  
  // More ripples (12 waves)
  ripples: "M 50 8 C 55 8 55 12 60 12 C 65 12 65 8 70 8 C 75 8 75 12 80 12 C 85 12 85 16 88 20 C 91 24 87 28 90 32 C 93 36 97 38 95 44 C 93 50 89 50 89 55 C 89 60 93 64 90 69 C 87 74 81 72 78 77 C 75 82 78 87 73 90 C 68 93 64 89 59 91 C 54 93 54 97 49 97 C 44 97 44 93 39 91 C 34 89 30 93 25 90 C 20 87 23 82 20 77 C 17 72 11 74 8 69 C 5 64 9 60 9 55 C 9 50 5 50 3 44 C 1 38 5 36 8 32 C 11 28 7 24 10 20 C 13 16 13 12 18 12 C 23 12 23 8 28 8 C 33 8 33 12 38 12 C 43 12 43 8 48 8 L 50 8 Z",
  
  // Soft, smooth 6 waves
  soft: "M 50 10 C 62 10 65 15 75 18 C 85 21 88 32 90 42 C 92 52 82 60 81 70 C 80 80 65 85 55 88 C 45 91 35 85 25 80 C 15 75 10 60 8 50 C 6 40 15 30 20 20 C 25 10 38 10 50 10 Z",
  
  // Deeper oscillating 8 waves
  dynamic: "M 50 2 C 65 2 70 20 85 20 C 100 20 95 35 95 50 C 95 65 100 80 85 80 C 70 80 65 98 50 98 C 35 98 30 80 15 80 C 0 80 5 65 5 50 C 5 35 0 20 15 20 C 30 20 35 2 50 2 Z"
};

const SIZE_MAP = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96
};

// Internal constant to prevent infinite loops should the loader be used everywhere
const SETTINGS_KEY = 'wavy-loader-settings';

export const WavyLoader: React.FC<WavyLoaderProps> = ({
  className,
  size: sizeProp = 'md',
  style: styleProp,
  color: colorProp = 'currentColor',
  speed: speedProp = 1.5,
  usePreset = true
}) => {
  const [settings, setSettings] = useState({
    style: styleProp || 'standard',
    size: typeof sizeProp === 'number' ? sizeProp : SIZE_MAP[sizeProp],
    speed: speedProp
  });

  useEffect(() => {
    if (!usePreset) return;
    
    const updateSettings = () => {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({
            style: styleProp || parsed.style || 'standard',
            size: typeof sizeProp === 'number' ? sizeProp : (parsed.size || SIZE_MAP[sizeProp]),
            // Ignoring speed from local storage as per request
            speed: speedProp || 1.5 
          });
        } catch (e) {
          console.error("Error parsing wavy settings", e);
        }
      }
    };

    updateSettings();
    window.addEventListener('wavy-settings-updated', updateSettings);
    return () => window.removeEventListener('wavy-settings-updated', updateSettings);
  }, [usePreset, sizeProp, styleProp, speedProp]);

  // Fallback to standard if style isn't found
  const path = WAVY_PATHS[settings.style as WavyStyle] || WAVY_PATHS.standard;

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: settings.size, height: settings.size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d={path}
          fill="none"
          stroke={colorProp}
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            rotate: { duration: settings.speed * 4, repeat: Infinity, ease: "linear" }
          }}
          className="origin-center"
        />
      </svg>
    </div>
  );
};
