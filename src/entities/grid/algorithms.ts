import { GridCell, PathfindingResult } from './types';

const DIRECTIONS = [
  { dr: -1, dc: 0 }, // up
  { dr: 1, dc: 0 },  // down
  { dr: 0, dc: -1 }, // left
  { dr: 0, dc: 1 },  // right
];

const DIRECTIONS_8 = [
  { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
  { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
  { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
  { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
];

export function* dijkstra(
  grid: GridCell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): Generator<{ visited: { row: number; col: number }; grid: GridCell[][] }, PathfindingResult | null, unknown> {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const distance: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(Infinity));
  const previous: (GridCell | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  const visitedSet = new Set<string>();
  
  distance[start.row][start.col] = 0;
  
  // Priority queue simulation using array
  const queue: { row: number; col: number; dist: number }[] = [
    { row: start.row, col: start.col, dist: 0 }
  ];
  
  while (queue.length > 0) {
    // Sort and get minimum
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;
    
    const key = `${current.row},${current.col}`;
    if (visitedSet.has(key)) continue;
    visitedSet.add(key);
    
    // Yield for visualization
    yield { 
      visited: { row: current.row, col: current.col },
      grid: JSON.parse(JSON.stringify(grid))
    };
    
    // Check if reached end
    if (current.row === end.row && current.col === end.col) {
      break;
    }
    
    // Explore neighbors
    for (const { dr, dc } of DIRECTIONS) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
      if (grid[newRow][newCol].type === 1) continue; // Wall
      
      const newDist = distance[current.row][current.col] + 1;
      
      if (newDist < distance[newRow][newCol]) {
        distance[newRow][newCol] = newDist;
        previous[newRow][newCol] = grid[current.row][current.col];
        queue.push({ row: newRow, col: newCol, dist: newDist });
      }
    }
  }
  
  // Reconstruct path
  const path: { row: number; col: number }[] = [];
  let current: { row: number; col: number } | null = end;
  
  while (current) {
    path.unshift(current);
    const prev: GridCell | null = previous[current.row][current.col];
    current = prev ? { row: prev.row, col: prev.col } : null;
  }
  
  // Check if path exists
  if (path.length === 0 || path[0].row !== start.row || path[0].col !== start.col) {
    return null;
  }
  
  return {
    path,
    visited: Array.from(visitedSet).map(str => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    }),
    steps: path.length
  };
}

export function* astar(
  grid: GridCell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): Generator<{ visited: { row: number; col: number }; grid: GridCell[][] }, PathfindingResult | null, unknown> {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const heuristic = (r1: number, c1: number, r2: number, c2: number) => {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2); // Manhattan distance
  };
  
  const gScore: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(Infinity));
  const fScore: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(Infinity));
  const previous: (GridCell | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  const visitedSet = new Set<string>();
  
  gScore[start.row][start.col] = 0;
  fScore[start.row][start.col] = heuristic(start.row, start.col, end.row, end.col);
  
  const queue: { row: number; col: number; f: number }[] = [
    { row: start.row, col: start.col, f: fScore[start.row][start.col] }
  ];
  
  while (queue.length > 0) {
    queue.sort((a, b) => a.f - b.f);
    const current = queue.shift()!;
    
    const key = `${current.row},${current.col}`;
    if (visitedSet.has(key)) continue;
    visitedSet.add(key);
    
    yield { 
      visited: { row: current.row, col: current.col },
      grid: JSON.parse(JSON.stringify(grid))
    };
    
    if (current.row === end.row && current.col === end.col) {
      break;
    }
    
    for (const { dr, dc } of DIRECTIONS) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
      if (grid[newRow][newCol].type === 1) continue;
      
      const tentativeG = gScore[current.row][current.col] + 1;
      
      if (tentativeG < gScore[newRow][newCol]) {
        previous[newRow][newCol] = grid[current.row][current.col];
        gScore[newRow][newCol] = tentativeG;
        fScore[newRow][newCol] = tentativeG + heuristic(newRow, newCol, end.row, end.col);
        queue.push({ row: newRow, col: newCol, f: fScore[newRow][newCol] });
      }
    }
  }
  
  // Reconstruct path
  const path: { row: number; col: number }[] = [];
  let current: { row: number; col: number } | null = end;
  
  while (current) {
    path.unshift(current);
    const prev: GridCell | null = previous[current.row][current.col];
    current = prev ? { row: prev.row, col: prev.col } : null;
  }
  
  if (path.length === 0 || path[0].row !== start.row || path[0].col !== start.col) {
    return null;
  }
  
  return {
    path,
    visited: Array.from(visitedSet).map(str => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    }),
    steps: path.length
  };
}

