# README export (view only)

**Export README** writes a `README.md` for **reading** the tree on GitHub. It is one-way: panda
can't open it again; the tree's file is its JSON ([0017](../decisions/0017-json-is-the-only-file-format.md)).
It has three parts, in this order:

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
   the title with hard line breaks; a content line that would render as a list item is escaped
   (`1\. step`). The outline always lists every point, collapsed or not.
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
