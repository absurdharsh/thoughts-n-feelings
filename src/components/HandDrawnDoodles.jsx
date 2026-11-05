import React from 'react';

// Streamline & Graciano Style Hand-Drawn SVG Doodles
// Styled with organic wobbly strokes and squigglevision filtering

export function DoodleArrowDown({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M16 4 C15.8 12, 16.3 20, 16 26" />
      <path d="M9 19 C12 22, 14.5 25, 16 27 C17.5 25, 20 22, 23 19" />
    </svg>
  );
}

export function DoodleArrowUp({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M16 28 C16.2 20, 15.7 12, 16 6" />
      <path d="M9 13 C12 10, 14.5 7, 16 5 C17.5 7, 20 10, 23 13" />
    </svg>
  );
}

export function DoodleQuill({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M25 4 C21 5, 13 10, 9 20 C8 23, 6 27, 6 27 C6 27, 10 25, 13 24 C23 20, 27 12, 28 8 C28 8, 26 12, 20 14" />
      <path d="M9 20 L21 8" strokeWidth="1.6" />
      <path d="M6 27 L8 25" strokeWidth="2.5" />
    </svg>
  );
}

export function DoodlePenNib({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`hand-drawn-line ${className}`}
    >
      <path d="M12 2.5 L16.5 8.5 C16.5 11.5, 14.5 14, 14 21.5 L10 21.5 C9.5 14, 7.5 11.5, 7.5 8.5 Z" />
      <path d="M12 2.5 L12 10.5" />
      <circle cx="12" cy="11.5" r="1" strokeWidth="1.2" />
    </svg>
  );
}

export function DoodleEraser({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`hand-drawn-line ${className}`}
    >
      <path d="M15 3.5 L20.5 9 L10 19.5 L4.5 19.5 L2.5 17.5 L6 13 L15 3.5 Z" />
      <path d="M7.5 12 L13 17.5" />
      <path d="M2 21.5 L12 21.5" strokeWidth="1.2" />
    </svg>
  );
}

export function DoodleSun({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <circle cx="16" cy="16" r="6.5" />
      <path d="M16 3 L16 6" />
      <path d="M16 26 L16 29" />
      <path d="M3 16 L6 16" />
      <path d="M26 16 L29 16" />
      <path d="M6.8 6.8 L9 9" />
      <path d="M23 23 L25.2 25.2" />
      <path d="M6.8 25.2 L9 23" />
      <path d="M23 9 L25.2 6.8" />
    </svg>
  );
}

export function DoodleMoon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M22 6 C13 7, 7 14, 8 23 C9 26, 11 28, 14 29 C24 29, 28 19, 25 13 C23 17, 18 19, 14 17 C16 11, 20 7, 22 6 Z" />
    </svg>
  );
}

export function DoodleEye({ className = 'w-10 h-6' }) {
  return (
    <svg viewBox="0 0 44 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M3 13 C10 4, 34 4, 41 13 C34 22, 10 22, 3 13 Z" />
      <circle cx="22" cy="13" r="5" fill="currentColor" />
      <circle cx="20.5" cy="11.5" r="1.5" fill="white" />
    </svg>
  );
}

export function DoodleStar({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M16 3 C16.5 10, 17 15, 29 16 C17 17, 16.5 22, 16 29 C15.5 22, 15 17, 3 16 C15 15, 15.5 10, 16 3 Z" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}

export function DoodleSpiral({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M16 15 C15 15, 14 16, 14 17 C14 18.5, 16 19.5, 17.5 19 C19.5 18, 20.5 15.5, 19.5 13.5 C18 11, 14.5 10.5, 12 12.5 C9 15, 9 19.5, 12 22.5 C15.5 25.5, 21 25, 24 21.5 C27.5 17.5, 26.5 11, 22.5 7.5" />
    </svg>
  );
}

export function DoodleSpark({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M12 2 L12 22" />
      <path d="M2 12 L22 12" />
      <path d="M5 5 L19 19" />
      <path d="M5 19 L19 5" />
    </svg>
  );
}

export function DoodleUnderline({ className = 'w-full h-3' }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={`hand-drawn-line ${className}`}>
      <path d="M 2 8 C 45 4, 95 10, 145 6 C 170 4, 188 7, 198 6" />
    </svg>
  );
}

export function DoodleDivider({ className = 'w-full h-6' }) {
  return (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" className={`hand-drawn-line ${className}`}>
      <path d="M 4 8 C 50 12, 100 4, 150 8 C 200 12, 250 4, 300 8 C 350 12, 380 6, 396 8" />
    </svg>
  );
}

export function DoodleCircle({ className = 'w-full h-full' }) {
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`hand-drawn-line ${className}`}>
      <path d="M 8 20 C 6 8, 45 4, 90 7 C 98 12, 96 32, 70 36 C 30 39, 4 33, 7 18" />
    </svg>
  );
}

export function DoodleHeart({ className = 'w-5 h-5', filled = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`hand-drawn-line ${className}`}
    >
      <path d="M16 27 C16 27 5 19 5 11 C5 6 9 3 13 4 C15 4.7 15.6 6.5 16 8 C16.4 6.5 17 4.7 19 4 C23 3 27 6 27 11 C27 19 16 27 16 27 Z" />
    </svg>
  );
}


