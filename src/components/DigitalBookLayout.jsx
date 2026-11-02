import React, { useState, useMemo } from 'react';
import JournalEntryCard from './JournalEntryCard';
import { DoodleCircle } from './HandDrawnDoodles';

export default function DigitalBookLayout({
  entries,
  onOpenNewEntryModal,
  isOwner = false,
  onDeleteEntry,
  comments = {},
  onAddComment,
  onDeleteComment
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort descending by creation timestamp / ID so most recent appears first
  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
      const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);
      return timeB - timeA;
    });

    return sorted.filter((entry) => {
      const matchesFilter =
        activeFilter === 'all' || entry.type === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [entries, activeFilter, searchQuery]);

  const categories = [
    { id: 'all', label: 'all' },
    { id: 'thought', label: 'thoughts' },
    { id: 'feeling', label: 'feelings' },
    { id: 'quote', label: 'quotes' },
  ];

  return (
    <section id="digital-ledger" className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-ink/20 dark:border-darkInk/20">
        {/* Naked Category Links with Hand-Drawn Circle on Active */}
        <div className="flex items-center gap-6 sm:gap-8 font-handwritten text-lg sm:text-xl">
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            const count = cat.id === 'all' 
              ? entries.length 
              : entries.filter((e) => e.type === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveFilter(cat.id)}
                className="naked-link relative py-1 group select-none"
              >
                <span className={`transition-opacity duration-200 ${isActive ? 'opacity-100 font-bold' : 'opacity-60 group-hover:opacity-90'}`}>
                  {cat.label} ({count})
                </span>

                {/* Hand-Drawn Wobbly Circle around active link */}
                {isActive && (
                  <div className="absolute -inset-x-2 -inset-y-1 pointer-events-none opacity-90 text-ink dark:text-darkInk">
                    <DoodleCircle className="w-full h-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Minimal Naked Search Input */}
        <div className="w-full sm:w-auto flex items-center gap-2 font-handwritten text-base border-b border-ink/30 dark:border-darkInk/30 pb-0.5 focus-within:border-ink dark:focus-within:border-darkInk">
          <span className="opacity-50">search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="keywords..."
            className="bg-transparent text-ink dark:text-darkInk placeholder:text-ink/40 dark:placeholder:text-darkInk/40 outline-none w-32 sm:w-40 font-handwritten text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="opacity-50 hover:opacity-100 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stream of Sketchbook Entries (Most Recent First) */}
      <div className="mt-4">
        {filteredEntries.length === 0 ? (
          <div className="py-20 text-center font-handwritten text-2xl text-ink/50 dark:text-darkInk/50">
            <p>no scribbles found in this folder.</p>
            <button
              type="button"
              onClick={onOpenNewEntryModal}
              className="naked-link scribble-hover mt-4 text-lg text-ink dark:text-darkInk font-editorial italic underline"
            >
              ink a new thought?
            </button>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <JournalEntryCard
              key={entry.id || index}
              entry={entry}
              index={index}
              total={filteredEntries.length}
              isOwner={isOwner}
              onDeleteEntry={onDeleteEntry}
              comments={comments[entry.id] || []}
              onAddComment={(text) => onAddComment && onAddComment(entry.id, text)}
              onDeleteComment={(commentId) => onDeleteComment && onDeleteComment(entry.id, commentId)}
            />
          ))
        )}
      </div>
    </section>
  );
}
