import React, { useState, useEffect } from 'react';
import GreekMeanderDivider from './GreekMeanderDivider';
import { sound } from '../utils/audio';

const MONUMENTAL_ASCII_HEADER = `
  ╔══════════════════════════════════════════════════════════════════════════════╗
  ║                                                                              ║
  ║   ████████╗██╗  ██╗ ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗████████╗███████╗      ║
  ║   ╚══██╔══╝██║  ██║██╔═══██╗██║   ██║██╔════╝ ██║  ██║╚══██╔══╝██╔════╝      ║
  ║      ██║   ███████║██║   ██║██║   ██║██║  ███╗███████║   ██║   ███████╗      ║
  ║      ██║   ██╔══██║██║   ██║██║   ██║██║   ██║██╔══██║   ██║   ╚════██║      ║
  ║      ██║   ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║   ██║   ███████║      ║
  ║      ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝      ║
  ║                                                                              ║
  ║                       T H O U G H T S   ' N '   F E E L I N G S              ║
  ║                           M O N U M E N T U M   D I G I T A L E              ║
  ║                     A N N O   M M X X V I   ‡   A B S U R D H A R S H        ║
  ╚══════════════════════════════════════════════════════════════════════════════╝
`;

const MONUMENT_MOTTOES = [
  "Not even a leaf can fall without divine decree. So why prosecute my sins?",
  "Plants nourish animals, animals nourish humans, and humans are consumed by God.",
  "Watch me as I come to life when someone speaks your name upon my grave.",
  "I think more than I feel, so do not expect frequent updates upon this stone.",
  "Even your shadow departs from you when you are surrounded by darkness.",
  "Do not stand by my grave and weep; I am not there, I did not die."
];

export default function AsciiHeroBanner({ 
  onInscribeClick, 
  onScrollToLedger, 
  soundEnabled, 
  onToggleSound 
}) {
  const [mottoIndex, setMottoIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  // Slow, quiet dust-clearing fade for mottoes (no neon typewriter)
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setMottoIndex((prev) => (prev + 1) % MONUMENT_MOTTOES.length);
        setFadeState(true);
      }, 500);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const handleStoneTap = () => {
    sound.playClick(1.0);
  };

  return (
    <header className="relative pt-16 pb-8 px-4 text-center select-none">
      {/* Stele Top Archaeological Marker */}
      <div className="flex items-center justify-between font-mono text-[10px] text-[#8c867a] border-b border-[#36373b]/60 pb-3 mb-8 tracking-[0.25em] uppercase">
        <div className="flex items-center space-x-2">
          <span>◈</span>
          <span>STELE NO. I &bull; EX ARCHIVO ABSURDHARSH</span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-[#736f66]">
          <span>LAPIS BASALTICUS</span>
          <span>&bull;</span>
          <span>AETERNITAS</span>
        </div>
      </div>

      {/* Primary Chiseled Monolith Title (Antique Typeface Specimen) */}
      <div onClick={handleStoneTap} className="cursor-pointer group py-4">
        <h1 className="antique-title text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.12em] uppercase leading-none select-none">
          thoughts<br />'n'<br />feelings
        </h1>

        <p className="mt-4 font-mono text-[11px] sm:text-xs tracking-[0.3em] uppercase text-[#9c9679]">
          [ MONUMENTUM DIGITALE &bull; MMXXVI ]
        </p>
      </div>

      {/* Greek Key Meander Divider Band */}
      <GreekMeanderDivider className="my-6" />

      {/* Carved ASCII Monumental Tabula */}
      <div className="overflow-x-auto py-2">
        <pre className="font-mono text-[9px] sm:text-[10px] md:text-[11px] leading-[1.25] text-[#d8d2c4] carved-text inline-block mx-auto select-none opacity-90">
{MONUMENTAL_ASCII_HEADER}
        </pre>
      </div>

      {/* Dust-Clearing Motto Inscription (Quiet & Grounded) */}
      <div className="my-8 max-w-2xl mx-auto px-6 py-4 bg-[#1a1b1d] border-y border-[#36373b] stone-inset">
        <p className={`font-serif italic text-base sm:text-lg text-[#d8d2c4] carved-text leading-relaxed transition-opacity duration-500 ${fadeState ? 'opacity-100' : 'opacity-0'}`}>
          “{MONUMENT_MOTTOES[mottoIndex]}”
        </p>
      </div>

      {/* Recessed Stone Inlays (Buttons) */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            sound.playClick(1.2);
            onInscribeClick();
          }}
          className="stone-inlay-btn px-6 py-2.5 flex items-center space-x-2"
        >
          <span>INSCRIBE STELE</span>
          <span className="text-[#9c9679]">‡</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playFold();
            onScrollToLedger();
          }}
          className="stone-inlay-btn px-6 py-2.5 flex items-center space-x-2 text-[#8c867a]"
        >
          <span>DESCEND INTO CORPUS</span>
          <span className="text-[10px]">▼</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick(1.0);
            onToggleSound();
          }}
          className="stone-inlay-btn px-4 py-2.5 text-[#8c867a] hover:text-[#d8d2c4]"
          title="Toggle Subterranean Acoustic Resonance"
        >
          <span>{soundEnabled ? 'RESONANCE [ON]' : 'RESONANCE [OFF]'}</span>
        </button>
      </div>
    </header>
  );
}
