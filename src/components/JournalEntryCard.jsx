import React, { useState } from 'react';
import {
  DoodleEye,
  DoodleStar,
  DoodleSpiral,
  DoodleSpark,
  DoodleArrowDown,
  DoodleHeart,
  DoodleDivider
} from './HandDrawnDoodles';

// Map doodle keys to authentic hand-drawn SVG components
function renderDoodleIcon(doodleType) {
  const commonClasses = "w-7 h-7 sm:w-8 sm:h-8 text-ink dark:text-darkInk opacity-80";
  switch (doodleType) {
    case 'star':
      return <DoodleStar className={commonClasses} />;
    case 'spiral':
      return <DoodleSpiral className={commonClasses} />;
    case 'eye':
      return <DoodleEye className={commonClasses} />;
    case 'spark':
      return <DoodleSpark className={commonClasses} />;
    case 'wind':
    case 'arrow':
    default:
      return <DoodleArrowDown className={commonClasses} />;
  }
}

export default function JournalEntryCard({
  entry,
  index,
  total,
  isOwner = false,
  onDeleteEntry,
  comments = [],
  onAddComment,
  onDeleteComment,
  hasLiked = false,
  likeCount = 0,
  onToggleLike
}) {
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleCopy = () => {
    const textToCopy = `“${entry.title}”\n\n${entry.content}\n\n— ${entry.author} (${entry.date})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Shift-click deletion for thought entry (Owner only)
  const handleArticleClick = (e) => {
    if (isOwner && e.shiftKey && onDeleteEntry) {
      e.preventDefault();
      e.stopPropagation();
      const confirmed = window.confirm(`Delete entry "${entry.title}"?`);
      if (confirmed) {
        onDeleteEntry(entry.id);
      }
    }
  };

  // Add anonymous comment
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  // Shift-click deletion for individual anonymous comment (Owner only)
  const handleCommentShiftClick = (e, commentId, text) => {
    if (isOwner && e.shiftKey && onDeleteComment) {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm(`Delete comment "${text}"?`)) {
        onDeleteComment(commentId);
      }
    }
  };

  // Split multi-paragraph content cleanly
  const paragraphs = entry.content.split('\n\n').filter(Boolean);

  return (
    <article 
      onClick={handleArticleClick}
      className="relative py-12 select-text first:pt-4"
    >
      {/* Top Entry Metadata: Number + Category + Margin Doodle */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-editorial italic text-3xl sm:text-4xl text-ink/40 dark:text-darkInk/40">
            {entry.number || String(index + 1).padStart(2, '0')}.
          </span>
          <span className="font-handwritten text-base sm:text-lg uppercase tracking-wider text-ink/60 dark:text-darkInk/60">
            {entry.type}
          </span>
          {isOwner && onDeleteEntry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete entry "${entry.title}"?`)) {
                  onDeleteEntry(entry.id);
                }
              }}
              className="text-xs opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity ml-1 cursor-pointer select-none"
              title="Delete this entry (Owner only)"
            >
              [x]
            </button>
          )}
        </div>

        {/* Playful margin doodle */}
        <div className="transform hover:rotate-12 transition-transform duration-200">
          {renderDoodleIcon(entry.doodle)}
        </div>
      </div>

      {/* Entry Title */}
      <h2 className="font-editorial italic text-3xl sm:text-5xl text-ink dark:text-darkInk leading-tight mb-3">
        {entry.title}
      </h2>

      {/* Author and Date Attribution */}
      <div className="font-handwritten text-base sm:text-lg text-ink/70 dark:text-darkInk/70 mb-8 flex items-center gap-2">
        <span>by {entry.author}</span>
        <span>&bull;</span>
        <span>{entry.date}</span>
      </div>

      {/* Body Paragraphs with Natural Kerning (Zero Drop-Cap Split Gap) */}
      <div className="space-y-6 max-w-2xl">
        {paragraphs.map((pText, pIdx) => {
          // Check if paragraph is a quote (starts with quote marks)
          const isQuote = pText.trim().startsWith('“') || pText.trim().startsWith('"');
          return (
            <p
              key={pIdx}
              className={`font-body text-xl sm:text-2xl leading-[1.85] text-ink dark:text-darkInk ${
                isQuote ? 'font-editorial italic text-2xl sm:text-3xl text-ink/90 dark:text-darkInk/90 pl-3 border-l-2 border-ink/40 dark:border-darkInk/40' : ''
              }`}
            >
              {pText}
            </p>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-8 pt-4 flex items-center justify-between font-handwritten text-base sm:text-lg">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Subtle Hand-Drawn Heart Like Trigger (Real-only likes, one per user) */}
          <button
            type="button"
            onClick={onToggleLike}
            className={`naked-link scribble-hover flex items-center gap-1.5 transition-transform active:scale-90 ${
              hasLiked 
                ? 'text-ink dark:text-darkInk font-bold' 
                : 'text-ink/60 dark:text-darkInk/60 hover:text-ink dark:hover:text-darkInk'
            }`}
            title={hasLiked ? "Unlike this thought" : "Like this thought"}
          >
            <DoodleHeart 
              className={`w-5 h-5 transition-transform ${hasLiked ? 'scale-110' : ''}`} 
              filled={hasLiked} 
            />
            <span className="text-base select-none">{likeCount}</span>
          </button>

          {/* Copy Thought Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="naked-link scribble-hover text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk"
            title="Copy this entry to clipboard"
          >
            {copied ? '✓ copied to clipboard!' : 'copy thought'}
          </button>
        </div>

        <span className="text-ink/40 dark:text-darkInk/40">
          folio {index + 1} of {total}
        </span>
      </div>

      {/* Anonymous Comments Section (Preserves hand-drawn sketchbook aesthetic) */}
      <div className="mt-6 pt-4 border-t border-ink/10 dark:border-darkInk/10 font-handwritten">
        {/* Render comments if any exist */}
        {comments && comments.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs uppercase tracking-wider text-ink/40 dark:text-darkInk/40">
              anonymous notes ({comments.length})
            </div>
            <div className="space-y-2">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  onClick={(e) => handleCommentShiftClick(e, comment.id, comment.text)}
                  className="flex items-baseline justify-between gap-3 text-base sm:text-lg group"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-editorial italic text-sm text-ink/50 dark:text-darkInk/50 flex-shrink-0 select-none">
                      anonymous:
                    </span>
                    <span className="font-body text-ink dark:text-darkInk leading-snug">
                      {comment.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink/40 dark:text-darkInk/40 flex-shrink-0 select-none">
                    <span>{comment.timestamp}</span>
                    {isOwner && onDeleteComment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete comment "${comment.text}"?`)) {
                            onDeleteComment(comment.id);
                          }
                        }}
                        className="opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity ml-1 cursor-pointer select-none text-[11px]"
                        title="Delete this comment (Owner only)"
                      >
                        [x]
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minimal Hand-Drawn Single Input (No Name field, Submit on Enter or button) */}
        <form onSubmit={handleCommentSubmit} className="mt-3 flex items-center gap-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="leave an anonymous note..."
            className="flex-grow bg-transparent border-b border-ink/20 dark:border-darkInk/20 focus:border-ink dark:focus:border-darkInk outline-none font-handwritten text-base sm:text-lg text-ink dark:text-darkInk placeholder:text-ink/40 dark:placeholder:text-darkInk/40 py-1 transition-colors"
          />
          <button
            type="submit"
            className="naked-link scribble-hover font-handwritten text-base text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk flex-shrink-0"
            title="Leave anonymous note"
          >
            drop note →
          </button>
        </form>
      </div>

      {/* Hand-drawn divider between thoughts */}
      <DoodleDivider className="mt-14 text-ink/20 dark:text-darkInk/20" />
    </article>
  );
}
