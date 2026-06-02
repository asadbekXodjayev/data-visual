import { cloneTree, makeNode, type DeleteResult, type InsertResult } from './bst';
import type { TreeNode } from './types';

/**
 * AVL tree — a self-balancing BST. After every insert/delete we walk back up
 * the path, refresh heights, and rotate any node whose subtrees differ in
 * height by more than one. Rotations reshape the tree; because node ids are
 * preserved, the canvas animates each displaced node gliding to its new slot.
 */

const h = (n: TreeNode | null): number => n?.height ?? 0;

function update(n: TreeNode): void {
  n.height = 1 + Math.max(h(n.left), h(n.right));
}

function balanceFactor(n: TreeNode): number {
  return h(n.left) - h(n.right);
}

function rotateRight(y: TreeNode): TreeNode {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  update(y);
  update(x);
  return x;
}

function rotateLeft(x: TreeNode): TreeNode {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  update(x);
  update(y);
  return y;
}

function rebalance(node: TreeNode): TreeNode {
  update(node);
  const bf = balanceFactor(node);

  // Left-heavy
  if (bf > 1) {
    if (balanceFactor(node.left!) < 0) node.left = rotateLeft(node.left!); // LR
    return rotateRight(node); // LL
  }
  // Right-heavy
  if (bf < -1) {
    if (balanceFactor(node.right!) > 0) node.right = rotateRight(node.right!); // RL
    return rotateLeft(node); // RR
  }
  return node;
}

export function avlInsert(root: TreeNode | null, value: number): InsertResult {
  if (!root) {
    const fresh = makeNode(value);
    return { root: fresh, path: [], newId: fresh.id, inserted: true };
  }

  const clone = cloneTree(root)!;
  const path: number[] = [];
  let newId = -1;
  let inserted = true;

  const insert = (node: TreeNode | null, descend = true): TreeNode => {
    if (!node) {
      const fresh = makeNode(value);
      newId = fresh.id;
      return fresh;
    }
    if (descend) path.push(node.id);
    if (value === node.value) {
      inserted = false;
      newId = node.id;
      return node;
    }
    if (value < node.value) node.left = insert(node.left);
    else node.right = insert(node.right);
    return inserted ? rebalance(node) : node;
  };

  const next = insert(clone);
  return { root: next, path, newId, inserted };
}

export function avlDelete(root: TreeNode | null, value: number): DeleteResult {
  if (!root) return { root: null, path: [], found: false };

  const clone = cloneTree(root)!;
  const path: number[] = [];
  let found = false;

  const remove = (node: TreeNode | null): TreeNode | null => {
    if (!node) return null;
    path.push(node.id);

    if (value < node.value) {
      node.left = remove(node.left);
    } else if (value > node.value) {
      node.right = remove(node.right);
    } else {
      found = true;
      if (!node.left || !node.right) return node.left ?? node.right;
      // Two children: copy in the in-order successor's value, then drop it.
      let succ = node.right;
      while (succ.left) succ = succ.left;
      node.value = succ.value;
      const removeSucc = (n: TreeNode | null): TreeNode | null => {
        if (!n) return null;
        if (n === succ) return n.right;
        n.left = removeSucc(n.left);
        return rebalance(n);
      };
      node.right = removeSucc(node.right);
    }
    return rebalance(node);
  };

  const next = remove(clone);
  return { root: next, path, found };
}
