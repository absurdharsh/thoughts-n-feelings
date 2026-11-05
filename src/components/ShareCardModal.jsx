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

  const cleanTitle = entry.title.replace(/^["“]|["”]$/g, '').trim();

  // 1. Dynamic Heading Scaling (Based on Title Length)
  // Short Titles (1–22 chars): Large, bold statement size (32px–36px)
  // Medium Titles (23–45 chars): Slightly stepped-down size (26px–30px)
  // Long Titles (46+ chars): Capped at strict minimum floor (never smaller than 22px–24px)
  const isSquare = aspectRatio === 'square';
  const titleLen = cleanTitle.length;
  const bodyLen = charCount;

  let headingSize;
  if (titleLen <= 22) {
    headingSize = isSquare && bodyLen > 250 ? 30 : 34;
  } else if (titleLen <= 45) {
    headingSize = isSquare && bodyLen > 250 ? 25 : 28;
  } else {
    headingSize = 23;
  }

  // 2. Dynamic Body Scaling (Based on Body Character Length)
  // Short / Punchy Quotes (under 100 chars): Generous font size (22px–24px), relaxed line spacing (1.75)
  // Medium Thoughts (100–280 chars): Balanced reading size (18px–20px), comfortable line spacing (1.65)
  // Long Reflections (280–600+ chars): Step down gently (15px–17px, never smaller than 15px), line spacing (1.5)
  let bodySize;
  let bodyLineHeight;
  if (bodyLen < 100) {
    bodySize = isSquare ? 21 : 23;
    bodyLineHeight = 1.75;
  } else if (bodyLen <= 280) {
    bodySize = isSquare ? 17 : 19;
    bodyLineHeight = 1.65;
  } else {
    bodySize = isSquare ? 15 : 16;
    bodyLineHeight = 1.5;
  }

  // Strict minimum floors
  headingSize = Math.max(22, headingSize);
  bodySize = Math.max(15, bodySize);

  // 3. Contrast Ratio: Heading must always remain at least 1.35x larger than body font size
  if (headingSize < bodySize * 1.35) {
    const maxAllowedBody = Math.floor(headingSize / 1.35);
    if (maxAllowedBody >= 15) {
      bodySize = maxAllowedBody;
    } else {
      headingSize = Math.round(bodySize * 1.35);
    }
  }

  // Author signature size proportional to body
  const authorSize = Math.max(14, Math.round(bodySize * 0.95));

  // 4. Proportional Gaps
  // Enforce a dedicated minimum vertical gap (24px to 32px) between heading and body
  let headingToBodyGap;
  let bodyToAuthorGap;

  if (bodyLen < 100 && titleLen <= 22) {
    headingToBodyGap = isSquare ? 26 : 30; // 28px–32px
    bodyToAuthorGap = isSquare ? 16 : 20;
  } else if (bodyLen > 280 || (isSquare && bodyLen > 180)) {
    headingToBodyGap = isSquare ? 20 : 24; // 20px–24px
    bodyToAuthorGap = isSquare ? 12 : 16;
  } else {
    headingToBodyGap = isSquare ? 24 : 28; // 24px–28px
    bodyToAuthorGap = isSquare ? 14 : 18;
  }

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
                : bodyLen > 250
                ? 'px-7 py-5' // Reduced outer vertical margins for long reflections in square format
                : 'p-7' // Square post balanced margins
            }`}
          >
            {/* Top Header: Category Only on Left, Season + Margin Doodle on Right */}
            <header className="w-full flex items-center justify-between pb-2 flex-shrink-0">
              {/* Category Label in Clean Tracked-out Uppercase Monospace */}
              <div className="flex items-center">
                <span className="font-mono text-xs uppercase tracking-[0.25em] opacity-80 font-semibold">
                  {entry.type || 'thought'}
                </span>
              </div>

              {/* Season & Year aligned horizontally right beside Margin Doodle */}
              <div className="flex-shrink-0 flex items-center gap-2.5">
                <span className="font-mono text-[11px] sm:text-xs opacity-75 tracking-wider uppercase">
                  {displayDate || 'Autumn 2026'}
                </span>
                <div className="flex items-center justify-center">
                  {renderDoodle(entry.doodle)}
                </div>
              </div>
            </header>

            {/* Central Hero Block: Vertically Centered Title, Body & Direct Author Signature */}
            <main
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: '1 1 auto',
                minHeight: 0,
                boxSizing: 'border-box'
              }}
              className="w-full my-auto py-1"
            >
              {/* Confident Italic Serif Title with Clean 1.25 Line-Height & Guaranteed Minimum Flow Gap */}
              <h4
                style={{
                  fontSize: `${headingSize}px`,
                  lineHeight: 1.25,
                  margin: 0,
                  marginBottom: `${headingToBodyGap}px`,
                  display: 'block',
                  width: '100%',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box'
                }}
                className="font-editorial italic font-bold tracking-tight"
              >
                “{cleanTitle}”
              </h4>

              {/* Body Thought with Dynamic Size, Proportional Line Spacing & Sequential Natural Flow */}
              <div
                style={{
                  fontSize: `${bodySize}px`,
                  lineHeight: bodyLineHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: bodyLen > 280 ? '8px' : '10px',
                  boxSizing: 'border-box'
                }}
                className="font-body opacity-90"
              >
                {paragraphs.map((para, i) => (
                  <p key={i} style={{ margin: 0, padding: 0 }} className="break-words">
                    {para}
                  </p>
                ))}
              </div>

              {/* Author Signature Directly Below Thought Body with Proportional Gap */}
              <div
                style={{
                  marginTop: `${bodyToAuthorGap}px`,
                  boxSizing: 'border-box'
                }}
              >
                <span
                  style={{
                    fontSize: `${authorSize}px`
                  }}
                  className="font-editorial italic font-bold opacity-90 inline-block"
                >
                  — {authorName}
                </span>
              </div>
            </main>

            {/* Bottom Footer: thoughts 'n' feelings Centered Cleanly Below Faint Divider Line */}
            <footer className="pt-3 border-t border-current/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] sm:text-[11px] opacity-45 tracking-[0.25em] font-mono uppercase select-none text-center">
                thoughts 'n' feelings
              </span>
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
