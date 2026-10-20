# Roadmap

What is done, what is next, and what is still open. The user sets priorities. Every item must
respect [0007](decisions/0007-changes-are-options-not-replacements.md): new behaviour is an
option, never a silent replacement.

## Done

1. Tree model: chains, branches, leaves; title, plain-text content and color on every point.
2. Editing: + Next, ⎇ Branch, 🍃 Leaf (any number per point), Reopen, Delete.
3. Layout: `stacked` and `packed`; four directions with Rotate; lines on fixed sides or shortest path.
4. Pinning by drag (grid units, rotates with the tree), Unpin one / selected / all.
5. Collapse a point's branches, Collapse all / Expand all; `▸ +N` hidden count.
6. Leaf count `🍃 N` on every point with branches.
7. Box selection and group drag; Ctrl+drag moves a point with everything forward of it.
8. Import/export: JSON; README export (Mermaid + outline + pins) as a one-way view.
9. ~~Built-in example trees~~ (removed; a new tree starts with one point).
10. Claude setup and these docs; husky + commitlint for Conventional Commit messages.
11. Control panel on any side (default left) with File / View / Arrange groups: tabs on a side,
    hover menus on top/bottom; the point panel sits opposite a side panel.
12. Helvetica font (as draw.io); System / Light / Dark theme.
13. Image export: PNG, JPG, SVG of the whole diagram as drawn.
14. Live sync with a `.json` file on disk, both directions, surviving reloads (Chrome/Edge).
15. Architecture cleanup: pure `core/`, feature folders, composition in `app/`, import rules
    enforced by a test ([0015](decisions/0015-feature-folders-and-a-pure-core.md)).
16. AI-friendly authoring: JSON is the only file format, with a JSON Schema, a written guide
    ([json-format](reference/json-format.md)) and a compiler-style `bun run check` (`--json`),
    tested with Haiku agents ([0017](decisions/0017-json-is-the-only-file-format.md)).
17. User guide: the top-level README.

## Later

- Undo / redo (the most useful missing feature).
- Line style per connection, not only per tree.
- Leaf count in the README view.
- `bun run check --fix`: rewrite a file in canonical form (defaults left out, stable order).
- Publish the schema at a URL so `$schema` works from any folder.
- Pure-SVG image export (no `foreignObject`), for vector editors ([0012](decisions/0012-image-export-captures-the-canvas.md)).
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
