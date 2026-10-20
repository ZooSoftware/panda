import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  applyNodeChanges,
  type ColorMode,
  type NodeChange,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { forwardIds, type Pin, type Tree } from '../../core/tree';
import { toPin } from '../../core/layout';
import { buildEdges, buildNodes } from './buildFlow';
import { FloatingEdge } from './FloatingEdge';
import { NodeActionsContext, PointNode, type NodeActions, type PointNodeType } from './PointNode';

const nodeTypes = { point: PointNode };
const edgeTypes = { floating: FloatingEdge };

type Position = { x: number; y: number };

interface Props {
  tree: Tree;
  selectedIds: string[];
  onSelect: Dispatch<SetStateAction<string[]>>;
  /** Points moved by a drag, with their new pins. */
  onPin(pins: Map<string, Pin>): void;
  actions: NodeActions;
  colorMode: ColorMode;
}

/**
 * The diagram. Nodes are rebuilt from the tree after every change; a local
 * copy exists only so a drag can move them before the tree is updated (as
 * pins) on drop. Selection is owned by the caller and mirrored onto the nodes.
 */
export function Canvas({ tree, selectedIds, onSelect, onPin, actions, colorMode }: Props) {
  const derivedNodes = useMemo(() => buildNodes(tree), [tree]);
  const edges = useMemo(() => buildEdges(tree), [tree]);
  const [nodes, setNodes] = useState(derivedNodes);

  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;
  useEffect(() => {
    setNodes(derivedNodes.map((n) => ({ ...n, selected: selectedRef.current.includes(n.id) })));
  }, [derivedNodes]);
  useEffect(() => {
    setNodes((ns) =>
      ns.every((n) => !!n.selected === selectedIds.includes(n.id))
        ? ns
        : ns.map((n) => ({ ...n, selected: selectedIds.includes(n.id) })),
    );
  }, [selectedIds]);

  const onNodesChange = useCallback(
    (changes: NodeChange<PointNodeType>[]) => {
      const selects = changes.filter((c) => c.type === 'select');
      if (selects.length > 0) {
        onSelect((ids) => {
          const next = new Set(ids);
          for (const c of selects) {
            if (c.selected) next.add(c.id);
            else next.delete(c.id);
          }
          return [...next];
        });
      }
      setNodes((ns) => applyNodeChanges(changes, ns));
    },
    [onSelect],
  );

  // Ctrl+drag: points forward of the dragged one follow it. Holds their
  // start positions and the dragged node's start, for the offset.
  const follow = useRef<{ anchor: Position; starts: Map<string, Position> } | null>(null);

  const onNodeDragStart: OnNodeDrag<PointNodeType> = (e, node, dragged) => {
    follow.current = null;
    if (!(e.ctrlKey || e.metaKey)) return;
    const draggedIds = new Set(dragged.map((n) => n.id));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const starts = new Map<string, Position>();
    for (const id of forwardIds(tree, node.id)) {
      const n = byId.get(id);
      if (n && !draggedIds.has(id)) starts.set(id, n.position);
    }
    follow.current = { anchor: byId.get(node.id)?.position ?? node.position, starts };
  };

  const onNodeDrag: OnNodeDrag<PointNodeType> = (_, node) => {
    const f = follow.current;
    if (!f) return;
    const dx = node.position.x - f.anchor.x;
    const dy = node.position.y - f.anchor.y;
    setNodes((ns) =>
      ns.map((n) => {
        const start = f.starts.get(n.id);
        return start ? { ...n, position: { x: start.x + dx, y: start.y + dy } } : n;
      }),
    );
  };

  const onNodeDragStop: OnNodeDrag<PointNodeType> = (_, node, dragged) => {
    const moved = new Map<string, Position>(dragged.map((n) => [n.id, n.position]));
    const f = follow.current;
    if (f) {
      const dx = node.position.x - f.anchor.x;
      const dy = node.position.y - f.anchor.y;
      for (const [id, start] of f.starts) moved.set(id, { x: start.x + dx, y: start.y + dy });
    }
    follow.current = null;

    // A click can register as a zero-length drag; only real moves pin.
    const pins = new Map<string, Pin>();
    for (const [id, pos] of moved) {
      const from = derivedNodes.find((n) => n.id === id)?.position;
      if (from && Math.hypot(pos.x - from.x, pos.y - from.y) < 3) continue;
      pins.set(id, toPin(pos, tree.direction));
    }
    if (pins.size > 0) onPin(pins);
  };

  return (
    <NodeActionsContext.Provider value={actions}>
      <div className="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          // Left-drag on the pane draws a selection box; pan with the
          // middle/right button, Space+drag, or the scroll wheel.
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          panOnScroll
          zoomOnScroll={false}
          onPaneContextMenu={(e) => e.preventDefault()}
          // Ctrl is taken by "drag with forward points"; Shift+click adds to the selection.
          multiSelectionKeyCode="Shift"
          nodesConnectable={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          colorMode={colorMode}
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={(n) => (n.data as PointNodeType['data']).point.color} />
        </ReactFlow>
      </div>
    </NodeActionsContext.Provider>
  );
}
