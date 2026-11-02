import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';

const MONUMENTAL_ASCII_HEADER = `
  +==============================================================================+
  |                                                                              |
  |   ████████╗██╗  ██╗ ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗████████╗███████╗      |
  |   ╚══██╔══╝██║  ██║██╔═══██╗██║   ██║██╔════╝ ██║  ██║╚══██╔══╝██╔════╝      |
  |      ██║   ███████║██║   ██║██║   ██║██║  ███╗███████║   ██║   ███████╗      |
  |      ██║   ██╔══██║██║   ██║██║   ██║██║   ██║██╔══██║   ██║   ╚════██║      |
  |      ██║   ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║   ██║   ███████║      |
  |      ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝      |
  |                                                                              |
  |                     T H O U G H T S   ' N '   F E E L I N G S                |
  |                         M O N U M E N T U M   D I G I T A L E                |
  |                   A N N O   M M X X V I   &bull;   A B S U R D H A R S H     |
  +==============================================================================+
`;

const MONUMENT_MOTTOES = [
  "Not even a leaf can fall without divine decree. So why prosecute my sins?",
  "Plants nourish animals, animals nourish humans, and humans are consumed by God.",
  "Watch me as I come to life when someone speaks your name upon my grave.",
  "I think more than I feel, so do not expect frequent updates upon this stone.",
  "Even your shadow departs from you when surrounded by darkness.",
  "Do not stand by my grave and weep; I am not there, I did not die."
];

export default function AsciiHeroBanner({ 
  onInscribeClick, 
  onScrollToLedger, 
  soundEnabled, 
  onToggleSound 
}) {
  const [mottoIndex, setMottoIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [chiseled, setChiseled] = useState(false);

  // Slow, solemn stone chisel typewriter reveal
  useEffect(() => {
    const currentMotto = MONUMENT_MOTTOES[mottoIndex];
    let timer;

    if (!isDeleting && displayText.length < currentMotto.length) {
      timer = setTimeout(() => {
        setDisplayText(currentMotto.slice(0, displayText.length + 1));
      }, 42);
    } else if (!isDeleting && displayText.length === currentMotto.length) {
      timer = setTimeout(() => setIsDeleting(true), 4200);
    } else if (isDeleting && displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(currentMotto.slice(0, displayText.length - 1));
      }, 20);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setMottoIndex((prev) => (prev + 1) % MONUMENT_MOTTOES.length);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, mottoIndex]);

  const handleChiselStrike = () => {
    sound.playClick(1.0);
    setChiseled(true);
    setTimeout(() => setChiseled(false), 220);
  };

  return (
    <header id="hero" className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 py-16 text-center select-none">
      {/* Top Epigraphic Ledger Header */}
      <div className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between font-mono text-[11px] text-[#73716b] border-b border-[#262523] pb-2.5">
        <div className="flex items-center space-x-2.5">
          <span className="w-1.5 h-1.5 bg-[#d8d2c4] rounded-none opacity-80" />
          <span className="tracking-[0.2em] uppercase text-[#a39f96]">TABULA I &bull; EX ARCHIVO BASALTICO</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4 tracking-widest text-[#73716b]">
          <span>STATUS: PETRIFICATUS</span>
          <span>&bull;</span>
          <span>ORDO: CHRONOLOGICUS</span>
        </div>
      </div>

      {/* Main Basalt Stele Monolith */}
      <div 
        onClick={handleChiselStrike}
        className={`w-full max-w-4xl mx-auto p-6 sm:p-10 stone-slab stone-grain border border-[#2e2d29] transition-all duration-300 cursor-pointer ${chiseled ? 'scale-[0.998] border-[#44423d]' : 'hover:border-[#3a3934]'}`}
      >
        {/* Stele Top Keystone / Architectural Header */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#73716b] border-b border-[#22211f] pb-3 mb-6">
          <span className="tracking-widest">‡ CODEX LAPIDARIS ‡</span>
          <span className="tracking-widest font-serif text-[#94928b]">EPIGRAPHIA ABSURDHARSH</span>
          <span className="tracking-widest">‡ MCMXXVI ‡</span>
        </div>

        {/* Monumental ASCII Slab (Responsive) */}
        <div className="overflow-x-auto py-2">
          <pre className="font-mono text-[9px] sm:text-[11px] md:text-[12px] leading-[1.25] text-[#d8d2c4] carved-text font-bold inline-block mx-auto select-none opacity-95">
{MONUMENTAL_ASCII_HEADER}
          </pre>
        </div>

        {/* Subtitle / Architectural Inscription */}
        <div className="my-6 space-y-2">
          <p className="font-display text-xs sm:text-sm tracking-[0.28em] text-[#94928b] uppercase">
            A Living Monument of Consciousness, Paradox & Mortality
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#44423d] to-transparent mx-auto my-3" />
        </div>

        {/* Chiseled Motto Typewriter Display */}
        <div className="min-h-[58px] flex items-center justify-center px-4 py-3 bg-[#0d0d0c] border border-[#22211f] stone-inset">
          <span className="font-mono text-xs text-[#73716b] mr-2">§</span>
          <p className="font-serif italic text-base sm:text-lg text-[#e5e0d8] carved-text max-w-2xl leading-relaxed">
            “{displayText}”<span className="inline-block w-1.5 h-4 bg-[#d8d2c4] ml-1 translate-y-[2px] animate-pulse" />
          </p>
          <span className="font-mono text-xs text-[#73716b] ml-2">§</span>
        </div>

        {/* Monolithic Action Slabs */}
        <div className="mt-8 pt-6 border-t border-[#22211f] flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick(1.2);
              onInscribeClick();
            }}
            className="stone-btn px-6 py-2.5 font-display tracking-widest text-xs uppercase flex items-center space-x-2"
          >
            <span>Inscribe Stone</span>
            <span className="font-mono text-[10px] text-[#73716b]">✍</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playFold();
              onScrollToLedger();
            }}
            className="stone-btn px-6 py-2.5 font-display tracking-widest text-xs uppercase flex items-center space-x-2 text-[#94928b]"
          >
            <span>Descend into Codex</span>
            <span className="font-mono text-[10px]">▼</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            className="stone-btn px-4 py-2.5 font-display tracking-wider text-xs uppercase text-[#73716b] hover:text-[#e5e0d8]"
            title="Toggle Mineral Resonance"
          >
            <span>{soundEnabled ? 'Chamber Resonance [ON]' : 'Resonance [OFF]'}</span>
          </button>
        </div>

        {/* Bottom Stone Seal */}
        <div className="mt-6 text-[9px] font-mono text-[#52504b] tracking-[0.25em] uppercase">
          [ EX NIHILO NIHIL FIT &bull; CARVED INTO RECTANGULAR BASALT ]
        </div>
      </div>
    </header>
  );
}
