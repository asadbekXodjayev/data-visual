'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCompareArrows, ArrowLeftRight, PenLine, Sigma } from 'lucide-react';
import { useAlgorithmState, useAlgorithmActions, ALGORITHM_LIST } from '@/entities/algorithm/store';

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({
  icon,
  label,
  value,
  color,
}) => (
  <div className="flex items-center gap-2.5">
    <span className="text-white/40">{icon}</span>
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="font-mono text-lg font-semibold tabular-nums" style={{ color }}>
        {value.toLocaleString()}
      </p>
    </div>
  </div>
);

export const GlobalHUD: React.FC = () => {
  const { comparisons, swaps, writes, totalOperations, currentAlgorithm } = useAlgorithmState();
  const { getAlgorithm } = useAlgorithmActions();
  const reduceMotion = useReducedMotion();
  const meta = getAlgorithm(currentAlgorithm) ?? ALGORITHM_LIST.bubble;

  return (
    <motion.div
      initial={reduceMotion ? false : { y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="panel grid grid-cols-1 gap-5 rounded-2xl p-5 lg:grid-cols-[1.3fr_1fr]"
    >
      {/* live counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={<GitCompareArrows className="h-4 w-4" />} label="Compares" value={comparisons} color="#F8FAFC" />
        <Stat icon={<ArrowLeftRight className="h-4 w-4" />} label="Swaps" value={swaps} color="#FF4D6D" />
        <Stat icon={<PenLine className="h-4 w-4" />} label="Writes" value={writes} color="#22D3EE" />
        <Stat icon={<Sigma className="h-4 w-4" />} label="Total ops" value={totalOperations} color="#FFB627" />
      </div>

      {/* complexity card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{meta.displayName}</h3>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              meta.stable ? 'bg-[#22D3EE]/15 text-[#22D3EE]' : 'bg-white/10 text-white/50'
            }`}
          >
            {meta.stable ? 'stable' : 'unstable'}
          </span>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-white/55">{meta.blurb}</p>
        <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
          {(
            [
              ['Best', meta.complexity.best],
              ['Avg', meta.complexity.average],
              ['Worst', meta.complexity.worst],
              ['Space', meta.complexity.space],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-md bg-black/20 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-white/35">{k}</p>
              <p className="mt-0.5 text-white/80">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
