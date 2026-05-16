'use client';

import { SortingVisualizer } from '@/entities/algorithm/components/SortingVisualizer';
import { AlgorithmSelector } from '@/entities/algorithm/components/AlgorithmSelector';
import { GlobalHUD } from '@/features/controls/GlobalHUD';
import { motion } from 'framer-motion';
import { Cpu, Zap, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A122E] relative overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#E63946]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[#4CC9F0]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7209B7]/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#E63946]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Show-Data
                </h1>
                <p className="text-xs text-gray-400">Algorithm Visualization Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg">
                <Activity className="w-4 h-4 text-[#4CC9F0]" />
                <span className="text-sm text-gray-300">System Ready</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Visualizer Area */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <SortingVisualizer />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-2xl p-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-[#E63946]" />
                <h2 className="text-lg font-semibold text-white">Algorithms</h2>
              </div>
              
              <AlgorithmSelector />
            </motion.div>
          </div>

          {/* Global HUD Controls - positioned below visualizer */}
          <div className="lg:col-span-3 mt-4">
            <GlobalHUD />
          </div>
        </div>
      </main>
    </div>
  );
}
