'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAlgorithmState, useAlgorithmActions } from '@/entities/algorithm/store';
import { Play, Pause, Square, FastForward, Zap, Gauge } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const GlobalHUD: React.FC = () => {
  const { isRunning, isPaused, speed, comparisons, swaps, totalOperations, arrayData } = useAlgorithmState();
  const { toggleRunning, togglePause, stop, setSpeed, stepForward, generateArray } = useAlgorithmActions();

  const sortedCount = (arrayData || []).filter((item: { isSorted?: boolean }) => item.isSorted).length;
  const progress = (arrayData || []).length > 0 ? (sortedCount / (arrayData?.length || 1)) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="glass glass-strong px-6 py-4 rounded-2xl shadow-2xl max-w-[calc(100vw-12rem)]">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#E63946] to-[#4CC9F0]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={toggleRunning}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E63946] hover:bg-[#E63946]/80 
                           transition-colors shadow-lg shadow-[#E63946]/30"
              >
                <Play className="w-5 h-5 text-white" fill="currentColor" />
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 
                             transition-colors"
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={stop}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 
                             transition-colors"
                >
                  <Square className="w-4 h-4 text-white" fill="currentColor" />
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/10" />

          {/* Step Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={stepForward}
              disabled={!isRunning || isPaused}
              className="px-4 py-2 glass glass-hover rounded-lg text-sm font-medium text-white 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <FastForward className="w-4 h-4" />
                <span>Step</span>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/10" />

          {/* Speed Control */}
          <div className="flex items-center gap-3">
            <Gauge className="w-4 h-4 text-gray-400" />
            <div className="w-32">
              <Slider
                value={[speed]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setSpeed(value as number)}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{speed}%</span>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-white/10" />

          {/* Statistics */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Comparisons</p>
              <p className="text-lg font-mono font-bold text-[#4CC9F0]">{(comparisons ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Swaps</p>
              <p className="text-lg font-mono font-bold text-[#E63946]">{(swaps ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Operations</p>
              <p className="text-lg font-mono font-bold text-white">{(totalOperations ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};