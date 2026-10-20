# Writing a panda tree (outline format)

This page is the complete set of rules for writing a tree that panda can open. It is written for
people **and for AI agents**: follow it, write a `.md` file, run the checker, fix what it reports.

Source of truth in code: `src/core/outline.ts` (parser) and `src/core/formats.ts` (`analyzeText`).

## The model in one minute

- A tree is a **main chain** of points: 1 → 2 → 3. Order means sequence.
- Any point can grow **branches**. A branch is another chain that starts beside the point. After
  a point's branches, its own chain simply continues with its next point.
- A **leaf** (🍃) ends a chain: it is the last point of its chain and has no branches.
  A point can grow any number of leaves, each as its own branch.
- Every point has a **title**, optional plain-text **content** and an optional **color**.
- Branches have **no names** of their own, and they **never rejoin** the main chain: it is a tree.

## A complete example

```md
---
direction: LR
layout: packed
---
# Literature review: transformers

1. **2017** {#fde68a}
   The year attention took over.
   - ⎇ Branch 1
     1. 🍃 **Attention Is All You Need**
        Vaswani et al. · NeurIPS 2017
2. **2018**
   - ⎇ Branch 1
     1. 🍃 **BERT**
        Devlin et al. · NAACL 2019
   - ⎇ Branch 2
     1. 🍃 **GPT**
3. **2020**
   - ⎇ Branch 1
     1. **Scaling**
     2. 🍃 **GPT-3**
```

The main chain is 2017 → 2018 → 2020. 2017 has one branch (one leaf), 2018 has two, and 2020
has a branch with a point followed by a leaf.

## Rules

### File

1. Optional **front matter** at the very top, between `---` lines (see Settings).
2. A **`# Title`** heading before the list. Without it the tree is called "Untitled tree".
3. The tree is the **first numbered list** in the file. Anything before it (text, a Mermaid code
   block) is ignored. The tree ends at the first line back at the list's left margin that is not
   a numbered item (for example `## Notes`); everything after is ignored.

### Points

4. A point is a numbered item: `1. **Title**`. The number doesn't matter (`1.` everywhere is
   fine); order in the file is the order in the chain. `1)` also works.
5. The title is the bold text, and may contain any characters (colons, parentheses…). Bold is
   optional (`1. Title` works), but then the whole line is the title. **Text after the bold
   title is ignored** (warning): put it in the content.
6. A **leaf** starts with 🍃: `1. 🍃 **Title**`.
7. An optional **color** goes at the end of the line: `1. **Title** {#fde68a}` (`#rgb` or
   `#rrggbb`). Default: white for points, light green for leaves.
8. Notes in the form `_(…)_` at the end of the line, like `_(📌 pinned)_` and
   `_(▸ branches collapsed)_` written by the export, are ignored.

### Content

9. Content is the lines **right under a point**, indented to where the point's text starts
   (see Indentation). Each line is kept as a separate line. Plain text only: no formatting.
10. A content line that starts like a list item must be escaped: `1\. step`, `\- note`.
    The backslash is not kept: the content reads "1. step".
11. Within a point, the order is: title line, content lines, then branch lines.

### Branches

12. A branch is a line `- ⎇ Branch N` (or `- Branch`), indented to the point's text, with the
    branch's points as a numbered list indented 2 more spaces. Each `- ⎇` line starts a new
    branch of the same point.
13. **Branches have no names.** Text after `⎇` other than `Branch N` is dropped (warning). To
    label a branch, make the label its first point:
    ```md
    - ⎇ Branch 1
      1. **Backend**
      2. **API**
    ```
14. Shortcut: a numbered list indented right under a point (no `- ⎇` line) is also a branch.
    Use the `- ⎇` line when a point has more than one branch.
15. Branches nest: points in a branch can have branches of their own, the same way.
16. A branch must contain at least one point. After a point's branches, the next item at the
    point's own indentation continues the point's chain.

### Leaves and endings

17. A leaf must be the **last point of its chain**: nothing can follow it. So two leaves can
    never be in the same numbered list.
18. A leaf **can't have branches**.
    Leaves are optional: a chain may also just end on a normal point.
