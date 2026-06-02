"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  META_BY_KIND,
  avlDelete,
  avlInsert,
  bstDelete,
  bstInsert,
  bstSearch,
  heapExtract,
  heapInsert,
  heapToTree,
  heapify,
  layoutTree,
  traverse,
  treeStats,
  type HeapItem,
  type Traversal,
  type TreeKind,
  type TreeLayout,
  type TreeNode,
} from "@/entities/tree";

/** Map UI speed (1 slow … 100 fast) to a per-step delay in ms. */
function speedToDelay(speed: number): number {
  const clamped = Math.max(1, Math.min(100, speed));
  return Math.round(520 * Math.pow(1 - clamped / 100, 1.7)) + 40;
}

const MAX_NODES = 31;

export type TreePhase =
  | "idle"
  | "inserting"
  | "searching"
  | "deleting"
  | "traversing"
  | "sorting";

export interface TreeView {
  kind: TreeKind;
  isHeap: boolean;
  speed: number;
  phase: TreePhase;
  busy: boolean;

  /** Renderable tree (BST/AVL root, or the heap projected as a complete tree). */
  layout: TreeLayout;
  size: number;
  height: number;
  isBalanced: boolean;

  /** Highlight channels consumed by the canvas. */
  activeIds: ReadonlySet<number>;
  visitedIds: ReadonlySet<number>;
  foundId: number | null;
  missing: boolean;
  pulseId: number | null;
  removingValue: number | null;

  /** Sequence output (traversal values / heapsort result) + its caption. */
  output: number[];
  outputLabel: string | null;
  lastTraversal: Traversal | null;
  message: string | null;

  setKind: (kind: TreeKind) => void;
  setSpeed: (speed: number) => void;
  insert: (value: number) => void;
  remove: (value: number) => void;
  deleteNode: (id: number) => void;
  search: (value: number) => void;
  runTraversal: (kind: Traversal) => void;
  extract: () => void;
  heapSort: () => void;
  randomFill: () => void;
  clear: () => void;
  stop: () => void;
}

const SEED_BST = [50, 30, 70, 20, 40, 60, 80, 35];
const SEED_HEAP_VALUES = [12, 25, 9, 40, 33, 17, 55, 7];

