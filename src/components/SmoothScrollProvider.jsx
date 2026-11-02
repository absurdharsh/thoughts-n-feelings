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

    // 2. Configure Lenis with heavy stone physics (massive monolithic inertia)
    const lenis = new Lenis({
      lerp: 0.055,          // Heavy, weighted stone deceleration
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8, // Deliberate, physical wheel resistance
      touchMultiplier: 1.1,
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
