---
paths:
  - "src/model/**"
---

# Model (`src/model/`)

- Pure TypeScript: no React, no DOM, no `localStorage`. The UI calls in; the model never calls out.
- Every editing operation returns a new tree (`structuredClone` + mutate the clone) and never
  touches its input. Operations that create a point return `[tree, newId]` so the UI can select it.
- Check what an operation may do with `capabilities()`; the UI enables buttons from the same
  function, so a rule lives in one place.
- Leaf rules ([0002](../../docs/decisions/0002-leaf-rules.md)): a leaf is last in its chain and
  has no branches; a point may grow any number of leaf branches. Enforce in both the operation
  and `parseTree`.
- A new field on `Tree` or `Point`: optional on import with the old behaviour as default
  (`parseTree`), written by `toJSON`, covered in `docs/reference/json-format.md`, and shown in the
  README export if it is view state the user set (pins, collapsed, settings).
- Layout works in grid units (`col`, `row`); only `toPixels`/`toPin` know pixels. A new layout
  mode is a new `LayoutMode` value, never a change to an existing one
  ([0007](../../docs/decisions/0007-changes-are-options-not-replacements.md)).
- Tests go in `model.test.ts`; run `bun run test`.
