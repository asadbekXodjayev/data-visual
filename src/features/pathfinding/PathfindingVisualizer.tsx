"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import { GridCellView, type CellVisual } from "./GridCellView";
import { Legend } from "./Legend";
import { StatsPanel } from "./StatsPanel";
import { Toolbar } from "./Toolbar";
import { keyOf } from "./grid-utils";
import { usePathfinding } from "./use-pathfinding";

/**
 * Scoped styles for the grid-cell animations. We can't touch globals.css, so
 * the keyframes live here. Animating only background/box-shadow/transform keeps
 * a 700-cell grid smooth (no layout thrash, no per-cell framer-motion).
 */
const GRID_STYLES = `
.pf-visited {
  background: linear-gradient(135deg, rgba(34,211,238,0.55), rgba(124,58,237,0.55));
  box-shadow: inset 0 0 6px rgba(34,211,238,0.35);
}
.pf-path {
  background: #FFB627;
  box-shadow: 0 0 8px 1px rgba(255,182,39,0.75), inset 0 0 4px rgba(255,255,255,0.5);
}
.pf-pop {
  animation: pf-pop 0.32s cubic-bezier(0.2, 0.9, 0.25, 1) both;
}
@keyframes pf-pop {
  0%   { transform: scale(0.2); opacity: 0.4; }
  55%  { transform: scale(1.18); }
  100% { transform: scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pf-pop { animation: none; }
}
`;

interface PathfindingVisualizerProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function PathfindingVisualizer({
  rows,
  cols,
  className,
}: PathfindingVisualizerProps) {
  const pf = usePathfinding({ rows, cols });
  const reducedMotion = !!useReducedMotion();

  const {
    grid,
    start,
    end,
    visited,
    path,
    onCellPointerDown,
    onCellPointerEnter,
    onPointerUp,
  } = pf;

  // Releasing the pointer anywhere (even off the grid) ends a drag.
  useEffect(() => {
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerUp]);

  // GridCellView reports (row, col); the hook works in Point objects.
  const handleCellDown = useCallback(
    (row: number, col: number) => onCellPointerDown({ row, col }),
    [onCellPointerDown]
  );
  const handleCellEnter = useCallback(
    (row: number, col: number) => onCellPointerEnter({ row, col }),
    [onCellPointerEnter]
  );

  const startKey = keyOf(start.row, start.col);
  const endKey = keyOf(end.row, end.col);

  const visualFor = useMemo(() => {
    return (row: number, col: number): CellVisual => {
      const k = keyOf(row, col);
      if (k === startKey) return "start";
      if (k === endKey) return "end";
      if (path.has(k)) return "path";
      if (visited.has(k)) return "visited";
      if (grid[row][col].type === 1) return "wall";
      return "empty";
    };
  }, [startKey, endKey, path, visited, grid]);

  return (
    <div
      className={cn(
        "w-full text-white",
        // ensure dark instrument backdrop even if mounted on a light page
        className
      )}
    >
      <style>{GRID_STYLES}</style>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Grid panel */}
        <section className="order-2 flex flex-col gap-4 lg:order-1">
          <div
            className="rounded-2xl border border-white/10 bg-[#0B0E14] p-3 backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
          >
            <div
              role="grid"
              aria-label="Pathfinding grid"
              onContextMenu={(e) => e.preventDefault()}
              className="grid touch-none gap-0 overflow-hidden rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${pf.cols}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((rowCells, r) =>
                rowCells.map((_, c) => (
                  <GridCellView
                    key={`${r}-${c}`}
                    row={r}
                    col={c}
                    visual={visualFor(r, c)}
                    reducedMotion={reducedMotion}
                    onPointerDown={handleCellDown}
                    onPointerEnter={handleCellEnter}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <Legend />
            <p className="text-[0.62rem] tracking-wide text-white/35">
              Drag to draw walls · drag the nodes to move them
            </p>
          </div>
        </section>

        {/* Control column */}
        <aside className="order-1 flex flex-col gap-4 lg:order-2">
          <header className="flex flex-col gap-1">
            <span className="text-[0.6rem] font-medium tracking-[0.22em] text-[#22D3EE]/80 uppercase">
              Pathfinding Lab
            </span>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-white">
              Grid Traversal Visualizer
            </h2>
          </header>

          <Toolbar
            algorithm={pf.algorithm}
            onAlgorithm={pf.setAlgorithm}
            speed={pf.speed}
            onSpeed={pf.setSpeed}
            phase={pf.phase}
            isRunning={pf.isRunning}
            onVisualize={pf.visualize}
            onClearPath={pf.clearPath}
            onClearBoard={pf.clearBoard}
            onMaze={pf.generateMaze}
          />

          <StatsPanel
            visitedCount={pf.visitedCount}
            pathLength={pf.pathLength}
            phase={pf.phase}
          />
        </aside>
      </div>
    </div>
  );
}

export default PathfindingVisualizer;
