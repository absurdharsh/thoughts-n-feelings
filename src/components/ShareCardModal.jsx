import React, { useState, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  DoodleStar,
  DoodleSpiral,
  DoodleEye,
  DoodleSpark,
  DoodleArrowDown
} from './HandDrawnDoodles';

/**
 * Publication-Grade Shareable Quote Card Generator
 * Formats thoughts into balanced, publication-ready cards for Instagram Stories (9:16)
 * and Square Posts (1:1) with exact typographic hierarchy, safe margins, and zero clipping.
 */
export default function ShareCardModal({
  isOpen,
  onClose,
  entry,
  assignedNumber,
  displayDate
}) {
  const [aspectRatio, setAspectRatio] = useState('story'); // 'story' (9:16) | 'square' (1:1)
  const [cardTheme, setCardTheme] = useState('light'); // 'light' | 'dark'
  const [isExporting, setIsExporting] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState('');
  const cardRef = useRef(null);

  if (!isOpen || !entry) return null;

  // Format clean counter number (e.g. "01", "14")
  const cleanNumber = String(
    assignedNumber || entry.number || (entry.id && String(entry.id).replace('entry-', '')) || '01'
  ).padStart(2, '0');

  // Clean author name
  const authorName = entry.author ? entry.author.replace(/^[-—]\s*/, '').trim() : 'absurdharsh';

  // Render margin doodle (supports both SVG doodles and custom Base64 drawings)
  const renderDoodle = (doodleType) => {
    if (typeof doodleType === 'string' && doodleType.startsWith('data:image')) {
      return (
        <img
          src={doodleType}
          alt="doodle"
          className={`w-9 h-9 sm:w-10 sm:h-10 object-contain select-none ${
            cardTheme === 'dark' ? 'invert' : ''
          }`}
        />
      );
    }
    const cls = 'w-9 h-9 sm:w-10 sm:h-10 text-current opacity-85';
    switch (doodleType) {
      case 'star':
        return <DoodleStar className={cls} />;
      case 'spiral':
        return <DoodleSpiral className={cls} />;
      case 'eye':
        return <DoodleEye className={cls} />;
      case 'spark':
        return <DoodleSpark className={cls} />;
      default:
        return <DoodleArrowDown className={cls} />;
    }
  };

  // Wait for web fonts and snapshot card with high-resolution pixel ratio
  const getCardImageBlob = async () => {
    if (!cardRef.current) throw new Error('Card element not found');

    // 1. Wait for all document fonts (Google Fonts cursive, serif, mono) to load
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Micro-tick to allow layout and font-metrics to settle
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 3. Render at pixelRatio 3 (360px * 3 = 1080px width)
    const blob = await toBlob(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: cardTheme === 'dark' ? '#0D0D0D' : '#F9F8F3',
      style: {
        transform: 'none',
        margin: '0'
      }
    });

    return blob;
  };

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setCopiedNotification('');

    try {
      const blob = await getCardImageBlob();
      if (!blob) throw new Error('Failed to generate image blob');

      const url = URL.createObjectURL(blob);
      const safeTitle = (entry.title || 'thought')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);

      const link = document.createElement('a');
      link.download = `thoughts-n-feelings-${safeTitle}-${aspectRatio}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setCopiedNotification('✓ image downloaded (1080px high-res)!');
      setTimeout(() => setCopiedNotification(''), 3200);
    } catch (err) {
      console.error('[Share Card] Error generating card image:', err);
      setCopiedNotification('failed to export image');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setCopiedNotification('');

    try {
      const blob = await getCardImageBlob();
      if (!blob) throw new Error('Could not create image blob');

      const file = new File([blob], 'thought-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `“${entry.title}” · thoughts 'n' feelings`,
          text: `“${entry.title}” — ${authorName}`
        });
        setCopiedNotification('✓ shared to app!');
      } else if (navigator.share) {
        await navigator.share({
          title: `“${entry.title}” · thoughts 'n' feelings`,
          text: `“${entry.title}”\n\n${entry.content}\n\n— ${authorName}`
        });
        setCopiedNotification('✓ shared text!');
      } else {
        await handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Share Card] Native share error:', err);
        await handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic typography scale based on content length to prevent clipping in 9:16 and 1:1
  const rawContent = (entry.content || '').trim();
  const charCount = rawContent.length;
  const paragraphs = rawContent.split('\n\n').filter(Boolean);

  const bodySizeClass =
    charCount > 450
      ? 'text-xs sm:text-sm leading-[1.65]'
      : charCount > 250
      ? 'text-sm sm:text-base leading-[1.7]'
      : 'text-base sm:text-lg leading-[1.75]';

  const cleanTitle = entry.title.replace(/^["“]|["”]$/g, '').trim();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Publication-grade shareable quote card modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-paper dark:bg-darkPaper text-ink dark:text-darkInk p-5 sm:p-7 relative shadow-2xl wobbly-paper-border my-auto max-h-[96vh] overflow-y-auto"
        style={{ borderRadius: '2px 4px 2px 5px' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink/20 dark:border-darkInk/20">
          <div>
            <h3 className="font-editorial italic text-2xl sm:text-3xl font-bold tracking-tight">
              shareable quote card
            </h3>
            <p className="font-handwritten text-xs sm:text-sm opacity-60">
              editorial typesetting for Instagram Stories (9:16) & Square Posts (1:1)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="naked-link font-handwritten text-xl opacity-60 hover:opacity-100 cursor-pointer"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Customization Controls: Format & Theme */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-ink/10 dark:border-darkInk/10 font-handwritten text-sm">
          {/* Format Selector */}
          <div className="flex items-center gap-2">
            <span className="opacity-50 select-none">format:</span>
            <button
              type="button"
              onClick={() => setAspectRatio('story')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                aspectRatio === 'story'
                  ? 'border-ink dark:border-darkInk bg-ink text-paper dark:bg-darkInk dark:text-darkPaper font-bold'
                  : 'border-ink/20 dark:border-darkInk/20 opacity-70 hover:opacity-100'
              }`}
            >
              Story (9:16)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('square')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                aspectRatio === 'square'
                  ? 'border-ink dark:border-darkInk bg-ink text-paper dark:bg-darkInk dark:text-darkPaper font-bold'
                  : 'border-ink/20 dark:border-darkInk/20 opacity-70 hover:opacity-100'
              }`}
            >
              Square Post (1:1)
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="opacity-50 select-none">paper:</span>
            <button
              type="button"
              onClick={() => setCardTheme('light')}
              className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                cardTheme === 'light'
                  ? 'border-[#111111] bg-[#F9F8F3] text-[#111111] font-bold shadow-xs'
                  : 'border-ink/20 opacity-60 hover:opacity-100'
              }`}
            >
              cream paper
            </button>
            <button
              type="button"
              onClick={() => setCardTheme('dark')}
              className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                cardTheme === 'dark'
                  ? 'border-[#F5F5F5] bg-[#0D0D0D] text-[#F5F5F5] font-bold shadow-xs'
                  : 'border-ink/20 opacity-60 hover:opacity-100'
              }`}
            >
              ink black
            </button>
          </div>
        </div>

        {/* Card Canvas Container (Scaled interactive live preview) */}
        <div className="flex justify-center items-center py-5 bg-ink/5 dark:bg-darkInk/5 rounded my-3 overflow-hidden">
          <div
            ref={cardRef}
            style={{
              backgroundColor: cardTheme === 'dark' ? '#0D0D0D' : '#F9F8F3',
              color: cardTheme === 'dark' ? '#F5F5F5' : '#111111',
              width: '360px',
              height: aspectRatio === 'story' ? '640px' : '360px',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
            className={`relative shadow-xl border border-current/15 select-none box-border ${
              aspectRatio === 'story'
                ? 'pt-8 pb-9 px-7' // Instagram Story safe margins: ~80px top, ~96px bottom, ~56px side in 3x scale
                : 'p-7' // Square post balanced margins
            }`}
          >
            {/* Top Header: № Counter · Category on Left, Margin Doodle on Right */}
            <header className="w-full flex items-center justify-between pb-2">
              <div className="flex items-center gap-2 font-medium">
                {/* Folio in Serif */}
                <span className="font-editorial italic text-xl font-bold tracking-normal">
                  № {cleanNumber}
                </span>

                {/* Delicate Divider Dot */}
                <span className="opacity-35 select-none font-sans text-sm">&bull;</span>

                {/* Tracked-out Category in Monospace Small Caps */}
                <span className="font-mono text-xs uppercase tracking-[0.25em] opacity-80 font-semibold">
                  {entry.type || 'thought'}
                </span>
              </div>

              {/* Hand-Drawn Margin Doodle */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {renderDoodle(entry.doodle)}
              </div>
            </header>

            {/* Central Hero Block: Golden-Ratio Vertically Centered Title & Body */}
            <main className="my-auto py-2 flex flex-col justify-center">
              {/* Confident Italic Serif Title with Curly Quotes */}
              <h4 className="font-editorial italic text-2xl sm:text-3xl font-bold tracking-tight leading-[1.25] mb-4 break-words">
                “{cleanTitle}”
              </h4>

              {/* Body Thought with Warm Natural Line Height */}
              <div className={`font-body ${bodySizeClass} opacity-90 space-y-2.5`}>
                {paragraphs.map((para, i) => (
                  <p key={i} className="break-words">
                    {para}
                  </p>
                ))}
              </div>
            </main>

            {/* Bottom Footer: Attribution Row + Watermark Footnote (Collision-Free) */}
            <footer className="pt-3 border-t border-current/15 flex flex-col gap-2">
              {/* Single Clean Attribution Row */}
              <div className="flex items-baseline justify-between w-full">
                {/* Author Signature */}
                <span className="font-editorial italic text-base sm:text-lg font-bold">
                  — {authorName}
                </span>

                {/* Season & Year */}
                <span className="font-mono text-xs opacity-75 tracking-wider uppercase">
                  {displayDate || 'Autumn 2026'}
                </span>
              </div>

              {/* Discreet Brand Watermark with Strict Margin Separation */}
              <div className="text-[10px] opacity-45 tracking-[0.25em] text-center pt-1 font-mono uppercase select-none">
                thoughts 'n' feelings &bull; absurdharsh
              </div>
            </footer>
          </div>
        </div>

        {copiedNotification && (
          <p className="text-center font-handwritten text-sm text-green-700 dark:text-green-400 mb-2">
            {copiedNotification}
          </p>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-4 pt-2 font-handwritten text-base">
          <button
            type="button"
            onClick={onClose}
            className="naked-link opacity-60 hover:opacity-100 cursor-pointer"
          >
            close
          </button>

          {/* Mobile Native Share Sheet */}
          {typeof navigator !== 'undefined' && (navigator.share || navigator.canShare) && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isExporting}
              className="naked-link scribble-hover font-bold text-ink dark:text-darkInk cursor-pointer"
              title="Share directly to Instagram Stories or WhatsApp"
            >
              {isExporting ? 'preparing card...' : 'share to story ↗'}
            </button>
          )}

          {/* High-Resolution PNG Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="naked-link scribble-hover font-editorial italic text-lg sm:text-xl font-bold text-ink dark:text-darkInk cursor-pointer"
          >
            {isExporting ? 'rendering image...' : 'download card ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
