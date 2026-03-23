
"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { BackButton } from "./back-button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { generateEbookChapterAction } from "@/app/actions";

const ebooks = [
  {
    title: "The Art of Programming",
    description: "An essential guide to the fundamentals of computer programming and software design, covering algorithms, data structures, and more.",
    coverUrl: "https://placehold.co/300x400.png",
  },
  {
    title: "A Journey Through the Cosmos",
    description: "Explore the wonders of the universe, from the Big Bang to the most distant galaxies. A captivating read for astronomy enthusiasts.",
    coverUrl: "https://placehold.co/300x400.png",
  },
  {
    title: "The History of Ancient Civilizations",
    description: "A comprehensive look at the rise and fall of the world's most influential ancient societies, from Mesopotamia to Rome.",
    coverUrl: "https://placehold.co/300x400.png",
  },
];

type ContentBlock = {
    type: 'h1' | 'h2' | 'p';
    text: string;
}
type ChapterContent = ContentBlock[];

export function EbookReader({ slug }: { slug: string }) {
  const [bookTitle, setBookTitle] = useState<string>("");
  const [chapters, setChapters] = useState<Record<number, ChapterContent>>({});
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isLoading, startLoading] = useTransition();
  const [isPrefetching, startPrefetching] = useTransition();
  const { toast } = useToast();

  const fetchChapter = useCallback(async (chapterNumber: number) => {
    if (!bookTitle) return;

    const action = chapterNumber > currentChapter || Object.keys(chapters).length === 0 ? startLoading : startPrefetching;

    action(async () => {
      try {
        const result = await generateEbookChapterAction({ title: bookTitle, chapter: chapterNumber });

        if (result.error) {
            throw new Error(result.error);
        } else if (result.data?.content) {
            setChapters(prev => ({ ...prev, [chapterNumber]: result.data.content }));
        } else {
             throw new Error("Invalid format from AI.");
        }
      } catch (e: any) {
         toast({
          title: `Failed to load Chapter ${chapterNumber}`,
          description: e.message || "An error occurred with the AI model.",
          variant: "destructive"
        });
      }
    });
  }, [bookTitle, currentChapter, chapters, toast]);


  useEffect(() => {
    const foundBook = ebooks.find(b => slugify(b.title) === slug);
    if (foundBook) {
      setBookTitle(foundBook.title);
    }
  }, [slug]);

  useEffect(() => {
    if (bookTitle && !chapters[1]) {
      fetchChapter(1);
    }
  }, [bookTitle, chapters, fetchChapter]);

  // Prefetch next chapter
  useEffect(() => {
    if (bookTitle && chapters[currentChapter] && !chapters[currentChapter + 1]) {
      fetchChapter(currentChapter + 1);
    }
  }, [bookTitle, chapters, currentChapter, fetchChapter]);

  const handleNextChapter = () => {
    setCurrentChapter(prev => prev + 1);
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(prev => prev - 1);
    }
  };


  const renderContent = () => {
      const content = chapters[currentChapter];
      if (isLoading && !content) {
          return (
             <div className="prose dark:prose-invert max-w-3xl mx-auto space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-full mt-4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-full mt-4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
            </div>
          )
      }
      if (!content) {
        return (
             <div className="flex-1 flex items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold">Chapter not found</h2>
                    <p className="text-muted-foreground">Could not load content for this chapter.</p>
                </div>
            </div>
        )
      }

    return content.map((item, index) => {
      switch (item.type) {
        case 'h1': return <h1 key={index} className="text-4xl font-bold mt-8 mb-4 !pb-2 !border-b-2">{item.text}</h1>;
        case 'h2': return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 !pb-1 !border-b">{item.text}</h2>;
        case 'p': return <p key={index} className="text-lg leading-relaxed">{item.text}</p>;
        default: return <p key={index}>{item.text}</p>;
      }
    });
  }

  if (!bookTitle) {
     return (
        <div className="flex-1 flex items-center justify-center text-center">
            <div>
                <h2 className="text-2xl font-bold">Book not found</h2>
                <p className="text-muted-foreground">The requested eBook could not be found.</p>
                <Link href="/ebooks"><Button variant="link" className="mt-4">Back to Library</Button></Link>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
        <BackButton />
        <div className="flex-1 mx-4 truncate">
          <h1 className="text-lg font-semibold truncate">{bookTitle}</h1>
        </div>
        <SidebarTrigger />
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="prose dark:prose-invert max-w-3xl mx-auto">
          {renderContent()}
        </div>
      </main>
       <footer className="sticky bottom-0 flex h-14 items-center justify-between border-t bg-background px-4 md:px-6">
            <Button variant="outline" onClick={handlePrevChapter} disabled={currentChapter === 1 || isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Chapter
            </Button>
            <span className="text-sm text-muted-foreground">Chapter {currentChapter}</span>
            <Button variant="outline" onClick={handleNextChapter} disabled={isLoading && !chapters[currentChapter + 1]}>
                 {(isLoading && !chapters[currentChapter + 1]) || (isPrefetching && !chapters[currentChapter+1]) ? <WavyLoader className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                Next Chapter
            </Button>
        </footer>
    </div>
  );
}
