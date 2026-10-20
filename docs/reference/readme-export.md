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

`importText` accepts a JSON file or a README. In a README only the embedded comment is read,
so importing an exported README gives back exactly the same tree
([0006](../decisions/0006-readme-export-is-lossless.md)). Hand edits to the Mermaid, outline or
pins table are not imported; a README without the comment fails with a clear error.
