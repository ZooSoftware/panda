# 0005. View state is saved with the tree

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the line style, layout mode and collapse requests ("treat it as a pinning too");
  `Tree`, `Point.collapsed`, `parseTree`

## Context

Direction, line style, layout mode, pins and collapsed points are how the user arranged the
tree to read it. Losing them on export or reload means arranging it again.

## Decision

All of them are fields of the tree: `direction`, `edgeStyle`, `layout` on `Tree`; `pin` and
`collapsed` on `Point`. They are saved to storage, to JSON and (embedded) to the README.
Selection and zoom are not saved.

## Consequences

- A shared file opens exactly as its author left it.
- Each new setting needs an import default, which is the old behaviour
  ([0007](0007-changes-are-options-not-replacements.md)).

## Alternatives considered

- **A separate view-settings file:** one more file to keep together; no benefit at this size.
