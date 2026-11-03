/* ==========================================================================
   AUGUSTO GRACIANO STYLE PRELOADER & HERO SCRIPT
   GSAP 3 · ScrollTrigger · Lenis Smooth Scroll · Interactive Pose Scrubbing
   ========================================================================== */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const preloader = document.getElementById('preloader');
  const preloaderCounter = document.getElementById('preloader-counter');
  const scribblePaths = document.querySelectorAll('.scribble-path');
  const scribbleDense = document.querySelector('.scribble-fill-dense');
  const cursor = document.getElementById('cursor');
  const heroWrap = document.querySelector('.hero-wrap');
  const artStage = document.getElementById('art-stage');
  const artFrames = document.querySelectorAll('.art-frame');
  const layerSkulls = document.getElementById('layer-skulls');
  const layerBody = document.getElementById('layer-body');
  const captionIndex = document.querySelector('.caption-index');
  const captionHint = document.querySelector('.caption-hint');
  const editorialItems = document.querySelectorAll('.editorial-block, .brand-signature, .nav-tag, .menu-trigger');

  // ==========================================================================
  // 1. LENIS SMOOTH SCROLL SETUP
  // ==========================================================================
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    // Pause scroll initially while preloader is active
    lenis.stop();

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  // ==========================================================================
  // 2. CUSTOM DOODLE CURSOR INTERACTION
  // ==========================================================================
  if (cursor && !prefersReducedMotion) {
    const cursorX = gsap.quickTo(cursor, 'x', { duration: 0.22, ease: 'power3.out' });
    const cursorY = gsap.quickTo(cursor, 'y', { duration: 0.22, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      cursorX(e.clientX);
      cursorY(e.clientY);
    });

    // Magnetic / hover states
    const hoverTargets = document.querySelectorAll('a, button, .menu-trigger, .cta-link, .brand-signature, .art-frame-container');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hovering');
      });
    });

    artStage?.addEventListener('mousedown', () => cursor.classList.add('is-drag'));
    window.addEventListener('mouseup', () => cursor.classList.remove('is-drag'));
  }

  // ==========================================================================
  // 3. SCRIBBLING PRELOADER TIMELINE & CURTAIN-WIPE
  // ==========================================================================
  function runPreloader() {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' }
    });

    // Counter number animation: 00 -> 100
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (preloaderCounter) {
          const formatted = Math.floor(counterObj.val).toString().padStart(2, '0');
          preloaderCounter.textContent = `${formatted} %`;
        }
      }
    }, 0);

    // Rapid black scribble animation strokes
    scribblePaths.forEach((path, i) => {
      const length = path.getTotalLength ? path.getTotalLength() : 3500;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      
      tl.to(path, {
        strokeDashoffset: 0,
        duration: 1.4 + i * 0.15,
        ease: 'power1.inOut'
      }, i * 0.08);
    });

    // Dense scribble flash
    if (scribbleDense) {
      tl.to(scribbleDense, {
        opacity: 0.9,
        strokeDashoffset: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, 0.9);
    }

    // Curtain-wipe exit upward (translate3d(0, -100%, 0))
    tl.to(preloader, {
      yPercent: -100,
      duration: 1.15,
      ease: 'power4.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        if (lenis) lenis.start();
      }
    }, 1.9);

    // Hero entrance kicks off as preloader is 60% through its upward curtain wipe
    tl.add(() => {
      runHeroEntrance();
    }, 2.3);
  }

  // ==========================================================================
  // 4. POST-LOAD HERO ENTRANCE
  // ==========================================================================
  function runHeroEntrance() {
    const heroTl = gsap.timeline();

    // 1. Editorial text stagger reveal
    heroTl.fromTo(editorialItems, {
      opacity: 0,
      y: 28,
    }, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      stagger: 0.07,
      ease: 'power3.out'
    }, 0);

    // 2. Central illustration entrance scale & fade
    heroTl.fromTo(artStage, {
      opacity: 0,
      scale: 0.92,
      y: 35
    }, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1.3,
      ease: 'power3.out'
    }, 0.15);

    // 3. SVG stroke paths reveal animation if SVG paths present
    const svgPaths = document.querySelectorAll('.ink-stroke');
    if (svgPaths.length > 0) {
      svgPaths.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 800;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      heroTl.to(svgPaths, {
        strokeDashoffset: 0,
        duration: 1.4,
        stagger: 0.005,
        ease: 'power2.out'
      }, 0.2);
    }
  }

  // ==========================================================================
  // 5. MOUSE-REACTIVE POSE SCRUBBING & MULTI-LAYER PARALLAX
  // ==========================================================================
  if (heroWrap && artFrames.length > 0) {
    let currentFrameIndex = 2; // neutral frame 3 (0-indexed: 2)

    // QuickTo dampening setters for buttery 60fps performance
    const stageRotateX = gsap.quickTo(artStage, 'rotateX', { duration: 0.35, ease: 'power2.out' });
    const stageRotateY = gsap.quickTo(artStage, 'rotateY', { duration: 0.35, ease: 'power2.out' });
    
    // Parallax layers
    const skullsX = layerSkulls ? gsap.quickTo(layerSkulls, 'x', { duration: 0.45, ease: 'power2.out' }) : null;
    const skullsY = layerSkulls ? gsap.quickTo(layerSkulls, 'y', { duration: 0.45, ease: 'power2.out' }) : null;
    
    const bodyX = layerBody ? gsap.quickTo(layerBody, 'x', { duration: 0.6, ease: 'power2.out' }) : null;
    const bodyY = layerBody ? gsap.quickTo(layerBody, 'y', { duration: 0.6, ease: 'power2.out' }) : null;

    function handleMouseMove(e) {
      const rect = heroWrap.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Normalized coordinates: 0.0 to 1.0
      const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      // Centered coordinates: -0.5 to +0.5
      const deltaX = normX - 0.5;
      const deltaY = normY - 0.5;

      // 1. Scrub across the 5 frames based on horizontal pointer traversal
      const targetFrame = Math.floor(normX * 5);
      const clampedIndex = Math.max(0, Math.min(4, targetFrame));

      if (clampedIndex !== currentFrameIndex) {
        artFrames.forEach((frame, idx) => {
          if (idx === clampedIndex) {
            frame.classList.add('active');
          } else {
            frame.classList.remove('active');
          }
        });
        currentFrameIndex = clampedIndex;

        // Update UI indicator
        if (captionIndex) captionIndex.textContent = `[ 0${clampedIndex + 1} / 05 ]`;
        if (captionHint) {
          const hints = [
            'LEFTWARD GAZE · CONTOUR BIAS',
            'SUBTLE TILT · CROSSHATCH SHIFT',
            'NEUTRAL CENTER · CORE INK FORM',
            'EMBRACE LEAN · SKELETAL CONTACT',
            'RIGHTWARD FOCAL · DENSE DETAIL'
          ];
          captionHint.textContent = hints[clampedIndex] || 'INTERACTIVE POSE';
        }
      }

      // 2. 3D Tilt depth
      if (!prefersReducedMotion) {
        stageRotateY(deltaX * 14);   // -7 to +7 deg
        stageRotateX(-deltaY * 12);  // -6 to +6 deg

        // 3. Multi-layer depth parallax (skulls separate from ribs/crosshatching)
        if (skullsX && skullsY) {
          skullsX(deltaX * 24);
          skullsY(deltaY * 18);
        }
        if (bodyX && bodyY) {
          bodyX(deltaX * 9);
          bodyY(deltaY * 7);
        }
      }
    }

    function handleMouseLeave() {
      // Smoothly return to center frame 3
      artFrames.forEach((frame, idx) => {
        if (idx === 2) frame.classList.add('active');
        else frame.classList.remove('active');
      });
      currentFrameIndex = 2;
      if (captionIndex) captionIndex.textContent = '[ 03 / 05 ]';
      if (captionHint) captionHint.textContent = 'NEUTRAL CENTER · SCRUB WITH CURSOR';

      if (!prefersReducedMotion) {
        stageRotateX(0);
        stageRotateY(0);
        if (skullsX && skullsY) { skullsX(0); skullsY(0); }
        if (bodyX && bodyY) { bodyX(0); bodyY(0); }
      }
    }

    heroWrap.addEventListener('mousemove', handleMouseMove);
    heroWrap.addEventListener('mouseleave', handleMouseLeave);
  }

  // ==========================================================================
  // 6. SCROLLTRIGGER PARALLAX DEPTH
  // ==========================================================================
  if (typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.to(artStage, {
      y: -75,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2
      }
    });

    gsap.to('.hero-col-left', {
      y: -35,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
      }
    });

    gsap.to('.hero-col-right', {
      y: -45,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.8
      }
    });
  }

  // Initialize preloader on load
  window.addEventListener('DOMContentLoaded', () => {
    runPreloader();
  });

})();

