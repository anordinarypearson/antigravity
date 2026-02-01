
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";
import { BackButton } from "./back-button";

const ebooks = [
  {
    title: "The Art of Programming",
    description: "An essential guide to the fundamentals of computer programming and software design, covering algorithms, data structures, and more.",
    coverUrl: "https://picsum.photos/seed/programming/300/400",
    aiHint: "programming book"
  },
  {
    title: "A Journey Through the Cosmos",
    description: "Explore the wonders of the universe, from the Big Bang to the most distant galaxies. A captivating read for astronomy enthusiasts.",
    coverUrl: "https://picsum.photos/seed/cosmos/300/400",
    aiHint: "space galaxy"
  },
  {
    title: "The History of Ancient Civilizations",
    description: "A comprehensive look at the rise and fall of the world's most influential ancient societies, from Mesopotamia to Rome.",
    coverUrl: "https://picsum.photos/seed/history/300/400",
    aiHint: "ancient history"
  }
];

export function EbooksContent() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center relative">
          <BackButton className="absolute left-0 top-1/2 -translate-y-1/2" />
          <Button className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => window.location.href = '/create-ebook'}>
            Create eBook
          </Button>
          <BookOpen className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight">eBook Library</h1>
          <p className="mt-2 text-lg text-muted-foreground">Browse our curated collection of educational eBooks.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
          {ebooks.map((book, index) => (
            <Card key={index} className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl">
              <Link href={`/ebooks/${slugify(book.title)}`}>
                <CardContent className="p-0">
                  <Image
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    width={300}
                    height={400}
                    className="w-full h-auto object-cover"
                    data-ai-hint={book.aiHint}
                  />
                </CardContent>
              </Link>
              <div className="flex flex-col flex-1 p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 mt-2">
                  <CardDescription>{book.description}</CardDescription>
                </CardContent>
                <CardFooter className="p-0 mt-4">
                  <Link href={`/ebooks/${slugify(book.title)}`} className="w-full">
                    <Button className="w-full">Read Now</Button>
                  </Link>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
