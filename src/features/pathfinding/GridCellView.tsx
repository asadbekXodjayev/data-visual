"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

export type CellVisual = "empty" | "wall" | "start" | "end" | "visited" | "path";

interface GridCellViewProps {
  row: number;
  col: number;
  visual: CellVisual;
  reducedMotion: boolean;
  onPointerDown: (row: number, col: number) => void;
  onPointerEnter: (row: number, col: number) => void;
}

/**
 * A single grid square. Pure transform/opacity/color transitions only — no
 * layout animation, no framer-motion per cell, so a 700-cell grid stays smooth.
 * The "pop" on visited/path cells is driven by a CSS keyframe toggled via class.
 */
function GridCellViewBase({
  row,
  col,
  visual,
  reducedMotion,
  onPointerDown,
  onPointerEnter,
}: GridCellViewProps) {
  return (
    <div
      role="gridcell"
      aria-label={`row ${row + 1}, column ${col + 1}, ${visual}`}
      data-visual={visual}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown(row, col);
      }}
      onPointerEnter={() => onPointerEnter(row, col)}
      className={cn(
        "relative aspect-square select-none border-[0.5px] border-white/5 transition-colors duration-150",
        visual === "empty" && "bg-transparent hover:bg-white/[0.06]",
        visual === "wall" &&
          "border-white/10 bg-white/[0.16] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
        visual === "visited" && "pf-visited",
        visual === "path" && "pf-path",
        // start / end are rendered as glowing nodes
        (visual === "start" || visual === "end") && "z-10",
        !reducedMotion && (visual === "visited" || visual === "path") && "pf-pop"
      )}
      style={
        visual === "start"
          ? { background: "radial-gradient(circle at 50% 40%, #5BE8FF, #22D3EE)" }
          : visual === "end"
            ? { background: "radial-gradient(circle at 50% 40%, #FFD074, #FFB627)" }
            : undefined
      }
    >
      {(visual === "start" || visual === "end") && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            visual === "start"
              ? "shadow-[0_0_10px_2px_rgba(34,211,238,0.65),inset_0_0_6px_rgba(255,255,255,0.4)]"
              : "shadow-[0_0_10px_2px_rgba(255,182,39,0.65),inset_0_0_6px_rgba(255,255,255,0.4)]"
          )}
        />
      )}
    </div>
  );
}

export const GridCellView = memo(GridCellViewBase);
