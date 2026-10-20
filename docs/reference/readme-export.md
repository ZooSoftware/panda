# README export

**Export README** writes `README.md` with four parts, in this order:

1. `# <title>`
2. A **Mermaid** `flowchart` (GitHub renders it): direction from the tree, points as `[box]`,
   leaves as `([pill])`, chain edges `-->`, branch edges `-.->`, and a `style` line per point
   with its color. Node ids are `n0, n1, …`; labels escape `"` as `#quot;`.
3. `## Outline`: the tree as nested numbered lists.
   ```md
   2. **HTML & CSS** _(📌 pinned)_  
      Structure and style pages.
      - ⎇ Branch 1
        1. **Flexbox**
        2. 🍃 **Build a landing page**
   3. **JavaScript** _(▸ branches collapsed)_
   ```
   Leaves get 🍃; pinned and collapsed points are flagged after the title. Content lines follow
   the title with hard line breaks. The outline always lists every point, collapsed or not.
4. `## Pins`: the view settings, then every pinned or collapsed point.
   ```md
   Direction: left → right · Lines: fixed sides · Layout: packed

   Positions are in layout grid units: `col` runs along a chain, `row` across it.

   | Point | Pinned position | Branches |
   | --- | --- | --- |
   | 2012 › AlexNet | col 1.24, row -1.71 | — |
   | 2015 | — | collapsed (5 hidden) |
   ```
   The point column is the path of titles from the root chain, so equal titles stay distinct.
   With nothing pinned or collapsed it says so instead of the table.

The file ends with the full tree as base64-encoded JSON in an HTML comment (invisible on GitHub):

```md
<!-- panda-tree:v1 eyJ0aXRsZSI6... -->
```

## Import

`importText` (through `analyzeText`) accepts a JSON file, an exported README, or a hand-written
outline ([outline-format.md](outline-format.md)):

| File | What loads |
|---|---|
| README whose outline matches the embedded data | the embedded tree, exactly ([0006](../decisions/0006-readme-export-is-lossless.md)) |
| README whose outline was edited | the outline, keeping ids, colors, pins and collapsed state of points at an unchanged title path ([0016](../decisions/0016-the-outline-is-an-input-format.md)) |
| README whose edited outline has errors | the embedded tree; the errors are reported (`bun run check`) |
| Outline without embedded data | the outline |

Content lines that would read as list items are escaped on export (`1\. step`, `\- note`), so
the outline always reads back as the same tree. Edits to the Mermaid block or the Pins table
have no effect; they are regenerated on the next export.
