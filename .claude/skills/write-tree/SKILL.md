---
name: write-tree
description: Write or edit a panda tree file (JSON) from a description - follow docs/reference/json-format.md and the schema, then run bun run check until it says ok. Use when asked to generate, draft or change a tree diagram.
---

# Write a panda tree

1. Read `docs/reference/json-format.md` (the guide) if it isn't in context; the exact contract is
   `src/core/panda-tree.schema.json`.
2. Plan the tree: what is the main chain (sequence), what splits off (branches, each an array of
   points), what ends a path (leaves: always last in their chain; several endings = several
   branches holding one leaf each). Branches have no names: a label is the branch's first point.
3. Write the JSON: `root` is the main chain; leave out every field that keeps its default; only
   `title` is required on a point.
4. Check it, and repeat until it says ok with no warnings:
   ```sh
   bun run check <file> --json
   ```
5. Editing a saved tree: keep existing `id`s (pins and colors stay attached), give new points no
   `id`, and leave `pin` and `collapsed` alone unless asked.
6. Report the file path and the checker's summary line.
