"use client";

import { Eraser, Play, Shuffle, Square, Trash2, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import { ALGORITHMS } from "./types";
import type { PathfindingAlgorithm, RunPhase } from "./types";

interface ToolbarProps {
  algorithm: PathfindingAlgorithm;
  onAlgorithm: (algo: PathfindingAlgorithm) => void;
  speed: number;
  onSpeed: (speed: number) => void;
  phase: RunPhase;
  isRunning: boolean;
  onVisualize: () => void;
  onClearPath: () => void;
  onClearBoard: () => void;
  onMaze: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.6rem] font-medium tracking-[0.18em] text-white/40 uppercase">
      {children}
    </span>
  );
}

export function Toolbar({
  algorithm,
  onAlgorithm,
  speed,
  onSpeed,
  phase,
  isRunning,
  onVisualize,
  onClearPath,
  onClearBoard,
  onMaze,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      {/* Algorithm segmented control */}
      <div className="flex flex-col gap-2">
        <Label>Algorithm</Label>
        <div
          role="radiogroup"
          aria-label="Pathfinding algorithm"
          className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1 sm:grid-cols-4"
        >
          {ALGORITHMS.map((meta) => {
            const active = meta.id === algorithm;
            return (
              <button
                key={meta.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isRunning}
                onClick={() => onAlgorithm(meta.id)}
                className={cn(
                  "group relative flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-all outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "bg-gradient-to-b from-[#22D3EE]/20 to-[#22D3EE]/5 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.4)]"
                    : "hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-sm font-semibold transition-colors",
                    active ? "text-[#5BE8FF]" : "text-white/80"
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-[0.6rem] tracking-wide text-white/40">
                  {meta.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Speed</Label>
          <span className="flex items-center gap-1 font-mono text-xs text-white/60">
            <Zap className="size-3 text-[#FFB627]" />
            {speed}
          </span>
        </div>
        <Slider
          min={1}
          max={100}
          value={[speed]}
          disabled={isRunning}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number") onSpeed(next);
          }}
          className="[&_[data-slot=slider-range]]:bg-[#22D3EE] [&_[data-slot=slider-thumb]]:border-[#22D3EE] [&_[data-slot=slider-track]]:bg-white/10"
        />
      </div>

      {/* Primary action */}
      <Button
        type="button"
        onClick={isRunning ? undefined : onVisualize}
        disabled={isRunning}
        size="lg"
        className={cn(
          "h-11 w-full gap-2 rounded-xl border-0 font-semibold tracking-wide text-black transition-all",
          "bg-gradient-to-r from-[#FFB627] to-[#FFCB5E]",
          "hover:from-[#FFC44D] hover:to-[#FFD884]",
          "shadow-[0_0_24px_-6px_rgba(255,182,39,0.7)]",
          "disabled:opacity-70"
        )}
      >
        {isRunning ? (
          <>
            <Square className="size-4 animate-pulse fill-current" />
            Searching…
          </>
        ) : (
          <>
            <Play className="size-4 fill-current" />
            Visualize {ALGORITHMS.find((a) => a.id === algorithm)?.label}
          </>
        )}
      </Button>

      {/* Secondary actions */}
      <div className="grid grid-cols-3 gap-1.5">
        <ToolButton onClick={onMaze} disabled={isRunning} icon={<Shuffle className="size-3.5" />}>
          Maze
        </ToolButton>
        <ToolButton
          onClick={onClearPath}
          disabled={isRunning || phase === "idle"}
          icon={<Eraser className="size-3.5" />}
        >
          Clear Path
        </ToolButton>
        <ToolButton onClick={onClearBoard} disabled={isRunning} icon={<Trash2 className="size-3.5" />}>
          Reset
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5",
        "text-[0.65rem] font-medium tracking-wide text-white/70 transition-all",
        "hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
        "focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
