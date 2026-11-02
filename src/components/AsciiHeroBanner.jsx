import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Sparkles, BookOpen, Volume2, VolumeX, Eye, Shield, ArrowDown, PenTool } from 'lucide-react';
import { sound } from '../utils/audio';

const ASCII_LOGO_LARGE = `
  _   _                       _     _                  __           _ _                 
 | |_| |__   ___  _   _  __ _| |__ | |_ ___       _ __  / _| ___  ___| (_)_ __   __ _ ___ 
 | __| '_ \\ / _ \\| | | |/ _\` | '_ \\| __/ __| ____| '_ \\| |_ / _ \\/ _ \\ | | '_ \\ / _\` / __|
 | |_| | | | (_) | |_| | (_| | | | | |_\\__ \\_____| | | |  _|  __/  __/ | | | | | (_| \\__ \\
  \\__|_| |_|\\___/ \\__,_|\\__, |_| |_|\\__|___/     |_| |_|_|  \\___|\\___|_|_|_| |_|\\__, |___/
                        |___/                                                   |___/     
`;

const ASCII_LOGO_SMALL = `
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |  T H O U G H T S  -  N  -  F E E L I N G S  |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`;

const MOTTO_CYCLES = [
  "unfiltered consciousness dumped straight into the parchment buffer.",
  "i think more than i feel so don't expect frequent updates lowk.",
  "we hear not even a leaf can fall without God's will. so why prosecute my sins?",
  "plants get value from animals, animals from us, and we are eaten by God.",
  "watch me as i come to life when someone takes your name on my grave.",
  "one thing i do wanna do is that i want to make this pretty with css so we DOING THAT SHIT FRFR."
];

export default function AsciiHeroBanner({ 
  onInscribeClick, 
  onScrollToLedger, 
  soundEnabled, 
  onToggleSound,
  themeColor = '#c5a059'
}) {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [cursorBlink, setCursorBlink] = useState(true);

  // Typewriter effect for motto
  useEffect(() => {
    const currentMotto = MOTTO_CYCLES[textIndex];
    let timer;

    if (!isDeleting && displayText.length < currentMotto.length) {
      timer = setTimeout(() => {
        setDisplayText(currentMotto.slice(0, displayText.length + 1));
      }, 35);
    } else if (!isDeleting && displayText.length === currentMotto.length) {
      timer = setTimeout(() => setIsDeleting(true), 3800);
    } else if (isDeleting && displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(currentMotto.slice(0, displayText.length - 1));
      }, 18);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % MOTTO_CYCLES.length);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex]);

  // Blinking cursor timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorBlink((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const triggerGlitch = () => {
    sound.playClick(1.4);
    setGlitchTitle(true);
    setTimeout(() => setGlitchTitle(false), 240);
  };

  return (
    <header id="hero" className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 py-16 text-center select-none overflow-hidden">
      {/* Decorative Top Border Bar */}
      <div className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between text-xs font-mono text-zinc-500 border-b border-zinc-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-zinc-400">LEDGER://THOUGHTS-N-FEELINGS.LOG</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          <span>PORT: 5173</span>
          <span>PARCHMENT_STATE: FLUID</span>
          <span className="text-[#c5a059]">v2.4.0-DEV</span>
        </div>
      </div>

      {/* Retro Book & Terminal Frame Box */}
      <div 
        onClick={triggerGlitch}
        className="w-full max-w-4xl mx-auto p-4 sm:p-8 rounded-lg bg-black/40 backdrop-blur-md border border-[#c5a059]/30 shadow-[0_0_50px_rgba(197,160,89,0.06)] hover:border-[#c5a059]/60 transition-all duration-300 cursor-pointer group"
      >
        {/* Frame corner brackets */}
        <div className="relative">
          <div className="text-zinc-600 font-mono text-xs text-left mb-2 flex justify-between items-center">
            <span>+--[ PROTOCOL: ANTHROPOLOGY_OF_MIND ]-------------------------+</span>
            <span className="text-zinc-500 hidden md:inline">CLICK TO GLITCH</span>
          </div>

          {/* ASCII Banner - Desktop Large */}
          <pre 
            className={`hidden md:block font-mono text-[10.5px] leading-[13px] tracking-tight whitespace-pre font-bold transition-all duration-150 ${
              glitchTitle 
                ? 'text-red-400 translate-x-1 skew-x-2 blur-[0.5px]' 
                : 'text-[#c5a059] group-hover:text-[#e5d7ba]'
            }`}
            style={{ textShadow: '0 0 12px rgba(197, 160, 89, 0.4)' }}
          >
            {ASCII_LOGO_LARGE}
          </pre>

          {/* ASCII Banner - Mobile Compact */}
          <pre 
            className={`block md:hidden font-mono text-xs leading-tight whitespace-pre font-bold text-[#c5a059] ${
              glitchTitle ? 'text-red-400 translate-x-1' : ''
            }`}
          >
            {ASCII_LOGO_SMALL}
          </pre>

          <div className="text-zinc-600 font-mono text-xs text-right mt-2">
            <span>+--------------------------------------------------------------+</span>
          </div>
        </div>

        {/* Dynamic Typewriter Stream */}
        <div className="mt-6 min-h-[4rem] flex items-center justify-center font-mono text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto px-4">
          <span className="text-[#c5a059] mr-2 font-bold">&gt;</span>
          <span className="italic tracking-wide">{displayText}</span>
          <span 
            className={`inline-block w-2.5 h-5 ml-1 bg-[#c5a059] align-middle ${
              cursorBlink ? 'opacity-100' : 'opacity-0'
            }`} 
          />
        </div>

        {/* Author & Context Badge */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-zinc-400">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            Author: <a href="https://www.instagram.com/absurdnigga" target="_blank" rel="noreferrer" className="text-[#c5a059] hover:underline" onClick={(e) => e.stopPropagation()}>absurdharsh</a>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            Inclusions: Ishika's Theorem & Clare Harner
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-semibold">
            Status: Synchronized Infinite Scroll
          </span>
        </div>
      </div>

      {/* Interactive Action Hub (React.bit magnetic / micro-interactions) */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => {
            sound.playFold();
            onScrollToLedger();
          }}
          className="group relative px-6 py-3 rounded bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/40 hover:border-[#c5a059] text-[#e5d7ba] font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-[#c5a059]/5 hover:shadow-[#c5a059]/20"
        >
          <BookOpen className="w-4 h-4 text-[#c5a059] group-hover:scale-110 transition-transform" />
          <span>Read Digital Ledger</span>
          <ArrowDown className="w-3.5 h-3.5 text-[#c5a059] animate-bounce" />
        </button>

        <button
          onClick={() => {
            sound.playClick(1.2);
            onInscribeClick();
          }}
          className="group relative px-6 py-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center space-x-2"
        >
          <PenTool className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Inscribe New Entry</span>
        </button>

        <button
          onClick={() => {
            onToggleSound();
          }}
          className={`px-4 py-3 rounded border font-mono text-xs flex items-center space-x-2 transition-all duration-200 ${
            soundEnabled 
              ? 'bg-amber-950/30 border-amber-500/60 text-amber-300' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Warm Retro CRT / Ambient Hum"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'HUM: ACTIVE' : 'HUM: MUTED'}</span>
        </button>
      </div>

      {/* Decorative spine scroll indicator */}
      <div className="mt-12 flex flex-col items-center text-zinc-600 font-mono text-xs space-y-1">
        <span className="tracking-widest uppercase text-[10px] text-zinc-500">SCROLL TO TURN PARCHMENT</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#c5a059] to-transparent animate-pulse" />
      </div>
    </header>
  );
}

