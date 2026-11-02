import React, { useState, useEffect } from 'react';
import { useSmoothScroll } from './SmoothScrollProvider';
import { sound } from '../utils/audio';

/**
 * Archaeological Stele Navigation & Acoustic Controls
 * Understated, recessed stone inlays. Zero floating sci-fi HUDs.
 */
export default function RetroStatusBar({
  soundEnabled,
  onToggleSound,
  onOpenNewEntryModal,
}) {
  const { lenis, scrollProgress } = useSmoothScroll() || {};
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const p = Math.min(100, Math.max(0, Math.round((scrollProgress || 0) * 100)));
    setPercent(p);
  }, [scrollProgress]);

  const scrollToTop = () => {
    sound.playClick(1.4);
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 select-none border-t border-[#36373b]/60 mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#8c867a]">
        {/* Left: Roman Epigraphic Marker */}
        <div className="flex items-center space-x-2 text-[10px] tracking-[0.25em] uppercase text-[#736f66]">
          <span>◈</span>
          <span>STRATUM TRAVERSED: {percent}%</span>
        </div>

        {/* Right: Recessed Stone Inlays */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onToggleSound();
            }}
            className="stone-inlay-btn px-3 py-1.5 text-[10px] tracking-wider uppercase text-[#8c867a]"
            title="Toggle Subterranean Acoustic Resonance"
          >
            <span>{soundEnabled ? 'RESONANCE [ON]' : 'RESONANCE [OFF]'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(1.3);
              onOpenNewEntryModal();
            }}
            className="stone-inlay-btn px-3 py-1.5 text-[10px] tracking-widest uppercase text-[#ffffff] bg-[#2a2b30] border-[#4e5059]"
          >
            <span>INSCRIBE ‡</span>
          </button>

          <button
            type="button"
            onClick={scrollToTop}
            className="stone-inlay-btn px-2.5 py-1.5 text-[10px] text-[#8c867a] hover:text-[#d8d2c4]"
            title="Ascend to Stele Crest"
          >
            <span>APEX ▲</span>
          </button>
        </div>
      </div>
    </div>
  );
}
