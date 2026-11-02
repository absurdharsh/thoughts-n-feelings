import React from 'react';
import { useSmoothScroll } from './SmoothScrollProvider';
import { DoodleArrowUp } from './HandDrawnDoodles';

export default function RetroStatusBar() {
  const { lenis } = useSmoothScroll() || {};

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex justify-center">
      <button
        type="button"
        onClick={scrollToTop}
        className="naked-link scribble-hover font-handwritten text-lg sm:text-xl flex items-center gap-2 text-ink/70 dark:text-darkInk/70 hover:text-ink dark:hover:text-darkInk"
      >
        <DoodleArrowUp className="w-5 h-5" />
        <span>back to top of sketchbook</span>
      </button>
    </div>
  );
}
