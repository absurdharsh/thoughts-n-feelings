import React, { useState, useEffect } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import VantaAsciiBackground from './components/VantaAsciiBackground';
import CrtOverlay from './components/CrtOverlay';
import AsciiHeroBanner from './components/AsciiHeroBanner';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import InteractiveTerminalLog from './components/InteractiveTerminalLog';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { sound } from './utils/audio';

export default function App() {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_entries_monument');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ENTRIES;
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [textureEnabled, setTextureEnabled] = useState(true);
  const [theme, setTheme] = useState('basalt'); // Default: ancient basalt rock
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_entries_monument', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.setMuted(!nextState);
    sound.toggleAmbient(nextState);
    if (nextState) {
      sound.playClick(1.0);
    }
  };

  const handleSaveEntry = (newEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleScrollToLedger = () => {
    const el = document.getElementById('digital-ledger');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SmoothScrollProvider>
      <div className={`relative min-h-screen text-[#e5e0d8] bg-[#0a0a09] theme-${theme} selection:bg-[#32312d] selection:text-[#ffffff]`}>
        {/* Background Atmosphere: Subdued Basalt Vanta & Ancient Lithic Sediment Shader */}
        <VantaAsciiBackground theme={theme} />

        {/* Micro-mineral Stippling & Ancient Chamber Vignette */}
        <CrtOverlay enabled={textureEnabled} theme={theme} />

        {/* Floating Lithic Status Bar & Navigation */}
        <RetroStatusBar
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          currentTheme={theme}
          onChangeTheme={setTheme}
          onOpenNewEntryModal={() => setIsModalOpen(true)}
        />

        {/* Main Monolithic Column */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Monumental ASCII Inscription Monolith Hero */}
          <AsciiHeroBanner
            onInscribeClick={() => setIsModalOpen(true)}
            onScrollToLedger={handleScrollToLedger}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />

          {/* Slabs & Folios Inscription Strata */}
          <main className="flex-1 pb-28">
            <DigitalBookLayout
              entries={entries}
              onOpenNewEntryModal={() => setIsModalOpen(true)}
            />
          </main>

          {/* Ancient Epigraphic Colophon & Footer */}
          <footer className="relative border-t border-[#1e1d1b] bg-[#070706] py-14 px-4 text-center font-mono text-xs text-[#73716b]">
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-center gap-6 text-[#94928b] text-[11px] uppercase tracking-widest">
                <a
                  href="https://www.instagram.com/absurdnigga"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#ffffff] transition-colors flex items-center space-x-1.5"
                >
                  <span>‡</span>
                  <span>absurdharsh</span>
                </a>
                <span>&bull;</span>
                <span className="text-[#5e5c56]">Ishika's Theorem on Consumption</span>
                <span>&bull;</span>
                <span className="text-[#5e5c56]">Clare Harner (Immortality 1934)</span>
                <span>&bull;</span>
                <a
                  href="https://github.com/absurdharsh/thoughts-n-feelings"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#ffffff] transition-colors"
                >
                  GitHub Codex
                </a>
              </div>

              <div className="text-[10px] text-[#52504a]">
                <pre className="font-mono inline-block text-left opacity-80">
{`+================================================================+
| MONUMENTUM DIGITALE &bull; ANNO DOMINI MMXXVI                     |
| "i think more than i feel, so don't expect frequent updates"   |
| Chiseled with Lenis Inertia, Three.js Lithic Dust & Basalt CSS |
+================================================================+`}
                </pre>
              </div>

              <p className="text-[10px] text-[#42403b] tracking-wider uppercase font-serif italic">
                Non omnis moriar &bull; Not all of me shall die &bull; Inscribed upon permanent mineral memory
              </p>
            </div>
          </footer>
        </div>

        {/* Modal: Chisel Inscription into Stele */}
        <InteractiveTerminalLog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveEntry={handleSaveEntry}
          entries={entries}
        />
      </div>
    </SmoothScrollProvider>
  );
}
