import type { Edge } from '@xyflow/react';
import {
  capabilities,
  countDescendants,
  countLeaves,
  visibleBranches,
  visiblePoints,
  type Chain,
  type Tree,
} from '../../core/tree';
import { layoutGrid, toPixels } from '../../core/layout';
import type { PointNodeType } from './PointNode';

/** React Flow nodes for the visible points, at their pin or their layout cell. */
export function buildNodes(tree: Tree): PointNodeType[] {
  const grid = layoutGrid(tree);
  return visiblePoints(tree).map((point) => ({
    id: point.id,
    type: 'point',
    position: toPixels(point.pin ?? grid.get(point.id)!, tree.direction),
    data: {
      point,
      direction: tree.direction,
      layout: tree.layout,
      caps: capabilities(tree, point.id),
      descendants: countDescendants(point),
      leaves: countLeaves(point),
    },
  }));
}

/** Chain edges (solid) and branch edges (dashed), in the tree's line style. */
export function buildEdges(tree: Tree): Edge[] {
  const edges: Edge[] = [];
  const type = tree.edgeStyle === 'shortest' ? 'floating' : 'smoothstep';
  const walk = (chain: Chain) => {
    chain.forEach((p, i) => {
      if (i > 0) {
        edges.push({
          id: `c-${p.id}`,
          source: chain[i - 1].id,
          target: p.id,
          sourceHandle: 'out',
          targetHandle: 'in',
          type,
          className: 'edge-chain',
        });
      }
      visibleBranches(p).forEach((branch) => {
        edges.push({
          id: `b-${branch[0].id}`,
          source: p.id,
          target: branch[0].id,
          sourceHandle: 'branch',
          targetHandle: 'in',
          type,
          className: 'edge-branch',
        });
        walk(branch);
      });
    });
  };
  walk(tree.root);
  return edges;
}
