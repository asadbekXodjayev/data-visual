import type { PositionedNode, TreeEdge, TreeLayout, TreeNode } from './types';

/**
 * Classic "in-order column" layout: walk the tree in-order and hand each node
 * the next column index. Depth becomes the row. This guarantees no two nodes
 * share a column and that left children always sit left of their parent —
 * a clean, overlap-free drawing for any binary tree (BST, AVL, or heap shape).
 */
export function layoutTree(root: TreeNode | null): TreeLayout {
  const nodes: PositionedNode[] = [];
  const pos = new Map<number, { x: number; y: number }>();
  let column = 0;
  let levels = 0;

  const place = (node: TreeNode | null, depth: number): void => {
    if (!node) return;
    place(node.left, depth + 1);
    const x = column++;
    pos.set(node.id, { x, y: depth });
    nodes.push({ id: node.id, value: node.value, x, y: depth });
    levels = Math.max(levels, depth + 1);
    place(node.right, depth + 1);
  };
  place(root, 0);

  const edges: TreeEdge[] = [];
  const link = (node: TreeNode | null): void => {
    if (!node) return;
    const p = pos.get(node.id)!;
    for (const child of [node.left, node.right]) {
      if (!child) continue;
      const c = pos.get(child.id)!;
      edges.push({ id: `${node.id}-${child.id}`, x1: p.x, y1: p.y, x2: c.x, y2: c.y });
      link(child);
    }
  };
  link(root);

  return { nodes, edges, columns: column, levels };
}
