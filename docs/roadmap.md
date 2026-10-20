# Roadmap

What is done, what is next, and what is still open. The user sets priorities. Every item must
respect [0007](decisions/0007-changes-are-options-not-replacements.md): new behaviour is an
option, never a silent replacement.

## Done

1. Tree model: chains, branches, leaves; title, plain-text content and color on every point.
2. Editing: + Next, ⎇ Branch, 🍃 Leaf (any number per point), ⏹ End chain, Reopen, Delete.
3. Layout: `stacked` and `packed`; four directions with Rotate; lines on fixed sides or shortest path.
4. Pinning by drag (grid units, rotates with the tree), Unpin one / selected / all.
5. Collapse a point's branches, Collapse all / Expand all; `▸ +N` hidden count.
6. Leaf count `🍃 N` on every point with branches.
7. Box selection and group drag; Ctrl+drag moves a point with everything forward of it.
8. Import/export: JSON, and README (Mermaid + outline + pins + embedded tree, lossless).
9. Examples: "Learn web development", "Literature review (60 papers)".
10. Claude setup and these docs; husky + commitlint for Conventional Commit messages.

## Later

- Undo / redo (the most useful missing feature).
- A user guide (`README.md` at the top level).
- Line style per connection, not only per tree.
- Leaf count in the README outline.
- Import a hand-written README outline (no embedded data).
- Rich content: Markdown, links, tags, status.
- A layout mode that keeps a point's branches under the point itself, for the packed-layout quirk below.

## Out of scope (for now)

- Merging branches back (a DAG) ([0003](decisions/0003-strictly-a-tree.md)).
- Accounts, sync, collaboration: trees are files.

## Open questions

- **Packed layout:** a point's branches sit under the *next* point of its chain (2012's papers
  under 2013). Accept it, or add another mode?
- **Unpin all vs collapsed points:** should Unpin all also expand collapsed points, since
  collapsed is "treated as a pin"? Today it only clears positions.
- **Free rotation** (any angle) on top of the four directions: text would rotate too.
