import type { TreeKind, Traversal } from './types';

export * from './types';
export * from './layout';
export * from './bst';
export * from './avl';
export * from './heap';

/** Display metadata for each structure, shown in the selector + info panel. */
export interface TreeKindMeta {
  id: TreeKind;
  label: string;
  short: string;
  blurb: string;
  /** Average-case complexity of insert/search/delete. */
  ops: string;
  isHeap: boolean;
}

export const TREE_KINDS: TreeKindMeta[] = [
  {
    id: 'bst',
    label: 'Binary Search Tree',
    short: 'BST',
    blurb: 'Left < node < right. Simple and fast on random data, but can degrade to a list.',
    ops: 'O(log n) avg · O(n) worst',
    isHeap: false,
  },
  {
    id: 'avl',
    label: 'AVL Tree',
    short: 'AVL',
    blurb: 'A self-balancing BST. Rotations keep every subtree within height 1 — guaranteed O(log n).',
    ops: 'O(log n) guaranteed',
    isHeap: false,
  },
  {
    id: 'heap-min',
    label: 'Min-Heap',
    short: 'Min-Heap',
    blurb: 'A complete tree where each parent ≤ its children. The minimum always sits at the root.',
    ops: 'insert/extract O(log n)',
    isHeap: true,
  },
  {
    id: 'heap-max',
    label: 'Max-Heap',
    short: 'Max-Heap',
    blurb: 'A complete tree where each parent ≥ its children. The maximum always sits at the root.',
    ops: 'insert/extract O(log n)',
    isHeap: true,
  },
];

export interface TraversalMeta {
  id: Traversal;
  label: string;
  note: string;
}

export const TRAVERSALS: TraversalMeta[] = [
  { id: 'inorder', label: 'In-order', note: 'L · Node · R — yields the sorted sequence' },
  { id: 'preorder', label: 'Pre-order', note: 'Node · L · R — clones / serializes the tree' },
  { id: 'postorder', label: 'Post-order', note: 'L · R · Node — frees / evaluates the tree' },
  { id: 'levelorder', label: 'Level-order', note: 'Breadth-first, row by row' },
];

export const META_BY_KIND = Object.fromEntries(
  TREE_KINDS.map((m) => [m.id, m]),
) as Record<TreeKind, TreeKindMeta>;
