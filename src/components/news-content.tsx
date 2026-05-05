
"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw,  ExternalLink, Search, ChevronDown } from "lucide-react"
import { WavyLoader } from "@/components/ui/wavy-loader";
import { useRouter } from "next/navigation";
import { Skeleton } from "./ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";


type Article = {
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    source: {
        name: string;
    };
    publishedAt: string;
};

const categories = [
    { key: "general", name: "Top Stories" },
    { key: "technology", name: "Technology" },
    { key: "science", name: "Science" },
    { key: "sports", name: "Sports" },
    { key: "business", name: "Business" },
    { key: "entertainment", name: "Entertainment" },
    { key: "health", name: "Health" },
];

const mainCategories = ["technology", "science", "sports"];

export function NewsContent() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [category, setCategory] = useState("general");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNews = useCallback(async (cat: string, query?: string) => {
        setLoading(true);
        setError(null);
        setArticles([]);

        try {
            let url = `/api/news?page=1`;
            if (query) {
                url += `&q=${encodeURIComponent(query)}`;
            } else {
                url += `&category=${cat}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch news");
            }
            const data = await res.json();

            const newArticles = (data.articles || []).filter((article: Article) => article.title && article.title !== "[Removed]");
            setArticles(newArticles);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews(category, searchQuery);
    }, [fetchNews, category, searchQuery]);

    const handleReadMore = (article: Article) => {
        try {
            localStorage.setItem('selectedArticle', JSON.stringify(article));
            router.push('/news-reader');
        } catch (e) {
            console.error("Could not save article to localStorage", e);
            setError("Could not open article. Please try again.");
        }
    }

    const handleCategorySelect = (catKey: string) => {
        setCategory(catKey);
        setSearchQuery("");
    }

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('search') as HTMLInputElement;
        setCategory(""); // Clear category when searching
        setSearchQuery(input.value);
    }

    const currentCategoryName = categories.find(c => c.key === category)?.name || "Search Results";

    return (
        <div className="flex flex-col h-full bg-muted/40 overflow-hidden">

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <header className="mb-8 sticky top-0 z-20 bg-muted/40 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 -mt-2">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input name="search" placeholder="Search for news..." className="w-full pl-10 h-12 text-base rounded-full shadow-lg" />
                            </div>
                        </form>
                        <div className="flex items-center justify-center gap-2">
                            <div className="hidden md:flex items-center gap-2">
                                {categories.filter(c => mainCategories.includes(c.key)).map(c => (
                                    <Button key={c.key} variant={category === c.key ? "default" : "outline"} onClick={() => handleCategorySelect(c.key)}>{c.name}</Button>
                                ))}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        More <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {categories.map(c => (
                                        <DropdownMenuItem key={c.key} onSelect={() => handleCategorySelect(c.key)}>
                                            {c.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNews(category, searchQuery)}
                        disabled={loading}
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </header>

                <h2 className="text-2xl font-bold mb-6 text-center">{loading ? "Fetching news..." : currentCategoryName}</h2>

                {error && (
                    <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
                        <p className="text-destructive font-semibold">Failed to load news</p>
                        <p className="text-destructive/80 text-sm mt-1">{error}</p>
                        <p className="text-destructive/80 text-sm mt-4">Please make sure your NewsAPI key is set in the .env file.</p>
                    </div>
                )}

                {loading && articles.length === 0 ? (
                    <div className="space-y-8">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 items-center">
                                <Skeleton className="h-40 w-full rounded-lg" />
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2 mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !loading && !error && articles.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-12">
                        <p>No articles found. Please try a different search or category.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {articles.map((article, i) => (
                            <div
                                key={`${article.url}-${i}`}
                                className="group grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 items-center cursor-pointer"
                                onClick={() => handleReadMore(article)}
                            >
                                <div className="relative w-full aspect-video md:aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                                    {article.urlToImage ? (
                                        <Image
                                            src={article.urlToImage}
                                            alt={article.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            unoptimized
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No Image</div>}
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold leading-snug group-hover:text-primary transition-colors">{article.title}</h2>
                                    <p className="text-base text-muted-foreground mt-2 line-clamp-3">{article.description}</p>
                                    <p className="text-sm text-muted-foreground mt-auto pt-2">{new Date(article.publishedAt).toLocaleDateString()} &middot; {article.source.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
