import React, { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const LenisContext = createContext(null);

export const useSmoothScroll = () => useContext(LenisContext);

export default function SmoothScrollProvider({ children }) {
  const [lenisInstance, setLenisInstance] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // 1. Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 2. Configure Lenis with airy, smooth sketchbook gliding physics
    const lenis = new Lenis({
      lerp: 0.08,           // Airy, fluid deceleration for hand-drawn paper feel
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      infinite: false,
    });

    setLenisInstance(lenis);

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      setScrollProgress(e.progress || 0);
    });

    // Synchronize into GSAP's high-precision ticker
    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, scrollProgress }}>
      {children}
    </LenisContext.Provider>
  );
}
