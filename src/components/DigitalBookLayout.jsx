import React, { useState, useMemo, useEffect } from 'react';
import JournalEntryCard from './JournalEntryCard';
import { DoodleUnderline } from './HandDrawnDoodles';
import { getCommentsForEntry } from '../utils/commentUtils';

export default function DigitalBookLayout({
  entries,
  onOpenNewEntryModal,
  isOwner = false,
  onDeleteEntry,
  onUpdateEntry,
  comments = {},
  onAddComment,
  onDeleteComment,
  likesData = {},
  voterId = '',
  onToggleLike,
  onOpenComments
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'popular'

  // Focus Mode & Collapsible Comments: Only one thought's comment drawer open at a time
  const [activeCommentEntryId, setActiveCommentEntryId] = useState(null);

  // Pressing Escape smoothly closes the comment drawer and restores focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && activeCommentEntryId) {
        setActiveCommentEntryId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCommentEntryId]);

  // Toggle comments and fetch latest remote comments upon opening
  const handleToggleComments = (entryId) => {
    setActiveCommentEntryId((prev) => {
      const isOpening = prev !== entryId;
      const nextId = isOpening ? entryId : null;
      if (isOpening && onOpenComments) {
        onOpenComments(entryId);
      }
      return nextId;
    });
  };

  // Canonical chronological numbering based on contribution recency:
  // The earliest contribution is #01, the next is #02, ..., and the most recent contribution gets the next number available (#10, #11, etc.).
  const entryNumberMap = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const timeA = typeof a.createdAt === 'number'
        ? a.createdAt
        : (a.id && String(a.id).startsWith('entry-') ? parseInt(String(a.id).replace('entry-', ''), 10) || 0 : 0);
      const timeB = typeof b.createdAt === 'number'
        ? b.createdAt
        : (b.id && String(b.id).startsWith('entry-') ? parseInt(String(b.id).replace('entry-', ''), 10) || 0 : 0);
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });

    const map = new Map();
    sorted.forEach((entry, idx) => {
      map.set(String(entry.id), String(idx + 1).padStart(2, '0'));
    });
    return map;
  }, [entries]);

  // Dynamic sorting (Newest, Oldest, or Most Popular) and category/search filtering
  const filteredEntries = useMemo(() => {
    const list = [...entries];

    list.sort((a, b) => {
      const timeA = a.createdAt || (a.id && a.id.startsWith('entry-') ? parseInt(a.id.replace('entry-', ''), 10) || 0 : 0);
      const timeB = b.createdAt || (b.id && b.id.startsWith('entry-') ? parseInt(b.id.replace('entry-', ''), 10) || 0 : 0);

      if (sortBy === 'oldest') {
        return timeA - timeB; // Oldest first
      }

      if (sortBy === 'popular') {
        const getLikeCount = (id) => {
          const targetId = String(id || '');
          const item = likesData && (likesData[targetId] || likesData[id]);
          if (Array.isArray(item)) return item.length;
          if (item && typeof item === 'object') return item.count || (item.likedBy ? item.likedBy.length : 0);
          return 0;
        };

        const countA = getLikeCount(a.id);
        const countB = getLikeCount(b.id);
        if (countB !== countA) {
          return countB - countA; // Higher likes first
        }
        return timeB - timeA; // Tie-breaker: newest first
      }

      // Default: 'newest' (most recent first)
      return timeB - timeA;
    });

    return list.filter((entry) => {
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
  }, [entries, activeFilter, searchQuery, sortBy, likesData]);

  const categories = [
    { id: 'all', label: 'all' },
    { id: 'thought', label: 'thoughts' },
    { id: 'feeling', label: 'feelings' },
    { id: 'quote', label: 'quotes' },
  ];

  return (
    <section id="digital-ledger" className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Click-outside backdrop for Focus Mode: smoothly closes comment box on click outside */}
      {activeCommentEntryId && (
        <div 
          className="fixed inset-0 z-20 cursor-pointer"
          onClick={() => setActiveCommentEntryId(null)}
          aria-hidden="true"
        />
      )}

      {/* Editorial Navigation: Hand-Drawn Category Selector & Search */}
      <div 
        style={{
          opacity: activeCommentEntryId ? 0.2 : 1,
          pointerEvents: activeCommentEntryId ? 'none' : 'auto',
          transition: 'opacity 0.4s ease'
        }}
        className="flex flex-col md:flex-row items-baseline justify-between gap-6 pb-6 border-b border-ink/20 dark:border-darkInk/20 font-handwritten text-lg sm:text-xl"
      >
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
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

                {/* Tasteful Hand-Drawn Ink Underline below active link (never clashes with text) */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-2 pointer-events-none text-ink dark:text-darkInk transition-opacity duration-200">
                    <DoodleUnderline className="w-full h-full" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls: Minimal Hand-Drawn Sort Selector & Search */}
        <div className="flex items-center gap-5 sm:gap-6 flex-wrap w-full md:w-auto justify-between md:justify-end">
          
          {/* Minimal Hand-Drawn Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-base sm:text-lg">
            <span className="opacity-50 select-none">sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-ink dark:text-darkInk border-b border-ink/30 dark:border-darkInk/30 focus:border-ink dark:focus:border-darkInk outline-none font-handwritten text-base sm:text-lg cursor-pointer py-0.5 select-none transition-colors"
            >
              <option value="newest" className="bg-paper dark:bg-darkPaper text-ink dark:text-darkInk">newest</option>
              <option value="oldest" className="bg-paper dark:bg-darkPaper text-ink dark:text-darkInk">oldest</option>
              <option value="popular" className="bg-paper dark:bg-darkPaper text-ink dark:text-darkInk">most popular</option>
            </select>
          </div>

          {/* Minimal Naked Search Input */}
          <div className="flex items-center gap-2 text-base border-b border-ink/30 dark:border-darkInk/30 pb-0.5 focus-within:border-ink dark:focus-within:border-darkInk">
            <span className="opacity-50 select-none">search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="find words..."
              className="bg-transparent outline-none font-handwritten text-base w-24 sm:w-32 text-ink dark:text-darkInk placeholder:text-ink/40 dark:placeholder:text-darkInk/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="opacity-50 hover:opacity-100 text-xs px-1 select-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stream of Sketchbook Entries */}
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
          filteredEntries.map((entry, index) => {
            const entryIdStr = String(entry.id);
            const entryLikes = (likesData && (likesData[entryIdStr] || likesData[entry.id])) || [];
            const voterList = Array.isArray(entryLikes)
              ? entryLikes
              : (entryLikes && entryLikes.likedBy ? entryLikes.likedBy : []);
            const hasLiked = Boolean(voterId && voterList.includes(voterId));
            const likeCount = voterList.length;

            const entryComments = getCommentsForEntry(comments, entry);
            const isCommentsOpen = activeCommentEntryId === entry.id;
            const isDimmed = Boolean(activeCommentEntryId && activeCommentEntryId !== entry.id);
            const assignedNumber = entryNumberMap.get(String(entry.id)) || entry.number || String(index + 1).padStart(2, '0');

            return (
              <JournalEntryCard
                key={entry.id || index}
                entry={entry}
                assignedNumber={assignedNumber}
                index={index}
                total={filteredEntries.length}
                isOwner={isOwner}
                onDeleteEntry={onDeleteEntry}
                onUpdateEntry={onUpdateEntry}
                comments={entryComments}
                onAddComment={(text) => onAddComment && onAddComment(entry.id, text)}
                onDeleteComment={(commentId) => onDeleteComment && onDeleteComment(entry.id, commentId)}
                hasLiked={hasLiked}
                likeCount={likeCount}
                onToggleLike={() => onToggleLike && onToggleLike(entry.id)}
                isCommentsOpen={isCommentsOpen}
                onToggleComments={() => handleToggleComments(entry.id)}
                isDimmed={isDimmed}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
