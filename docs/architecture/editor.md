# Editor (`App.tsx`, `src/components/`)

## State

| State | Where | Notes |
|---|---|---|
| `tree` | `useState` in `Editor` | the only state that is saved |
| `selectedIds` | `useState` | copied onto nodes when they are rebuilt; change with `select()` |
| `nodes` | local copy of `buildNodes(tree)` | exists so React Flow can move nodes during a drag |
| `follow` | ref | Ctrl+drag: start positions of the points that follow the dragged one |

`buildNodes` lays out the visible points and passes each node its point, direction, layout
mode, capabilities, descendant count and leaf count. `buildEdges` makes chain edges (solid) and
branch edges (dashed), as `smoothstep` or `floating` depending on the line style.

## Gestures

| Gesture | Result |
|---|---|
| click a point | select it; its quick actions show above it and the inspector opens |
| Shift+click | add/remove a point from the selection |
| left-drag on empty canvas | selection box (partial overlap counts) |
| drag a point | moves it (and the rest of the selection); pins every moved point |
| Ctrl+drag a point | also moves everything forward of it (`forwardIds`); pins them all |
| right/middle drag, Space+drag, scroll | pan; Ctrl+scroll or pinch zooms |
| ▾ / ▸ +N on a point | collapse / expand its branches |
| Delete | remove the selected point (one selected only); Escape clears the selection |

A drag shorter than 3px doesn't pin (a click can register as a zero-length drag).
Why these keys: [0009](../decisions/0009-mouse-and-key-controls.md).

## Node card

Title (cut with "…"), up to two lines of content (one when the badge row is shown), 📌 at the
top right when pinned (click to unpin), and on points with branches a bottom row with
`🍃 N` (leaf count) on the left and the collapse toggle on the right. Leaves are pill-shaped
with a dashed border.

## Toolbar

Title · Rotate · direction · line style · layout mode · Collapse/Expand all · Unpin all · Fit ·
Import · Export JSON · Export README · Examples · New. Loading an example asks for confirmation.

## Persistence

Every change is written to `localStorage['panda-tree']` as the export JSON. On load the app
reads it through `importText`, so stored trees get the same validation and defaults as imported
files; unreadable data falls back to the sample tree.
