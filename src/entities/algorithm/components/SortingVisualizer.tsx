'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Shuffle, Volume2, VolumeX, Square } from 'lucide-react';
import { useAlgorithmState, useAlgorithmActions } from '../store';
import { algorithmRegistry, AlgorithmOperation } from '../algorithms';
import { soundManager } from '../sound';
import { Bar, BarState } from './Bar';

interface RenderState {
  values: number[];
  compare: Set<number>;
  swap: Set<number>;
  pivot: Set<number>;
  sorted: Set<number>;
}

const EMPTY: RenderState = { values: [], compare: new Set(), swap: new Set(), pivot: new Set(), sorted: new Set() };

/** Map the 1-100 speed dial to a per-tick delay and an ops-per-tick batch. */
function pacing(speed: number, size: number): { delay: number; batch: number } {
  const delay = Math.max(6, Math.round(130 - speed * 1.24));
  const batch = Math.max(1, Math.round((speed / 100) ** 2 * (size / 9)));
  return { delay, batch };
}

export const SortingVisualizer: React.FC = () => {
  const { arrayData, currentAlgorithm, speed, isRunning, isPaused, arraySize } = useAlgorithmState();
  const {
    generateArray,
    setRunning,
    togglePause,
    incrementComparisons,
    incrementSwaps,
    incrementWrites,
    resetStats,
  } = useAlgorithmActions();

  const reduceMotion = useReducedMotion();

  const [render, setRender] = useState<RenderState>(EMPTY);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const valuesRef = useRef<number[]>([]);
  const maxRef = useRef<number>(1);
  const genRef = useRef<Generator<AlgorithmOperation, void, unknown> | null>(null);
  const sortedRef = useRef<Set<number>>(new Set());
  const pivotRef = useRef<Set<number>>(new Set());
  const finishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef(soundEnabled);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /** Pull the (original) array from the store into the canvas; discard any run. */
  const resetFromStore = useCallback(() => {
    clearTimer();
    const values = (arrayData ?? []).map((d) => d.value);
    valuesRef.current = [...values];
    maxRef.current = Math.max(1, ...values);
    genRef.current = null;
    sortedRef.current = new Set();
    pivotRef.current = new Set();
    finishedRef.current = false;
    setFinished(false);
    setStarted(false);
    setRender({ values, compare: new Set(), swap: new Set(), pivot: new Set(), sorted: new Set() });
  }, [arrayData]);

  // Re-sync whenever the source array or algorithm changes and we're not mid-run.
  useEffect(() => {
    resetFromStore();
    resetStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayData, currentAlgorithm]);

  /** Build a fresh generator + working array from the store's current array. */
  const ensureGenerator = useCallback(() => {
    if (genRef.current && !finishedRef.current) return;
    const initial = (arrayData ?? []).map((d) => d.value);
    valuesRef.current = [...initial];
    maxRef.current = Math.max(1, ...initial);
    sortedRef.current = new Set();
    pivotRef.current = new Set();
    finishedRef.current = false;
    setFinished(false);
    resetStats();
    const factory = algorithmRegistry[currentAlgorithm];
    genRef.current = factory ? factory([...initial]) : null;
  }, [arrayData, currentAlgorithm, resetStats]);

  const finalize = useCallback(() => {
    finishedRef.current = true;
    clearTimer();
    for (let i = 0; i < valuesRef.current.length; i++) sortedRef.current.add(i);
    pivotRef.current = new Set();
    setFinished(true);
    setRunning(false);
    setRender({
      values: [...valuesRef.current],
      compare: new Set(),
      swap: new Set(),
      pivot: new Set(),
      sorted: new Set(sortedRef.current),
    });
    if (soundRef.current) soundManager.playComplete();
  }, [setRunning]);

  /** Advance the generator by `batch` ops, then commit one render + stat flush. */
  const runBatch = useCallback(
    (batch: number) => {
      const gen = genRef.current;
      if (!gen || finishedRef.current) return;

      const compare = new Set<number>();
      const swap = new Set<number>();
      let cmp = 0;
      let swp = 0;
      let wrt = 0;
      let soundValue: number | null = null;

      for (let s = 0; s < batch; s++) {
        if (finishedRef.current) break;
        const res = gen.next();
        if (res.done) {
          finalize();
          return;
        }
        const op = res.value;
        switch (op.type) {
          case 'compare': {
            cmp++;
            op.indices.forEach((i) => compare.add(i));
            soundValue = valuesRef.current[op.indices[0]] ?? soundValue;
            break;
          }
          case 'swap': {
            swp++;
            const [i, j] = op.indices;
            const v = valuesRef.current;
            [v[i], v[j]] = [v[j], v[i]];
            swap.add(i);
            swap.add(j);
            soundValue = v[i];
            break;
          }
          case 'overwrite': {
            wrt++;
            valuesRef.current[op.index] = op.value;
            swap.add(op.index);
            soundValue = op.value;
            break;
          }
          case 'pivot': {
            op.indices.forEach((i) => pivotRef.current.add(i));
            break;
          }
          case 'markSorted': {
            if (op.indices) op.indices.forEach((i) => sortedRef.current.add(i));
            else {
              finalize();
              return;
            }
            break;
          }
        }
      }

      // Pivots that have since been locked in as sorted shouldn't keep glowing.
      pivotRef.current.forEach((i) => {
        if (sortedRef.current.has(i)) pivotRef.current.delete(i);
      });

      if (cmp) incrementComparisons(cmp);
      if (swp) incrementSwaps(swp);
      if (wrt) incrementWrites(wrt);
      if (soundRef.current && soundValue !== null) soundManager.playCompare(soundValue, maxRef.current);

      setRender({
        values: [...valuesRef.current],
        compare,
        swap,
        pivot: new Set(pivotRef.current),
        sorted: new Set(sortedRef.current),
      });
    },
    [finalize, incrementComparisons, incrementSwaps, incrementWrites],
  );

  // The animation loop: only runs while playing and not paused.
  useEffect(() => {
    if (!isRunning || isPaused || finishedRef.current) return;
    if (!genRef.current) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled || finishedRef.current) return;
      const { delay, batch } = pacing(speed, valuesRef.current.length || arraySize);
      runBatch(batch);
      if (!cancelled && !finishedRef.current) timerRef.current = setTimeout(tick, delay);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [isRunning, isPaused, speed, arraySize, runBatch]);

  /* ----------------------------- transport ------------------------------ */

  const handlePlay = () => {
    if (isRunning && !isPaused) return;
    if (finishedRef.current) {
      resetFromStore();
      // resetFromStore nulls the generator; rebuild on next tick.
      requestAnimationFrame(() => {
        ensureGenerator();
        setStarted(true);
        setRunning(true);
      });
      return;
    }
    ensureGenerator();
    setStarted(true);
    if (isPaused) togglePause();
    setRunning(true);
  };

  const handlePause = () => {
    if (isRunning) togglePause();
  };

  const handleStop = () => {
    setRunning(false);
    resetFromStore();
    resetStats();
  };

  const handleStep = () => {
    if (finishedRef.current) return;
    ensureGenerator();
    setStarted(true);
    if (!isRunning) setRunning(true);
    if (!isPaused) togglePause();
    // Run exactly one operation.
    runBatch(1);
  };

  const handleRegenerate = () => {
    setRunning(false);
    generateArray();
  };

  const toggleSound = () => setSoundEnabled(soundManager.toggle());

  /* ------------------------------ render -------------------------------- */

  const playing = isRunning && !isPaused;
  const n = render.values.length || (arrayData?.length ?? 0);
  const showLabels = n <= 28;
  const progress = n > 0 ? (render.sorted.size / n) * 100 : 0;

  const barState = (i: number): BarState => {
    if (render.sorted.has(i)) return 'sorted';
    if (render.pivot.has(i)) return 'pivot';
    if (render.swap.has(i)) return 'swap';
    if (render.compare.has(i)) return 'compare';
    return 'idle';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="panel relative overflow-hidden rounded-2xl">
        {/* faint instrument grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:100%_24px]" />

        {/* progress hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#22D3EE] via-[#7DD3FC] to-[#FFB627]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          />
        </div>

        <div className="relative flex h-[56vh] min-h-[320px] items-end gap-px px-4 pb-4 pt-6">
          {render.values.map((value, i) => (
            <Bar key={i} value={value} maxValue={maxRef.current} state={barState(i)} showLabel={showLabels} />
          ))}

          {!started && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B0E14]/40 backdrop-blur-[2px]">
              <motion.button
                onClick={handlePlay}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className="group flex items-center gap-3 rounded-full bg-[#FFB627] px-7 py-3.5 font-medium text-[#0B0E14] shadow-[0_0_30px_rgba(255,182,39,0.35)]"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                Run {currentAlgorithm}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* control deck */}
      <div className="panel flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          {!playing ? (
            <button onClick={handlePlay} className="ctrl-primary" aria-label="Play">
              <Play className="h-4 w-4" fill="currentColor" />
            </button>
          ) : (
            <button onClick={handlePause} className="ctrl-primary" aria-label="Pause">
              <Pause className="h-4 w-4" fill="currentColor" />
            </button>
          )}
          <button onClick={handleStep} className="ctrl" aria-label="Step one operation" title="Step">
            <SkipForward className="h-4 w-4" />
          </button>
          <button onClick={handleStop} className="ctrl" aria-label="Stop and reset" title="Stop">
            <Square className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-1 h-7 w-px bg-white/10" />

        <button onClick={handleRegenerate} className="ctrl-wide" title="New array">
          <Shuffle className="h-4 w-4" />
          <span>Shuffle</span>
        </button>
        <button onClick={resetFromStore} className="ctrl-wide" title="Reset bars to original">
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`ctrl ${soundEnabled ? 'text-[#FFB627]' : 'text-white/55'}`}
            title={soundEnabled ? 'Mute' : 'Sound on'}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
            {finished ? 'complete' : playing ? 'running' : started ? 'paused' : 'ready'}
          </span>
        </div>
      </div>
    </div>
  );
};
