# 0004. Pins are stored in grid units, so they rotate with the tree

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the pinning + rotation request; `model/layout.ts` (`toPin`, `toPixels`), `Point.pin`

## Context

The user wanted to rotate the tree freely and to pin points at chosen positions. Pins stored in
pixels stay put when the tree rotates, so after a rotation pinned points end up far from their
chain.

## Decision

- A pin is `{ col, row }` in layout grid units (fractional): `col` along the chain, `row` across.
- Dragging converts the drop position with `toPin`; drawing converts with `toPixels`, using the
  current direction, exactly like auto-placed points.

## Consequences

- Rotating keeps every pinned point in the same place relative to its chain.
- Pin values in the README are grid units, not pixels; the README says so.
- Spacing changes in `toPixels` move pinned points too (they scale with the grid).

## Alternatives considered

- **Pixel pins:** simple, but wrong after a rotation.
- **Pins per direction:** four positions per point, confusing to edit and to export.
