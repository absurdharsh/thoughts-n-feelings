import React, { useState, useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Filter, Search, Bookmark, Sparkles, SlidersHorizontal, BookOpen } from 'lucide-react';
import JournalEntryCard from './JournalEntryCard';
import { sound } from '../utils/audio';

export default function DigitalBookLayout({ entries, onOpenNewEntryModal }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const containerRef = useRef(null);

  // Filter logic
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesFilter =
        activeFilter === 'all' || entry.type === activeFilter;
      const matchesFavorites = onlyFavorites ? entry.starred : true;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesFilter && matchesFavorites && matchesSearch;
    });
  }, [entries, activeFilter, searchQuery, onlyFavorites]);

  // Group entries by chapter
  const groupedByChapter = useMemo(() => {
    const groups = {};
    filteredEntries.forEach((entry) => {
      const ch = entry.chapter || 'UNCLASSIFIED REFLECTIONS';
      if (!groups[ch]) groups[ch] = [];
      groups[ch].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  // GSAP reveal animations for chapter headers
  useEffect(() => {
    const headers = document.querySelectorAll('.chapter-banner');
    headers.forEach((header) => {
      gsap.fromTo(
        header,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }, [groupedByChapter]);

  const handleFilterChange = (filter) => {
    sound.playClick(1.1);
    setActiveFilter(filter);
  };

  return (
    <section id="digital-ledger" ref={containerRef} className="relative w-full max-w-5xl mx-auto px-3 sm:px-6 py-12">
      {/* Book Binding Top Spine Bar */}
      <div className="relative mb-10 p-4 rounded-t-xl bg-[#12151c]/90 border-t-2 border-x-2 border-[#c5a059]/40 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-[#c5a059]" />
            <span className="font-serif text-lg font-bold text-[#e5d7ba] tracking-wider uppercase">
              The Digital Codex & Folio
            </span>
          </div>
          <div className="font-mono text-xs text-zinc-400 flex items-center space-x-4">
            <span>BINDING: CONTINUOUS PARCHMENT</span>
            <span className="text-[#c5a059]">FOLIOS: {entries.length}</span>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {[
              { id: 'all', label: `ALL (${entries.length})` },
              { id: 'thought', label: `THOUGHTS (${entries.filter(e => e.type === 'thought').length})` },
              { id: 'feeling', label: `FEELINGS (${entries.filter(e => e.type === 'feeling').length})` },
              { id: 'quote', label: `QUOTES (${entries.filter(e => e.type === 'quote').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded transition-all duration-200 ${
                  activeFilter === tab.id
                    ? 'bg-[#c5a059] text-black font-bold shadow-md'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                [{tab.label}]
              </button>
            ))}

            <button
              onClick={() => {
                sound.playClick(1.3);
                setOnlyFavorites(!onlyFavorites);
              }}
              className={`px-3 py-1.5 rounded transition-all duration-200 flex items-center space-x-1 border ${
                onlyFavorites
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
              <span>STARRED</span>
            </button>
          </div>

          {/* Retro Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query thoughts, quotes, or tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-black/60 border border-zinc-800 focus:border-[#c5a059] focus:outline-none text-xs font-mono text-zinc-200 placeholder-zinc-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Parchment Infinite Stream Canvas Container */}
      <div className="relative border-x-2 border-b-2 border-[#c5a059]/30 rounded-b-xl bg-[#090b0f]/80 backdrop-blur-md px-3 sm:px-8 py-6 shadow-2xl">
        {/* Continuous Book Spine Visual Marker on the Left */}
        <div className="absolute left-2 sm:left-4 top-0 bottom-0 w-px bg-dashed border-l border-zinc-800/80 pointer-events-none" />

        {/* Empty state if search has no results */}
        {filteredEntries.length === 0 && (
          <div className="py-20 text-center font-mono">
            <div className="text-zinc-600 text-4xl mb-3">¯\_(ツ)_/¯</div>
            <p className="text-zinc-400 text-sm">NO INSCRIBED THOUGHTS MATCH YOUR QUERY.</p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
                setOnlyFavorites(false);
              }}
              className="mt-4 px-4 py-2 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 font-mono transition-colors"
            >
              RESET FILTERS
            </button>
          </div>
        )}

        {/* Chapter Stream */}
        {Object.entries(groupedByChapter).map(([chapterTitle, chapterEntries], chapterIndex) => (
          <div key={chapterTitle} className="mb-14 last:mb-4">
            {/* Chapter Header Banner with ASCII styling */}
            <div className="chapter-banner my-6 select-none">
              <div className="flex items-center space-x-3 text-zinc-600 font-mono text-xs">
                <span>+======================================================+</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <h2 className="font-mono text-sm sm:text-base font-bold text-[#c5a059] tracking-wider uppercase flex items-center space-x-2">
                  <span className="text-zinc-600">&gt;&gt;</span>
                  <span>{chapterTitle}</span>
                </h2>
                <span className="font-mono text-xs text-zinc-500">
                  {chapterEntries.length} {chapterEntries.length === 1 ? 'FOLIO' : 'FOLIOS'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-zinc-600 font-mono text-xs">
                <span>+======================================================+</span>
              </div>
            </div>

            {/* List of Entries in this Chapter */}
            <div className="space-y-6">
              {chapterEntries.map((entry, idx) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  isInitiallyOpen={idx === 0 || chapterIndex === 0}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Infinite Scroll End of Parchment Marker */}
        <div className="pt-10 pb-6 text-center select-none font-mono text-xs text-zinc-500 border-t border-zinc-800/80">
          <div className="text-[#c5a059] mb-2 tracking-widest">[ END OF CURRENT PARCHMENT ROLL ]</div>
          <p className="text-zinc-600 text-[11px] mb-4">
            Consciousness is unbounded. You may add your own thoughts to the local ledger.
          </p>
          <button
            onClick={() => {
              sound.playClick(1.2);
              onOpenNewEntryModal();
            }}
            className="px-5 py-2.5 rounded bg-[#c5a059]/15 hover:bg-[#c5a059]/25 border border-[#c5a059]/50 text-[#e5d7ba] font-mono text-xs tracking-wider transition-all duration-200"
          >
            + INSCRIBE YOUR OWN THOUGHT
          </button>
        </div>
      </div>
    </section>
  );
}

