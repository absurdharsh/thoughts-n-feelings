import React, { useState } from 'react';
import {
  DoodleSpiral,
  DoodleSpark,
  DoodleArrowDown,
  DoodleHeart,
  DoodleDivider,
  DoodleEye,
  DoodleStar
} from './HandDrawnDoodles';

// Helper to render the appropriate margin doodle
function renderMarginDoodle(type) {
  const commonClasses = 'w-5 h-5 text-ink/70 dark:text-darkInk/70';
  switch (type) {
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
  assignedNumber,
  index,
  total,
  isOwner = false,
  onDeleteEntry,
  comments = [],
  onAddComment,
  onDeleteComment,
  hasLiked = false,
  likeCount = 0,
  onToggleLike,
  isCommentsOpen = false,
  onToggleComments,
  isDimmed = false
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
      if (window.confirm(`Delete entry "${entry.title}"?`)) {
        onDeleteEntry(entry.id);
      }
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (onAddComment) {
      onAddComment(commentText.trim());
    }
    setCommentText('');
  };

  // Shift-click deletion for anonymous comment (Owner only)
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
      style={{
        opacity: isDimmed ? 0.12 : 1,
        filter: isDimmed ? 'blur(2px)' : 'blur(0px)',
        pointerEvents: isDimmed ? 'none' : 'auto',
        transition: 'opacity 0.4s ease, filter 0.4s ease'
      }}
      className={`relative py-12 select-text first:pt-4 transition-all duration-400 ${
        isCommentsOpen ? 'z-30' : 'z-10'
      }`}
    >
      {/* Top Entry Metadata: Number + Category + Margin Doodle */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-editorial italic text-3xl sm:text-4xl text-ink/40 dark:text-darkInk/40">
            {assignedNumber || entry.number || String(index + 1).padStart(2, '0')}.
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

        <div className="flex items-center gap-2">
          {renderMarginDoodle(entry.doodle)}
          <span className="font-editorial italic text-sm sm:text-base text-ink/50 dark:text-darkInk/50">
            {entry.date}
          </span>
        </div>
      </div>

      {/* Main Entry Title */}
      <h3 className="font-editorial italic text-2xl sm:text-4xl text-ink dark:text-darkInk font-bold tracking-tight mb-6 leading-tight">
        {entry.title}
      </h3>

      {/* Multi-Paragraph Content with Editorial Whitespace */}
      <div className="font-body text-lg sm:text-xl text-ink dark:text-darkInk leading-relaxed space-y-5">
        {paragraphs.map((para, pIdx) => {
          // If Ishika quote note, style subtly as handwritten attribution
          if (para.includes('Ishika, a friend')) {
            return (
              <p
                key={pIdx}
                className="font-handwritten text-base sm:text-lg text-ink/60 dark:text-darkInk/60 italic pl-3 border-l-2 border-ink/20 dark:border-darkInk/20 my-4"
              >
                {para}
              </p>
            );
          }

          // If entry is a quote or stanza, render with indented margin
          if (entry.type === 'quote') {
            return (
              <blockquote
                key={pIdx}
                className="font-editorial italic text-xl sm:text-2xl text-ink/90 dark:text-darkInk/90 pl-4 border-l-2 border-ink dark:border-darkInk my-4 whitespace-pre-line"
              >
                {para}
              </blockquote>
            );
          }

          return (
            <p key={pIdx} className="break-words">
              {para}
            </p>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="mt-8 pt-4 flex flex-wrap items-center justify-between gap-y-2 font-handwritten text-base sm:text-lg">
        <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
          {/* Subtle Hand-Drawn Heart Like Trigger (Real-only likes, one per user) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike && onToggleLike();
            }}
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

          {/* Collapsible Comments Trigger: comments (N) ↓ */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComments && onToggleComments();
            }}
            className={`naked-link scribble-hover flex items-center gap-1.5 transition-colors select-none ${
              isCommentsOpen 
                ? 'text-ink dark:text-darkInk font-bold' 
                : 'text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk'
            }`}
            title={isCommentsOpen ? "Close comments" : "Open comments"}
          >
            <span>comments ({comments.length})</span>
            <span
              className={`inline-block transition-transform duration-300 transform ${
                isCommentsOpen ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <DoodleArrowDown className="w-3.5 h-3.5 inline text-ink dark:text-darkInk" />
            </span>
          </button>

          {/* Copy Thought Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="naked-link scribble-hover text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk"
            title="Copy this entry to clipboard"
          >
            {copied ? '✓ copied to clipboard!' : 'copy thought'}
          </button>
        </div>

        {/* Right Meta: Inscribed By Author beside Folio Text in the Same Handwritten Font */}
        <div className="flex items-center gap-2 sm:gap-3 text-ink/50 dark:text-darkInk/50 select-none">
          {entry.author && (
            <span className="text-ink/70 dark:text-darkInk/70">
              — {entry.author.replace(/^[-—]\s*/, '')}
            </span>
          )}
          {entry.author && <span className="opacity-30">&middot;</span>}
          <span className="text-ink/40 dark:text-darkInk/40">
            folio {index + 1} of {total}
          </span>
        </div>
      </div>

      {/* Collapsible Anonymous Comments Drawer */}
      {isCommentsOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-6 pt-5 border-t border-ink/15 dark:border-darkInk/15 font-handwritten transition-all duration-300"
        >
          {/* Render comments if any exist */}
          {comments && comments.length > 0 ? (
            <div className="space-y-2.5 mb-5">
              <div className="text-xs uppercase tracking-wider text-ink/40 dark:text-darkInk/40 select-none">
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
                      <span className="font-body text-ink dark:text-darkInk leading-snug break-words">
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
          ) : (
            <p className="text-ink/40 dark:text-darkInk/40 text-sm mb-4 italic">
              no notes inked yet. leave the first one below.
            </p>
          )}

          {/* Minimal Hand-Drawn Single Input */}
          <form onSubmit={handleCommentSubmit} className="mt-2 flex items-center gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="leave an anonymous note..."
              className="flex-grow bg-transparent border-b border-ink/20 dark:border-darkInk/20 focus:border-ink dark:focus:border-darkInk outline-none font-handwritten text-base sm:text-lg text-ink dark:text-darkInk placeholder:text-ink/40 dark:placeholder:text-darkInk/40 py-1 transition-colors"
              autoFocus
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
      )}

      {/* Hand-drawn divider between thoughts */}
      <DoodleDivider className="mt-14 text-ink/20 dark:text-darkInk/20" />
    </article>
  );
}