export function useTree(): TreeView {
  const [kind, setKindState] = useState<TreeKind>("bst");
  const [speed, setSpeed] = useState(58);
  const [phase, setPhase] = useState<TreePhase>("idle");

  // The two backing models. Only one is live for a given `kind`. Both are
  // seeded once via lazy initializers so the lab opens with something to see.
  const [root, setRoot] = useState<TreeNode | null>(() => {
    let r: TreeNode | null = null;
    for (const v of SEED_BST) r = bstInsert(r, v).root;
    return r;
  });
  const [heap, setHeap] = useState<HeapItem[]>(() => heapify(SEED_HEAP_VALUES, true));

  // Highlight channels.
  const [activeIds, setActiveIds] = useState<Set<number>>(() => new Set());
  const [visitedIds, setVisitedIds] = useState<Set<number>>(() => new Set());
  const [foundId, setFoundId] = useState<number | null>(null);
  const [missing, setMissing] = useState(false);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const [removingValue, setRemovingValue] = useState<number | null>(null);
  const [output, setOutput] = useState<number[]>([]);
  const [outputLabel, setOutputLabel] = useState<string | null>(null);
  const [lastTraversal, setLastTraversal] = useState<Traversal | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isHeap = META_BY_KIND[kind].isHeap;

  // Async-loop bookkeeping: a token invalidates stale scheduled callbacks.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef(0);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  /** Wipe every transient highlight channel. */
  const clearHighlights = useCallback(() => {
    setActiveIds(new Set());
    setVisitedIds(new Set());
    setFoundId(null);
    setMissing(false);
    setPulseId(null);
    setRemovingValue(null);
  }, []);

  /** Cancel any running animation and return to a clean idle state. */
  const stop = useCallback(() => {
    token.current += 1;
    clearTimer();
    setPhase("idle");
  }, [clearTimer]);

  const beginRun = useCallback(
    (next: TreePhase): number => {
      token.current += 1;
      clearTimer();
      clearHighlights();
      setMessage(null);
      setPhase(next);
      return token.current;
    },
    [clearTimer, clearHighlights],
  );

  /** Highlight `path` node-by-node, then invoke `done`. */
  const tracePath = useCallback(
    (path: number[], runId: number, done: () => void) => {
      let i = 0;
      const step = () => {
        if (token.current !== runId) return;
        if (i >= path.length) {
          done();
          return;
        }
        const id = path[i];
        setActiveIds((prev) => new Set(prev).add(id));
        i += 1;
        timer.current = setTimeout(step, speedToDelay(speedRef.current));
      };
      step();
    },
    [],
  );

  const settle = useCallback(
    (runId: number, ms = 700) => {
      timer.current = setTimeout(() => {
        if (token.current !== runId) return;
        setActiveIds(new Set());
        setPhase("idle");
      }, ms);
    },
    [],
  );

  /* ------------------------------------------------------------- structure */

  const setKind = useCallback(
    (next: TreeKind) => {
      if (next === kind) return;
      token.current += 1;
      clearTimer();
      clearHighlights();
      setOutput([]);
      setOutputLabel(null);
      setLastTraversal(null);
      setMessage(null);
      setPhase("idle");
      setKindState(next);
    },
    [kind, clearTimer, clearHighlights],
  );

  /* ----------------------------------------------------------------- insert */

  const insert = useCallback(
    (value: number) => {
      if (phase !== "idle" || Number.isNaN(value)) return;

      if (isHeap) {
        if (heap.length >= MAX_NODES) {
          setMessage("Heap is full — remove a node first.");
          return;
        }
        const runId = beginRun("inserting");
        const { arr, newId } = heapInsert(heap, value, kind === "heap-min");
        setHeap(arr);
        setPulseId(newId);
        settle(runId, 600);
        return;
      }

      const { size } = treeStats(root);
      if (size >= MAX_NODES) {
        setMessage("Tree is full — remove a node first.");
        return;
      }
      const runId = beginRun("inserting");
      const fn = kind === "avl" ? avlInsert : bstInsert;
      const res = fn(root, value);
      if (!res.inserted) {
        setActiveIds(new Set(res.path));
        setMessage(`${value} is already in the tree.`);
        settle(runId, 800);
        return;
      }
      tracePath(res.path, runId, () => {
        setRoot(res.root);
        setPulseId(res.newId);
        settle(runId, 700);
      });
    },
    [phase, isHeap, heap, kind, root, beginRun, tracePath, settle],
  );

  /* ----------------------------------------------------------------- search */

  const search = useCallback(
    (value: number) => {
      if (phase !== "idle" || isHeap || Number.isNaN(value)) return;
      const runId = beginRun("searching");
      const { path, foundId: hit } = bstSearch(root, value);
      tracePath(path, runId, () => {
        if (token.current !== runId) return;
        if (hit !== null) {
          setFoundId(hit);
          setMessage(`Found ${value}.`);
        } else {
          setMissing(true);
          setMessage(`${value} is not in the tree.`);
        }
        timer.current = setTimeout(() => {
          if (token.current !== runId) return;
          setActiveIds(new Set());
          setFoundId(null);
          setMissing(false);
          setPhase("idle");
        }, 1100);
      });
    },
    [phase, isHeap, root, beginRun, tracePath],
  );

  /* ----------------------------------------------------------------- delete */

  const removeByValue = useCallback(
    (value: number) => {
      if (phase !== "idle" || isHeap || Number.isNaN(value)) return;
      const fn = kind === "avl" ? avlDelete : bstDelete;
      // Compute the search path first (so we can trace before mutating).
      const { path } = bstSearch(root, value);
      const runId = beginRun("deleting");
      tracePath(path, runId, () => {
        if (token.current !== runId) return;
        const res = fn(root, value);
        if (!res.found) {
          setMissing(true);
          setMessage(`${value} is not in the tree.`);
          settle(runId, 900);
          return;
        }
        setRemovingValue(value);
        setRoot(res.root);
        setMessage(`Removed ${value}.`);
        settle(runId, 700);
      });
    },
    [phase, isHeap, kind, root, beginRun, tracePath, settle],
  );

  const deleteNode = useCallback(
    (id: number) => {
      if (phase !== "idle" || isHeap) return;
      // Find the value for this id, then delegate to the value-based path.
      let target: number | null = null;
      const find = (n: TreeNode | null) => {
        if (!n || target !== null) return;
        if (n.id === id) target = n.value;
        else {
          find(n.left);
          find(n.right);
        }
      };
      find(root);
      if (target !== null) removeByValue(target);
    },
    [phase, isHeap, root, removeByValue],
  );

  /* -------------------------------------------------------------- traversal */

  const runTraversal = useCallback(
    (t: Traversal) => {
      if (phase !== "idle" || isHeap) return;
      const { order, values } = traverse(root, t);
      if (order.length === 0) {
        setMessage("Tree is empty.");
        return;
      }
      const runId = beginRun("traversing");
      setOutput([]);
      setOutputLabel(t === "inorder" ? "In-order — sorted output" : `${t} sequence`);
      setLastTraversal(t);

      let i = 0;
      const visited = new Set<number>();
      const acc: number[] = [];
      const step = () => {
        if (token.current !== runId) return;
        if (i >= order.length) {
          settle(runId, 900);
          return;
        }
        const id = order[i];
        visited.add(id);
        acc.push(values[i]);
        setVisitedIds(new Set(visited));
        setActiveIds(new Set([id]));
        setOutput([...acc]);
        i += 1;
        timer.current = setTimeout(step, speedToDelay(speedRef.current));
      };
      step();
    },
    [phase, isHeap, root, beginRun, settle],
  );

  /* --------------------------------------------------------------- heap ops */

  const extract = useCallback(() => {
    if (phase !== "idle" || !isHeap) return;
    const res = heapExtract(heap, kind === "heap-min");
    if (!res) {
      setMessage("Heap is empty.");
      return;
    }
    const runId = beginRun("deleting");
    setRemovingValue(res.removedValue);
    setHeap(res.arr);
    setMessage(`Extracted root: ${res.removedValue}.`);
    settle(runId, 650);
  }, [phase, isHeap, heap, kind, beginRun, settle]);

  const heapSort = useCallback(() => {
    if (phase !== "idle" || !isHeap || heap.length === 0) return;
    const runId = beginRun("sorting");
    setOutput([]);
    setOutputLabel(
      kind === "heap-min" ? "Heap sort — ascending" : "Heap sort — descending",
    );
    setLastTraversal(null);

    const acc: number[] = [];
    let working = heap;
    const step = () => {
      if (token.current !== runId) return;
      const res = heapExtract(working, kind === "heap-min");
      if (!res) {
        setPhase("idle");
        return;
      }
      acc.push(res.removedValue);
      working = res.arr;
      setHeap(working);
      setOutput([...acc]);
      setPulseId(res.arr[0]?.id ?? null);
      timer.current = setTimeout(step, speedToDelay(speedRef.current) + 120);
    };
    step();
  }, [phase, isHeap, heap, kind, beginRun]);

  /* ----------------------------------------------------------------- resets */

  const randomFill = useCallback(() => {
    if (phase !== "idle") return;
    token.current += 1;
    clearTimer();
    clearHighlights();
    setOutput([]);
    setOutputLabel(null);
    setMessage(null);

    const count = 9 + Math.floor(Math.random() * 6); // 9–14 nodes
    if (isHeap) {
      const values = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 98));
      setHeap(heapify(values, kind === "heap-min"));
      return;
    }
    const used = new Set<number>();
    let r: TreeNode | null = null;
    const fn = kind === "avl" ? avlInsert : bstInsert;
    while (used.size < count) {
      const v = 1 + Math.floor(Math.random() * 98);
      if (used.has(v)) continue;
      used.add(v);
      r = fn(r, v).root;
    }
    setRoot(r);
  }, [phase, isHeap, kind, clearTimer, clearHighlights]);

  const clear = useCallback(() => {
    token.current += 1;
    clearTimer();
    clearHighlights();
    setOutput([]);
    setOutputLabel(null);
    setLastTraversal(null);
    setMessage(null);
    setPhase("idle");
    if (isHeap) setHeap([]);
    else setRoot(null);
  }, [isHeap, clearTimer, clearHighlights]);

  /* ---------------------------------------------------------------- derived */

  const renderRoot = useMemo(
    () => (isHeap ? heapToTree(heap) : root),
    [isHeap, heap, root],
  );
  const layout = useMemo(() => layoutTree(renderRoot), [renderRoot]);
  const { size, height } = useMemo(() => treeStats(renderRoot), [renderRoot]);
  const isBalanced = size === 0 || height <= Math.ceil(Math.log2(size + 1)) + 1;

  return {
    kind,
    isHeap,
    speed,
    phase,
    busy: phase !== "idle",
    layout,
    size,
    height,
    isBalanced,
    activeIds,
    visitedIds,
    foundId,
    missing,
    pulseId,
    removingValue,
    output,
    outputLabel,
    lastTraversal,
    message,
    setKind,
    setSpeed,
    insert,
    remove: removeByValue,
    deleteNode,
    search,
    runTraversal,
    extract,
    heapSort,
    randomFill,
    clear,
    stop,
  };
}
