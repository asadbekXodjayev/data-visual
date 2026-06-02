import type { CellType, GridCell } from "@/entities/grid/types";
import type { Point } from "./types";

export const DEFAULT_ROWS = 20;
export const DEFAULT_COLS = 35;

export const CELL_EMPTY: CellType = 0;
export const CELL_WALL: CellType = 1;

/** Stable string key for a coordinate, used in Sets/Maps. */
export function keyOf(row: number, col: number): string {
  return `${row},${col}`;
}

export function pointsEqual(a: Point, b: Point): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Build a fresh grid of plain, JSON-serializable cells.
 *
 * The pathfinding generators deep-clone the grid via JSON, and only inspect
 * `type === 1` (walls). Start/end positions are tracked separately by the UI,
 * so every cell here is either empty (0) or a wall (1).
 */
export function createGrid(rows: number, cols: number): GridCell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col): GridCell => ({
      row,
      col,
      type: CELL_EMPTY,
    }))
  );
}

/** Return a deep-ish copy of the grid with one cell's type replaced. */
export function withCellType(
  grid: GridCell[][],
  row: number,
  col: number,
  type: CellType
): GridCell[][] {
  return grid.map((r, ri) =>
    ri !== row ? r : r.map((cell, ci) => (ci !== col ? cell : { ...cell, type }))
  );
}

/** Reset every cell back to empty (clears walls). */
export function clearGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell, type: CELL_EMPTY })));
}

/**
 * Scatter walls at the given density, never overwriting start/end.
 * density is a fraction in [0, 1].
 */
export function randomMaze(
  rows: number,
  cols: number,
  start: Point,
  end: Point,
  density = 0.28
): GridCell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col): GridCell => {
      const isAnchor =
        (row === start.row && col === start.col) ||
        (row === end.row && col === end.col);
      const isWall = !isAnchor && Math.random() < density;
      return { row, col, type: isWall ? CELL_WALL : CELL_EMPTY };
    })
  );
}

/** Clamp a point into the grid bounds. */
export function clampPoint(p: Point, rows: number, cols: number): Point {
  return {
    row: Math.max(0, Math.min(rows - 1, p.row)),
    col: Math.max(0, Math.min(cols - 1, p.col)),
  };
}