export function* bfs(
  grid: GridCell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): Generator<{ visited: { row: number; col: number }; grid: GridCell[][] }, PathfindingResult | null, unknown> {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const visitedSet = new Set<string>();
  const previous: (GridCell | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  const queue: { row: number; col: number }[] = [start];
  
  visitedSet.add(`${start.row},${start.col}`);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    yield { 
      visited: { row: current.row, col: current.col },
      grid: JSON.parse(JSON.stringify(grid))
    };
    
    if (current.row === end.row && current.col === end.col) {
      break;
    }
    
    for (const { dr, dc } of DIRECTIONS) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const key = `${newRow},${newCol}`;
      
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
      if (visitedSet.has(key)) continue;
      if (grid[newRow][newCol].type === 1) continue;
      
      visitedSet.add(key);
      previous[newRow][newCol] = grid[current.row][current.col];
      queue.push({ row: newRow, col: newCol });
    }
  }
  
  // Reconstruct path
  const path: { row: number; col: number }[] = [];
  let current: { row: number; col: number } | null = end;
  
  while (current) {
    path.unshift(current);
    const prev: GridCell | null = previous[current.row][current.col];
    current = prev ? { row: prev.row, col: prev.col } : null;
  }
  
  if (path.length === 0 || path[0].row !== start.row || path[0].col !== start.col) {
    return null;
  }
  
  return {
    path,
    visited: Array.from(visitedSet).map(str => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    }),
    steps: path.length
  };
}

export function* dfs(
  grid: GridCell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): Generator<{ visited: { row: number; col: number }; grid: GridCell[][] }, PathfindingResult | null, unknown> {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const visitedSet = new Set<string>();
  const previous: (GridCell | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
  const stack: { row: number; col: number }[] = [start];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.row},${current.col}`;
    
    if (visitedSet.has(key)) continue;
    visitedSet.add(key);
    
    yield { 
      visited: { row: current.row, col: current.col },
      grid: JSON.parse(JSON.stringify(grid))
    };
    
    if (current.row === end.row && current.col === end.col) {
      break;
    }
    
    // Add neighbors in reverse order for consistent exploration
    for (const { dr, dc } of [...DIRECTIONS].reverse()) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;
      const neighborKey = `${newRow},${newCol}`;
      
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
      if (visitedSet.has(neighborKey)) continue;
      if (grid[newRow][newCol].type === 1) continue;
      
      previous[newRow][newCol] = grid[current.row][current.col];
      stack.push({ row: newRow, col: newCol });
    }
  }
  
  // Reconstruct path
  const path: { row: number; col: number }[] = [];
  let current: { row: number; col: number } | null = end;
  
  while (current) {
    path.unshift(current);
    const prev: GridCell | null = previous[current.row][current.col];
    current = prev ? { row: prev.row, col: prev.col } : null;
  }
  
  if (path.length === 0 || path[0].row !== start.row || path[0].col !== start.col) {
    return null;
  }
  
  return {
    path,
    visited: Array.from(visitedSet).map(str => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    }),
    steps: path.length
  };
}

export const pathfindingAlgorithms = {
  dijkstra,
  astar,
  bfs,
  dfs,
};