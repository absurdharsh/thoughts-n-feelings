import React, { useState, useEffect } from 'react';
import { useSmoothScroll } from './SmoothScrollProvider';
import { sound } from '../utils/audio';

const MINERAL_THEMES = [
  { id: 'basalt', label: 'BASALT', color: '#0a0a09', text: '#d8d2c4' },
  { id: 'slate', label: 'SLATE', color: '#0c0e12', text: '#c7d0dc' },
  { id: 'limestone', label: 'LIMESTONE', color: '#0e0d0b', text: '#e4ddcf' },
  { id: 'obsidian', label: 'OBSIDIAN', color: '#050505', text: '#b0aba2' },
];

export default function RetroStatusBar({
  soundEnabled,
  onToggleSound,
  currentTheme,
  onChangeTheme,
  onOpenNewEntryModal,
}) {
  const { lenis, scrollProgress } = useSmoothScroll() || {};
  const [percent, setPercent] = useState(0);
  const [activeLiber, setActiveLiber] = useState('PRAEFATIO');

  useEffect(() => {
    const p = Math.min(100, Math.max(0, Math.round((scrollProgress || 0) * 100)));
    setPercent(p);

    if (p < 15) {
      setActiveLiber('PRAEFATIO &bull; HERO');
    } else if (p < 38) {
      setActiveLiber('LIBER I &bull; DETERMINISMUS');
    } else if (p < 62) {
      setActiveLiber('LIBER II &bull; CONSUMPTIO');
    } else if (p < 85) {
      setActiveLiber('LIBER III &bull; TABULA VACUA');
    } else {
      setActiveLiber('LIBER IV &bull; EPITAPHIA');
    }
  }, [scrollProgress]);

  // Lithic Progress Bar e.g. [██████░░░░]
  const renderLithicBar = () => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(Math.max(0, totalBlocks - filledBlocks));
    return `[${filled}${empty}]`;
  };

  const scrollToTop = () => {
    sound.playClick(1.4);
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cycleMineralTheme = () => {
    sound.playClick(1.2);
    const currentIndex = MINERAL_THEMES.findIndex((t) => t.id === currentTheme);
    const nextTheme = MINERAL_THEMES[(currentIndex + 1) % MINERAL_THEMES.length];
    onChangeTheme(nextTheme.id);
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl select-none">
      <div className="stone-slab p-2 sm:px-4 sm:py-2.5 border border-[#302f2b] flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#a39f96]">
        {/* Left: Lithic Progress Bar & Current Liber */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-[#d8d2c4] font-bold tracking-wider">
            {renderLithicBar()} <span className="text-[#ffffff] ml-1">{percent}%</span>
          </span>
          <span className="text-[#3c3a35] hidden sm:inline">|</span>
          <span 
            dangerouslySetInnerHTML={{ __html: activeLiber }} 
            className="hidden md:inline tracking-widest text-[#73716b] uppercase text-[10px]"
          />
        </div>

        {/* Center/Right: Monolithic Stone Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Mineral Theme Selector */}
          <button
            type="button"
            onClick={cycleMineralTheme}
            className="stone-btn px-2.5 py-1 text-[10px] tracking-wider uppercase"
            title="Cycle mineral tablet stone: Basalt, Slate, Limestone, Obsidian"
          >
            <span>MINERAL: {currentTheme?.toUpperCase() || 'BASALT'}</span>
          </button>

          {/* Sound / Chamber Resonance Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onToggleSound();
            }}
            className="stone-btn px-2.5 py-1 text-[10px] tracking-wider uppercase text-[#88857c]"
            title="Toggle mineral stone acoustic feedback"
          >
            <span>{soundEnabled ? 'RESONANCE 🔔' : 'RESONANCE 🔕'}</span>
          </button>

          {/* Inscribe Stone Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.3);
              onOpenNewEntryModal();
            }}
            className="stone-btn px-3 py-1 text-[10px] tracking-widest uppercase font-bold text-[#ffffff] bg-[#222220] border-[#44423d]"
          >
            <span>INSCRIBE ✍</span>
          </button>

          {/* Return to Top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="stone-btn px-2 py-1 text-[10px] text-[#73716b] hover:text-[#d8d2c4]"
            title="Ascend to Monumental Crest"
          >
            <span>▲</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
