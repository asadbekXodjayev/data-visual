import { nextId, type HeapItem, type TreeNode } from './types';

/**
 * Binary heap stored as a flat array (a complete binary tree). Each slot keeps
 * a stable id, so when sift-up/down swaps two slots the *nodes* trade places —
 * the canvas then animates a value visibly climbing or sinking through the heap.
 *
 * `isMin` selects the ordering: a min-heap keeps the smallest at the root, a
 * max-heap the largest.
 */

const ordered = (a: number, b: number, isMin: boolean): boolean =>
  isMin ? a < b : a > b;

function siftUp(arr: HeapItem[], start: number, isMin: boolean): void {
  let i = start;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (!ordered(arr[i].value, arr[parent].value, isMin)) break;
    [arr[i], arr[parent]] = [arr[parent], arr[i]];
    i = parent;
  }
}

function siftDown(arr: HeapItem[], start: number, isMin: boolean): void {
  const n = arr.length;
  let i = start;
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let best = i;
    if (l < n && ordered(arr[l].value, arr[best].value, isMin)) best = l;
    if (r < n && ordered(arr[r].value, arr[best].value, isMin)) best = r;
    if (best === i) break;
    [arr[i], arr[best]] = [arr[best], arr[i]];
    i = best;
  }
}

export interface HeapInsertResult {
  arr: HeapItem[];
  newId: number;
}

/** Append a value and bubble it up to its sorted position. */
export function heapInsert(arr: HeapItem[], value: number, isMin: boolean): HeapInsertResult {
  const next = arr.map((it) => ({ ...it }));
  const item: HeapItem = { id: nextId(), value };
  next.push(item);
  siftUp(next, next.length - 1, isMin);
  return { arr: next, newId: item.id };
}

export interface HeapExtractResult {
  arr: HeapItem[];
  removedId: number;
  removedValue: number;
}

/** Remove and return the root, then restore the heap by sinking the new root. */
export function heapExtract(arr: HeapItem[], isMin: boolean): HeapExtractResult | null {
  if (arr.length === 0) return null;
  const next = arr.map((it) => ({ ...it }));
  const root = next[0];
  const last = next.pop()!;
  if (next.length > 0) {
    next[0] = last;
    siftDown(next, 0, isMin);
  }
  return { arr: next, removedId: root.id, removedValue: root.value };
}

/** Build a heap from scratch using Floyd's bottom-up heapify. */
export function heapify(values: number[], isMin: boolean): HeapItem[] {
  const arr: HeapItem[] = values.map((value) => ({ id: nextId(), value }));
  for (let i = (arr.length >> 1) - 1; i >= 0; i--) siftDown(arr, i, isMin);
  return arr;
}

/** Project the flat heap array into a renderable binary tree (i → 2i+1, 2i+2). */
export function heapToTree(arr: HeapItem[]): TreeNode | null {
  const build = (i: number): TreeNode | null => {
    if (i >= arr.length) return null;
    return { id: arr[i].id, value: arr[i].value, left: build(2 * i + 1), right: build(2 * i + 2) };
  };
  return build(0);
}
