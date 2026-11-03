import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function ScribblePreloader({ isDark, onComplete }) {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState('scribbling'); // 'scribbling' -> 'drawing' -> 'resolved' -> 'exit'
  
  const preloaderRef = useRef(null);
  const scribblePathRef1 = useRef(null);
  const scribblePathRef2 = useRef(null);
  const scribblePathRef3 = useRef(null);
  const illustrationRef = useRef(null);
  const skeletonSvgRef = useRef(null);

  useEffect(() => {
    // Lock body scroll while preloader is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.body.style.overflow = originalOverflow;
      if (onComplete) onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = originalOverflow;
        if (onComplete) onComplete();
      }
    });

    // 1. Counter Number Progress: 0% -> 100%
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        const cur = Math.floor(counterObj.val);
        setPercent(cur);
        if (cur > 30 && cur <= 75) {
          setPhase('drawing');
        } else if (cur > 75) {
          setPhase('resolved');
        }
      }
    }, 0);

    // 2. Initial Organic Scribble Paths
    const paths = [scribblePathRef1.current, scribblePathRef2.current, scribblePathRef3.current].filter(Boolean);
    paths.forEach((p, i) => {
      const len = p.getTotalLength ? p.getTotalLength() : 3000;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(p, {
        strokeDashoffset: 0,
        duration: 1.1 + i * 0.2,
        ease: 'power1.inOut'
      }, i * 0.12);
    });

    // 3. Vector Contours Drawing Phase (drawing the skeletons)
    if (skeletonSvgRef.current) {
      const skeletonPaths = skeletonSvgRef.current.querySelectorAll('.draw-path');
      skeletonPaths.forEach((sp) => {
        const len = sp.getTotalLength ? sp.getTotalLength() : 800;
        gsap.set(sp, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.95 });
      });

      tl.to(skeletonPaths, {
        strokeDashoffset: 0,
        duration: 1.3,
        stagger: 0.04,
        ease: 'power2.out'
      }, 0.5);
    }

    // 4. Resolve into the Complete Hand-Drawn Ink Illustration
    if (illustrationRef.current) {
      gsap.set(illustrationRef.current, { opacity: 0, scale: 0.96 });
      tl.to(illustrationRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out'
      }, 1.4);

      // Fade out rough scribble paths as illustration solidifies
      tl.to(paths, {
        opacity: 0.15,
        duration: 0.5,
        ease: 'power1.out'
      }, 1.5);
    }

    // 5. Short pause to admire completed drawing at 100%
    tl.to({}, { duration: 0.35 });

    // 6. Smooth Curtain-Wipe Upward Exit
    if (preloaderRef.current) {
      tl.to(preloaderRef.current, {
        yPercent: -100,
        duration: 0.95,
        ease: 'power4.inOut'
      });
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      tl.kill();
    };
  }, [onComplete]);

  const handleSkip = () => {
    if (preloaderRef.current) {
      gsap.to(preloaderRef.current, {
        yPercent: -100,
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete: () => {
          document.body.style.overflow = '';
          if (onComplete) onComplete();
        }
      });
    }
  };

  return (
    <aside
      ref={preloaderRef}
      className="fixed inset-0 w-screen h-screen z-[99999] bg-paper dark:bg-darkPaper text-ink dark:text-darkInk flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden will-change-transform transition-colors duration-200"
      aria-label="Hand-drawn preloader drawing illustration"
    >
      {/* Top Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between font-handwritten text-sm sm:text-base border-b border-ink/15 dark:border-darkInk/20 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-editorial italic text-lg sm:text-xl">vol. 01</span>
          <span className="opacity-40">·</span>
          <span className="opacity-75">ink on paper</span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="naked-link font-handwritten text-xs sm:text-sm text-ink/50 dark:text-darkInk/50 hover:text-ink dark:hover:text-darkInk transition-colors"
          title="Skip to sketchbook"
        >
          [ skip drawing ]
        </button>
      </div>

      {/* Center Drawing Canvas */}
      <div className="relative flex-grow flex flex-col items-center justify-center my-auto">
        <div className="relative w-64 sm:w-72 md:w-80 aspect-[1080/1350] bg-white rounded-lg overflow-hidden shadow-lg border border-black/15 dark:border-white/20 flex items-center justify-center">
          
          {/* Sketchbook Plate Inset Border */}
          <div className="absolute inset-0 border border-dashed border-black/20 rounded-lg pointer-events-none z-20" />

          {/* 1. Organic Hand-Drawn Scribble Paths (Always pure black ink strokes) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
            viewBox="0 0 600 750"
            fill="none"
          >
            <path
              ref={scribblePathRef1}
              d="M100 250 C 180 120, 320 80, 420 180 C 520 280, 480 420, 350 480 C 220 540, 120 420, 180 300 C 240 180, 440 220, 480 360 C 520 500, 380 620, 260 560 C 140 500, 180 320, 300 240 Z"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black/80"
            />
            <path
              ref={scribblePathRef2}
              d="M200 160 Q 380 280 500 180 T 320 420 Q 180 290 380 140 T 520 380 Q 380 520 220 340 Z"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black/60"
            />
            <path
              ref={scribblePathRef3}
              d="M280 100 C 190 200, 150 360, 260 420 C 370 480, 500 390, 520 260 C 540 130, 400 90, 300 180 Z"
              stroke="#000000"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black/40"
            />
          </svg>

          {/* 2. Skeleton Contour Vectors that Draw In (Always pure black ink strokes) */}
          <svg
            ref={skeletonSvgRef}
            className="absolute inset-0 w-full h-full pointer-events-none p-2 z-15 text-black"
            viewBox="0 0 400 500"
            fill="none"
          >
            {/* Left skull outline */}
            <path
              className="draw-path"
              d="M160 140 C 140 110, 180 80, 210 95 C 240 110, 245 150, 225 175 C 205 195, 175 190, 160 170 C 150 155, 150 145, 160 140 Z"
              stroke="#000000"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right skull outline */}
            <path
              className="draw-path"
              d="M230 150 C 220 125, 255 105, 275 120 C 295 135, 295 170, 280 190 C 265 205, 240 200, 230 185 Z"
              stroke="#000000"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Clavicles & Embracing Arms */}
            <path
              className="draw-path"
              d="M120 190 L 220 250 M 110 230 L 195 285 M 260 235 L 320 300"
              stroke="#000000"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Ribcage arcs */}
            <path
              className="draw-path"
              d="M140 270 Q 180 290 220 275 M 135 300 Q 185 320 225 305 M 140 330 Q 190 350 230 335 M 150 360 Q 195 380 235 365"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Spine & Pelvic column */}
            <path
              className="draw-path"
              d="M225 240 C 225 280, 235 340, 245 400"
              stroke="#000000"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Background crosshatching bursts */}
            <path
              className="draw-path"
              d="M90 140 L 130 200 M 80 180 L 120 240 M 310 140 L 350 200 M 320 190 L 360 250 M 120 400 L 170 440"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* 3. The Finished Master Ink Illustration (Always black ink on white paper) */}
          <div
            ref={illustrationRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-18"
          >
            <img
              src="/illustration/illustration-clean.webp"
              alt="Two in Embrace Hand-Drawn Ink Illustration"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Live Drawing Status */}
        <div className="mt-4 flex flex-col items-center gap-1 font-handwritten text-center">
          <p className="text-sm sm:text-base text-ink/80 dark:text-darkInk/80">
            {phase === 'scribbling' && 'rough pen scribbles on paper...'}
            {phase === 'drawing' && 'drawing: "two in embrace"...'}
            {phase === 'resolved' && 'inking complete · two in embrace'}
          </p>
          <span className="text-xs text-ink/40 dark:text-darkInk/40">
            specimen no. 01 · pen on heavyweight wove
          </span>
        </div>
      </div>

      {/* Bottom Footer Meta & Counter */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between font-handwritten text-base sm:text-lg border-t border-ink/15 dark:border-darkInk/20 pt-4">
        <span className="text-xs sm:text-sm text-ink/60 dark:text-darkInk/60">
          sketchbook memory dump
        </span>

        <span className="font-editorial italic text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-darkInk">
          {percent} %
        </span>
      </div>
    </aside>
  );
}

