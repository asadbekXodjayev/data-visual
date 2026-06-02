"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GridCell, PathfindingResult } from "@/entities/grid/types";
import { pathfindingAlgorithms } from "@/entities/grid/algorithms";

import {
  CELL_WALL,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  clampPoint,
  clearGrid,
  createGrid,
  keyOf,
  pointsEqual,
  randomMaze,
  withCellType,
} from "./grid-utils";
import type { DragMode, PathfindingAlgorithm, Point, RunPhase } from "./types";

/** Map a UI speed (1 slow … 100 fast) to a per-step delay in ms. */
function speedToDelay(speed: number): number {
  const clamped = Math.max(1, Math.min(100, speed));
  // 1 -> ~90ms, 100 -> ~2ms (eased)
  return Math.round(90 * Math.pow(1 - clamped / 100, 1.7)) + 2;
}

interface UsePathfindingOptions {
  rows?: number;
  cols?: number;
}

export interface PathfindingState {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: Point;
  end: Point;
  algorithm: PathfindingAlgorithm;
  speed: number;
  phase: RunPhase;
  /** Cells discovered so far, by `${row},${col}` key. */
  visited: ReadonlySet<string>;
  /** Final path cells, by key (revealed progressively). */
  path: ReadonlySet<string>;
  visitedCount: number;
  pathLength: number;
  isRunning: boolean;
}

export interface PathfindingActions {
  setAlgorithm: (algo: PathfindingAlgorithm) => void;
  setSpeed: (speed: number) => void;
  visualize: () => void;
  clearPath: () => void;
  clearBoard: () => void;
  generateMaze: () => void;
  // pointer interaction
  onCellPointerDown: (p: Point) => void;
  onCellPointerEnter: (p: Point) => void;
  onPointerUp: () => void;
}

