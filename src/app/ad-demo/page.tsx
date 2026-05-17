'use client';

import { ImageSearchAd } from '@/components/image-search-ad';

export default function AdDemoPage() {
  return (
    <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center p-4 md:p-12">
      <div className="w-full max-w-6xl space-y-12">
        <header className="text-center space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-500">Component Preview</h2>
          <p className="text-slate-500">Premium Feature Advertisement - Image Search</p>
        </header>
        
        <ImageSearchAd />
        
        <footer className="text-center text-slate-600 text-sm pt-8 border-t border-white/5">
          &copy; 2024 White Neon AI Ecosystem. Designed for premium experiences.
        </footer>
      </div>
    </div>
  );
}
