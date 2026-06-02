'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Route } from 'lucide-react';
import { SortingVisualizer } from '@/entities/algorithm/components/SortingVisualizer';
import { AlgorithmSelector } from '@/entities/algorithm/components/AlgorithmSelector';
import { ArrayControls } from '@/entities/algorithm/components/ArrayControls';
import { GlobalHUD } from '@/features/controls/GlobalHUD';
import { PathfindingVisualizer } from '@/features/pathfinding';

type Mode = 'sorting' | 'pathfinding';

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: 'sorting', label: 'Sorting', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'pathfinding', label: 'Pathfinding', icon: <Route className="h-4 w-4" /> },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>('sorting');
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0E14] text-white">
      {/* atmosphere: blueprint grid + instrument glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#22D3EE]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-[#FFB627]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-end justify-center gap-[3px] rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              {[0.5, 0.85, 0.35, 0.7].map((h, i) => (
                <motion.span
                  key={i}
                  initial={reduceMotion ? false : { scaleY: 0.2 }}
                  animate={{ scaleY: [h * 0.6, h, h * 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                  className="w-1 origin-bottom rounded-full"
                  style={{ height: '100%', background: i % 2 ? '#FFB627' : '#22D3EE' }}
                />
              ))}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight">
                SHOW<span className="text-[#FFB627]">DATA</span>
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Algorithm Instrument
              </p>
            </div>
          </div>

          {/* Mode tabs */}
          <nav className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-[#0B0E14]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={reduceMotion ? undefined : 'mode-pill'}
                      className="absolute inset-0 rounded-lg bg-[#FFB627]"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {m.icon}
                    {m.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'sorting' ? (
            <motion.div
              key="sorting"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]"
            >
              <div className="space-y-5">
                <SortingVisualizer />
                <GlobalHUD />
              </div>

              <aside className="space-y-4">
                <div className="panel rounded-2xl p-4">
                  <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Array</h2>
                  <ArrayControls />
                </div>
                <div className="panel max-h-[60vh] overflow-y-auto rounded-2xl p-4 custom-scrollbar">
                  <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                    Algorithm
                  </h2>
                  <AlgorithmSelector />
                </div>
              </aside>
            </motion.div>
          ) : (
            <motion.div
              key="pathfinding"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <PathfindingVisualizer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
