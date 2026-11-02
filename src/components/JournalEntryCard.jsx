import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { sound } from '../utils/audio';

export default function JournalEntryCard({ entry, index, isInitiallyOpen = true }) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [likes, setLikes] = useState(entry.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const scrambleTimerRef = useRef(null);

  // GSAP Accordion unfold / fold animation (heavy stone slab movement)
  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      gsap.to(contentRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
      });
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current);
      }
    };
  }, []);

  // Chisel Chipping Rune Reveal (ancient stone brushing micro-interaction)
  const chiselTitle = () => {
    const titleEl = titleRef.current;
    if (!titleEl) return;
    if (scrambleTimerRef.current) {
      clearInterval(scrambleTimerRef.current);
    }
    const originalText = entry.title;
    const lithicRunes = '░▒▓§‡◈▲▼᚛᚜01:;+=-_·';
    let iteration = 0;

    scrambleTimerRef.current = setInterval(() => {
      titleEl.innerText = originalText
        .split('')
        .map((char, idx) => {
          if (idx < iteration) return originalText[idx];
          return lithicRunes[Math.floor(Math.random() * lithicRunes.length)];
        })
        .join('');

      if (iteration >= originalText.length) {
        clearInterval(scrambleTimerRef.current);
        scrambleTimerRef.current = null;
        titleEl.innerText = originalText;
      }
      iteration += 1 / 2;
    }, 28);
  };

  const toggleFold = () => {
    sound.playFold();
    setIsOpen(!isOpen);
  };

  const handleMark = (e) => {
    e.stopPropagation();
    sound.playClick(1.3);
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    sound.playClick(1.6);
    const textToCopy = `[ ${entry.title.toUpperCase()} ]\n${entry.epigraph ? `(${entry.epigraph})\n\n` : ''}${entry.content}\n\n— Inscribed by ${entry.author} [${entry.date}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Mineral Lapidary Classification
  const getTypeClassification = () => {
    switch (entry.type) {
      case 'thought':
        return { label: 'COGITATIO', epigraph: 'DE RATIONE' };
      case 'feeling':
        return { label: 'SENTIENTIA', epigraph: 'DE AFFECTIBUS' };
      case 'quote':
        return { label: 'MONUMENTUM', epigraph: 'EPITAPHIUM' };
      default:
        return { label: 'INSPECTIO', epigraph: 'DE MEMORIA' };
    }
  };

  const classification = getTypeClassification();

  return (
    <article
      ref={cardRef}
      className="stone-slab stone-grain border border-[#2a2925] mb-6 p-6 sm:p-8 transition-colors duration-200"
    >
      {/* Stone Tablet Header Band */}
      <header 
        onClick={toggleFold}
        className="cursor-pointer select-none border-b border-[#22211f] pb-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#73716b] mb-3">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 bg-[#181816] border border-[#2e2d29] text-[#a8a49c] font-bold tracking-widest text-[10px] uppercase">
              {classification.label}
            </span>
            <span className="text-[#4e4d47]">&bull;</span>
            <span className="tracking-wider uppercase text-[#88857c]">{entry.chapterRoman || 'STELA'}</span>
          </div>

          <div className="flex items-center space-x-3 text-[#73716b] text-[10px] tracking-wider">
            <span>{entry.date}</span>
            <span className="text-[#3a3934]">&bull;</span>
            <span>{entry.timestamp}</span>
          </div>
        </div>

        {/* Chiseled Heading */}
        <div className="group">
          <h3
            ref={titleRef}
            onMouseEnter={chiselTitle}
            className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#e5e0d8] carved-text leading-snug group-hover:text-[#ffffff] transition-colors"
          >
            {entry.title}
          </h3>
          {entry.epigraph && (
            <p className="font-serif italic text-xs text-[#8c887e] tracking-widest uppercase mt-1">
              {entry.epigraph}
            </p>
          )}
        </div>

        {/* Collapsed Snippet when closed */}
        {!isOpen && (
          <p className="mt-3 font-serif text-[#94928b] italic text-sm line-clamp-1">
            {entry.snippet}
          </p>
        )}
      </header>

      {/* Expandable Tablet Body */}
      <div ref={contentRef} className="overflow-hidden">
        {/* Main Inscription Text */}
        <div className="py-6 space-y-4 font-serif text-base sm:text-lg leading-[1.85] text-[#d8d2c4] select-text">
          {entry.content.split('\n\n').map((para, i) => (
            <p key={i} className="carved-text-subtle first-letter:text-2xl first-letter:font-display first-letter:mr-1 first-letter:text-[#ffffff]">
              {para}
            </p>
          ))}
        </div>

        {/* Carved ASCII Lithic Artifact if present */}
        {entry.asciiArt && (
          <div className="my-5 p-4 bg-[#0a0a09] border border-[#22211f] stone-inset overflow-x-auto">
            <pre className="font-mono text-[10px] sm:text-xs text-[#94928b] leading-tight select-none inline-block">
              {entry.asciiArt.trim()}
            </pre>
          </div>
        )}

        {/* Tablet Meta Bar & Stone Tags */}
        <div className="pt-4 border-t border-[#1e1d1b] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Tags as carved glyphs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.tags && entry.tags.map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-2 py-0.5 bg-[#141413] border border-[#262522] text-[#858279] text-[10px] tracking-wider uppercase"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="text-[11px] font-serif text-[#73716b] italic">
            Inscribed by <strong className="text-[#a8a49c] font-normal not-italic font-mono uppercase">{entry.author}</strong>
          </div>
        </div>
      </div>

      {/* Tablet Bottom Action Slab */}
      <footer className="mt-4 pt-3 border-t border-[#1e1d1b] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          {/* Carve Mark / Endorsement */}
          <button
            type="button"
            onClick={handleMark}
            className={`stone-btn px-3 py-1.5 text-[11px] tracking-widest flex items-center space-x-1.5 ${hasLiked ? 'text-[#ffffff] bg-[#262522] border-[#44423d]' : 'text-[#858279]'}`}
            title="Inscribe recognition mark on this stele"
          >
            <span>{hasLiked ? '‡ MARKED' : '‡ MARK'}</span>
            <span className="text-[10px] text-[#5e5c56]">[{likes}]</span>
          </button>

          {/* Copy Stone Inscription */}
          <button
            type="button"
            onClick={handleCopy}
            className="stone-btn px-3 py-1.5 text-[11px] tracking-widest text-[#858279]"
            title="Transcribe inscription to clipboard"
          >
            <span>{copied ? '✓ TRANSCRIBED' : 'TRANSCRIBE'}</span>
          </button>
        </div>

        {/* Toggle Unseal/Seal Button */}
        <button
          type="button"
          onClick={toggleFold}
          className="stone-btn px-3 py-1.5 text-[10px] tracking-widest text-[#73716b] uppercase"
        >
          <span>{isOpen ? 'SEAL SLAB ▲' : 'UNSEAL SLAB ▼'}</span>
        </button>
      </footer>
    </article>
  );
}
