import { BaseEdge, getStraightPath, useInternalNode, type EdgeProps, type InternalNode } from '@xyflow/react';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function centerBox(node: InternalNode): Box {
  const { x, y } = node.internals.positionAbsolute;
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  return { x: x + w / 2, y: y + h / 2, w, h };
}

/** Where the line from `from`'s center toward `to`'s center leaves `from`'s border. */
function borderPoint(from: Box, to: Box): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return from;
  const t = Math.min(dx ? from.w / 2 / Math.abs(dx) : Infinity, dy ? from.h / 2 / Math.abs(dy) : Infinity);
  return { x: from.x + dx * t, y: from.y + dy * t };
}

/** Straight edge between the closest border points, ignoring handle sides. */
export function FloatingEdge({ id, source, target, style, markerEnd }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const s = centerBox(sourceNode);
  const t = centerBox(targetNode);
  const from = borderPoint(s, t);
  const to = borderPoint(t, s);
  const [path] = getStraightPath({ sourceX: from.x, sourceY: from.y, targetX: to.x, targetY: to.y });
  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />;
}
