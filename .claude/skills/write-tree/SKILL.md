---
name: write-tree
description: Write or edit a panda tree file (.md outline) from a description - follow docs/reference/outline-format.md, then run bun run check until it says ok. Use when asked to generate, draft or change a tree diagram as Markdown.
---

# Write a panda tree

1. Read `docs/reference/outline-format.md` (the rules) if it isn't in context.
2. Plan the tree: what is the main chain (sequence), what splits off (branches), what ends a
   path (leaves, always last in their chain; several endings = several leaf branches).
3. Write the file: front matter only if a setting differs from the default (`layout: packed`
   for many leaves per point), a `# Title`, then the numbered list. Content goes on the lines
   under a point, indented to its text; nothing after the bold title on the same line.
4. Check it, and repeat until it says ok:
   ```sh
   bun run check <file> --json
   ```
   Fix each reported line; warnings are worth fixing too (ignored text, missing title).
5. Editing a file panda exported: change the outline only. Leave the `<!-- panda-tree:v1 … -->`
   comment, the Mermaid block and the Pins table as they are; renaming a point drops its pin
   and color.
6. Report the file path and the checker's summary line.
