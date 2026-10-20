# Panda

A web editor for tree diagrams built from **chains** and **branches**: points chain one after
another, any point can grow branches (each one another chain), and a **leaf** ends a chain.
Every point and leaf has a title, plain-text content and a color. Trees import and export as
JSON or as a README (Mermaid diagram + outline + pins).
Source of truth: `docs/` (index: `docs/README.md`): `architecture/` (how it works),
`decisions/` (one record per decision, the why), `reference/` (file formats), `techs/`,
`roadmap.md` (done, later, open questions). Read the relevant part before a structural change;
record a lasting decision as a new `docs/decisions/` record.

Claude setup (rules, skills, hook): `.claude/README.md`. There is no user guide yet.

## The most important rule: options, not replacements

When a shipped behaviour (layout, line style, controls) shows a problem, **add an option next
to it; never silently replace it**. Old saved trees must open exactly as before, so a new
setting defaults to the old behaviour when it is missing from a file.
Why: [0007](docs/decisions/0007-changes-are-options-not-replacements.md).
If a change can't be an option (it changes what a saved tree means), ask the user first.

## Core invariants (do not break)

- **It is a tree.** No merging branches back; every point has exactly one owner
  ([0003](docs/decisions/0003-strictly-a-tree.md)).
- **Prev/next are array positions.** A chain is `Point[]`; never store prev/next pointers
  ([0001](docs/decisions/0001-chains-are-arrays.md)).
- **Leaf rules:** a leaf is the last point of its chain and has no branches. A point can grow
  **any number** of leaf branches ([0002](docs/decisions/0002-leaf-rules.md)). The editing
  operations and `parseTree` both enforce this.
- **Edits are pure.** Every operation in `src/core/tree.ts` returns a new tree and never
  mutates its input (tested).
- **Pins are in grid units** (`col` along a chain, `row` across), so they rotate with the
  direction ([0004](docs/decisions/0004-pins-in-grid-units.md)).
- **View state is saved with the tree:** direction, line style, layout mode, pins and
  collapsed points ([0005](docs/decisions/0005-view-state-saved-with-the-tree.md)).
- **The README export is lossless:** it embeds the full tree, so importing it gives the same
  tree back, and every pin and collapsed point is also written in readable form
  ([0006](docs/decisions/0006-readme-export-is-lossless.md)).
- **The outline is an input format** others (and AI agents) write: an edited outline wins over
  the embedded data, keeping pins and colors by title path
  ([0016](docs/decisions/0016-the-outline-is-an-input-format.md)). The rules are
  `docs/reference/outline-format.md`; `bun run check` must agree with the app, so both use
  `analyzeText`.
- **Import is tolerant of old files:** a missing setting gets its old default; format
  changes are additive only.

## Stack

TypeScript (strict), React 18, **React Flow** (`@xyflow/react`) for the canvas, our own layout
(no ELK/dagre), Vite dev server and build, Vitest for tests. **Bun** is the package manager
and script runner: never npm or pnpm. See `docs/techs/`.

## Structure

```
src/
  core/            pure TypeScript: no React, no DOM, no packages
    tree.ts          types, editing operations, queries, counts, import validation (parseTree)
    layout.ts        grid layout (stacked | packed), grid ↔ pixel per direction
    formats.ts       JSON, README (Mermaid + outline + pins + embedded data), analyzeText/import
    outline.ts       parse a hand-written outline, with line-numbered diagnostics
  shared/          small helpers any layer may use (download, slug)
  features/        one folder per feature; imports core/ and shared/, never another feature
    editor/          useTreeEditor: tree, selection, edit actions, saving, Delete/Escape
    canvas/          Canvas (React Flow, drag, pin, Ctrl+drag), PointNode, FloatingEdge,
                     buildFlow (tree → nodes/edges), useFit
    inspector/       Inspector (one point), SelectionPanel (several)
    panel/           ControlPanel: tabs on a side, hover menus on top/bottom
    file-sync/       live link to a .md/.json on disk (File System Access API)
    image-export/    PNG/JPG/SVG capture of the canvas
  app/             composition: App, main, styles.css, usePreferences, the panel groups
scripts/check.ts   `bun run check <file>`: the app's reading of a tree file, as diagnostics
tests/             all tests, outside src/ and mirroring it
  core/              tree, layout, formats, outline tests
  fixtures.ts        trees shared by the tests
  architecture.test.ts   enforces the import rules above
```

- `core/` must stay pure so it can be tested without a browser and reused later.
- A new feature gets its own folder. Features talk through `app/`, which passes props and
  slots; a feature never imports another ([0015](docs/decisions/0015-feature-folders-and-a-pure-core.md)).
- `app/` only composes: logic goes into a feature (or `core/` if it is about the tree).

## Conventions

- Match the surrounding code: comment density, naming, idiom.
- Tests live in `tests/`, never in `src/`; `tests/<path>/x.test.ts` tests `src/<path>/x.ts`.
  New behaviour in `src/core/` gets a test in `tests/core/`.
- A file format change updates `docs/reference/` in the same commit.
- UI changes are verified in a real browser (`browser-test` skill), never on the user's own
  tree without a backup: it lives in `localStorage` under `panda-tree`.
- Commit messages follow **Conventional Commits** (`feat: …`, `fix: …`, `docs: …`,
  `refactor: …`, `test: …`, `chore: …`), enforced by commitlint in `.husky/commit-msg`.
  Never bypass it with `--no-verify`.

## Commands

```sh
bun install          # also installs the husky git hooks (prepare script)
bun run dev          # editor on http://localhost:5173
bun run test         # vitest (not `bun test`: that is Bun's own runner)
bun run typecheck    # tsc for the app, then for scripts/ (Bun types)
bun run check f.md   # check a tree file (outline, README or JSON); --json for agents
bun run build        # typecheck + production build into dist/
```
