# 0014. Leaves are added only as branches; no "End chain"

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** user feedback ("remove the button end with the leaf, it is meaningless");
  supersedes the End chain part of [0002](0002-leaf-rules.md); `model/tree.ts`, `PointNode`, `Inspector`

## Context

[0002](0002-leaf-rules.md) gave two ways to make a leaf: **🍃 Leaf** (a new branch that is one
leaf) and **End chain** (a leaf appended after the last point of a chain). Once Leaf existed, End
chain added nothing the user wanted, and having two leaf buttons was confusing.

## Decision

- The only way to add a leaf is **🍃 Leaf** / **Add leaf**: a new branch holding one leaf.
- The `endChain` operation, its capability and its buttons are removed.
- The leaf rules themselves don't change: a leaf is last in its chain and has no branches, and
  files with a leaf at the end of a chain (the examples, older trees) load and display as before.
- **Reopen** still turns a leaf back into a point.

## Consequences

- One leaf button; fewer choices on every point.
- A chain can no longer be ended with a leaf from the UI.

## Alternatives considered

- **Keep End chain as an option:** the user called it meaningless; nothing depends on it.
