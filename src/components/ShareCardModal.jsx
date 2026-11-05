import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Helper: Wrap text into lines based on canvas measureText
 */
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Helper: Calculate dynamic typography and vertical gaps
 * Based on character counts to guarantee airy, balanced editorial layouts
 */
function getTypographyAndSpacing({ titleLen, bodyLen, isSquare }) {
  let headingSize;
  let bodySize;
  let bodyLineHeightRatio;

  // 1. Short Entries (Body under 100 chars & Title under 25 chars)
  if (bodyLen < 100 && titleLen < 25) {
    headingSize = isSquare ? 23 : 25; // Moderate-large editorial size (~1.4x body)
    bodySize = isSquare ? 16.5 : 18;
    bodyLineHeightRatio = 1.7;
  }
  // 2. Medium Entries (Body 100–250 chars or Title over 25 chars)
  else if (bodyLen <= 250) {
    headingSize = isSquare ? 19 : 21; // Stepped down ~25% so titles fit on 1-2 refined lines
    bodySize = isSquare ? 14.5 : 15.5;
    bodyLineHeightRatio = 1.65;
  }
  // 3. Long Entries (Body over 250 chars)
  else {
    headingSize = isSquare ? 17.5 : 18.5; // Refined, understated editorial header
    bodySize = isSquare ? 13.5 : 14;
    bodyLineHeightRatio = 1.55;
  }

  // Author signature size (italic serif)
  const authorSize = isSquare ? 15 : 16.5;

  // Dedicated vertical gaps at 1x scale
  const titleToBodyGap = bodyLen > 250 ? (isSquare ? 22 : 24) : (isSquare ? 24 : 28);
  const bodyToAuthorGap = isSquare ? 22 : 26;
  const paragraphBreakGap = isSquare ? 6 : 8;

  return {
    headingSize,
    bodySize,
    bodyLineHeightRatio,
    authorSize,
    titleToBodyGap,
    bodyToAuthorGap,
    paragraphBreakGap
  };
}

/**
 * Helper: Draw preset hand-drawn vector doodle onto canvas
 */
