export type CellType = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = empty, 1 = wall, 2 = start, 3 = end, 4 = visited, 5 = path

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
  distance?: number;
  previous?: { row: number; col: number };
}

export interface GridState {
  rows: number;
  cols: number;
  cells: GridCell[][];
  isDrawing: boolean;
  drawType: CellType;
  isRunning: boolean;
  isFinished: boolean;
}

export type PathfindingAlgorithm = 'dijkstra' | 'astar' | 'bfs' | 'dfs';

export interface PathfindingResult {
  path: { row: number; col: number }[];
  visited: { row: number; col: number }[];
  steps: number;
}