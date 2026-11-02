import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';

/**
 * Ancient Subterranean Atmosphere
 * Ultra-slow matte charcoal & ash mineral sediment with quiet drifting dust motes.
 * Purely geological and tactile, never digital or futuristic.
 */
export default function VantaAsciiBackground() {
  const vantaRef = useRef(null);
  const canvasRef = useRef(null);
  const vantaEffectRef = useRef(null);

  // 1. Initialize subdued matte charcoal & ash mineral lattice
  useEffect(() => {
    let effect = null;

    try {
      if (typeof window !== 'undefined') {
        window.THREE = THREE;
      }
      if (!vantaEffectRef.current && vantaRef.current) {
        effect = NET({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x1e1f21,           // Matte charcoal slate
          backgroundColor: 0x141516, // Dark basalt void
          points: 5.0,
          maxDistance: 14.0,
          spacing: 28.0,
          showDots: false,
        });
        vantaEffectRef.current = effect;
      }
    } catch (err) {
      console.warn("Vanta background fallback to lithic canvas:", err);
    }

    return () => {
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {}
        vantaEffectRef.current = null;
      }
    };
  }, []);

  // 2. Ultra-slow settling ancient dust motes (barely perceptible)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const glyphs = ['·', '°', '‡', '§', '░', '·', '.'];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Drifting ancient dust motes
    const motes = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: Math.random() * 0.08 + 0.02, // Ultra-slow settling
      char: glyphs[Math.floor(Math.random() * glyphs.length)],
      alpha: Math.random() * 0.14 + 0.03,
      size: Math.random() > 0.85 ? 11 : 8,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8c867a';

      motes.forEach((m) => {
        m.y += m.vy;
        m.x += m.vx;

        if (m.y > height) {
          m.y = -10;
          m.x = Math.random() * width;
        }
        if (m.x < 0) m.x = width;
        if (m.x > width) m.x = 0;

        ctx.font = `${m.size}px "IBM Plex Mono", monospace`;
        ctx.globalAlpha = m.alpha;
        ctx.fillText(m.char, m.x, m.y);
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Matte Charcoal Subdued Mesh */}
      <div ref={vantaRef} className="absolute inset-0 opacity-30" />

      {/* Ancient Settling Dust Shader */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Atmospheric Perimeter Darkness */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 35%, transparent 40%, rgba(10, 11, 12, 0.9) 100%)',
        }}
      />
    </div>
  );
}
