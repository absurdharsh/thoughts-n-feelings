import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Heart, Share2, Copy, Check, ChevronDown, Sparkles, Terminal, Tag, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

export default function JournalEntryCard({ entry, index, isInitiallyOpen = true }) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [likes, setLikes] = useState(entry.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const contentRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const scrambleTimerRef = useRef(null);

  // GSAP Accordion unfold / fold animation
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

  useEffect(() => {
    return () => {
      if (scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current);
      }
    };
  }, []);

  // Spotlight mouse tracking (React.bit micro-interaction)
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  // Scramble / Decrypt text on hover
  const scrambleTitle = () => {
    const titleEl = titleRef.current;
    if (!titleEl) return;
    if (scrambleTimerRef.current) {
      clearInterval(scrambleTimerRef.current);
    }
    const originalText = entry.title;
    const chars = '01#%&*+<>~_[]';
    let iteration = 0;

    scrambleTimerRef.current = setInterval(() => {
      titleEl.innerText = originalText
        .split('')
        .map((char, idx) => {
          if (idx < iteration) return originalText[idx];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= originalText.length) {
        clearInterval(scrambleTimerRef.current);
        scrambleTimerRef.current = null;
        titleEl.innerText = originalText;
      }
      iteration += 1 / 2;
    }, 25);
  };

  const toggleFold = () => {
    sound.playFold();
    setIsOpen(!isOpen);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    sound.playClick(1.5);
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);

      // Trigger micro retro burst
      try {
        confetti({
          particleCount: 18,
          spread: 45,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
          colors: ['#c5a059', '#e5d7ba', '#ffffff'],
          shapes: ['square'],
          scalar: 0.7,
        });
      } catch {}
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    sound.playClick(1.8);
    const textToCopy = `"${entry.content}"\n\n— ${entry.author} (${entry.date})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Type styling
  const getTypeBadge = () => {
    switch (entry.type) {
      case 'thought':
        return { label: 'THOUGHT_LOG', color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' };
      case 'feeling':
        return { label: 'AFFECT_SIGNAL', color: 'text-rose-400 border-rose-500/40 bg-rose-950/20' };
      case 'quote':
        return { label: 'INSCRIPTION', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20' };
      default:
        return { label: 'LEDGER_ENTRY', color: 'text-[#c5a059] border-[#c5a059]/40 bg-[#c5a059]/10' };
    }
  };

  const badge = getTypeBadge();

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative my-8 rounded-lg border border-zinc-800/90 bg-[#0d0f14]/85 hover:border-[#c5a059]/50 transition-all duration-300 shadow-xl overflow-hidden group select-text"
      style={{
        boxShadow: mousePos.active
          ? '0 10px 30px -10px rgba(0,0,0,0.7), 0 0 25px rgba(197, 160, 89, 0.08)'
          : '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* React.bit Dynamic Spotlight Glow */}
      {mousePos.active && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-60"
          style={{
            background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(197, 160, 89, 0.12), transparent 80%)`,
          }}
        />
      )}

      {/* Decorative Book Page Spine Stitch Marker on left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#c5a059]/40 via-[#c5a059]/80 to-[#c5a059]/40 group-hover:w-2 transition-all duration-300" />

      {/* Paper Crease / Stitching Pattern on left gutter */}
      <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-3 pointer-events-none select-none text-[8px] text-[#c5a059]/30 font-mono">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i}>:</span>
        ))}
      </div>

      {/* Card Header (Accordion Clickable Bar) */}
      <div 
        onClick={toggleFold}
        onMouseEnter={scrambleTitle}
        className="cursor-pointer pl-7 pr-5 py-4 border-b border-zinc-800/70 flex flex-wrap items-center justify-between gap-3 bg-black/20 select-none"
      >
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Entry ID & Type Badge */}
          <span className="font-mono text-xs text-zinc-500">[{entry.id}]</span>
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="font-mono text-xs text-zinc-400">{entry.timestamp}</span>
        </div>

        {/* Action micro-tools */}
        <div className="flex items-center space-x-2">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy entry inscription"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`p-1.5 rounded flex items-center space-x-1 transition-colors ${
              hasLiked ? 'text-rose-400 bg-rose-950/30' : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
            }`}
            title="Acknowledge thought resonance"
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400' : ''}`} />
            <span className="font-mono text-[11px]">{likes}</span>
          </button>

          {/* Accordion Fold Chevron */}
          <div className="p-1 text-zinc-500 group-hover:text-[#c5a059] transition-colors">
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-[#c5a059]' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Entry Title Bar with Decrypt / Scramble effect */}
      <div className="pl-7 pr-6 pt-4 pb-2">
        <h3 
          ref={titleRef}
          onClick={toggleFold}
          className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#e8e4dc] cursor-pointer hover:text-[#c5a059] transition-colors"
        >
          {entry.title}
        </h3>

        {/* Snippet preview if folded */}
        {!isOpen && (
          <p className="mt-2 text-sm text-zinc-400 font-mono italic truncate cursor-pointer" onClick={toggleFold}>
            &gt; {entry.snippet}
          </p>
        )}
      </div>

      {/* Accordion Unfoldable Content */}
      <div 
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="pl-7 pr-6 pt-2 pb-6 space-y-4">
          {/* Main Prose / Philosophy Body */}
          <div className="prose prose-invert max-w-none font-serif text-base sm:text-lg leading-relaxed text-zinc-300/90 whitespace-pre-line tracking-wide">
            {entry.content}
          </div>

          {/* ASCII Art Inset Block */}
          {entry.asciiArt && (
            <div className="my-4 p-3 rounded bg-black/60 border border-zinc-800/80 font-mono text-[11px] leading-tight text-[#c5a059] overflow-x-auto select-all">
              <pre className="whitespace-pre">{entry.asciiArt.trim()}</pre>
            </div>
          )}

          {/* Metadata Footer: Author, Mood, Tags */}
          <div className="pt-4 mt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2 text-zinc-400">
              <User className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Inscribed by:</span>
              <span className="text-[#e5d7ba] font-semibold">{entry.author}</span>
              {entry.mood && (
                <>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400 italic">Mood: {entry.mood}</span>
                </>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-[#c5a059] hover:border-[#c5a059]/40 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paper Bottom Edge ASCII Decorative Footer */}
      <div className="px-4 py-1.5 bg-black/40 border-t border-zinc-800/50 flex justify-between items-center text-[10px] font-mono text-zinc-600">
        <span>+--[ PAGE FOLIO: {index + 1} ]--+</span>
        <button 
          onClick={toggleFold}
          className="hover:text-zinc-400 transition-colors"
        >
          {isOpen ? '[- FOLD PARCHMENT]' : '[+ UNFOLD FULL]'}
        </button>
        <span>+----------------------+</span>
      </div>
    </article>
  );
}
