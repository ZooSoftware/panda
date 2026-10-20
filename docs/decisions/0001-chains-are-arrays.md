# 0001. A chain is an array; prev/next are positions

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the first design discussion; `model/tree.ts` (`Chain`, `Point`)

## Context

The idea is points that chain to a previous and a next point, and points that grow branches.
Storing explicit `prev`/`next` pointers on each point means keeping both ends in sync on every
insert, delete and move: the classic source of linked-list bugs, and awkward to serialize.

## Decision

- A chain is `Point[]`. A point's previous and next are its neighbours in the array.
- A point's branches are `Chain[]`. The tree is `{ root: Chain }`.
- Nothing stores a pointer to another point; `findPoint` finds the owner when needed.

## Consequences

- Insert and delete are `splice`; deleting a point re-links its neighbours for free.
- The JSON is a plain nested structure, easy to read and diff.
- Finding a point's chain or owner is a walk (`findPoint`), fine at diagram sizes.

## Alternatives considered

- **Point map + prev/next ids:** fast lookups, but two-sided updates and harder to validate.
- **Generic graph (nodes + edges):** would allow merges, which we don't want ([0003](0003-strictly-a-tree.md)).
