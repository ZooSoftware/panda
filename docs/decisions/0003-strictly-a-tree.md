# 0003. It is strictly a tree: branches never merge back

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** first design discussion ("we not deal with branch merge now"); the whole model

## Context

Some real flows split and join again. Supporting that turns the tree into a graph where a point
can have several parents, which complicates the data model, layout, collapsing, counting and
the README outline.

## Decision

Every point has exactly one owner: the chain it is in. There is no way to connect a branch back
into another chain.

## Consequences

- Layout, collapse, leaf counts and the outline are simple recursive walks.
- Flows that really rejoin can't be drawn yet.

## Alternatives considered

- **A DAG with merge points:** deferred; it would need its own decision and a new layout
  ([roadmap](../roadmap.md)).
