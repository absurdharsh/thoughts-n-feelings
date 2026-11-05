import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DoodlePenNib, DoodleEraser } from './HandDrawnDoodles';

/**
 * CustomDoodlePad — 120x120 Binary Ink Drawing Pad
 * Allows users to hand-draw their own margin doodle.
 * Exports as Base64 PNG data URL with transparent background.
 */
export default function CustomDoodlePad({ onDoodleChange, initialDataUrl = '' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialDataUrl));
  const lastPointRef = useRef(null);

  // Initialize Canvas with 2x High-DPI support
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = 120 * dpr;
    canvas.height = 120 * dpr;
    canvas.style.width = '120px';
    canvas.style.height = '120px';

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 120, 120);
        ctx.drawImage(img, 0, 0, 120, 120);
        setHasDrawn(true);
      };
      img.src = initialDataUrl;
    } else {
      ctx.clearRect(0, 0, 120, 120);
    }
  }, [initialDataUrl]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onDoodleChange) {
      onDoodleChange(hasDrawn ? dataUrl : '');
    }
  }, [hasDrawn, onDoodleChange]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (e.touches && e.cancelable) e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, tool === 'pen' ? 1.2 : 5, 0, Math.PI * 2);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fill();
    }
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const last = lastPointRef.current || coords;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(coords.x, coords.y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 10;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.4;
    }

    ctx.stroke();
    lastPointRef.current = coords;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    exportCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 120, 120);
    setHasDrawn(false);
    if (onDoodleChange) onDoodleChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-ink/5 dark:bg-darkInk/5 border border-dashed border-ink/30 dark:border-darkInk/30 rounded select-none">
      {/* 120x120 Drawing Canvas (inverts in dark mode for natural black/white ink look) */}
      <div className="relative w-[120px] h-[120px] bg-paper dark:bg-darkPaper border border-ink/40 dark:border-darkInk/40 shadow-inner flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-[120px] h-[120px] touch-none dark:invert"
          title="Draw your doodle here"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs opacity-40 font-handwritten text-center px-2">
            sketch in this box
          </div>
        )}
      </div>

      {/* Drawing Actions & Tools */}
      <div className="flex flex-col gap-2 font-handwritten text-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`px-2 py-0.5 border text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tool === 'pen'
                ? 'border-ink dark:border-darkInk bg-ink text-paper dark:bg-darkInk dark:text-darkPaper font-bold'
                : 'border-ink/30 dark:border-darkInk/30 hover:border-ink dark:hover:border-darkInk opacity-70 hover:opacity-100'
            }`}
          >
            <DoodlePenNib className="w-3 h-3 text-current inline-block" />
            <span>pen</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`px-2 py-0.5 border text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tool === 'eraser'
                ? 'border-ink dark:border-darkInk bg-ink text-paper dark:bg-darkInk dark:text-darkPaper font-bold'
                : 'border-ink/30 dark:border-darkInk/30 hover:border-ink dark:hover:border-darkInk opacity-70 hover:opacity-100'
            }`}
          >
            <DoodleEraser className="w-3 h-3 text-current inline-block" />
            <span>eraser</span>
          </button>

          <button
            type="button"
            onClick={clearCanvas}
            className="px-2 py-0.5 border border-ink/30 dark:border-darkInk/30 hover:border-red-500 hover:text-red-500 opacity-60 hover:opacity-100 text-xs transition-colors cursor-pointer"
            title="Clear drawing"
          >
            clear
          </button>
        </div>

        <p className="text-xs opacity-60 italic leading-snug">
          1-bit binary ink &bull; automatically inverts across light & dark paper.
        </p>
      </div>
    </div>
  );
}

