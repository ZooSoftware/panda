import { createContext, memo, useContext, type CSSProperties } from 'react';
import { Handle, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Capabilities, Direction, LayoutMode, Point } from '../model/tree';

export type PointNodeData = {
  point: Point;
  direction: Direction;
  layout: LayoutMode;
  caps: Capabilities;
  /** Points inside this point's branches; shown on the toggle while collapsed. */
  descendants: number;
  /** Leaves inside this point's branches. */
  leaves: number;
};

export type PointNodeType = Node<PointNodeData, 'point'>;

export interface NodeActions {
  addNext(id: string): void;
  addBranch(id: string): void;
  addLeaf(id: string): void;
  unpin(id: string): void;
  toggleCollapsed(id: string): void;
}

export const NodeActionsContext = createContext<NodeActions | null>(null);

interface Sides {
  in: Position;
  out: Position;
  branch: Position;
  branchStyle?: CSSProperties;
}

// Which side of a node each connection uses, per flow direction.
// Stacked: branch lines leave the side facing the branches.
const STACKED_SIDES: Record<Direction, Sides> = {
  LR: { in: Position.Left, out: Position.Right, branch: Position.Bottom },
  RL: { in: Position.Right, out: Position.Left, branch: Position.Bottom },
  TB: { in: Position.Top, out: Position.Bottom, branch: Position.Right },
  BT: { in: Position.Bottom, out: Position.Top, branch: Position.Right },
};

// Packed: branch lines leave the forward side near the corner facing the
// branches, so the step edge runs down the gap between columns (the packed
// layout keeps that gap clear).
const PACKED_SIDES: Record<Direction, Sides> = {
  LR: { in: Position.Left, out: Position.Right, branch: Position.Right, branchStyle: { top: '85%' } },
  RL: { in: Position.Right, out: Position.Left, branch: Position.Left, branchStyle: { top: '85%' } },
  TB: { in: Position.Top, out: Position.Bottom, branch: Position.Bottom, branchStyle: { left: '85%' } },
  BT: { in: Position.Bottom, out: Position.Top, branch: Position.Top, branchStyle: { left: '85%' } },
};

function PointNodeView({ id, data, selected }: NodeProps<PointNodeType>) {
  const actions = useContext(NodeActionsContext)!;
  const { point, direction, layout, caps, descendants, leaves } = data;
  const sides = (layout === 'packed' ? PACKED_SIDES : STACKED_SIDES)[direction];
  const isLeaf = point.kind === 'leaf';

  return (
    <>
      {/* Shown only while this is the one selected node. Clicks must not bubble
          (through the portal) to the node, which would re-select it. */}
      <NodeToolbar
        position={Position.Top}
        className="node-toolbar"
        onClick={(e) => e.stopPropagation()}
      >
        {caps.addNext && <button onClick={() => actions.addNext(id)}>+ Next</button>}
        {caps.addBranch && <button onClick={() => actions.addBranch(id)}>⎇ Branch</button>}
        {caps.addBranch && (
          <button onClick={() => actions.addLeaf(id)} title="New branch that is a single leaf">
            🍃 Leaf
          </button>
        )}
      </NodeToolbar>
      <div
        className={`point-node ${isLeaf ? 'leaf' : ''} ${point.branches.length > 0 ? 'has-badges' : ''} ${selected ? 'selected' : ''}`}
        style={{ background: point.color }}
      >
        <div className="point-header">
          <div className="point-title">
            {isLeaf && <span aria-label="leaf">🍃 </span>}
            {point.title || <em>Untitled</em>}
          </div>
          {point.pin && (
            <button
              className="pin-badge nodrag"
              title="Pinned — click to unpin"
              onClick={(e) => {
                e.stopPropagation();
                actions.unpin(id);
              }}
            >
              📌
            </button>
          )}
        </div>
        {point.content && <div className="point-content">{point.content}</div>}
        {point.branches.length > 0 && (
          <div className="node-badges">
            <span className="leaf-count" title={`${leaves} ${leaves === 1 ? 'leaf' : 'leaves'} in this point's branches`}>
              🍃 {leaves}
            </span>
            <button
              className={`collapse-toggle nodrag ${point.collapsed ? 'collapsed' : ''}`}
              title={point.collapsed ? `Show ${descendants} hidden points` : 'Hide branches'}
              onClick={(e) => {
                e.stopPropagation();
                actions.toggleCollapsed(id);
              }}
            >
              {point.collapsed ? `▸ +${descendants}` : '▾'}
            </button>
          </div>
        )}
      </div>
      <Handle type="target" id="in" position={sides.in} isConnectable={false} />
      <Handle type="source" id="out" position={sides.out} isConnectable={false} />
      <Handle type="source" id="branch" position={sides.branch} style={sides.branchStyle} isConnectable={false} />
    </>
  );
}

export const PointNode = memo(PointNodeView);
