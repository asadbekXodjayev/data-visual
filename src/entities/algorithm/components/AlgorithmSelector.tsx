'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAlgorithmState, useAlgorithmActions, AlgorithmCategory, SortAlgorithm } from '../store';

const CATEGORIES: { id: AlgorithmCategory; title: string; hint: string }[] = [
  { id: 'simple', title: 'Simple', hint: 'O(n²) · learn the basics' },
  { id: 'efficient', title: 'Efficient', hint: 'Divide, heap & gap based' },
  { id: 'distribution', title: 'Distribution', hint: 'Non-comparison · counting' },
  { id: 'exotic', title: 'Exotic', hint: 'Curiosities & oddities' },
];

export const AlgorithmSelector: React.FC = () => {
  const { currentAlgorithm, isRunning } = useAlgorithmState();
  const { setAlgorithm, getAllAlgorithms } = useAlgorithmActions();
  const reduceMotion = useReducedMotion();
  const algorithms = getAllAlgorithms();

  return (
    <div className="space-y-5">
      {CATEGORIES.map((category) => {
        const items = algorithms.filter((a) => a.category === category.id);
        return (
          <div key={category.id} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFB627]">
                {category.title}
              </span>
              <span className="text-[10px] text-white/35">{category.hint}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((algo: SortAlgorithm) => {
                const active = currentAlgorithm === algo.name;
                return (
                  <motion.button
                    key={algo.name}
                    onClick={() => setAlgorithm(algo.name)}
                    disabled={isRunning}
                    whileTap={reduceMotion || isRunning ? undefined : { scale: 0.97 }}
                    className={`relative overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors duration-200
                      ${
                        active
                          ? 'border-[#22D3EE]/60 bg-[#22D3EE]/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
                      }
                      ${isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduceMotion ? undefined : 'algo-active'}
                        className="absolute inset-y-0 left-0 w-0.5 bg-[#22D3EE]"
                      />
                    )}
                    <p className={`text-[13px] font-medium ${active ? 'text-white' : 'text-white/80'}`}>
                      {algo.displayName.replace(' Sort', '')}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-white/40">{algo.complexity.average}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
