'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAlgorithmState, useAlgorithmActions, ArrayData } from '../store';
import { Bar } from './Bar';
import { algorithmRegistry, AlgorithmOperation } from '../algorithms';
import { soundManager } from '../sound';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Gauge } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const SortingVisualizer: React.FC = () => {
  const { arrayData, isRunning, isPaused, speed, currentAlgorithm, comparisons = 0, swaps = 0, totalOperations = 0 } = useAlgorithmState();
  const actions = useAlgorithmActions();
  const { generateArray, incrementComparisons, incrementSwaps, markArrayAsSorted, stop, setArrayValues, toggleRunning, togglePause, setSpeed } = actions;
  
  const [comparingIndices, setComparingIndices] = useState<Set<number>>(new Set());
  const [swappingIndices, setSwappingIndices] = useState<Set<number>>(new Set());
  const [pivotIndices, setPivotIndices] = useState<Set<number>>(new Set());
  const [sortedIndices, setSortedIndices] = useState<Set<number>>(new Set());
  const [internalArray, setInternalArray] = useState<ArrayData[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const generatorRef = useRef<Generator<AlgorithmOperation, void, unknown> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);
  const internalArrayRef = useRef<ArrayData[]>([]);
  const soundEnabledRef = useRef(soundEnabled);

  // Update refs when values change - use effect to avoid accessing refs during render
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Calculate bar dimensions based on array size - ensure perfect alignment
  const gap = 1;
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 48 : 1200;
  const availableWidth = containerWidth - 100; // Account for padding
  const barWidth = arrayData && arrayData.length > 0 
    ? Math.floor(availableWidth / arrayData.length - gap) 
    : 8;

  // Initialize generator when algorithm changes
  const initGenerator = useCallback((data: ArrayData[]) => {
    const arrCopy = data.map((item) => ({ ...item }));
    setInternalArray(arrCopy);
    const algoFn = algorithmRegistry[currentAlgorithm];
    if (algoFn) {
      generatorRef.current = algoFn(arrCopy);
      isFinishedRef.current = false;
    }
  }, [currentAlgorithm]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (arrayData && arrayData.length > 0) {
      const arrCopy = arrayData.map((item) => ({ ...item }));
      setInternalArray(arrCopy);
      const algoFn = algorithmRegistry[currentAlgorithm];
      if (algoFn) {
        generatorRef.current = algoFn(arrCopy);
        isFinishedRef.current = false;
      }
    }
  }, [arrayData?.length, currentAlgorithm]);

  // Process algorithm step
  const processStep = useCallback(() => {
    if (!generatorRef.current || isPaused || isFinishedRef.current) return;

    const result = generatorRef.current.next();
    
    if (result.done) {
      isFinishedRef.current = true;
      // The internal array was modified in-place during sorting
      // Update the display to show the sorted array
      setArrayValues(internalArray.map((item) => item.value));
      setSortedIndices(new Set(internalArray.map((_, i) => i)));
      markArrayAsSorted();
      if (soundEnabled) {
        soundManager.playComplete();
      }
      return;
    }

    const operation = result.value;
    const maxValue = internalArray.length > 0 ? Math.max(...internalArray.map(a => a.value), 1) : 1;
    
    switch (operation.type) {
      case 'compare': {
        const [i, j] = operation.indices;
        setComparingIndices(new Set([i, j]));
        incrementComparisons();
        if (soundEnabledRef.current && internalArray[i] && internalArray[j]) {
          soundManager.playCompare(internalArray[i].value, maxValue);
        }
        break;
      }
      
      case 'swap': {
        const [i, j] = operation.indices;
        setSwappingIndices(new Set([i, j]));
        incrementSwaps();
        if (soundEnabledRef.current && internalArray[i] && internalArray[j]) {
          soundManager.playSwap(internalArray[i].value, internalArray[j].value, maxValue);
        }
        
        setInternalArray((prev) => {
          const newArray = [...prev];
          const temp = newArray[i];
          newArray[i] = newArray[j];
          newArray[j] = temp;
          return newArray;
        });
        break;
      }
      
      case 'pivot': {
        setPivotIndices((prev) => new Set([...prev, operation.index]));
        break;
      }
      
      case 'markSorted': {
        isFinishedRef.current = true;
        // Update the store with the final sorted array
        const sortedValues = internalArray.map((item) => item.value);
        setArrayValues(sortedValues);
        setSortedIndices(new Set(internalArray.map((_, i) => i)));
        markArrayAsSorted();
        if (soundEnabledRef.current) {
          soundManager.playComplete();
        }
        break;
      }
    }
  }, [isPaused, internalArray, incrementComparisons, incrementSwaps, markArrayAsSorted, setArrayValues]);

  // Animation loop
  useEffect(() => {
    if (isRunning && !isPaused && !isFinishedRef.current && generatorRef.current) {
      const delay = Math.max(10, 100 - speed * 0.9);
      
      const runStep = () => {
        processStep();
        animationFrameRef.current = setTimeout(runStep, delay) as unknown as number;
      };
      
      animationFrameRef.current = setTimeout(runStep, delay) as unknown as number;
    }
    
    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, [isRunning, isPaused, processStep, speed]);

  const handleRegenerate = () => {
    stop();
    setHasStarted(false);
    setSortedIndices(new Set());
    setComparingIndices(new Set());
    setSwappingIndices(new Set());
    setPivotIndices(new Set());
    isFinishedRef.current = false;
    generateArray();
  };

  const handleStart = () => {
    setHasStarted(true);
    if (arrayData) {
      const arrCopy = arrayData.map((item) => ({ ...item }));
      initGenerator(arrCopy);
    }
  };

  const toggleSound = () => {
    const newEnabled = soundManager.toggle();
    setSoundEnabled(newEnabled);
  };

  const displayArray = (hasStarted && internalArray.length > 0) ? internalArray : arrayData;
  const maxValue = displayArray && displayArray.length > 0 ? Math.max(...displayArray.map((a) => a.value), 1) : 1;

  // Guard against undefined/empty arrayData
  if (!arrayData || arrayData.length === 0) {
    return (
      <div className="relative w-full h-[60vh] glass rounded-2xl overflow-hidden flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] glass rounded-2xl overflow-hidden">
      {/* Visualizer Container */}
      <div className="absolute inset-4 flex items-end justify-center">
        {displayArray.map((item, index) => (
          <Bar
            key={index}
            data={item}
            index={index}
            maxValue={maxValue}
            isComparing={comparingIndices.has(index)}
            isSwapping={swappingIndices.has(index)}
            isSorted={sortedIndices.has(index)}
            isPivot={pivotIndices.has(index)}
            barWidth={barWidth}
            gap={gap}
          />
        ))}
      </div>
      
      {/* Regenerate Button */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleSound}
          className={`px-4 py-2 glass glass-hover rounded-lg text-sm font-medium
                     transition-all duration-200 ${soundEnabled ? 'bg-[#E63946]/30' : ''}`}
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 glass glass-hover rounded-lg text-sm font-medium
                     text-white transition-all duration-200"
        >
          Regenerate Array
        </button>
      </div>
      
      {/* Start Button Overlay - shown when not running */}
      {!isRunning && !hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-[#E63946] hover:bg-[#E63946]/80 rounded-2xl text-white font-semibold
                       shadow-lg shadow-[#E63946]/30 transition-all duration-200 transform hover:scale-105"
          >
            Start Sorting
          </button>
        </div>
      )}
      
      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 glass px-4 py-2 rounded-lg">
        <p className="text-xs text-gray-400">
          Array Size: <span className="text-white font-mono">{arrayData.length}</span>
        </p>
      </div>
    </div>
  );
};