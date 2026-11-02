import React, { useState, useMemo } from 'react';
import JournalEntryCard from './JournalEntryCard';
import GreekMeanderDivider from './GreekMeanderDivider';
import { sound } from '../utils/audio';

export default function DigitalBookLayout({ entries, onOpenNewEntryModal }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesFilter =
        activeFilter === 'all' || entry.type === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesFilter && matchesSearch;
    });
  }, [entries, activeFilter, searchQuery]);

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

  const handleFilterChange = (filter) => {
    sound.playClick(1.15);
    setActiveFilter(filter);
  };

  return (
    <section id="digital-ledger" className="relative w-full max-w-3xl mx-auto px-4 sm:px-8 py-8">
      {/* Stratum Filter Bar (Recessed Stone Inlays, No Boxy Cards) */}
      <div className="border-b border-[#36373b]/60 pb-6 mb-10 select-none">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          {/* Classification Inlays */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: `ALL (${entries.length})` },
              { id: 'thought', label: `COGITATIO (${entries.filter(e => e.type === 'thought').length})` },
              { id: 'feeling', label: `SENTIENTIA (${entries.filter(e => e.type === 'feeling').length})` },
              { id: 'quote', label: `MONUMENTA (${entries.filter(e => e.type === 'quote').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id)}
                className={`stone-inlay-btn px-3 py-1.5 ${activeFilter === tab.id ? 'bg-[#2b2c31] text-[#ffffff] border-[#4f515a]' : 'text-[#8c867a]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Trough */}
          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH STONE GLYPHS..."
              className="w-full sm:w-48 px-3 py-1.5 bg-[#17181a] border border-[#36373b] stone-inset text-[11px] font-mono text-[#d8d2c4] placeholder-[#5a5852] focus:outline-none focus:border-[#6a6344] tracking-wider uppercase"
            />
          </div>
        </div>
      </div>

      {/* Continuous Strata of Inscriptions (No Boxy Cards) */}
      <div className="space-y-14">
        {Object.entries(groupedByChapter).map(([chapterName, chapterEntries]) => (
          <div key={chapterName} className="relative">
            {/* Monumental Chapter Heading */}
            <div className="text-center my-8 select-none">
              <div className="flex items-center justify-center space-x-3 text-xs font-mono text-[#8c867a] tracking-[0.25em] uppercase mb-2">
                <span>─── ❖ ───</span>
              </div>
              <h2 className="antique-subhead text-lg sm:text-xl font-bold tracking-[0.16em] uppercase text-[#e4e2dd]">
                {chapterName}
              </h2>
              <div className="flex items-center justify-center space-x-3 text-[10px] font-mono text-[#736f66] tracking-[0.3em] uppercase mt-1">
                <span>[{chapterEntries.length} {chapterEntries.length === 1 ? 'INSCRIPTION' : 'INSCRIPTIONS'}]</span>
              </div>
            </div>

            {/* Inscriptions flowing continuously */}
            <div>
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
          <div className="py-16 text-center select-none font-mono text-xs text-[#8c867a]">
            <p className="tracking-widest uppercase mb-4">
              [ NO STONE INSCRIPTIONS FOUND FOR THIS QUERY ]
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="stone-inlay-btn px-4 py-2"
            >
              RESET FILTERS
            </button>
          </div>
        )}
      </div>

      {/* Archaeological Addendum Invitation */}
      <div className="mt-16 pt-12 text-center select-none border-t border-[#36373b]/60">
        <div className="font-mono text-[10px] text-[#8c867a] tracking-[0.3em] uppercase mb-3">
          ‡ ADDENDUM AD CODICEM ‡
        </div>
        <h3 className="antique-title text-xl sm:text-2xl font-bold tracking-[0.14em] uppercase text-[#e4e2dd] mb-3">
          Leave Your Inscription Upon The Basalt
        </h3>
        <p className="font-serif italic text-sm text-[#8c867a] max-w-md mx-auto mb-6">
          “Words spoken into air vanish with the wind. Thoughts chiseled into stone endure past empires and monuments.”
        </p>
        <button
          type="button"
          onClick={() => {
            sound.playClick(1.2);
            onOpenNewEntryModal();
          }}
          className="stone-inlay-btn px-8 py-3 text-xs tracking-[0.2em] text-[#ffffff] bg-[#2a2b30] border-[#4e5059]"
        >
          INSCRIBE NEW FOLIO ‡
        </button>
      </div>
    </section>
  );
}
