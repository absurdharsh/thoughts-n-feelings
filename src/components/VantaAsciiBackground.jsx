import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';

const MINERAL_THEMES = {
  basalt: {
    netColor: 0x222220,
    bg: 0x0a0a09,
    dust: '#d8d2c4',
    dustDim: 'rgba(216, 210, 196, 0.07)',
    sedimentAccent: 'rgba(216, 210, 196, 0.25)',
  },
  slate: {
    netColor: 0x1e2229,
    bg: 0x0c0e12,
    dust: '#c7d0dc',
    dustDim: 'rgba(199, 208, 220, 0.07)',
    sedimentAccent: 'rgba(199, 208, 220, 0.25)',
  },
  limestone: {
    netColor: 0x2b2721,
    bg: 0x0e0d0b,
    dust: '#e4ddcf',
    dustDim: 'rgba(228, 221, 207, 0.07)',
    sedimentAccent: 'rgba(228, 221, 207, 0.25)',
  },
  obsidian: {
    netColor: 0x181818,
    bg: 0x050505,
    dust: '#b0aba2',
    dustDim: 'rgba(176, 171, 162, 0.06)',
    sedimentAccent: 'rgba(176, 171, 162, 0.2)',
  },
};

export default function VantaAsciiBackground({ theme = 'basalt' }) {
  const vantaRef = useRef(null);
  const canvasRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  // 1. Initialize Vanta.js deep mineral sediment grid
  useEffect(() => {
    let effect = null;
    const currentTheme = MINERAL_THEMES[theme] || MINERAL_THEMES.basalt;

    try {
      if (typeof window !== 'undefined') {
        window.THREE = THREE;
      }
      if (!vantaEffectRef.current && vantaRef.current) {
        effect = NET({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: currentTheme.netColor,
          backgroundColor: currentTheme.bg,
          points: 6.0,          // Subdued sparse stone lattice
          maxDistance: 16.0,
          spacing: 24.0,
          showDots: true,
        });
        vantaEffectRef.current = effect;
      } else if (vantaEffectRef.current) {
        vantaEffectRef.current.setOptions({
          color: currentTheme.netColor,
          backgroundColor: currentTheme.bg,
        });
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
  }, [theme]);

  // 2. Overlay subtle ancient dust motes & mineral sedimentation shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const currentTheme = MINERAL_THEMES[theme] || MINERAL_THEMES.basalt;
    const lithicGlyphs = ['·', '°', '‡', '§', '░', '·', '.', '◈', ':', '::', '᛫'];

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Ancient dust mote particles
    const motes = Array.from({ length: 48 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: Math.random() * 0.18 + 0.05, // Slow downward mineral drift
      char: lithicGlyphs[Math.floor(Math.random() * lithicGlyphs.length)],
      alpha: Math.random() * 0.25 + 0.05,
      size: Math.random() > 0.8 ? 13 : 9,
    }));

    let time = 0;

    const render = () => {
      time += 0.008;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.03;

      ctx.clearRect(0, 0, width, height);

      // Render drifting dust motes
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      motes.forEach((m) => {
        m.y += m.vy;
        m.x += m.vx + Math.sin(time + m.y * 0.01) * 0.08;

        if (m.y > height) {
          m.y = -10;
          m.x = Math.random() * width;
        }
        if (m.x < 0) m.x = width;
        if (m.x > width) m.x = 0;

        // Proximity to mouse slight disturbance
        const dx = m.x - mouseRef.current.x * width;
        const dy = m.y - mouseRef.current.y * height;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let alpha = m.alpha;
        if (dist < 120) {
          alpha = Math.min(0.55, m.alpha + (1 - dist / 120) * 0.35);
          ctx.fillStyle = currentTheme.sedimentAccent;
        } else {
          ctx.fillStyle = currentTheme.dust;
        }

        ctx.font = `${m.size}px "JetBrains Mono", monospace`;
        ctx.globalAlpha = alpha;
        ctx.fillText(m.char, m.x, m.y);
      });

      // Subtle atmospheric peripheral vignette
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subdued Vanta Basalt Mesh */}
      <div ref={vantaRef} className="absolute inset-0 opacity-40" />

      {/* Lithic Sediment & Dust Shader */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Ancient Underground Chamber Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 45%, rgba(6, 6, 6, 0.85) 100%)',
        }}
      />
    </div>
  );
}
