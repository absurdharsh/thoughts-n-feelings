import React, { useState, useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import JournalEntryCard from './JournalEntryCard';
import { sound } from '../utils/audio';

export default function DigitalBookLayout({ entries, onOpenNewEntryModal }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMarked, setOnlyMarked] = useState(false);

  const containerRef = useRef(null);

  // Filter logic
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesFilter =
        activeFilter === 'all' || entry.type === activeFilter;
      const matchesMarked = onlyMarked ? entry.starred : true;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesFilter && matchesMarked && matchesSearch;
    });
  }, [entries, activeFilter, searchQuery, onlyMarked]);

  // Group entries by chapter
  const groupedByChapter = useMemo(() => {
    const groups = {};
    filteredEntries.forEach((entry) => {
      const ch = entry.chapter || 'LIBER UNIVERSALIS';
      if (!groups[ch]) groups[ch] = [];
      groups[ch].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  // GSAP reveal animations for monumental chapter banners
  useEffect(() => {
    const headers = document.querySelectorAll('.chapter-banner');
    headers.forEach((header) => {
      gsap.fromTo(
        header,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }, [groupedByChapter]);

  const handleFilterChange = (filter) => {
    sound.playClick(1.15);
    setActiveFilter(filter);
  };

  return (
    <section id="digital-ledger" ref={containerRef} className="relative w-full max-w-4xl mx-auto px-4 py-8">
      {/* Monumental Stone Architrave / Top Header Slab */}
      <div className="stone-slab stone-grain p-5 mb-8 border border-[#2e2d29]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22211f] pb-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm text-[#73716b]">‡</span>
            <h2 className="font-display text-sm sm:text-base font-bold tracking-[0.25em] text-[#e5e0d8] uppercase carved-text">
              ARCHIVUM LAPIDARIS &bull; BASALT STRATA
            </h2>
          </div>
          <div className="font-mono text-[10px] text-[#73716b] tracking-widest flex items-center space-x-4 uppercase">
            <span>INSCRIPTIONS: {entries.length}</span>
            <span>&bull;</span>
            <span className="text-[#a39f96]">FILTERED: {filteredEntries.length}</span>
          </div>
        </div>

        {/* Filter Slabs & Search Trough */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Classification Slabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {[
              { id: 'all', label: `ALL STELES (${entries.length})` },
              { id: 'thought', label: `COGITATIO (${entries.filter(e => e.type === 'thought').length})` },
              { id: 'feeling', label: `SENTIENTIA (${entries.filter(e => e.type === 'feeling').length})` },
              { id: 'quote', label: `MONUMENTA (${entries.filter(e => e.type === 'quote').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`stone-btn px-3 py-1.5 text-[10px] sm:text-[11px] tracking-wider uppercase ${activeFilter === tab.id ? 'bg-[#262522] border-[#44423d] text-[#ffffff]' : 'text-[#858279]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Stone Inset */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH STONE GLYPHS..."
              className="w-full md:w-56 px-3 py-1.5 bg-[#0a0a09] border border-[#22211f] stone-inset text-[11px] font-mono text-[#d8d2c4] placeholder-[#5a5852] focus:outline-none focus:border-[#44423d] tracking-wider uppercase"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-[#73716b] hover:text-[#d8d2c4]"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters & Thought Folios */}
      <div className="space-y-12">
        {Object.entries(groupedByChapter).map(([chapterName, chapterEntries]) => (
          <div key={chapterName} className="relative">
            {/* Monumental Chapter Header Bar */}
            <div className="chapter-banner mb-6 p-4 bg-[#0e0e0d] border border-[#262522] stone-beveled select-none">
              <div className="flex items-center justify-between text-xs font-mono text-[#73716b] mb-1">
                <span className="tracking-[0.25em] text-[#a39f96] font-display text-[11px] uppercase">
                  {chapterName}
                </span>
                <span className="text-[10px] tracking-widest uppercase">
                  [{chapterEntries.length} {chapterEntries.length === 1 ? 'STELE' : 'STELES'}]
                </span>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-[#32312d] via-[#1a1a18] to-transparent" />
            </div>

            {/* Inscribed Folio Cards */}
            <div className="space-y-6">
              {chapterEntries.map((entry, idx) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  isInitiallyOpen={true}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="p-12 text-center stone-slab border border-[#262522]">
            <p className="font-display tracking-[0.2em] text-[#73716b] uppercase text-sm mb-4">
              NO STONE INSCRIPTIONS FOUND FOR THIS QUERY
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="stone-btn px-4 py-2 font-mono text-xs uppercase"
            >
              RESET STRATA FILTERS
            </button>
          </div>
        )}
      </div>

      {/* Bottom Stone Inscribe Invitation */}
      <div className="mt-14 p-8 text-center stone-slab stone-grain border border-[#2a2925]">
        <div className="font-mono text-xs text-[#73716b] tracking-widest uppercase mb-2">
          ‡ ADDENDUM AD CODICEM ‡
        </div>
        <h3 className="font-display text-lg sm:text-xl font-bold tracking-widest text-[#e5e0d8] carved-text uppercase mb-3">
          Leave Your Inscription Upon The Basalt
        </h3>
        <p className="font-serif italic text-sm text-[#94928b] max-w-lg mx-auto mb-6">
          “Words spoken into air vanish with the wind. Thoughts chiseled into stone endure past empires and monuments.”
        </p>
        <button
          type="button"
          onClick={() => {
            sound.playClick(1.2);
            onOpenNewEntryModal();
          }}
          className="stone-btn px-8 py-3 font-display tracking-[0.2em] text-xs uppercase text-[#ffffff]"
        >
          INSCRIBE NEW FOLIO ✍
        </button>
      </div>
    </section>
  );
}
