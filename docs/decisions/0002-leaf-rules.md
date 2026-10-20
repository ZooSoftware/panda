# 0002. A leaf ends its chain; a point can grow any number of leaves

- **Status:** accepted; the **End chain** action is superseded by [0014](0014-leaves-only-as-branches.md)
- **Date:** 2026-10-20
- **Where:** first design; the "only one leaf per point" bug report; `model/tree.ts`
  (`capabilities`, `addLeaf`, `endChain`, `parseTree`)

## Context

A leaf is an end: nothing chains after it. The first UI only had "End", which appends a leaf
after the last point of a chain, so a point could end up with at most one leaf. The user
reported this as a bug: a point must be able to have many leaves (a year with five papers).
The model already allowed it; only the UI was missing a way to make one.

## Decision

- A leaf is always the **last point of its chain** and has **no branches**.
- **Add leaf** grows a new branch that is a single leaf. Any non-leaf point can do this any
  number of times, wherever it is in its chain.
- **End chain** appends a leaf after a point that is last in its chain.
- **Reopen** turns a leaf back into a point so its chain can continue.
- `parseTree` rejects a leaf that isn't last or has branches.

## Consequences

- Leaves are easy to count (`countLeaves`): the `🍃 N` badge on each point.
- Both rules live in `capabilities()`, which the operations and the buttons share.

## Alternatives considered

- **Allow anything after a leaf:** then a leaf means nothing.
- **Many leaves only at chain ends:** forces a dummy point per leaf; the literature review
  would need 60 extra points.
