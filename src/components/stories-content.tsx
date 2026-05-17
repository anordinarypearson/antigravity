"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Heart, ThumbsDown, Bookmark, Share2, MessageCircle,
  ExternalLink, ChevronUp, ChevronDown, Volume2, VolumeX,
  Search, RefreshCw, X, TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Article = {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Curated fallback images by category (Unsplash)
const FALLBACK_IMAGES: Record<string, string> = {
  general:       "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
  technology:    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  science:       "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80",
  sports:        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
  entertainment: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&q=80",
  business:      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  health:        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
};

export function StoriesContent() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("general");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const categories = [
    { id: "general",       name: "For You",       emoji: "✨" },
    { id: "technology",    name: "Tech",           emoji: "💻" },
    { id: "science",       name: "Science",        emoji: "🔬" },
    { id: "sports",        name: "Sports",         emoji: "⚽" },
    { id: "entertainment", name: "Entertainment",  emoji: "🎬" },
    { id: "business",      name: "Business",       emoji: "📈" },
    { id: "health",        name: "Health",         emoji: "🏥" },
  ];

  // Interactions
  const [liked,      setLiked]      = useState<Record<string, number>>({});
  const [disliked,   setDisliked]   = useState<Record<string, boolean>>({});
  const [saved,      setSaved]      = useState<Record<string, boolean>>({});
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const lastTapRef = useRef<{ time: number; url: string }>({ time: 0, url: "" });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const storyRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const fetchNews = useCallback(async (p: number, cat: string, q?: string) => {
    if (p === 1) setLoading(true); else setRefreshing(false);
    try {
      const params = new URLSearchParams({ page: String(p), category: cat });
      if (q) params.set("q", q);
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      const incoming: Article[] = (data.articles || []).filter(
        (a: Article) => a.title && a.title !== "[Removed]"
      );
      setArticles(prev => {
        if (p === 1) return incoming;
        const seen = new Set(prev.map(a => a.url.split("#")[0]));
        const fresh = incoming.filter(a => !seen.has(a.url.split("#")[0]));
        if (fresh.length === 0 && incoming.length > 0) {
          // loop with tagged URLs to keep feed going
          return [...prev, ...incoming.map(a => ({ ...a, url: `${a.url}#loop${p}` }))];
        }
        return [...prev, ...fresh];
      });
    } catch (err) {
      console.error("Failed to fetch stories", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setArticles([]);
    setActiveIndex(0);
    setPage(1);
    fetchNews(1, category, searchQuery || undefined);
  }, [fetchNews, category, searchQuery]);

  // IntersectionObserver to track active story
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || articles.length === 0) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    storyRefs.current.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [articles]);

  // TTS narrator
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!isMuted && articles[activeIndex]) {
      const a = articles[activeIndex];
      const text = `${a.source.name}. ${a.title}. ${a.description || ""}`;
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      const t = setTimeout(() => window.speechSynthesis.speak(utt), 400);
      return () => clearTimeout(t);
    }
  }, [activeIndex, articles, isMuted]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    };
  }, []);

  // Load more near end
  useEffect(() => {
    if (activeIndex >= articles.length - 4 && !loading && articles.length > 0) {
      const next = page + 1;
      setPage(next);
      fetchNews(next, category, searchQuery || undefined);
    }
  }, [activeIndex, articles.length, loading]);

  // Double-tap like
  const handleDoubleTap = (url: string) => {
    const now = Date.now();
    if (lastTapRef.current.url === url && now - lastTapRef.current.time < 350) {
      setLiked(prev => ({ ...prev, [url]: (prev[url] ?? 0) + 1 }));
      setDisliked(prev => ({ ...prev, [url]: false }));
      setHeartBurst(url);
      setTimeout(() => setHeartBurst(null), 900);
    }
    lastTapRef.current = { time: now, url };
  };

  const toggleLike = (url: string) => {
    setLiked(prev => {
      const cur = prev[url] ?? 0;
      return { ...prev, [url]: cur > 0 ? 0 : 1 };
    });
    setDisliked(prev => ({ ...prev, [url]: false }));
  };
  const toggleDislike = (url: string) => {
    setDisliked(prev => ({ ...prev, [url]: !prev[url] }));
    setLiked(prev => ({ ...prev, [url]: 0 }));
  };
  const toggleSave    = (url: string)  => setSaved(prev => ({ ...prev, [url]: !prev[url] }));
  const toggleSubscribe = (src: string) => setSubscribed(prev => ({ ...prev, [src]: !prev[src] }));
  const toggleMute    = ()             => setIsMuted(p => !p);

  const handleShare = async (article: Article) => {
    if (navigator.share) {
      try { await navigator.share({ title: article.title, url: article.url }); } catch {}
    } else {
      await navigator.clipboard.writeText(article.url);
    }
  };

  const handleReadMore = (article: Article) => {
    try {
      localStorage.setItem("selectedArticle", JSON.stringify(article));
      router.push("/news-reader");
    } catch {}
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setArticles([]);
    setActiveIndex(0);
    setPage(1);
    fetchNews(1, category, searchQuery || undefined);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchInput("");
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (searchOpen) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        storyRefs.current.get(Math.min(activeIndex + 1, articles.length - 1))?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        storyRefs.current.get(Math.max(activeIndex - 1, 0))?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "l") { const a = articles[activeIndex]; if (a) toggleLike(a.url); }
        else if (e.key === "s") { const a = articles[activeIndex]; if (a) toggleSave(a.url); }
        else if (e.key === "m") toggleMute();
        else if (e.key === "/") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, articles, isMuted, searchOpen]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col md:flex-row overflow-hidden">
      
      {/* ── Left Sidebar (Desktop) ── */}
      <div className="hidden md:flex flex-col w-[260px] h-full bg-neutral-950 border-r border-white/10 p-5 shrink-0 z-50 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Search topics..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white w-fit">
              <TrendingUp className="w-3 h-3" />
              <span>"{searchQuery}"</span>
              <button onClick={clearSearch} className="text-white/50 hover:text-white ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">Categories</h3>
          <button onClick={handleRefresh} className={`text-white/50 hover:text-white ${refreshing ? "animate-spin" : ""}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.id); setPage(1); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === c.id
                  ? "bg-white/10 text-white border border-white/20 shadow-sm"
                  : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-lg">{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top bar: Categories + Search (Mobile) ── */}
      <div className="md:hidden absolute top-0 inset-x-0 z-50 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex justify-center pointer-events-none">
        <div className="w-full max-w-[440px] pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 backdrop-blur-md border flex-shrink-0 ${
                  category === c.id
                    ? "bg-white text-black border-white shadow-lg shadow-white/20 scale-105"
                    : "bg-white/10 text-white/80 border-white/15 hover:bg-white/20 hover:text-white"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>{c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 hover:bg-white/20 hover:text-white transition-all"
              title="Search (press /)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 hover:bg-white/20 hover:text-white transition-all ${refreshing ? "animate-spin" : ""}`}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-3 pb-2 flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 shadow-lg">
                <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
                <input
                  autoFocus
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") setSearchOpen(false); }}
                  placeholder="Search news topics..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="text-white/40 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-white/90 transition-colors shadow-lg"
              >
                Go
              </button>
              <button onClick={() => setSearchOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active search chip */}
        {searchQuery && !searchOpen && (
          <div className="px-3 pb-1.5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 text-xs text-white">
              <TrendingUp className="w-3 h-3" />
              <span>"{searchQuery}"</span>
              <button onClick={clearSearch} className="text-white/50 hover:text-white ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Story counter + audio toggle ── */}
      {articles.length > 0 && (
        <div className="absolute top-[52px] md:top-6 right-3 md:right-6 z-40 flex flex-col items-center gap-2">
          {/* Progress dots */}
          <div className="flex flex-col items-center gap-0.5">
            {articles.slice(0, Math.min(articles.length, 12)).map((_, i) => (
              <button
                key={i}
                onClick={() => storyRefs.current.get(i)?.scrollIntoView({ behavior: "smooth" })}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-1.5 h-5 bg-white"
                    : Math.abs(i - activeIndex) <= 2
                    ? "w-1 h-1.5 bg-white/50"
                    : "w-1 h-1 bg-white/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all shadow-lg mt-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className="text-white/60 text-[10px] font-bold bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
            {activeIndex + 1}/{articles.length}
          </span>
        </div>
      )}

      {/* ── Main Scroll Feed ── */}
      <div
        ref={scrollRef}
        className="h-full flex-1 w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center sm:gap-6 sm:py-6 relative"
      >
        {articles.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-white/50 gap-3">
            <span className="text-5xl">📰</span>
            <p className="text-lg font-medium">No stories found</p>
            <p className="text-sm text-white/30">Try a different category or search</p>
          </div>
        )}

        {articles.map((article, index) => {
          const imgSrc = article.urlToImage || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.general;
          const isActive = index === activeIndex;
          const likeCount = liked[article.url] ?? 0;

          return (
            <div
              key={`${article.url}-${index}`}
              data-index={index}
              ref={el => { if (el) storyRefs.current.set(index, el); }}
              className="w-full max-w-[440px] h-full sm:h-[calc(100vh-3rem)] shrink-0 snap-center snap-always relative bg-neutral-950 overflow-hidden flex flex-col sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-[0_0_40px_rgba(0,0,0,0.3)]"
              onClick={() => handleDoubleTap(article.url)}
            >
              {/* Background image with subtle Ken-Burns */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1 }}
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: 12, ease: "linear" }}
              >
                <Image
                  src={imgSrc}
                  alt={article.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={index < 3}
                />
              </motion.div>

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none z-10" style={{ top: "35%" }} />

              {/* Source pill — top-left */}
              <div className="absolute top-14 left-3 z-20 flex items-center gap-1.5">
                <div className="flex items-center bg-black/50 backdrop-blur-lg px-2.5 py-1 rounded-full border border-white/15 gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {article.source.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs text-white truncate max-w-[100px]">
                    {article.source.name}
                  </span>
                </div>
                <span className="text-white/50 text-[10px] font-medium bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full">
                  {timeAgo(article.publishedAt)}
                </span>
              </div>

              {/* Double-tap heart burst */}
              <AnimatePresence>
                {heartBurst === article.url && (
                  <motion.div
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Heart className="w-28 h-28 text-red-500 drop-shadow-2xl" fill="currentColor" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1" />

              {/* ── Bottom content ── */}
              <div className="relative z-20 w-full px-3 pb-4 flex items-end gap-3">
                {/* Left: text */}
                <div className="flex-1 min-w-0 text-white">
                  {/* Follow button */}
                  <button
                    className={`mb-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      subscribed[article.source.name]
                        ? "bg-white text-black border-white"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                    onClick={e => { e.stopPropagation(); toggleSubscribe(article.source.name); }}
                  >
                    {subscribed[article.source.name] ? "✓ Following" : "+ Follow"}
                  </button>

                  {/* Title */}
                  <h2 className="text-base md:text-lg font-bold mb-1.5 leading-snug text-white drop-shadow-lg line-clamp-3">
                    {article.title}
                  </h2>

                  {/* Description — tap to expand */}
                  {article.description && (
                    <div onClick={e => { e.stopPropagation(); setExpanded(p => ({ ...p, [article.url]: !p[article.url] })); }}>
                      <p className={`text-xs text-gray-300 leading-relaxed drop-shadow-sm cursor-pointer ${expanded[article.url] ? "" : "line-clamp-2"}`}>
                        {article.description}
                      </p>
                      {!expanded[article.url] && article.description.length > 80 && (
                        <span className="text-[10px] text-white/50 font-medium">…more</span>
                      )}
                    </div>
                  )}

                  {/* Read full link */}
                  <button
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    onClick={e => { e.stopPropagation(); handleReadMore(article); }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Read Full Article
                  </button>
                </div>

                {/* Right: action buttons */}
                <div className="flex flex-col items-center gap-3.5 pb-1 flex-shrink-0">
                  <ActionButton
                    icon={<Heart className="w-5 h-5" fill={likeCount > 0 ? "currentColor" : "none"} />}
                    label={likeCount > 0 ? String(likeCount) : "Like"}
                    active={likeCount > 0}
                    activeColor="text-red-500"
                    onClick={() => toggleLike(article.url)}
                  />
                  <ActionButton
                    icon={<ThumbsDown className="w-5 h-5" fill={disliked[article.url] ? "currentColor" : "none"} />}
                    label="Less"
                    active={disliked[article.url]}
                    activeColor="text-blue-400"
                    onClick={() => toggleDislike(article.url)}
                  />
                  <ActionButton
                    icon={<Bookmark className="w-5 h-5" fill={saved[article.url] ? "currentColor" : "none"} />}
                    label={saved[article.url] ? "Saved" : "Save"}
                    active={saved[article.url]}
                    activeColor="text-yellow-400"
                    onClick={() => toggleSave(article.url)}
                  />
                  <ActionButton
                    icon={<Share2 className="w-5 h-5" />}
                    label="Share"
                    onClick={() => handleShare(article)}
                  />
                  <ActionButton
                    icon={<MessageCircle className="w-5 h-5" />}
                    label="Read"
                    onClick={() => handleReadMore(article)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading card */}
        {loading && (
          <div className="w-full max-w-[440px] h-full sm:h-[calc(100vh-3rem)] shrink-0 snap-center flex flex-col items-center justify-center bg-neutral-900/50 sm:rounded-2xl gap-4 sm:border sm:border-white/5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
            </div>
            <p className="text-white/40 text-sm font-medium animate-pulse">Loading stories…</p>
          </div>
        )}
      </div>

      {/* ── Navigation arrows (desktop) ── */}
      <div className="absolute right-6 bottom-6 z-40 hidden md:flex flex-col items-center gap-3">
        <button
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors disabled:opacity-30 shadow-xl"
          disabled={activeIndex === 0}
          onClick={() => storyRefs.current.get(activeIndex - 1)?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors disabled:opacity-30 shadow-xl"
          disabled={activeIndex >= articles.length - 1}
          onClick={() => storyRefs.current.get(activeIndex + 1)?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Reusable Action Button ── */
function ActionButton({
  icon, label, active, activeColor, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform touch-manipulation"
    >
      <div className={`p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-lg transition-all ${active && activeColor ? activeColor : "text-white"} hover:bg-white/10`}>
        {icon}
      </div>
      <span className="text-white/70 text-[9px] font-semibold leading-none">{label}</span>
    </button>
  );
}
