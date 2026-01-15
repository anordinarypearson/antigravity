
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Tag } from "lucide-react";
import { Badge } from "./ui/badge";

type ColorVariants = {
  [key: string]: {
    background: string;
    border: string;
    text: string;
  };
};

const colorVariants: ColorVariants = {
  blue: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  green: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  purple: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  orange: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  red: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  yellow: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  pink: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  teal: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  gray: { background: "bg-muted dark:bg-muted/50", border: "border-border", text: "text-foreground" },
  default: { background: "bg-muted", border: "border-border", text: "text-foreground" },
};


interface FlashcardProps {
  front: string;
  back: string;
  category: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink' | 'teal' | 'gray';
}

export function Flashcard({ front, back, category, color }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colors = colorVariants[color] || colorVariants.default;

  return (
    <div
      className="group w-full [perspective:1000px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <Card
        className={cn(
          "relative h-64 w-full cursor-pointer rounded-xl shadow-lg transition-all duration-700 [transform-style:preserve-3d]",
          "border-2",
          isFlipped ? "[transform:rotateY(180deg)]" : "",
          isFlipped ? colors.border : "border-border"
        )}
      >
        {/* Front of the card */}
        <CardContent className="absolute flex h-full w-full flex-col justify-between p-4 [backface-visibility:hidden] bg-card rounded-xl">
          <div>
            <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
              <Tag className="h-3 w-3" />
              {category}
            </Badge>
          </div>
          <p className="text-center text-lg font-semibold">{front}</p>
          <div className="flex justify-end opacity-20 transition-opacity group-hover:opacity-80">
            <RotateCcw className="h-4 w-4" />
          </div>
        </CardContent>

        {/* Back of the card */}
        <CardContent className={cn(
          "absolute flex h-full w-full flex-col justify-center items-center p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl",
          colors.background,
          colors.text
        )}>
          <div className="flex-grow overflow-y-auto pr-2 flex justify-center items-center">
            <p className="text-base text-center">{back}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
