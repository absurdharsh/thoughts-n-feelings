import React, { useState, useEffect } from 'react';
import SmoothScrollProvider from './components/SmoothScrollProvider';
import HandDrawnHero from './components/HandDrawnHero';
import DigitalBookLayout from './components/DigitalBookLayout';
import RetroStatusBar from './components/RetroStatusBar';
import HandDrawnThoughtModal from './components/HandDrawnThoughtModal';
import { INITIAL_ENTRIES } from './data/initialThoughts';

export default function App() {
  // Binary Theme: Light mode (Paper #FFFFFF, Ink #000000) by default
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('sketchbook_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('thoughts_sketchbook_entries_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_ENTRIES.length) return parsed;
      }
    } catch {}
    return INITIAL_ENTRIES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync theme with HTML root class
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sketchbook_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sketchbook_theme', 'light');
      }
    } catch {}
  }, [isDark]);

  // Sync entries to local storage
  useEffect(() => {
    try {
      localStorage.setItem('thoughts_sketchbook_entries_v4', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
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
      <div className="relative min-h-screen bg-paper dark:bg-darkPaper text-ink dark:text-darkInk transition-colors duration-200 selection:bg-ink selection:text-paper dark:selection:bg-darkInk dark:selection:text-darkPaper flex flex-col justify-between">
        
        {/* Main Sketchbook Body */}
        <main className="w-full flex-grow">
          {/* Graciano & Dribbble Inspired Hand-Drawn Hero */}
          <HandDrawnHero
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            onOpenNewEntryModal={() => setIsModalOpen(true)}
            onScrollToLedger={handleScrollToLedger}
          />

          {/* Continuous Editorial Journal Stream */}
          <DigitalBookLayout
            entries={entries}
            onOpenNewEntryModal={() => setIsModalOpen(true)}
          />

          {/* Hand-Drawn Scroll Back To Top */}
          <RetroStatusBar />
        </main>

        {/* Minimal Editorial Footer */}
        <footer className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 border-t border-ink/20 dark:border-darkInk/20 font-handwritten text-base sm:text-lg text-center text-ink/70 dark:text-darkInk/70">
          <p className="flex flex-wrap items-center justify-center gap-2">
            <span>thoughts 'n' feelings</span>
            <span className="opacity-40">&bull;</span>
            <span>an ink and paper sketchbook by</span>
            <a
              href="https://www.instagram.com/absurdnigga"
              target="_blank"
              rel="noreferrer"
              className="scribble-hover font-editorial italic underline decoration-1 underline-offset-4 text-ink dark:text-darkInk font-bold"
            >
              absurdharsh
            </a>
          </p>
          <p className="mt-2 text-sm opacity-50">
            pure binary ink on paper &bull; zero noise &bull; crafted with organic linework
          </p>
        </footer>

        {/* Hand-Drawn Thought Inscription Modal */}
        <HandDrawnThoughtModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveEntry={handleSaveEntry}
        />
      </div>
    </SmoothScrollProvider>
  );
}
