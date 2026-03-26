"use client";

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { cn } from "@/lib/utils";

// Define 4 designs of wavy rings
export type WavyStyle = 'standard' | 'ripples' | 'soft' | 'dynamic';

export interface WavyLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: WavyStyle;
  color?: string;
  speed?: number;
  usePreset?: boolean;
}

// Wave configuration per style
const WAVE_CONFIG: Record<WavyStyle, { waves: number; amp: number; baseR: number }> = {
  standard: { waves: 6, amp: 6, baseR: 65 },
  ripples:  { waves: 10, amp: 4, baseR: 65 },
  soft:     { waves: 4, amp: 8, baseR: 65 },
  dynamic:  { waves: 8, amp: 7, baseR: 65 },
};

const SIZE_MAP = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96
};

const SETTINGS_KEY = 'wavy-loader-settings';

// Unique id counter for SSR-safe unique ids
let idCounter = 0;

function buildWavyPath(
  cx: number, cy: number, baseR: number, waves: number, amp: number, segments: number = 240
): string {
  let d = "";
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = t * Math.PI * 2;
    const r = baseR + Math.sin(a * waves) * amp;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    else d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + " Z";
}

export const WavyLoader: React.FC<WavyLoaderProps> = ({
  className,
  size: sizeProp = 'md',
  style: styleProp,
  color: colorProp = '#22c55e',
  speed: speedProp = 2.2,
  usePreset = true
}) => {
  const [settings, setSettings] = useState({
    style: styleProp || 'standard',
    size: typeof sizeProp === 'number' ? sizeProp : SIZE_MAP[sizeProp],
    speed: speedProp
  });

  // Stable unique id for this instance
  const uniqueId = useRef(`wavy-${++idCounter}`).current;

  useEffect(() => {
    if (!usePreset) return;

    const updateSettings = () => {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({
            style: styleProp || parsed.style || 'standard',
            size: typeof sizeProp === 'number' ? sizeProp : (parsed.size || SIZE_MAP[sizeProp as keyof typeof SIZE_MAP]),
            speed: speedProp || 2.2
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

  const currentStyle = (settings.style as WavyStyle) || 'standard';
  const config = WAVE_CONFIG[currentStyle] || WAVE_CONFIG.standard;
  const path = useMemo(
    () => buildWavyPath(100, 100, config.baseR, config.waves, config.amp),
    [config.baseR, config.waves, config.amp]
  );

  const duration = settings.speed;

  // Stroke dash config — green takes 74% of path, gap is 26%
  const greenDash = 740;
  const greenGap = 260;
  const whiteDash = greenGap; // white fills the gap
  const whiteGap = greenDash;

  // Determine the effective stroke color — use colorProp, fallback to green
  const strokeColor = colorProp === 'currentColor' ? '#22c55e' : colorProp;

  // Compute stroke widths relative to the size for consistency
  const mainStrokeWidth = 14;
  const gapStrokeWidth = 5;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: settings.size, height: settings.size }}
    >
      {/* Inject scoped keyframes */}
      <style>{`
        @keyframes ${uniqueId}-move {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1000; }
        }
        @keyframes ${uniqueId}-white {
          0% { stroke-dashoffset: -740; }
          100% { stroke-dashoffset: -1740; }
        }
      `}</style>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White gap-filler rendered first (behind) */}
        <path
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth={gapStrokeWidth}
          strokeLinecap="round"
          pathLength={1000}
          opacity={0.9}
          style={{
            strokeDasharray: `${whiteDash} ${whiteGap}`,
            strokeDashoffset: -740,
            animation: `${uniqueId}-white ${duration}s linear infinite`,
          }}
        />
        {/* Main colored stroke */}
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={mainStrokeWidth}
          strokeLinecap="round"
          pathLength={1000}
          style={{
            strokeDasharray: `${greenDash} ${greenGap}`,
            strokeDashoffset: 0,
            animation: `${uniqueId}-move ${duration}s linear infinite`,
          }}
        />
      </svg>
    </div>
  );
};