function drawPresetDoodle(ctx, doodleType, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 32;
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (doodleType === 'star') {
    const p = new Path2D(
      'M16 3 C16.5 10, 17 15, 29 16 C17 17, 16.5 22, 16 29 C15.5 22, 15 17, 3 16 C15 15, 15.5 10, 16 3 Z'
    );
    ctx.stroke(p);
  } else if (doodleType === 'spiral') {
    const p = new Path2D(
      'M16 15 C15 15, 14 16, 14 17 C14 18.5, 16 19.5, 17.5 19 C19.5 18, 20.5 15.5, 19.5 13.5 C18 11, 14.5 10.5, 12 12.5 C9 15, 9 19.5, 12 22.5 C15.5 25.5, 21 25, 24 21.5 C27.5 17.5, 26.5 11, 22.5 7.5'
    );
    ctx.stroke(p);
  } else if (doodleType === 'eye') {
    ctx.save();
    ctx.scale(32 / 44, 32 / 26);
    const p = new Path2D('M3 13 C10 4, 34 4, 41 13 C34 22, 10 22, 3 13 Z');
    ctx.stroke(p);
    ctx.beginPath();
    ctx.arc(22, 13, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20.5, 11.5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color === '#F5F5F5' ? '#0D0D0D' : '#F9F8F3';
    ctx.fill();
    ctx.restore();
  } else if (doodleType === 'spark') {
    ctx.save();
    ctx.scale(32 / 24, 32 / 24);
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(12, 22);
    ctx.moveTo(2, 12);
    ctx.lineTo(22, 12);
    ctx.moveTo(5, 5);
    ctx.lineTo(19, 19);
    ctx.moveTo(5, 19);
    ctx.lineTo(19, 5);
    ctx.stroke();
    ctx.restore();
  } else {
    // Arrow Down default
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.bezierCurveTo(15.8, 12, 16.3, 20, 16, 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9, 19);
    ctx.bezierCurveTo(12, 22, 14.5, 25, 16, 27);
    ctx.bezierCurveTo(17.5, 25, 20, 22, 23, 19);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Helper: Draw custom user hand-drawn Base64 doodle onto canvas
 */
function drawCustomDoodle(ctx, dataUrl, x, y, size, isDark) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      if (isDark) {
        ctx.filter = 'invert(1)';
      }
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

/**
 * Publication-Grade Shareable Quote Card Generator
 * Uses Native HTML5 2D Canvas rendering for 1080p high-resolution exports.
 * Guarantees zero text collision, dynamic typography scaling, single-line author attribution,
 * and harmoniously centered content blocks.
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
  const canvasRef = useRef(null);

  // Clean author name
  const authorName = entry?.author
    ? entry.author.replace(/^[-—]\s*/, '').trim()
    : 'absurdharsh';

  const cleanTitle = entry?.title
    ? entry.title.replace(/^["“]|["”]$/g, '').trim()
    : 'thought';

  const rawContent = (entry?.content || '').trim();

  // Render card onto canvas with 3x scale factor (1080px resolution)
  const renderCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !entry) return;

    // Wait for custom web fonts (Instrument Serif, Patrick Hand)
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const isStory = aspectRatio === 'story';
    const isDark = cardTheme === 'dark';

    // 1x Logical Coordinates
    const logicalWidth = 360;
    const logicalHeight = isStory ? 640 : 360;

    // 3x High-Res Canvas Buffer (1080x1920 or 1080x1080)
    const scale = 3;
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(scale, scale);

    // 1. Paper Background Fill
    const bgColor = isDark ? '#0D0D0D' : '#F9F8F3';
    const textColor = isDark ? '#F5F5F5' : '#111111';
    const mutedColor = isDark ? 'rgba(245, 245, 245, 0.75)' : 'rgba(17, 17, 17, 0.75)';
    const watermarkColor = isDark ? 'rgba(245, 245, 245, 0.45)' : 'rgba(17, 17, 17, 0.45)';
    const dividerColor = isDark ? 'rgba(245, 245, 245, 0.15)' : 'rgba(17, 17, 17, 0.15)';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Card Outer Subtle Border
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, logicalWidth - 1, logicalHeight - 1);

    // 2. Safe Margins
    const padLeft = 28;
    const padRight = 28;
    const isSquare = !isStory;
    const titleLen = cleanTitle.length;
    const bodyLen = rawContent.length;

    const padTop = isStory ? 32 : (bodyLen > 250 ? 20 : 26);
    const padBottom = isStory ? 36 : (bodyLen > 250 ? 20 : 26);
    const contentWidth = logicalWidth - padLeft - padRight; // 304px

    // 3. Top Header: Category on Left, Season + Margin Doodle on Right
    const headerTop = padTop;
    const doodleSize = 30;
    const doodleX = logicalWidth - padRight - doodleSize;
    const doodleY = headerTop + 1;

    // Category Label
    ctx.font = '600 11px monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText((entry.type || 'thought').toUpperCase(), padLeft, headerTop + 16);

    // Season & Year
    const seasonText = (displayDate || 'Autumn 2026').toUpperCase();
    ctx.font = '11px monospace';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(seasonText, doodleX - 10, headerTop + 16);

    // Margin Doodle
    if (typeof entry.doodle === 'string' && entry.doodle.startsWith('data:image')) {
      await drawCustomDoodle(ctx, entry.doodle, doodleX, doodleY, doodleSize, isDark);
    } else {
      drawPresetDoodle(ctx, entry.doodle, doodleX, doodleY, doodleSize, textColor);
    }

    const headerBottom = headerTop + 36;

    // 4. Bottom Footer: Faint Divider + thoughts 'n' feelings Centered
    const footerBottom = logicalHeight - padBottom;
    const footerTop = footerBottom - 26;

    ctx.beginPath();
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padLeft, footerTop);
    ctx.lineTo(padLeft + contentWidth, footerTop);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = watermarkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("THOUGHTS 'N' FEELINGS", logicalWidth / 2, footerTop + 15);

    // 5. Dynamic Typography Scaling & Pre-Calculation
    const {
      headingSize,
      bodySize,
      bodyLineHeightRatio,
      authorSize,
      titleToBodyGap,
      bodyToAuthorGap,
      paragraphBreakGap
    } = getTypographyAndSpacing({ titleLen, bodyLen, isSquare });

    // Measure Title Lines
    const titleText = `“${cleanTitle}”`;
    ctx.font = `italic bold ${headingSize}px "Instrument Serif", Georgia, serif`;
    const titleLines = wrapCanvasText(ctx, titleText, contentWidth);
    const titleLineHeight = Math.round(headingSize * 1.3);
    const totalTitleHeight = titleLines.length * titleLineHeight;

    // Measure Body Lines
    const paragraphs = rawContent.split('\n\n').filter(Boolean);
    ctx.font = `${bodySize}px "Patrick Hand", "Caveat", cursive`;
    const bodyLineHeight = Math.round(bodySize * bodyLineHeightRatio);

    const allBodyGroups = [];
    let totalBodyHeight = 0;
    paragraphs.forEach((para, idx) => {
      const pLines = wrapCanvasText(ctx, para, contentWidth);
      const isLast = idx === paragraphs.length - 1;
      allBodyGroups.push({ lines: pLines, isLast });
      totalBodyHeight += pLines.length * bodyLineHeight;
      if (!isLast) totalBodyHeight += paragraphBreakGap;
    });

    // Single-Line Author Attribution
    const authorText = `— ${authorName}`;
    const authorLineHeight = Math.round(authorSize * 1.3);

    // 6. Vertically Center the Complete Content Block Between Header & Footer
    const totalContentHeight =
      totalTitleHeight +
      titleToBodyGap +
      totalBodyHeight +
      bodyToAuthorGap +
      authorLineHeight;

    const availableMiddleHeight = footerTop - headerBottom;
    const startY =
      headerBottom + Math.max(10, (availableMiddleHeight - totalContentHeight) / 2);

    // 7. Render Sequential Flow with Running currentY Cursor (No Clashing)
    let currentY = startY;

    // Draw Title Lines
    ctx.font = `italic bold ${headingSize}px "Instrument Serif", Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], padLeft, currentY);
      currentY += titleLineHeight;
    }

    // Dedicated Gap Between Title & Body
    currentY += titleToBodyGap;

    // Draw Body Lines
    ctx.font = `${bodySize}px "Patrick Hand", "Caveat", cursive`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let p = 0; p < allBodyGroups.length; p++) {
      const group = allBodyGroups[p];
      for (let l = 0; l < group.lines.length; l++) {
        ctx.fillText(group.lines[l], padLeft, currentY);
        currentY += bodyLineHeight;
      }
      if (!group.isLast) {
        currentY += paragraphBreakGap;
      }
    }

    // Dedicated Gap Between Body & Author
    currentY += bodyToAuthorGap;

    // Draw Author Attribution on a Single Line
    ctx.font = `italic bold ${authorSize}px "Instrument Serif", Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(authorText, padLeft, currentY);

    ctx.restore();
  }, [entry, aspectRatio, cardTheme, displayDate, cleanTitle, rawContent, authorName]);

  // Re-draw when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      renderCard();
    }
  }, [isOpen, renderCard]);

  if (!isOpen || !entry) return null;

  // Export high-resolution PNG blob directly from canvas
  const getCardImageBlob = async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Card canvas not found');

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      }, 'image/png');
    });
  };

  const handleDownload = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    setCopiedNotification('');

    try {
      const blob = await getCardImageBlob();
      if (!blob) throw new Error('Failed to generate image blob');

      const url = URL.createObjectURL(blob);
      const safeTitle = (cleanTitle || 'thought')
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
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    setCopiedNotification('');

    try {
      const blob = await getCardImageBlob();
      if (!blob) throw new Error('Could not create image blob');

      const file = new File([blob], 'thought-card.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `“${cleanTitle}” · thoughts 'n' feelings`,
          text: `“${cleanTitle}” — ${authorName}`
        });
        setCopiedNotification('✓ shared to app!');
      } else if (navigator.share) {
        await navigator.share({
          title: `“${cleanTitle}” · thoughts 'n' feelings`,
          text: `“${cleanTitle}”\n\n${rawContent}\n\n— ${authorName}`
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

        {/* Card Canvas Container (High-Resolution 3x Canvas Live Preview) */}
        <div className="flex justify-center items-center py-5 bg-ink/5 dark:bg-darkInk/5 rounded my-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            style={{
              width: '360px',
              height: aspectRatio === 'story' ? '640px' : '360px',
              maxWidth: '100%',
              aspectRatio: aspectRatio === 'story' ? '9/16' : '1/1',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
            }}
            className="select-none block"
          />
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