19. There are two kinds of ending; pick by meaning:
    - **The chain ends here:** make the last item of the chain a leaf
      (`5. 🍃 **Launch**` as the last main-chain point).
    - **A side ending from a point** (one of several outcomes, a paper under a year): give the
      point a branch holding just the leaf. For several endings, one branch per leaf:
      ```md
      4. **Beta**
         - ⎇ Branch 1
           1. 🍃 **Go**
         - ⎇ Branch 2
           1. 🍃 **No-go**
      ```

### Indentation

20. Use spaces. Columns, counted from the start of the line:

    | Line | Column |
    |---|---|
    | main-chain point `1. **A**` | 0 |
    | its content and its `- ⎇` lines | 3 (4 after `10. `) |
    | points in that branch `1. **B**` | 5 |
    | their content and their `- ⎇` lines | 8 |
    | points in a branch of a branch | 10 |
    | their content | 13 |

    The rule behind it: content and `- ⎇` lines start where the point's text starts; a branch's
    points start 2 spaces after its `- ` (the `⎇`'s column).
21. A nested list must start at the parent's text column or further right (the same rule GitHub
    uses to render it). Something between two levels is an error, because it is unclear where it
    belongs.

### Settings (front matter, all optional)

| Key | Values | Default |
|---|---|---|
| `direction` | `LR` (left → right), `TB` (top → bottom), `RL`, `BT` | `LR` |
| `layout` | `stacked` (each branch on its own rows), `packed` (compact, good for many leaves) | `stacked` |
| `lines` | `sides` (lines on fixed sides), `shortest` (straight lines) | `sides` |

Pins, collapsed branches and ids can't be written in the outline: they are set in the editor.

## Check your file

```sh
bun run check tree.md            # one line per problem, then a summary
bun run check tree.md --json     # the same, as JSON, for agents
```

Exit code 0 means panda will open the file as written; 1 means fix the reported errors; 2 means
the command was used wrong. Warnings don't fail the check, but each one means something you
wrote is not kept: fix them too. Output looks like:

```
tree.md:12: error: leaf "Done" must be the last point of its chain; nothing can follow a leaf
tree.md:15: error: empty branch: put numbered points under it
tree.md: 2 errors, 0 warnings
```

```
tree.md: ok · "Literature review: transformers" · 8 points, 4 leaves, 4 branches · from outline
```

`--json` prints one object per file:

| Field | Meaning |
|---|---|
| `ok` | true when there are no errors |
| `title` | the tree's title |
| `stats` | `points` (every point: leaves and label points included), `leaves`, `branches` |
| `source` | where the tree was read from: `outline`; `embedded` (an exported README whose outline matches its hidden data); `outline+embedded` (an edited exported README: the outline, with pins and colors kept); `json` |
| `diagnostics` | `{ line, severity: "error" \| "warning", message }` for each problem |

## Editing a file panda exported

An exported README has the same outline plus hidden data at the end (a
`<!-- panda-tree:v1 … -->` comment) that holds ids, colors, pins and settings.

- **Edit the outline only.** Leave the comment, the Mermaid block, the Pins table and the
  `_(…)_` notes as they are, even though the Mermaid block and Pins table will look out of date:
  panda ignores them when reading and rewrites them on its next save.
- When the outline no longer matches the hidden data, panda loads the outline and keeps ids,
  colors, pins and collapsed state for every point whose title path (the titles from the main
  chain down to it) is unchanged. A renamed or moved point loses its pin and color. The checker
  then reports `source: outline+embedded`.
- If the edited outline has errors, panda opens the hidden data instead, and your edits are
  lost: the checker reports this. Fix the errors first.

## Prompt for an agent

> Write a panda tree as Markdown following docs/reference/outline-format.md: a `# Title`, then
> the main chain as a numbered list of `**bold titles**`, content indented under each point,
> branches as `- ⎇ Branch N` lines with an indented numbered list (branches have no names: put
> a label as the branch's first point), leaves marked 🍃 and always last in their chain. Then
> run `bun run check <file>` and fix every reported error and warning until it says ok with no
> warnings.
