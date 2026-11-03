import React from 'react';
import InteractiveHeroIllustration from './InteractiveHeroIllustration';
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
            className="naked-link scribble-hover font-handwritten text-base sm:text-lg flex items-center gap-1.5"
            title="Inscribe a new thought"
          >
            <DoodleQuill className="w-5 h-5 text-ink dark:text-darkInk" />
            <span>jot a thought</span>
          </button>

          {/* Theme toggle doodle icon */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="naked-link p-1 transition-transform duration-200 hover:rotate-12 hover:scale-110"
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

      {/* Main Hand-Drawn Hero Title */}
      <div className="text-center pt-14 pb-8 relative">
        {/* Floating Accent Doodles */}
        <div className="absolute top-8 right-6 sm:right-16 opacity-75 pointer-events-none transform rotate-12">
          <DoodleStar className="w-8 h-8 sm:w-10 sm:h-10 text-ink dark:text-darkInk" />
        </div>

        <h1 className="font-editorial italic text-6xl sm:text-8xl md:text-9xl leading-[0.88] tracking-tight text-ink dark:text-darkInk transition-colors duration-200">
          thoughts<br />
          <span className="font-handwritten not-italic text-4xl sm:text-6xl opacity-60 inline-block my-1">&amp;</span><br />
          feelings
        </h1>

        <p className="font-handwritten text-xl sm:text-2xl text-ink/80 dark:text-darkInk/80 max-w-xl mx-auto mt-6 leading-relaxed">
          an ink and paper sketchbook of quiet notes, personal paradoxes, and midnight reflections by{' '}
          <a
            href="https://www.instagram.com/absurdnigga"
            target="_blank"
            rel="noreferrer"
            className="scribble-hover font-editorial italic underline decoration-1 underline-offset-4"
          >
            absurdharsh
          </a>
          .
        </p>

        {/* Hand-Drawn Specimen: Two in Embrace (Interactive Pose Scrubbing) */}
        <InteractiveHeroIllustration isDark={isDark} />

        {/* Scroll Trigger Naked Link */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={onScrollToLedger}
            className="naked-link scribble-hover font-handwritten text-lg sm:text-xl flex items-center gap-2 group"
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

