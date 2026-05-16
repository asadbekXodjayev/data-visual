'use client';

import React from 'react';
import { useAlgorithmState, useAlgorithmActions, SortAlgorithm } from '../store';

const categories: Array<{
  id: 'simple' | 'efficient' | 'distribution' | 'exotic';
  title: string;
  description: string;
}> = [
  { id: 'simple', title: 'Simple', description: 'Basic algorithms for learning' },
  { id: 'efficient', title: 'Efficient', description: 'O(n log n) complexity' },
  { id: 'distribution', title: 'Distribution', description: 'Non-comparison based' },
  { id: 'exotic', title: 'Exotic', description: 'Unique approaches' },
];

interface AlgorithmSelectorProps {
  onSelect?: (algorithm: string) => void;
}

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ onSelect }) => {
  const { currentAlgorithm, isRunning } = useAlgorithmState();
  const { setAlgorithm, getAllAlgorithms } = useAlgorithmActions();
  
  const algorithms = getAllAlgorithms();
  
  const handleSelect = (algo: SortAlgorithm) => {
    setAlgorithm(algo.name);
    onSelect?.(algo.name);
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {category.title}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          
          <p className="text-xs text-gray-500 -mt-2">{category.description}</p>
          
          <div className="grid grid-cols-2 gap-2">
            {algorithms
              .filter((algo) => algo.category === category.id)
              .map((algo) => (
                <button
                  key={algo.name}
                  onClick={() => handleSelect(algo)}
                  disabled={isRunning}
                  className={`
                    px-4 py-3 rounded-xl text-left transition-all duration-200
                    glass glass-hover group relative overflow-hidden
                    ${currentAlgorithm === algo.name 
                      ? 'glass-active ring-1 ring-[#E63946]' 
                      : ''}
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-white group-hover:text-[#E63946] transition-colors">
                      {algo.displayName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {algo.complexity}
                    </p>
                  </div>
                  
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E63946]/0 via-[#E63946]/5 to-[#E63946]/0 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};