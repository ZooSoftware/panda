# 0009. Left-drag selects, Shift adds, Ctrl moves forward points

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the box-select and Ctrl+drag requests; `App.tsx` (React Flow props, drag handlers)

## Context

The user asked for a rectangle selection by pressing and dragging, and for Ctrl+drag to move a
point together with everything forward of it. Both collide with defaults: left-drag used to pan,
and Ctrl is React Flow's multi-select key on Linux and Windows.

## Decision

| Input | Action |
|---|---|
| left-drag on empty canvas | selection box (partial overlap selects) |
| Shift+click | add/remove one point from the selection |
| Ctrl/⌘+drag a point | move it with every later point in its chain and all their branches |
| right/middle drag, Space+drag, scroll | pan |
| Ctrl+scroll, pinch | zoom |

Every moved point is pinned on drop.

## Consequences

- Panning moved off the left button; mouse-wheel users scroll to pan.
- Ctrl+click no longer multi-selects.

## Alternatives considered

- **Shift+drag for the box (React Flow default):** the user asked for a plain drag.
- **Alt for forward-drag:** Alt+drag moves windows on many Linux desktops.
