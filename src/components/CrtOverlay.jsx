import React from 'react';

/**
 * Ancient Mineral Surface & Chamber Atmosphere Overlay
 * Pure stone pitting and natural subterranean darkness vignette.
 * Zero CRT scanlines, zero cathode ray beams.
 */
export default function CrtOverlay({ enabled = true }) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* Microscopic stone surface pitting */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Subterranean chamber room darkness vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.95), inset 0 0 60px rgba(0, 0, 0, 0.98)',
        }}
      />
    </div>
  );
}
