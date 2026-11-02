import React from 'react';
import {
  DoodleArrowDown,
  DoodleQuill,
  DoodleSun,
  DoodleMoon,
  DoodleStar,
  DoodleDivider
} from './HandDrawnDoodles';

export default function HandDrawnHero({
  isDark,
  onToggleTheme,
  onOpenNewEntryModal,
  onScrollToLedger
}) {
  return (
    <header className="relative w-full max-w-3xl mx-auto pt-8 pb-4 px-4 sm:px-6 select-none">
      {/* Top Sketchbook Bar */}
      <nav className="flex items-center justify-between font-handwritten text-base sm:text-lg pb-6 border-b border-ink/20 dark:border-darkInk/20">
        <div className="flex items-center gap-2">
          <span className="font-editorial italic text-xl">vol. 01</span>
          <span className="opacity-40">&bull;</span>
          <span className="opacity-70">ink on paper</span>
        </div>

        <div className="flex items-center gap-5 sm:gap-8">
          {/* Jot down thought naked link */}
          <button
            type="button"
            onClick={onOpenNewEntryModal}
            className="cta-link naked-link scribble-hover font-handwritten text-base sm:text-lg flex items-center gap-1.5 text-black dark:text-white"
            title="Inscribe a new thought"
          >
            <DoodleQuill className="w-5 h-5 text-ink dark:text-darkInk" />
            <span>jot a thought</span>
          </button>

          {/* Theme toggle doodle icon */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="cta-link naked-link p-1 transition-transform duration-200 hover:rotate-12 hover:scale-110 text-black dark:text-white"
            title={isDark ? 'Switch to Paper (Light)' : 'Switch to Ink (Dark)'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <DoodleSun className="w-6 h-6 text-darkInk" />
            ) : (
              <DoodleMoon className="w-6 h-6 text-ink" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Hand-Drawn Hero Title Block */}
      <div className="text-center pt-14 pb-8 relative z-10">
        {/* Delicate Hand-Drawn Sketch Framing Ribbon (Delicate 1.8px line framing whitespace around the block) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible opacity-20 dark:opacity-15"
          viewBox="0 0 800 450"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 35 25 C 160 12, 640 10, 765 28 C 785 90, 785 360, 765 425 C 640 440, 160 435, 35 420 C 15 360, 15 90, 35 25 Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="hand-drawn-line text-ink dark:text-darkInk"
          />
        </svg>

        {/* Floating Accent Doodle - Positioned carefully in the top corner margin */}
        <div className="absolute top-4 right-4 sm:right-12 opacity-80 pointer-events-none transform rotate-12">
          <DoodleStar className="w-7 h-7 sm:w-9 sm:h-9 text-ink dark:text-darkInk" />
        </div>

        {/* Hero Title with Paper Knockout Halo (-webkit-text-stroke: 10px var(--bg-color)) */}
        <h1 className="hero-title font-editorial italic text-6xl sm:text-8xl md:text-9xl leading-[0.88] tracking-tight text-black dark:text-white transition-colors duration-200 relative z-10 select-none">
          thoughts<br />
          <span className="font-handwritten not-italic text-4xl sm:text-6xl opacity-70 inline-block my-1">&amp;</span><br />
          feelings
        </h1>

        {/* Subtitle with High-Contrast Solid Ink and Paper Knockout Halo */}
        <p className="hero-subtitle font-handwritten text-[1.25rem] sm:text-[1.4rem] font-semibold text-black dark:text-white max-w-xl mx-auto mt-6 leading-relaxed relative z-10">
          an ink and paper sketchbook of quiet notes, personal paradoxes, and midnight reflections by{' '}
          <a
            href="https://www.instagram.com/absurdnigga"
            target="_blank"
            rel="noreferrer"
            className="cta-link scribble-hover font-editorial italic underline decoration-1 underline-offset-4 font-bold text-black dark:text-white"
          >
            absurdharsh
          </a>
          .
        </p>

        {/* Scroll Trigger Naked Link */}
        <div className="pt-8 flex justify-center relative z-10">
          <button
            type="button"
            onClick={onScrollToLedger}
            className="cta-link naked-link scribble-hover font-handwritten text-lg sm:text-xl flex items-center gap-2 group text-black dark:text-white font-medium"
          >
            <span>read the sketchbook</span>
            <DoodleArrowDown className="w-5 h-5 transition-transform group-hover:translate-y-1" />
          </button>
        </div>
      </div>

      {/* Wobbly Divider */}
      <DoodleDivider className="my-4 text-ink/30 dark:text-darkInk/30" />
    </header>
  );
}
