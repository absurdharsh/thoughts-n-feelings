import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import GreekMeanderDivider from './GreekMeanderDivider';
import { sound } from '../utils/audio';

export default function JournalEntryCard({ entry, index, isInitiallyOpen = true }) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [copied, setCopied] = useState(false);

  const contentRef = useRef(null);
  const titleRef = useRef(null);

  // GSAP slow stone unfolding
  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      gsap.to(contentRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      });
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      });
    }
  }, [isOpen]);

  const toggleFold = () => {
    sound.playFold();
    setIsOpen(!isOpen);
  };

  const handleCopy = () => {
    sound.playClick(1.4);
    const textToCopy = `[ ${entry.title.toUpperCase()} ]\n${entry.epigraph ? `(${entry.epigraph})\n\n` : ''}${entry.content}\n\n— Inscribed by ${entry.author} [${entry.date}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <article className="relative py-8 select-text">
      {/* Epigraphic Heading Band (Directly on stone, no boxy card border) */}
      <header 
        onClick={toggleFold}
        className="cursor-pointer select-none text-center pb-4"
      >
        {/* Roman Stratum Marker */}
        <div className="flex items-center justify-center space-x-3 text-[10px] font-mono text-[#8c867a] tracking-[0.25em] uppercase mb-3">
          <span>◈</span>
          <span>{entry.chapterRoman || 'STELE'}</span>
          <span>&bull;</span>
          <span>{entry.date}</span>
          <span>◈</span>
        </div>

        {/* Chiseled Antique Title */}
        <h3
          ref={titleRef}
          className="antique-subhead text-2xl sm:text-3xl font-bold tracking-[0.14em] uppercase text-[#e4e2dd] leading-snug hover:text-[#ffffff] transition-colors"
        >
          {entry.title}
        </h3>

        {/* Latin Epigraph */}
        {entry.epigraph && (
          <p className="mt-2 font-serif italic text-xs tracking-[0.2em] text-[#9c9679] uppercase">
            — {entry.epigraph} —
          </p>
        )}

        {/* Collapsed Snippet */}
        {!isOpen && (
          <p className="mt-3 font-serif text-[#8c867a] italic text-sm line-clamp-1 max-w-prose mx-auto">
            “{entry.snippet}”
          </p>
        )}
      </header>

      {/* Unsealed Stele Body */}
      <div ref={contentRef} className="overflow-hidden">
        {/* Classical Reading Measure (60ch–65ch) */}
        <div className="py-6 max-w-prose mx-auto space-y-6 font-serif text-base sm:text-lg leading-[1.95] text-[#d8d2c4] carved-text text-justify sm:text-left">
          {entry.content.split('\n\n').map((para, i) => (
            <p key={i} className="first-letter:text-2xl sm:first-letter:text-3xl first-letter:font-antique first-letter:float-left first-letter:mr-2.5 first-letter:text-[#e4e2dd] first-letter:leading-none">
              {para}
            </p>
          ))}
        </div>

        {/* Carved Geometric Schematic / Architectural ASCII Diagram */}
        {entry.asciiArt && (
          <div className="my-8 max-w-xl mx-auto p-4 bg-[#1a1b1d] border-y border-[#36373b] stone-inset overflow-x-auto text-center">
            <pre className="font-mono text-[10px] sm:text-[11px] text-[#8c867a] leading-tight select-none inline-block text-left">
              {entry.asciiArt.trim()}
            </pre>
          </div>
        )}

        {/* Classical Attribution & Stone Tags */}
        <div className="max-w-prose mx-auto pt-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#8c867a] border-t border-[#36373b]/40">
          <div className="flex flex-wrap items-center gap-2">
            {entry.tags && entry.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="text-[10px] tracking-wider uppercase text-[#736f66]"
              >
                § {tag}
              </span>
            ))}
          </div>

          <div className="text-[11px] font-serif text-[#8c867a] italic">
            Inscribed by <span className="font-mono text-[#d8d2c4] not-italic uppercase tracking-wider">{entry.author}</span>
          </div>
        </div>

        {/* Recessed Archaeological Actions (No Likes, No Upvotes) */}
        <div className="max-w-prose mx-auto mt-5 flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={handleCopy}
            className="stone-inlay-btn px-4 py-1.5 text-[11px]"
            title="Transcribe inscription to clipboard"
          >
            <span>{copied ? '✓ TRANSCRIBED' : 'TRANSCRIBE INSCULPTURA ‡'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFold}
            className="stone-inlay-btn px-3 py-1.5 text-[10px] text-[#8c867a]"
          >
            <span>{isOpen ? 'CONCEAL ▲' : 'REVEAL ▼'}</span>
          </button>
        </div>
      </div>

      {/* Greek Key Meander Divider Between Entries */}
      <GreekMeanderDivider className="mt-8 mb-4" />
    </article>
  );
}
