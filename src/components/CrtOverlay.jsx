import React from 'react';

export default function CrtOverlay({ enabled = true, theme = 'basalt' }) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Micro-mineral stippling grain */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-color-dodge"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 0)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Ancient lapidary edge erosion shadow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 140px rgba(0, 0, 0, 0.92), inset 0 0 50px rgba(0, 0, 0, 0.98)',
        }}
      />
    </div>
  );
}
