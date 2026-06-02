/**
 * Shared types for the tree-structures entity.
 *
 * Every node carries a stable numeric `id` so that Framer Motion can track it
 * across re-layouts — when the tree reshapes (rotations, deletes, sift-up) the
 * node keeps its identity and animates from its old position to the new one.
 */

export interface TreeNode {
  id: number;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  /** Cached subtree height — only maintained for AVL trees. */
  height?: number;
}

/** The four structures the visualizer can model. */
export type TreeKind = 'bst' | 'avl' | 'heap-min' | 'heap-max';

/** Depth-first / breadth-first orders a binary tree can be walked in. */
export type Traversal = 'inorder' | 'preorder' | 'postorder' | 'levelorder';

/** A heap is stored as a flat, identity-bearing array (a complete tree). */
export interface HeapItem {
  id: number;
  value: number;
}

/** A node placed on the logical grid: `x` = column index, `y` = depth. */
export interface PositionedNode {
  id: number;
  value: number;
  x: number;
  y: number;
}

/** A parent → child link with both endpoints in logical grid coordinates. */
export interface TreeEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TreeLayout {
  nodes: PositionedNode[];
  edges: TreeEdge[];
  /** Number of columns (= node count). */
  columns: number;
  /** Number of depth levels. */
  levels: number;
}

/* ----------------------------------------------------------------- id source */

let counter = 1;

/** Monotonic id generator shared by every structure. */
export const nextId = (): number => counter++;
