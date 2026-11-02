import React from 'react';

export default function CrtOverlay({ enabled = true, theme = 'parchment' }) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Scanline bars */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.75) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04))',
          backgroundSize: '100% 3px, 6px 100%',
        }}
      />

      {/* Moving CRT beam line */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-gradient-to-b from-transparent via-white to-transparent h-20 animate-scanline" />

      {/* Heavy CRT curvature vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.95)',
        }}
      />
    </div>
  );
}

