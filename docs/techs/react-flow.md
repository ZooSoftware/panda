# React Flow (`@xyflow/react` 12)

React Flow draws the canvas: nodes, edges, pan and zoom, dragging, box selection, the minimap
and the zoom controls. It does **not** decide where nodes go; positions come from our layout
(`core/layout.ts`) or from pins.

| Feature | How we use it |
|---|---|
| Nodes | one custom type, `point` → `PointNode`; rebuilt from the tree after each change |
| Edges | built-in `smoothstep` ("fixed sides") and custom `floating` → `FloatingEdge` ("shortest path") |
| Handles | three per node, not connectable: `in`, `out`, `branch`; sides depend on direction and layout mode |
| Quick actions | `NodeToolbar` without `isVisible`, so it only shows when exactly one node is selected |
| Dragging | `onNodeDragStart/Drag/Stop`; positions are written to the tree as pins on stop |
| Selection | `selectionOnDrag` + `SelectionMode.Partial`; `multiSelectionKeyCode="Shift"` |
| Pan | `panOnDrag={[1, 2]}` (middle/right), `panOnScroll`, Space+drag (default) |
| Props we turn off | `nodesConnectable`, `deleteKeyCode` (we handle Delete ourselves), `zoomOnScroll` |

## Gotchas

- A click inside a `NodeToolbar` bubbles (through the portal) to the node's click handling and
  re-selects it: buttons there must `stopPropagation`.
- `onNodeDrag*` handlers get native `MouseEvent | TouchEvent`; type them as `OnNodeDrag<T>`.
- Floating edges need measured node sizes: use `useInternalNode` and
  `node.internals.positionAbsolute` + `node.measured`.
- Controlled nodes: apply `onNodesChange` to the local copy (`applyNodeChanges`), and keep our
  own selection list in sync from the `select` changes.
