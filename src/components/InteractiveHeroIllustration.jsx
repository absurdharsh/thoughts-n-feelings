import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function InteractiveHeroIllustration({ isDark }) {
  // Active pose frame index: 0 (frame-1) through 4 (frame-5), default center = 2 (frame-3)
  const [activeFrame, setActiveFrame] = useState(2);
  const [caption, setCaption] = useState('center pose · neutral');

  const containerRef = useRef(null);
  const skullsRef = useRef(null);
  const bodyRef = useRef(null);

  const rotateXRef = useRef(null);
  const rotateYRef = useRef(null);
  const skullsXRef = useRef(null);
  const skullsYRef = useRef(null);
  const bodyXRef = useRef(null);
  const bodyYRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fast quickTo setters for 60fps buttery responsiveness
    rotateXRef.current = gsap.quickTo(containerRef.current, 'rotateX', { duration: 0.35, ease: 'power2.out' });
    rotateYRef.current = gsap.quickTo(containerRef.current, 'rotateY', { duration: 0.35, ease: 'power2.out' });

    if (skullsRef.current) {
      skullsXRef.current = gsap.quickTo(skullsRef.current, 'x', { duration: 0.45, ease: 'power2.out' });
      skullsYRef.current = gsap.quickTo(skullsRef.current, 'y', { duration: 0.45, ease: 'power2.out' });
    }

    if (bodyRef.current) {
      bodyXRef.current = gsap.quickTo(bodyRef.current, 'x', { duration: 0.6, ease: 'power2.out' });
      bodyYRef.current = gsap.quickTo(bodyRef.current, 'y', { duration: 0.6, ease: 'power2.out' });
    }
  }, []);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : rect.top + rect.height / 2);

    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const deltaX = normX - 0.5;
    const deltaY = normY - 0.5;

    // 1. Scrub through 5 pose frames
    const frameIdx = Math.max(0, Math.min(4, Math.floor(normX * 5)));
    if (frameIdx !== activeFrame) {
      setActiveFrame(frameIdx);
      const hints = [
        'left gaze · contour shift',
        'slight left · pen tilt',
        'center pose · neutral',
        'embrace lean · skeletal contact',
        'right focal · dense detail'
      ];
      setCaption(hints[frameIdx] || 'interactive pose');
    }

    // 2. 3D Perspective Tilt
    if (rotateXRef.current && rotateYRef.current) {
      rotateYRef.current(deltaX * 14);
      rotateXRef.current(-deltaY * 10);
    }

    // 3. Multi-layer Parallax
    if (skullsXRef.current && skullsYRef.current) {
      skullsXRef.current(deltaX * 18);
      skullsYRef.current(deltaY * 14);
    }
    if (bodyXRef.current && bodyYRef.current) {
      bodyXRef.current(deltaX * 8);
      bodyYRef.current(deltaY * 6);
    }
  };

  const handlePointerLeave = () => {
    setActiveFrame(2);
    setCaption('center pose · neutral');

    if (rotateXRef.current && rotateYRef.current) {
      rotateXRef.current(0);
      rotateYRef.current(0);
    }
    if (skullsXRef.current && skullsYRef.current) {
      skullsXRef.current(0);
      skullsYRef.current(0);
    }
    if (bodyXRef.current && bodyYRef.current) {
      bodyXRef.current(0);
      bodyYRef.current(0);
    }
  };

  return (
    <div className="my-8 flex flex-col items-center justify-center select-none">
      {/* Hand-Drawn Sketchbook Specimen Frame */}
      <div
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
        className="relative w-64 sm:w-72 md:w-80 aspect-[1080/1350] cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out"
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        title="Move pointer across to inspect interactive pose frames"
      >
        {/* Paper Inset Shadow / Glow */}
        <div className="absolute inset-0 rounded-lg pointer-events-none border border-ink/15 dark:border-darkInk/20 shadow-sm" />

        {/* 5 WebP interactive pose frames */}
        {[1, 2, 3, 4, 5].map((num, i) => (
          <img
            key={num}
            src={`/illustration/frame-${num}.webp`}
            alt={`Two in Embrace - Pose ${num}`}
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75 ${
              activeFrame === i ? 'opacity-100' : 'opacity-0'
            } ${isDark ? 'invert brightness-95 contrast-125' : ''}`}
            loading="eager"
          />
        ))}

        {/* Parallax Layer 1: Skulls */}
        <div
          ref={skullsRef}
          className="absolute inset-0 w-full h-full pointer-events-none will-change-transform z-10"
        >
          <img
            src="/illustration/layer-skulls.png"
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-contain opacity-0 ${isDark ? 'invert brightness-95' : ''}`}
          />
        </div>

        {/* Parallax Layer 2: Body / Ribs */}
        <div
          ref={bodyRef}
          className="absolute inset-0 w-full h-full pointer-events-none will-change-transform z-5"
        >
          <img
            src="/illustration/layer-body.png"
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-contain opacity-0 ${isDark ? 'invert brightness-95' : ''}`}
          />
        </div>
      </div>

      {/* Hand-Drawn Sketchbook Caption */}
      <div className="mt-3 flex items-center justify-center gap-3 font-handwritten text-xs sm:text-sm text-ink/70 dark:text-darkInk/70 tracking-wide">
        <span className="font-editorial italic font-bold text-ink dark:text-darkInk text-sm">
          specimen 01:
        </span>
        <span>two in embrace</span>
        <span className="opacity-40">&middot;</span>
        <span className="opacity-80 italic">{caption}</span>
      </div>
    </div>
  );
}

