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
  onDeleteComment,
  likesData = {},
  voterId = '',
  onToggleLike
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'popular'

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
          const item = likesData && likesData[id];
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
    <section id="digital-ledger" className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Category Filter & Feed Controls (Sort & Search) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-ink/20 dark:border-darkInk/20 font-handwritten">
        
        {/* Naked Category Links with Hand-Drawn Circle on Active */}
        <div className="flex items-center gap-6 sm:gap-8 text-lg sm:text-xl">
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
              placeholder="keywords..."
              className="bg-transparent text-ink dark:text-darkInk placeholder:text-ink/40 dark:placeholder:text-darkInk/40 outline-none w-28 sm:w-36 font-handwritten text-base"
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
            const entryLikes = (likesData && likesData[entry.id]) || [];
            const voterList = Array.isArray(entryLikes)
              ? entryLikes
              : (entryLikes && entryLikes.likedBy ? entryLikes.likedBy : []);
            const hasLiked = Boolean(voterId && voterList.includes(voterId));
            const likeCount = voterList.length;

            return (
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
                hasLiked={hasLiked}
                likeCount={likeCount}
                onToggleLike={() => onToggleLike && onToggleLike(entry.id)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
