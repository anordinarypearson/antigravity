import React from 'react';
import Image from 'next/image';

export const ImageSearchAd = () => {
  return (
    <section className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0a0b14] p-8 md:p-16">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10" />
      </div>

      <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-12">
        {/* Content Side */}
        <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse-soft">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            New Feature
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Infinite Vision: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Search by Image
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Revolutionize how you explore. Instantly identify products, landmarks, 
            and objects with our state-of-the-art AI visual search. If you can see it, you can search it.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
            <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Try it Now
            </button>
            <button className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md">
              Learn More
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
            <div className="space-y-1">
              <div className="text-white font-bold text-xl">99.9%</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="space-y-1">
              <div className="text-white font-bold text-xl">&lt; 0.5s</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider">Speed</div>
            </div>
            <div className="space-y-1">
              <div className="text-white font-bold text-xl">10B+</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider">Indexed</div>
            </div>
          </div>
        </div>

        {/* Visual Side */}
        <div className="flex-1 relative animate-float">
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-blue-500/20">
             <img 
              src="/image-search-feature.png" 
              alt="Image Search Feature" 
              className="w-full h-auto object-cover"
            />
            
            {/* Scanning Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_linear_infinite]" />
            </div>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute -top-6 -right-6 glass p-4 rounded-xl border border-blue-500/30 animate-float delay-75 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm font-medium text-white">Item Identified</div>
            </div>
          </div>

          <div className="absolute -bottom-10 -left-6 glass p-6 rounded-2xl border border-purple-500/30 animate-float delay-150 hidden md:block max-w-[200px]">
             <div className="text-xs text-purple-300 font-bold uppercase mb-2">Visual Insight</div>
             <div className="text-sm text-slate-300 italic">"Matches premium collection 2024. Available in 4 colors."</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </section>
  );
};
