import type { PathfindingAlgorithm } from "@/entities/grid/types";

export type { PathfindingAlgorithm };

/** A single coordinate on the grid. */
export interface Point {
  row: number;
  col: number;
}

/** What the user is currently dragging while the pointer is down. */
export type DragMode = "none" | "wall" | "erase" | "start" | "end";

/** High-level lifecycle of the visualizer. */
export type RunPhase = "idle" | "running" | "done" | "no-path";

export interface AlgorithmMeta {
  id: PathfindingAlgorithm;
  label: string;
  /** Short, scientific-sounding subtitle. */
  blurb: string;
  /** Whether it guarantees the shortest path. */
  optimal: boolean;
}

export const ALGORITHMS: readonly AlgorithmMeta[] = [
  { id: "dijkstra", label: "Dijkstra", blurb: "Weighted · optimal", optimal: true },
  { id: "astar", label: "A*", blurb: "Heuristic · optimal", optimal: true },
  { id: "bfs", label: "BFS", blurb: "Breadth-first · optimal", optimal: true },
  { id: "dfs", label: "DFS", blurb: "Depth-first · greedy", optimal: false },
] as const;
