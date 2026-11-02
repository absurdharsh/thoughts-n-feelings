import React, { useState, useEffect } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import VantaAsciiBackground from './components/VantaAsciiBackground';
import CrtOverlay from './components/CrtOverlay';
import AsciiHeroBanner from './components/AsciiHeroBanner';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import InteractiveTerminalLog from './components/InteractiveTerminalLog';
import GreekMeanderDivider from './components/GreekMeanderDivider';
import { INITIAL_ENTRIES } from './data/initialThoughts';
import { sound } from './utils/audio';

export default function App() {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_entries_monument_clean');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ENTRIES;
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_entries_monument_clean', JSON.stringify(entries));
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
      <div className="relative min-h-screen text-[#d8d2c4] bg-[#141516] selection:bg-[#36373b] selection:text-[#ffffff]">
        {/* Subterranean Atmosphere: Ultra-slow matte charcoal & settling dust motes */}
        <VantaAsciiBackground />

        {/* Microscopic Stone Pitting & Chamber Shadow */}
        <CrtOverlay enabled={true} />

        {/* Single Monolithic Stone Stele (No Boxy Cards or Grid Containers) */}
        <div className="relative z-10 flex flex-col items-center min-h-screen px-3 sm:px-6 py-8 sm:py-16">
          <main className="w-full max-w-4xl monolith-stele stele-pitting my-4">
            
            {/* Monument Summit & Hero Architrave */}
            <AsciiHeroBanner
              onInscribeClick={() => setIsModalOpen(true)}
              onScrollToLedger={handleScrollToLedger}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />

            {/* Continuous Inscription Folios */}
            <DigitalBookLayout
              entries={entries}
              onOpenNewEntryModal={() => setIsModalOpen(true)}
            />

            {/* Inlaid Stele Controls */}
            <RetroStatusBar
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onOpenNewEntryModal={() => setIsModalOpen(true)}
            />

            {/* Authentic Greek Key Meander Divider */}
            <GreekMeanderDivider className="my-8" />

            {/* Monument Base / Epigraphic Colophon (Grounded, Solitary, Zero Emojis, Zero Documentation) */}
            <footer className="px-6 py-12 text-center font-mono text-xs text-[#8c867a]">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] tracking-[0.25em] uppercase text-[#736f66]">
                  <a
                    href="https://www.instagram.com/absurdnigga"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#d8d2c4] transition-colors"
                  >
                    ‡ ABSURDHARSH
                  </a>
                  <span>&bull;</span>
                  <span>ISHIKA'S THEOREM</span>
                  <span>&bull;</span>
                  <span>CLARE HARNER (MCMXXXIV)</span>
                </div>

                <div className="py-2 text-[10px] text-[#5a5852] leading-relaxed">
                  <pre className="font-mono inline-block text-left opacity-75">
{`╔════════════════════════════════════════════════════════════════╗
║ MONUMENTUM DIGITALE &bull; EX ARCHIVO ABSURDHARSH                  ║
║ "i think more than i feel, so don't expect frequent updates"   ║
║ AETERNITAS &bull; SILENTIUM &bull; MEMORIA                               ║
╚════════════════════════════════════════════════════════════════╝`}
                  </pre>
                </div>

                <p className="font-serif italic text-xs text-[#736f66] tracking-wider uppercase">
                  Non omnis moriar &bull; Not all of me shall die &bull; Inscribed upon permanent basalt
                </p>
              </div>
            </footer>
          </main>
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
