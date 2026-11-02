import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Monitor, Palette, ArrowUp, ArrowDown, Edit3, Compass } from 'lucide-react';
import { useSmoothScroll } from './SmoothScrollProvider';
import { sound } from '../utils/audio';

const THEMES = [
  { id: 'parchment', label: 'PARCHMENT', color: '#c5a059' },
  { id: 'emerald', label: 'EMERALD', color: '#00ff66' },
  { id: 'amber', label: 'AMBER', color: '#ffb000' },
  { id: 'cyan', label: 'CYAN', color: '#00e5ff' },
];

export default function RetroStatusBar({
  soundEnabled,
  onToggleSound,
  crtEnabled,
  onToggleCrt,
  currentTheme,
  onChangeTheme,
  onOpenNewEntryModal,
}) {
  const { lenis, scrollProgress } = useSmoothScroll() || {};
  const [percent, setPercent] = useState(0);
  const [activeSection, setActiveSection] = useState('PROLOGUE');

  useEffect(() => {
    const p = Math.min(100, Math.max(0, Math.round((scrollProgress || 0) * 100)));
    setPercent(p);

    if (p < 15) {
      setActiveSection('HERO: BOOT PROTOCOL');
    } else if (p < 40) {
      setActiveSection('CH I: DETERMINISM');
    } else if (p < 65) {
      setActiveSection('CH II: ISHIKA THEOREM');
    } else if (p < 85) {
      setActiveSection('CH III: TOMBSTONES');
    } else {
      setActiveSection('EPILOGUE: VOID');
    }
  }, [scrollProgress]);

  // Generate ASCII progress bar e.g. [██████░░░░]
  const renderProgressBar = () => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(Math.max(0, totalBlocks - filledBlocks));
    return `[${filled}${empty}]`;
  };

  const scrollToTop = () => {
    sound.playClick(1.6);
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToLedger = () => {
    sound.playFold();
    const el = document.getElementById('digital-ledger');
    if (el) {
      if (lenis) {
        lenis.scrollTo(el, { offset: -20, duration: 1.5 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const cycleTheme = () => {
    sound.playClick(1.3);
    const currentIndex = THEMES.findIndex((t) => t.id === currentTheme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    onChangeTheme(nextTheme.id);
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-4xl select-none">
      <div className="px-3 sm:px-5 py-2.5 rounded-lg bg-[#0c0e14]/90 backdrop-blur-md border border-zinc-800/90 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono text-zinc-300">
        
        {/* Left: Scroll Progress & ASCII bar */}
        <div className="flex items-center space-x-3">
          <div className="text-[#c5a059] font-bold tracking-wider">
            {renderProgressBar()} <span className="text-zinc-200">{percent}%</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <div className="hidden md:flex items-center space-x-1 text-zinc-400 text-[11px]">
            <Compass className="w-3 h-3 text-[#c5a059]" />
            <span className="truncate max-w-[150px]">{activeSection}</span>
          </div>
        </div>

        {/* Center / Right: Retro Tool Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Palette Switcher */}
          <button
            onClick={cycleTheme}
            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 flex items-center space-x-1 transition-colors"
            title="Cycle Retro Color Theme"
          >
            <Palette className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="hidden sm:inline uppercase text-[10px]">
              {THEMES.find((t) => t.id === currentTheme)?.label || 'THEME'}
            </span>
          </button>

          {/* CRT Scanline Toggle */}
          <button
            onClick={() => {
              sound.playClick(1.2);
              onToggleCrt();
            }}
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition-colors ${
              crtEnabled
                ? 'bg-zinc-800 border-[#c5a059]/60 text-[#c5a059]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle CRT Scanline Simulation"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">{crtEnabled ? 'CRT: ON' : 'CRT: OFF'}</span>
          </button>

          {/* Ambient Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`px-2 py-1 rounded border flex items-center space-x-1 transition-colors ${
              soundEnabled
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Toggle Retro Audio & Ambient Drone"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px]">{soundEnabled ? 'AUDIO: ON' : 'AUDIO: OFF'}</span>
          </button>

          {/* Inscribe Entry Quick Trigger */}
          <button
            onClick={() => {
              sound.playClick(1.4);
              onOpenNewEntryModal();
            }}
            className="px-2.5 py-1 rounded bg-[#c5a059]/20 hover:bg-[#c5a059]/30 border border-[#c5a059]/60 text-[#e5d7ba] flex items-center space-x-1 transition-colors"
            title="Inscribe New Thought"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="text-[10px] uppercase font-bold">INSCRIBE</span>
          </button>

          {/* Jump to top */}
          <button
            onClick={scrollToTop}
            className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:text-[#c5a059] text-zinc-400 transition-colors"
            title="Scroll to Top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

