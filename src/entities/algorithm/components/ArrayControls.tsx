'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useAlgorithmState, useAlgorithmActions, Distribution } from '../store';

const DISTRIBUTIONS: { id: Distribution; label: string }[] = [
  { id: 'random', label: 'Random' },
  { id: 'nearlySorted', label: 'Nearly' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'fewUnique', label: 'Few' },
];

export const ArrayControls: React.FC = () => {
  const { arraySize, distribution, speed, isRunning } = useAlgorithmState();
  const { setArraySize, setDistribution, setSpeed } = useAlgorithmActions();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Size</span>
          <span className="font-mono text-xs tabular-nums text-[#22D3EE]">{arraySize}</span>
        </div>
        <Slider
          value={[arraySize]}
          min={5}
          max={200}
          step={1}
          disabled={isRunning}
          onValueChange={(v) => setArraySize(Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Speed</span>
          <span className="font-mono text-xs tabular-nums text-[#FFB627]">{speed}</span>
        </div>
        <Slider value={[speed]} min={1} max={100} step={1} onValueChange={(v) => setSpeed(Array.isArray(v) ? v[0] : v)} />
      </div>

      <div className="space-y-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Distribution</span>
        <div className="grid grid-cols-4 gap-1">
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDistribution(d.id)}
              disabled={isRunning}
              className={`rounded-md border px-1 py-1.5 text-[11px] font-medium transition-colors
                ${
                  distribution === d.id
                    ? 'border-[#22D3EE]/60 bg-[#22D3EE]/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/55 hover:border-white/25'
                }
                ${isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
