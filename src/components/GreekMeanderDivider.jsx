import React from 'react';

/**
 * Greek Key Meander Divider
 * Extracted directly from the original 'Antique' vector specimen (18935121.eps).
 * Renders an authentic continuous Greek key fretwork band.
 */
export default function GreekMeanderDivider({ className = '', title = null }) {
  return (
    <div className={`w-full my-12 select-none ${className}`}>
      {title && (
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="h-[1px] w-12 bg-[#6a6344]/50" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#9c9679]">
            {title}
          </span>
          <span className="h-[1px] w-12 bg-[#6a6344]/50" />
        </div>
      )}

      {/* Vector Greek Fret Band */}
      <div className="w-full flex items-center justify-center overflow-hidden opacity-75 hover:opacity-95 transition-opacity duration-300">
        <svg
          viewBox="0 0 729 28"
          fill="none"
          stroke="#9c9679"
          strokeWidth="1.6"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="w-full max-w-2xl h-5 sm:h-6 text-[#9c9679]"
          style={{
            filter: 'drop-shadow(0 1px 1px #222325)',
          }}
        >
          {/* Direct vector path extracted from 18935121.eps */}
          <path d="M 706.01 11.82 L 657.67 11.82 L 657.67 4.13 L 719.29 4.13 L 719.29 27.84 L 728.42 27.84 L 728.42 0.00 L 648.54 0.00 L 648.54 16.95 L 696.88 16.95 L 696.88 23.75 L 667.96 23.75 L 616.24 23.75 L 587.32 23.75 L 587.32 16.95 L 635.66 16.95 L 635.66 0.00 L 555.78 0.00 L 555.78 23.75 L 543.00 23.75 L 543.00 0.00 L 463.12 0.00 L 463.12 16.95 L 511.46 16.95 L 511.46 23.75 L 482.54 23.75 L 430.82 23.75 L 401.90 23.75 L 401.90 16.95 L 450.24 16.95 L 450.24 0.00 L 370.36 0.00 L 370.36 23.75 L 357.58 23.75 L 357.58 0.00 L 277.70 0.00 L 277.70 16.95 L 326.04 16.95 L 326.04 23.75 L 297.12 23.75 L 245.40 23.75 L 216.49 23.75 L 216.49 16.95 L 264.83 16.95 L 264.83 0.00 L 184.94 0.00 L 184.94 23.75 L 172.64 23.75 L 172.64 0.00 L 92.76 0.00 L 92.76 16.95 L 141.10 16.95 L 141.10 23.75 L 112.18 23.75 L 60.46 23.75 L 31.54 23.75 L 31.54 16.95 L 79.88 16.95 L 79.88 0.00 L 0.00 0.00 L 0.00 27.84 L 9.13 27.84 L 9.13 4.13 L 70.75 4.13 L 70.75 11.82 L 22.41 11.82 L 22.41 27.88 L 60.46 27.88 L 112.18 27.88 L 150.23 27.88 L 150.23 11.82 L 101.89 11.82 L 101.89 4.13 L 163.51 4.13 L 163.43 27.88 L 193.95 27.88 L 193.95 27.84 L 194.07 27.84 L 194.07 4.13 L 255.70 4.13 L 255.70 11.82 L 207.36 11.82 L 207.36 27.88 L 245.40 27.88 L 297.12 27.88 L 335.17 27.88 L 335.17 11.82 L 286.83 11.82 L 286.83 4.13 L 348.45 4.13 L 348.45 27.84 L 348.85 27.84 L 348.85 27.88 L 379.36 27.88 L 379.36 27.84 L 379.49 27.84 L 379.49 4.13 L 441.11 4.13 L 441.11 11.82 L 392.77 11.82 L 392.77 27.88 L 430.82 27.88 L 482.54 27.88 L 520.59 27.88 L 520.59 11.82 L 472.25 11.82 L 472.25 4.13 L 533.87 4.13 L 533.87 27.84 L 534.27 27.84 L 534.27 27.88 L 564.78 27.88 L 564.78 27.84 L 564.91 27.84 L 564.91 4.13 L 626.53 4.13 L 626.53 11.82 L 578.19 11.82 L 578.19 27.88 L 616.24 27.88 L 667.96 27.88 L 706.01 27.88 L 706.01 11.82 Z" />
        </svg>
      </div>
    </div>
  );
}

