"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Compass } from "lucide-react";

import { cn } from "@/lib/utils";

import type { RunPhase } from "./types";

interface StatsPanelProps {
  visitedCount: number;
  pathLength: number;
  phase: RunPhase;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
      <span className="text-[0.58rem] font-medium tracking-[0.18em] text-white/40 uppercase">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold tabular-nums" style={{ color: accent }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export function StatsPanel({ visitedCount, pathLength, phase }: StatsPanelProps) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Compass className="size-3.5 text-white/40" />
        <span className="text-[0.6rem] font-medium tracking-[0.18em] text-white/40 uppercase">
          Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Visited" value={visitedCount} accent="#22D3EE" />
        <Stat label="Path" value={phase === "no-path" ? 0 : pathLength} accent="#FFB627" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "no-path" && (
          <StatusBanner
            key="no-path"
            reduced={!!reduced}
            className="border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF8B8B]"
            icon={<AlertTriangle className="size-4 shrink-0" />}
          >
            No path found — the target is walled off.
          </StatusBanner>
        )}
        {phase === "done" && (
          <StatusBanner
            key="done"
            reduced={!!reduced}
            className="border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#7DE9FB]"
            icon={<CheckCircle2 className="size-4 shrink-0" />}
          >
            Path found in {pathLength} steps.
          </StatusBanner>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBanner({
  children,
  icon,
  className,
  reduced,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  className: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </motion.div>
  );
}
