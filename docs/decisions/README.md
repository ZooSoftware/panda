# Decisions

One record per decision that shapes panda (an ADR): the context, the decision, what it costs,
and what else was considered. Records explain **why**; how things work today is in
[architecture/](../architecture/README.md).

- Add one by copying [template.md](template.md) to the next number. Keep it short.
- An accepted record's decision is never rewritten. To change it, write a new record that
  supersedes it and mark the old one `superseded by NNNN`.
- Rules in `CLAUDE.md` and `.claude/rules/` should link the record they come from.
- Questions not decided yet live in [roadmap.md](../roadmap.md#open-questions).

## Index

**Read first:** [0007](0007-changes-are-options-not-replacements.md), the working rule.

| # | Decision | Area | Date |
|---|---|---|---|
| [0001](0001-chains-are-arrays.md) | A chain is an array; prev/next are positions | model | 2026-10-20 |
| [0002](0002-leaf-rules.md) | A leaf ends its chain; a point can grow any number of leaves | model | 2026-10-20 |
| [0003](0003-strictly-a-tree.md) | It is strictly a tree: branches never merge back | model | 2026-10-20 |
| [0004](0004-pins-in-grid-units.md) | Pins are stored in grid units, so they rotate with the tree | layout | 2026-10-20 |
| [0005](0005-view-state-saved-with-the-tree.md) | View state is saved with the tree | format | 2026-10-20 |
| [0006](0006-readme-export-is-lossless.md) | The README export is lossless and lists every pin | format | 2026-10-20 |
| [0007](0007-changes-are-options-not-replacements.md) | Changes are options, not replacements | process | 2026-10-20 |
| [0008](0008-react-flow-canvas-own-layout.md) | React Flow draws the canvas; the layout is our own | editor | 2026-10-20 |
| [0009](0009-mouse-and-key-controls.md) | Left-drag selects, Shift adds, Ctrl moves forward points | editor | 2026-10-20 |
| [0010](0010-bun-vite-react.md) | Bun, Vite and React; no server | stack | 2026-10-20 |
| [0011](0011-ui-preferences-stay-in-the-browser.md) | UI preferences stay in the browser, not in the tree | editor | 2026-10-20 |
| [0012](0012-image-export-captures-the-canvas.md) | Image export captures the canvas as drawn | export | 2026-10-20 |
| [0013](0013-live-file-sync-in-the-browser.md) | Live file sync runs in the browser (File System Access API) | export | 2026-10-20 |
| [0014](0014-leaves-only-as-branches.md) | Leaves are added only as branches; no "End chain" | model | 2026-10-20 |
| [0015](0015-feature-folders-and-a-pure-core.md) | Feature folders on top of a pure core | structure | 2026-10-20 |