export function usePathfinding(
  options: UsePathfindingOptions = {}
): PathfindingState & PathfindingActions {
  const rows = options.rows ?? DEFAULT_ROWS;
  const cols = options.cols ?? DEFAULT_COLS;

  const initialStart = useMemo<Point>(
    () => ({ row: Math.floor(rows / 2), col: Math.floor(cols * 0.18) }),
    [rows, cols]
  );
  const initialEnd = useMemo<Point>(
    () => ({ row: Math.floor(rows / 2), col: Math.floor(cols * 0.82) }),
    [rows, cols]
  );

  const [grid, setGrid] = useState<GridCell[][]>(() => createGrid(rows, cols));
  const [start, setStart] = useState<Point>(initialStart);
  const [end, setEnd] = useState<Point>(initialEnd);
  const [algorithm, setAlgorithm] = useState<PathfindingAlgorithm>("astar");
  const [speed, setSpeed] = useState<number>(65);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [path, setPath] = useState<Set<string>>(() => new Set());

  const [drag, setDrag] = useState<DragMode>("none");

  // Refs to read latest values inside async loops without re-subscribing.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const isRunning = phase === "running";

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Clean up any pending timer on unmount.
  useEffect(() => stopTimer, [stopTimer]);

  const resetTransient = useCallback(() => {
    setVisited(new Set());
    setPath(new Set());
    setPhase("idle");
  }, []);

  /* ---------------------------------------------------------------- pointer */

  const onCellPointerDown = useCallback(
    (p: Point) => {
      if (phaseRef.current === "running") return;
      if (pointsEqual(p, start)) {
        setDrag("start");
        return;
      }
      if (pointsEqual(p, end)) {
        setDrag("end");
        return;
      }
      const isWall = grid[p.row][p.col].type === CELL_WALL;
      const mode: DragMode = isWall ? "erase" : "wall";
      setDrag(mode);
      setGrid((g) => withCellType(g, p.row, p.col, isWall ? 0 : CELL_WALL));
      // Mutating walls invalidates a finished run.
      if (phaseRef.current !== "idle") resetTransient();
    },
    [grid, start, end, resetTransient]
  );

  const onCellPointerEnter = useCallback(
    (p: Point) => {
      if (drag === "none" || phaseRef.current === "running") return;

      if (drag === "start") {
        if (pointsEqual(p, end)) return;
        if (grid[p.row][p.col].type === CELL_WALL) return;
        setStart(p);
        if (phaseRef.current !== "idle") resetTransient();
        return;
      }
      if (drag === "end") {
        if (pointsEqual(p, start)) return;
        if (grid[p.row][p.col].type === CELL_WALL) return;
        setEnd(p);
        if (phaseRef.current !== "idle") resetTransient();
        return;
      }
      if (pointsEqual(p, start) || pointsEqual(p, end)) return;

      const shouldBeWall = drag === "wall";
      const currentlyWall = grid[p.row][p.col].type === CELL_WALL;
      if (shouldBeWall === currentlyWall) return; // no change
      setGrid((g) => withCellType(g, p.row, p.col, shouldBeWall ? CELL_WALL : 0));
      if (phaseRef.current !== "idle") resetTransient();
    },
    [drag, grid, start, end, resetTransient]
  );

  const onPointerUp = useCallback(() => setDrag("none"), []);

  /* ------------------------------------------------------------- visualize */

  const revealPath = useCallback(
    (fullPath: { row: number; col: number }[]) => {
      // Skip start & end nodes for a cleaner trail.
      const trail = fullPath.filter(
        (c) =>
          !(c.row === start.row && c.col === start.col) &&
          !(c.row === end.row && c.col === end.col)
      );
      if (trail.length === 0) {
        setPhase("done");
        return;
      }
      let i = 0;
      const step = () => {
        setPath((prev) => {
          const next = new Set(prev);
          next.add(keyOf(trail[i].row, trail[i].col));
          return next;
        });
        i += 1;
        if (i < trail.length) {
          timerRef.current = setTimeout(step, 28);
        } else {
          timerRef.current = null;
          setPhase("done");
        }
      };
      timerRef.current = setTimeout(step, 28);
    },
    [start, end]
  );

  const visualize = useCallback(() => {
    if (phaseRef.current === "running") return;
    stopTimer();
    setVisited(new Set());
    setPath(new Set());
    setPhase("running");

    const generator = pathfindingAlgorithms[algorithm](grid, start, end);

    const tick = () => {
      const step = generator.next();

      if (!step.done) {
        const { row, col } = step.value.visited;
        setVisited((prev) => {
          const next = new Set(prev);
          next.add(keyOf(row, col));
          return next;
        });
        timerRef.current = setTimeout(tick, speedToDelay(speedRef.current));
        return;
      }

      // Generator finished — step.value is PathfindingResult | null.
      timerRef.current = null;
      const result: PathfindingResult | null = step.value;
      if (!result || result.path.length === 0) {
        setPhase("no-path");
        return;
      }
      revealPath(result.path);
    };

    timerRef.current = setTimeout(tick, speedToDelay(speedRef.current));
  }, [algorithm, grid, start, end, stopTimer, revealPath]);

  /* ---------------------------------------------------------------- resets */

  const clearPath = useCallback(() => {
    stopTimer();
    resetTransient();
  }, [stopTimer, resetTransient]);

  const clearBoard = useCallback(() => {
    stopTimer();
    setGrid((g) => clearGrid(g));
    setStart(initialStart);
    setEnd(initialEnd);
    resetTransient();
  }, [stopTimer, initialStart, initialEnd, resetTransient]);

  const generateMaze = useCallback(() => {
    stopTimer();
    setGrid(randomMaze(rows, cols, start, end));
    resetTransient();
  }, [stopTimer, rows, cols, start, end, resetTransient]);

  const handleSetAlgorithm = useCallback(
    (algo: PathfindingAlgorithm) => {
      setAlgorithm(algo);
      if (phaseRef.current === "done" || phaseRef.current === "no-path") {
        stopTimer();
        resetTransient();
      }
    },
    [stopTimer, resetTransient]
  );

  const visitedCount = visited.size;
  const pathLength = path.size;

  return {
    rows,
    cols,
    grid,
    start,
    end,
    algorithm,
    speed,
    phase,
    visited,
    path,
    visitedCount,
    pathLength,
    isRunning,
    setAlgorithm: handleSetAlgorithm,
    setSpeed,
    visualize,
    clearPath,
    clearBoard,
    generateMaze,
    onCellPointerDown,
    onCellPointerEnter,
    onPointerUp,
  };
}

export { clampPoint };
