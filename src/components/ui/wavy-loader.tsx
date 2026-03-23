"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// Define different wavy loading designs
export type WavyStyle = 'standard' | 'high-frequency' | 'deep' | 'chaotic' | 'subtle';
export type WavyShape = 'circle' | 'square' | 'capsule';

export interface WavyLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: WavyStyle;
  shape?: WavyShape;
  color?: string;
  speed?: number;
  usePreset?: boolean;
}

const WAVY_PATHS_CIRCLE: Record<WavyStyle, string> = {
  standard: "M 50 10 Q 60 15 70 10 Q 80 5 90 10 L 90 90 Q 80 85 70 90 Q 60 95 50 90 Q 40 85 30 90 Q 20 95 10 90 L 10 10 Q 20 5 30 10 Q 40 15 50 10 Z",
  'high-frequency': "M 50 10 C 55 12 55 8 60 10 C 65 12 65 8 70 10 C 75 12 75 8 80 10 C 85 12 85 8 90 10 L 90 90 C 85 88 85 92 80 90 C 75 88 75 92 70 90 C 65 88 65 92 60 90 C 55 88 55 92 50 90 C 45 88 45 92 40 90 C 35 88 35 92 30 90 C 25 88 25 92 20 90 C 15 88 15 92 10 90 L 10 10 C 15 8 15 12 20 10 C 25 8 25 12 30 10 C 35 8 35 12 40 10 C 45 8 45 12 50 10 Z",
  deep: "M 50 5 Q 70 20 90 5 L 95 95 Q 70 70 45 95 Q 20 70 5 95 L 10 5 Q 30 20 50 5 Z",
  chaotic: "M 50 10 Q 65 25 80 5 Q 95 20 90 40 Q 105 60 90 80 Q 75 95 50 85 Q 25 95 10 80 Q -5 60 10 40 Q 5 20 20 5 Q 35 25 50 10 Z",
  subtle: "M 50 12 Q 60 13 70 12 Q 80 11 90 12 L 92 88 Q 80 89 70 88 Q 60 87 50 88 Q 40 89 30 88 Q 20 87 10 88 L 8 12 Q 20 11 30 12 Q 40 13 50 12 Z"
};

const WAVY_PATHS_SQUARE: Record<WavyStyle, string> = {
  standard: "M 10 10 Q 50 5 90 10 Q 95 50 90 90 Q 50 95 10 90 Q 5 50 10 10 Z",
  'high-frequency': "M 10 10 Q 30 12 50 10 Q 70 8 90 10 L 88 30 Q 92 50 88 70 L 90 90 Q 70 88 50 90 Q 30 92 10 90 L 12 70 Q 8 50 12 30 Z",
  deep: "M 5 5 Q 50 20 95 5 L 80 50 L 95 95 Q 50 80 5 95 L 20 50 Z",
  chaotic: "M 10 10 C 30 -10 70 30 90 10 C 110 30 70 70 90 90 C 70 110 30 70 10 90 C -10 70 30 30 10 10 Z",
  subtle: "M 12 12 Q 50 13 88 12 Q 87 50 88 88 Q 50 87 12 88 Q 13 50 12 12 Z"
};

const SIZE_MAP = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96
};

const SETTINGS_KEY = 'wavy-loader-settings';

export const WavyLoader: React.FC<WavyLoaderProps> = ({
  className,
  size: sizeProp = 'md',
  style: styleProp,
  shape: shapeProp,
  color: colorProp = 'currentColor',
  speed: speedProp = 1.5,
  usePreset = true
}) => {
  const [settings, setSettings] = useState({
    style: styleProp || 'standard',
    shape: shapeProp || 'circle',
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
            shape: shapeProp || parsed.shape || 'circle',
            size: typeof sizeProp === 'number' ? sizeProp : (parsed.size || SIZE_MAP[sizeProp]),
            speed: speedProp || parsed.speed || 1.5
          });
        } catch (e) {
          console.error("Error parsing wavy settings", e);
        }
      }
    };

    updateSettings();
    window.addEventListener('wavy-settings-updated', updateSettings);
    return () => window.removeEventListener('wavy-settings-updated', updateSettings);
  }, [usePreset, sizeProp, styleProp, shapeProp, speedProp]);

  const pathMap = settings.shape === 'square' ? WAVY_PATHS_SQUARE : WAVY_PATHS_CIRCLE;
  const path = pathMap[settings.style as WavyStyle] || pathMap.standard;

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
          strokeWidth="6"
          strokeLinecap="round"
          animate={{
            pathLength: [0, 1],
            pathOffset: [0, 1],
          }}
          transition={{
            pathLength: { duration: settings.speed, repeat: Infinity, ease: "easeInOut" },
            pathOffset: { duration: settings.speed, repeat: Infinity, ease: "linear" }
          }}
        />
        <motion.path
          d={path}
          fill={colorProp}
          initial={{ opacity: 0.1 }}
          animate={{
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: settings.speed * 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="origin-center"
        />
      </svg>
    </div>
  );
};
