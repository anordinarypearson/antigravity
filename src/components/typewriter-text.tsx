"use client";

import { useEffect, useState } from "react";

export function TypewriterText({ text, speed = 10, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // If text is reset or changes drastically, reset (optional, but good for new messages)
        if (!text.startsWith(displayedText) && currentIndex > 0) {
            // Only reset if it's a completely new message structure, 
            // but for streaming, we usually just append.
            // For simple typewriter independent of streaming quirks:
        }
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    // If the text updates (streaming), we just continue from currentIndex
    // But wait, if 'text' updates, we need to ensure we don't miss characters.
    // Actually, for a *streaming* response that is also typewriting, it's tricky.
    // A simpler approach for *already loaded* text is above.
    // For streaming text, we might just want to display 'text' directly if it's new.

    // Revised approach for streaming compatibility: 
    // If 'text' is much longer than 'displayedText', catch up.

    return <span>{displayedText}</span>;
}

// Better version for Streaming:
export function StreamingTypewriter({ content, speed = 5, render }: { content: string, speed?: number, render?: (text: string) => React.ReactNode }) {
    const [displayedContent, setDisplayedContent] = useState("");

    useEffect(() => {
        let currentLength = displayedContent.length;

        if (currentLength === content.length) return;

        if (currentLength > content.length) {
            // Reset if content shrunk (new message maybe?)
            setDisplayedContent(content);
            return;
        }

        const interval = setInterval(() => {
            if (currentLength < content.length) {
                setDisplayedContent(content.slice(0, currentLength + 1));
                currentLength++;
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [content, speed]); // We depend on content updating

    if (render) {
        return <>{render(displayedContent)}</>;
    }

    return <>{displayedContent}</>;
}
