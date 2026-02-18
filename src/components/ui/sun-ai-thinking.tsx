import React, { useMemo } from "react";

/**
 * cubicBezier math helper to calculate points along the "S" curve.
 */
interface Point {
    x: number;
    y: number;
}

const cubicBezier = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
    const cX = 3 * (p1.x - p0.x);
    const bX = 3 * (p2.x - p1.x) - cX;
    const aX = p3.x - p0.x - cX - bX;
    const cY = 3 * (p1.y - p0.y);
    const bY = 3 * (p2.y - p1.y) - cY;
    const aY = p3.y - p0.y - cY - bY;
    const x = aX * Math.pow(t, 3) + bX * Math.pow(t, 2) + cX * t + p0.x;
    const y = aY * Math.pow(t, 3) + bY * Math.pow(t, 2) + cY * t + p0.y;
    return { x, y };
};

/**
 * SunAIThinkingIndicator
 * ----------------------
 * A micro-sized, professional version of the "S" logo animation.
 * Uses a fine line of dots for a minimalist tech aesthetic.
 */
interface SunAIThinkingIndicatorProps {
    isThinking?: boolean;
    dotsCount?: number;
    scale?: number;
    speed?: number;
    color?: string;
}

export function SunAIThinkingIndicator({
    isThinking = true,
    dotsCount = 22,
    scale = 0.4,
    speed = 1.0,
    color = "currentColor"
}: SunAIThinkingIndicatorProps) {
    const points = useMemo(() => {
        const sPoints: Point[] = [];
        // Tightened curve coordinates for a more slender "S"
        const topCurve = {
            p0: { x: 70, y: 20 },
            p1: { x: 30, y: 20 },
            p2: { x: 30, y: 50 },
            p3: { x: 50, y: 50 },
        };
        const bottomCurve = {
            p0: { x: 50, y: 50 },
            p1: { x: 70, y: 50 },
            p2: { x: 70, y: 80 },
            p3: { x: 30, y: 80 },
        };

        for (let i = 0; i < dotsCount; i++) {
            const t = i / (dotsCount - 1);
            let point;
            if (t < 0.5) {
                point = cubicBezier(t * 2, topCurve.p0, topCurve.p1, topCurve.p2, topCurve.p3);
            } else {
                point = cubicBezier((t - 0.5) * 2, bottomCurve.p0, bottomCurve.p1, bottomCurve.p2, bottomCurve.p3);
            }
            sPoints.push(point);
        }
        return sPoints;
    }, [dotsCount]);

    return (
        <div className="inline-flex items-center justify-center p-2" role="status">
            <style key="sun-style">{`
        @keyframes sun-line-blink {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 1; }
        }
      `}</style>

            <div
                style={{
                    transform: `scale(${scale})`,
                    width: '40px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                    {points.map((pt, i) => {
                        const delay = (i * 0.04) / speed;
                        return (
                            <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r={1.8}
                                fill={color}
                                style={{
                                    animation: isThinking ? `sun-line-blink ${1.4 / speed}s ease-in-out infinite` : "none",
                                    animationDelay: `${delay}s`,
                                    opacity: isThinking ? 0.1 : 1,
                                }}
                            />
                        );
                    })}
                </svg>
            </div>
            <span className="sr-only">Thinking...</span>
        </div>
    );
}
