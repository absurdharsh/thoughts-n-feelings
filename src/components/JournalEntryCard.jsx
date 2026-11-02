import React, { useState } from 'react';
import {
  DoodleEye,
  DoodleStar,
  DoodleSpiral,
  DoodleSpark,
  DoodleArrowDown,
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

export default function JournalEntryCard({ entry, index, total }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `“${entry.title}”\n\n${entry.content}\n\n— ${entry.author} (${entry.date})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split multi-paragraph content cleanly
  const paragraphs = entry.content.split('\n\n').filter(Boolean);

  return (
    <article className="relative py-12 select-text first:pt-4">
      {/* Top Entry Metadata: Number + Category + Margin Doodle */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-editorial italic text-3xl sm:text-4xl text-ink/40 dark:text-darkInk/40">
            {entry.number || String(index + 1).padStart(2, '0')}.
          </span>
          <span className="font-handwritten text-base sm:text-lg uppercase tracking-wider text-ink/60 dark:text-darkInk/60">
            {entry.type}
          </span>
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
        <button
          type="button"
          onClick={handleCopy}
          className="naked-link scribble-hover text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk"
          title="Copy this entry to clipboard"
        >
          {copied ? '✓ copied to clipboard!' : 'copy thought'}
        </button>

        <span className="text-ink/40 dark:text-darkInk/40">
          folio {index + 1} of {total}
        </span>
      </div>

      {/* Hand-drawn divider between thoughts */}
      <DoodleDivider className="mt-14 text-ink/20 dark:text-darkInk/20" />
    </article>
  );
}
