import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';

const THEME_COLORS = {
  parchment: { netColor: 0xc5a059, bg: 0x08090c, ascii: '#c5a059', asciiDim: 'rgba(197, 160, 89, 0.12)' },
  emerald: { netColor: 0x00ff66, bg: 0x050d08, ascii: '#00ff66', asciiDim: 'rgba(0, 255, 102, 0.12)' },
  amber: { netColor: 0xffb000, bg: 0x0c0802, ascii: '#ffb000', asciiDim: 'rgba(255, 176, 0, 0.12)' },
  cyan: { netColor: 0x00e5ff, bg: 0x040b10, ascii: '#00e5ff', asciiDim: 'rgba(0, 229, 255, 0.12)' },
};

export default function VantaAsciiBackground({ theme = 'parchment' }) {
  const vantaRef = useRef(null);
  const canvasRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  // 1. Initialize Vanta.js NET background with low opacity
  useEffect(() => {
    let effect = null;
    const currentTheme = THEME_COLORS[theme] || THEME_COLORS.parchment;

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
          points: 8.0,
          maxDistance: 20.0,
          spacing: 16.0,
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
      console.warn("Vanta background fallback to Canvas ASCII:", err);
    }

    return () => {
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch (e) {
          // ignore cleanup err
        }
        vantaEffectRef.current = null;
      }
    };
  }, [theme]);

  // 2. Overlay dynamic Canvas ASCII art matrix layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const glyphs = ['+', '-', '*', '.', ':', '/', '|', '\\', '[', ']', '#', '%', '=', '~', '0', '1', '§', '°'];
    const currentTheme = THEME_COLORS[theme] || THEME_COLORS.parchment;

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

    // Grid config
    const cellSize = 32;
    let time = 0;

    const render = () => {
      time += 0.015;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      ctx.font = '11px "Share Tech Mono", "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mouseCol = mouseRef.current.x * cols;
      const mouseRow = mouseRef.current.y * rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = c - mouseCol;
          const dy = r - mouseRow;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);

          // Mathematical noise & wave disturbance
          const wave = Math.sin(c * 0.15 + time) * Math.cos(r * 0.15 + time);
          const activeThreshold = 0.55;

          if (wave > activeThreshold || distToMouse < 6) {
            const glyphIndex = Math.abs(Math.floor((wave + distToMouse * 0.3) * 10)) % glyphs.length;
            const char = glyphs[glyphIndex];

            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;

            if (distToMouse < 6) {
              const alpha = (1 - distToMouse / 6) * 0.7 + 0.1;
              ctx.fillStyle = currentTheme.ascii;
              ctx.globalAlpha = alpha;
              ctx.fillText(char, x, y);
            } else {
              ctx.fillStyle = currentTheme.ascii;
              ctx.globalAlpha = 0.08 + Math.abs(wave) * 0.12;
              ctx.fillText(char, x, y);
            }
          }
        }
      }

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
      {/* Vanta.js 3D Net container with opacity blending */}
      <div 
        ref={vantaRef} 
        className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-1000"
      />

      {/* Retro Canvas ASCII Grid Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen"
      />

      {/* Subtle retro vignette & noise texture */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(6, 7, 10, 0.85) 100%)',
        }}
      />
    </div>
  );
}
