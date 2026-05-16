'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrayData } from '../store';

interface BarProps {
  data: ArrayData;
  index: number;
  maxValue: number;
  isComparing: boolean;
  isSwapping: boolean;
  isSorted: boolean;
  isPivot: boolean;
  barWidth: number;
  gap: number;
}

const BarComponent: React.FC<BarProps> = ({
  data,
  index,
  maxValue,
  isComparing,
  isSwapping,
  isSorted,
  isPivot,
  barWidth,
  gap,
}) => {
  const height = useMemo(() => {
    return (data.value / maxValue) * 100;
  }, [data.value, maxValue]);

  const xPosition = useMemo(() => {
    return index * (barWidth + gap);
  }, [index, barWidth, gap]);

  // Determine bar color based on state
  const getBarColor = () => {
    if (isSorted) return '#4CC9F0'; // Blue for sorted
    if (isPivot) return '#E63946'; // Red for pivot
    if (isSwapping) return '#F72585'; // Pink for swapping
    if (isComparing) return '#E63946'; // Red for comparing
    return '#7209B7'; // Default purple
  };

  return (
    <motion.div
      className="absolute bottom-0 rounded-t-md"
      style={{
        left: xPosition,
        width: barWidth,
        height: `${height}%`,
        backgroundColor: getBarColor(),
        boxShadow: isComparing || isSwapping || isPivot 
          ? `0 0 15px ${getBarColor()}80` 
          : 'none',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
      }}
      layout
      layoutId={`bar-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        height: `${height}%`,
      }}
      transition={{ 
        duration: 0.2,
        ease: 'easeOut',
      }}
    />
  );
};

export const Bar = memo(BarComponent, (prev, next) => {
  return (
    prev.data.value === next.data.value &&
    prev.isComparing === next.isComparing &&
    prev.isSwapping === next.isSwapping &&
    prev.isSorted === next.isSorted &&
    prev.isPivot === next.isPivot &&
    prev.maxValue === next.maxValue
  );
});

Bar.displayName = 'Bar';