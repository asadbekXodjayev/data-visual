import { nextId, type Traversal, type TreeNode } from './types';

/** Deep-clone a tree, preserving node ids (so Framer Motion identity holds). */
export function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    height: node.height,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

export function makeNode(value: number): TreeNode {
  return { id: nextId(), value, left: null, right: null, height: 1 };
}

export interface InsertResult {
  root: TreeNode;
  /** Ids of existing nodes compared against, in visit order. */
  path: number[];
  newId: number;
  /** False when the value already exists (duplicates are rejected). */
  inserted: boolean;
}

/**
 * Insert into a binary search tree. Returns a new root plus the comparison
 * path so the UI can trace the descent before the node pops in. Duplicate
 * values are rejected to keep the structure (and traversals) unambiguous.
 */
export function bstInsert(root: TreeNode | null, value: number): InsertResult {
  const fresh = makeNode(value);
  if (!root) return { root: fresh, path: [], newId: fresh.id, inserted: true };

  const clone = cloneTree(root)!;
  const path: number[] = [];
  let cur = clone;
  while (true) {
    path.push(cur.id);
    if (value === cur.value) {
      return { root: clone, path, newId: cur.id, inserted: false };
    }
    if (value < cur.value) {
      if (cur.left) cur = cur.left;
      else {
        cur.left = fresh;
        break;
      }
    } else if (cur.right) cur = cur.right;
    else {
      cur.right = fresh;
      break;
    }
  }
  return { root: clone, path, newId: fresh.id, inserted: true };
}

export interface SearchResult {
  path: number[];
  foundId: number | null;
}

/** Trace the descent toward `value`. `foundId` is the hit, or null on a miss. */
export function bstSearch(root: TreeNode | null, value: number): SearchResult {
  const path: number[] = [];
  let cur = root;
  while (cur) {
    path.push(cur.id);
    if (value === cur.value) return { path, foundId: cur.id };
    cur = value < cur.value ? cur.left : cur.right;
  }
  return { path, foundId: null };
}

export interface DeleteResult {
  root: TreeNode | null;
  path: number[];
  found: boolean;
}

/**
 * Standard BST delete. Leaf / single-child cases splice the node out; the
 * two-child case copies the in-order successor's value up (keeping the found
 * node's id, so it morphs in place) and removes the successor node instead.
 */
export function bstDelete(root: TreeNode | null, value: number): DeleteResult {
  if (!root) return { root: null, path: [], found: false };

  const clone = cloneTree(root)!;
  const path: number[] = [];
  let parent: TreeNode | null = null;
  let cur: TreeNode | null = clone;

  while (cur && cur.value !== value) {
    path.push(cur.id);
    parent = cur;
    cur = value < cur.value ? cur.left : cur.right;
  }
  if (!cur) return { root: clone, path, found: false };
  path.push(cur.id);

  // Zero or one child: replace `cur` with whichever child exists (maybe null).
  if (!cur.left || !cur.right) {
    const child = cur.left ?? cur.right;
    if (!parent) return { root: child, path, found: true };
    if (parent.left === cur) parent.left = child;
    else parent.right = child;
    return { root: clone, path, found: true };
  }

  // Two children: pull up the smallest value in the right subtree.
  let succParent = cur;
  let succ = cur.right;
  while (succ.left) {
    succParent = succ;
    succ = succ.left;
  }
  cur.value = succ.value;
  if (succParent.left === succ) succParent.left = succ.right;
  else succParent.right = succ.right;

  return { root: clone, path, found: true };
}

export interface TraversalResult {
  /** Node ids in visit order. */
  order: number[];
  /** Node values in visit order (in-order on a BST/AVL is the sorted sequence). */
  values: number[];
}

/** Produce the visit sequence for any of the four traversal orders. */
export function traverse(root: TreeNode | null, kind: Traversal): TraversalResult {
  const order: number[] = [];
  const values: number[] = [];
  const visit = (n: TreeNode) => {
    order.push(n.id);
    values.push(n.value);
  };

  if (kind === 'levelorder') {
    const queue: TreeNode[] = root ? [root] : [];
    while (queue.length) {
      const n = queue.shift()!;
      visit(n);
      if (n.left) queue.push(n.left);
      if (n.right) queue.push(n.right);
    }
    return { order, values };
  }

  const walk = (n: TreeNode | null) => {
    if (!n) return;
    if (kind === 'preorder') visit(n);
    walk(n.left);
    if (kind === 'inorder') visit(n);
    walk(n.right);
    if (kind === 'postorder') visit(n);
  };
  walk(root);
  return { order, values };
}

/** Node count and height — cheap stats for the panel. */
export function treeStats(root: TreeNode | null): { size: number; height: number } {
  let size = 0;
  const depth = (n: TreeNode | null): number => {
    if (!n) return 0;
    size++;
    return 1 + Math.max(depth(n.left), depth(n.right));
  };
  const height = depth(root);
  return { size, height };
}
