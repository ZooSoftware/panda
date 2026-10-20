# 0008. React Flow draws the canvas; the layout is our own

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** first build; `App.tsx`, `components/`, `model/layout.ts`

## Context

The editor needs pan, zoom, drag, box selection, custom node cards and edges. Placement must
respect chains (one row), branches (below), directions, pins and collapsed branches.

## Decision

- React Flow (`@xyflow/react`) renders and handles interaction.
- Placement is our own grid layout in `model/layout.ts`, pure and tested; React Flow gets
  absolute positions.

## Consequences

- We get interaction features without writing them, and keep full control over layout modes.
- React Flow's controlled-node model needs care (local node copy, selection sync; see
  [react-flow.md](../techs/react-flow.md)).

## Alternatives considered

- **dagre / ELK.js:** general graph layout ignores "a chain is one line" and doesn't know pins
  in grid units.
- **Own SVG canvas:** more control, much more code for pan/zoom/selection.
