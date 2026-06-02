'use client';

import React, { memo } from 'react';

export type BarState = 'idle' | 'compare' | 'swap' | 'pivot' | 'sorted';

interface BarProps {
  value: number;
  maxValue: number;
  state: BarState;
  showLabel: boolean;
}

/**
 * A single bar. Deliberately a plain div (no per-bar framer-motion `layout`):
 * with up to 200 bars updating dozens of times per second, layout animations
 * would jank. Height/colour transitions are cheap CSS and read as smooth.
 * Width is handled by the parent flex container (flex-1) so it stays responsive.
 */
const BarComponent: React.FC<BarProps> = ({ value, maxValue, state, showLabel }) => {
  const heightPct = (value / maxValue) * 100;

  // Duotone spectrum: low values teal (hue ~190) → high values amber (hue ~42).
  const t = Math.min(1, Math.max(0, value / maxValue));
  const baseHue = 190 - t * 148;
  const baseColor = `hsl(${baseHue} 85% 58%)`;

  let color = baseColor;
  let glow = 'none';
  switch (state) {
    case 'compare':
      color = '#F8FAFC';
      glow = '0 0 12px rgba(248,250,252,0.55)';
      break;
    case 'swap':
      color = '#FF4D6D';
      glow = '0 0 16px rgba(255,77,109,0.6)';
      break;
    case 'pivot':
      color = '#FFB627';
      glow = '0 0 18px rgba(255,182,39,0.8)';
      break;
    case 'sorted':
      color = `hsl(${baseHue} 92% 62%)`;
      glow = '0 0 9px hsl(158 90% 50% / 0.45)';
      break;
  }

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col justify-end" aria-hidden="true">
      {showLabel && (
        <span
          className="absolute left-1/2 -translate-x-1/2 font-mono text-[9px] tabular-nums text-white/45"
          style={{ bottom: `calc(${heightPct}% + 3px)` }}
        >
          {value}
        </span>
      )}
      <div
        className="w-full rounded-t-[2px]"
        style={{
          height: `${heightPct}%`,
          backgroundColor: color,
          boxShadow: glow,
          transition:
            'height 120ms cubic-bezier(0.22,1,0.36,1), background-color 90ms linear, box-shadow 90ms linear',
          willChange: 'height',
        }}
      />
    </div>
  );
};

export const Bar = memo(BarComponent);
Bar.displayName = 'Bar';
