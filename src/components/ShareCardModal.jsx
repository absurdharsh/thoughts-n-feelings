import React, { useState, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  DoodleStar,
  DoodleSpiral,
  DoodleEye,
  DoodleSpark,
  DoodleArrowDown,
  DoodleDivider
} from './HandDrawnDoodles';

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

  // Render margin doodle
  const renderDoodle = (doodleType) => {
    if (typeof doodleType === 'string' && doodleType.startsWith('data:image')) {
      return (
        <img
          src={doodleType}
          alt="doodle"
          className={`w-7 h-7 object-contain ${cardTheme === 'dark' ? 'invert' : ''}`}
        />
      );
    }
    const cls = 'w-7 h-7';
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

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setCopiedNotification('');

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: cardTheme === 'dark' ? '#0D0D0D' : '#F9F8F3'
      });

      const safeTitle = (entry.title || 'thought')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);
      const link = document.createElement('a');
      link.download = `thoughts-n-feelings-${safeTitle}-${aspectRatio}.png`;
      link.href = dataUrl;
      link.click();

      setCopiedNotification('✓ image downloaded!');
      setTimeout(() => setCopiedNotification(''), 3000);
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
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: cardTheme === 'dark' ? '#0D0D0D' : '#F9F8F3'
      });

      if (!blob) throw new Error('Could not create image blob');

      const file = new File([blob], 'thought-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `"${entry.title}" · thoughts 'n' feelings`,
          text: `“${entry.title}” — ${entry.author}`
        });
        setCopiedNotification('✓ shared!');
      } else if (navigator.share) {
        await navigator.share({
          title: `"${entry.title}" · thoughts 'n' feelings`,
          text: `“${entry.title}”\n\n${entry.content}\n\n— ${entry.author}`
        });
        setCopiedNotification('✓ shared text!');
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Share Card] Native share error:', err);
        handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Truncate text slightly if super long for graphic display
  const displayContent = entry.content.length > 500
    ? `${entry.content.slice(0, 500).trim()}...`
    : entry.content;

  const paragraphs = displayContent.split('\n\n').filter(Boolean);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Shareable quote card modal"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-paper dark:bg-darkPaper text-ink dark:text-darkInk p-5 sm:p-7 relative shadow-2xl wobbly-paper-border my-auto max-h-[95vh] overflow-y-auto"
        style={{ borderRadius: '2px 4px 2px 5px' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ink/20 dark:border-darkInk/20">
          <div>
            <h3 className="font-editorial italic text-2xl sm:text-3xl font-bold">shareable quote card</h3>
            <p className="font-handwritten text-xs sm:text-sm opacity-60">
              formatted for Instagram Stories, Posts & mobile sharing
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

        {/* Customization Toolbar: Ratio & Theme */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-ink/10 dark:border-darkInk/10 font-handwritten text-sm">
          {/* Ratio Selector */}
          <div className="flex items-center gap-2">
            <span className="opacity-50">format:</span>
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
            <span className="opacity-50">paper:</span>
            <button
              type="button"
              onClick={() => setCardTheme('light')}
              className={`px-2 py-0.5 rounded text-xs border cursor-pointer ${
                cardTheme === 'light'
                  ? 'border-ink bg-[#F9F8F3] text-[#0D0D0D] font-bold'
                  : 'border-ink/20 opacity-60 hover:opacity-100'
              }`}
            >
              light paper
            </button>
            <button
              type="button"
              onClick={() => setCardTheme('dark')}
              className={`px-2 py-0.5 rounded text-xs border cursor-pointer ${
                cardTheme === 'dark'
                  ? 'border-white bg-[#0D0D0D] text-[#F9F8F3] font-bold'
                  : 'border-ink/20 opacity-60 hover:opacity-100'
              }`}
            >
              dark ink
            </button>
          </div>
        </div>

        {/* Card Graphic Preview Canvas Container */}
        <div className="flex justify-center items-center py-4 bg-ink/5 dark:bg-darkInk/5 rounded my-3 overflow-hidden">
          <div
            ref={cardRef}
            style={{
              backgroundColor: cardTheme === 'dark' ? '#0D0D0D' : '#F9F8F3',
              color: cardTheme === 'dark' ? '#F9F8F3' : '#0D0D0D',
              aspectRatio: aspectRatio === 'story' ? '9 / 16' : '1 / 1',
              width: aspectRatio === 'story' ? '300px' : '360px',
              maxWidth: '100%'
            }}
            className="p-6 sm:p-7 flex flex-col justify-between relative shadow-lg border border-current select-none box-border"
          >
            {/* Top Border Framing Lines */}
            <div className="w-full flex items-center justify-between border-b border-current/25 pb-3">
              <div className="flex items-baseline gap-2">
                <span className="font-editorial italic text-2xl font-bold opacity-60">
                  {assignedNumber || entry.number || '01'}.
                </span>
                <span className="font-handwritten text-xs uppercase tracking-widest opacity-70">
                  {entry.type || 'thought'}
                </span>
              </div>
              <div>{renderDoodle(entry.doodle)}</div>
            </div>

            {/* Central Literary Content */}
            <div className="my-auto py-3">
              <h4 className="font-editorial italic text-xl sm:text-2xl font-bold tracking-tight mb-3 leading-snug">
                “{entry.title}”
              </h4>

              <div className="font-body text-xs sm:text-sm leading-relaxed space-y-2 opacity-90">
                {paragraphs.map((para, i) => (
                  <p key={i} className="break-words">
                    {para}
                  </p>
                ))}
              </div>

              {/* Hand-Drawn Divider Accent */}
              <div className="my-3 opacity-40">
                <DoodleDivider className="w-full h-2" />
              </div>
            </div>

            {/* Bottom Inscription & Subtle Brand Watermark */}
            <div className="pt-3 border-t border-current/25 font-handwritten text-xs space-y-1">
              <div className="flex items-baseline justify-between opacity-80">
                <span className="font-editorial italic text-sm font-bold">
                  — {entry.author ? entry.author.replace(/^[-—]\s*/, '') : 'absurdharsh'}
                </span>
                <span className="opacity-60">{displayDate || 'Autumn 2026'}</span>
              </div>

              <div className="text-[10px] opacity-40 tracking-wider text-center pt-1 font-mono">
                thoughts 'n' feelings &bull; absurdharsh
              </div>
            </div>
          </div>
        </div>

        {copiedNotification && (
          <p className="text-center font-handwritten text-sm text-green-700 dark:text-green-400 mb-2">
            {copiedNotification}
          </p>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-4 pt-2 font-handwritten text-base">
          <button
            type="button"
            onClick={onClose}
            className="naked-link opacity-60 hover:opacity-100 cursor-pointer"
          >
            close
          </button>

          {/* Mobile Native Share Trigger if supported */}
          {typeof navigator !== 'undefined' && (navigator.share || navigator.canShare) && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isExporting}
              className="naked-link scribble-hover font-bold text-ink dark:text-darkInk cursor-pointer"
              title="Share directly to Instagram, WhatsApp, or messages"
            >
              {isExporting ? 'preparing card...' : 'share to app ↗'}
            </button>
          )}

          {/* PNG Download Button */}
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

