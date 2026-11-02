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
import { Terminal, Github, Heart, BookOpen, ExternalLink } from 'lucide-react';

export default function App() {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ENTRIES;
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [theme, setTheme] = useState('parchment');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_entries', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.setMuted(!nextState);
    sound.toggleAmbient(nextState);
    if (nextState) {
      sound.playClick(1.2);
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
      <div className={`relative min-h-screen text-[#e8e4dc] theme-${theme} selection:bg-[#c5a059]/40`}>
        {/* Background Atmosphere: Vanta 3D NET + Reactive Canvas ASCII Filter */}
        <VantaAsciiBackground theme={theme} />

        {/* CRT Scanline & Curvature Simulation */}
        <CrtOverlay enabled={crtEnabled} theme={theme} />

        {/* Floating Retro Status Bar & HUD */}
        <RetroStatusBar
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          crtEnabled={crtEnabled}
          onToggleCrt={() => setCrtEnabled((v) => !v)}
          currentTheme={theme}
          onChangeTheme={setTheme}
          onOpenNewEntryModal={() => setIsModalOpen(true)}
        />

        {/* Main Content Body */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header / Hero ASCII Title Banner */}
          <AsciiHeroBanner
            onInscribeClick={() => setIsModalOpen(true)}
            onScrollToLedger={handleScrollToLedger}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />

          {/* Infinite Scroll Continuous Parchment Ledger */}
          <main className="flex-1 pb-24">
            <DigitalBookLayout
              entries={entries}
              onOpenNewEntryModal={() => setIsModalOpen(true)}
            />
          </main>

          {/* Retro Colophon / Terminal Footer */}
          <footer className="relative border-t border-zinc-800/80 bg-black/60 backdrop-blur-md py-12 px-4 text-center font-mono text-xs text-zinc-500">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
                <a
                  href="https://www.instagram.com/absurdnigga"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#c5a059] transition-colors flex items-center space-x-1"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>absurdharsh</span>
                </a>
                <span>•</span>
                <span className="text-zinc-500">ishika's theorem & clare harner</span>
                <span>•</span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#c5a059] transition-colors flex items-center space-x-1"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>thoughts-n-feelings</span>
                </a>
              </div>

              <div className="text-[11px] text-zinc-600">
                <pre className="font-mono inline-block">
{`+-------------------------------------------------------------+
| RETRO-FUTURISTIC CODEX // GSAP & LENIS SYNCHRONIZED ARCHIVE  |
| "i think more than i feel, so don't expect frequent updates" |
+-------------------------------------------------------------+`}
                </pre>
              </div>

              <p className="text-[10px] text-zinc-600">
                Designed with continuous parchment folding, Three.js Net, dynamic ASCII canvas filter, and Lenis inertia physics.
              </p>
            </div>
          </footer>
        </div>

        {/* Modal: Interactive Terminal Inscription */}
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

