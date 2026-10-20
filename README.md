# 🐼 Panda

A web editor for **tree diagrams made of chains and branches**: points follow one another in a
chain, any point can grow branches (each one another chain), and a leaf 🍃 ends a chain. Mind-map
tools treat every child the same; panda keeps "what comes next" apart from "what splits off", which
fits roadmaps, decision paths, story plots and literature reviews (years on the main chain, papers
as leaves).

```
 Research ──► Build ──────────► Beta ─────► 🍃 Launch        main chain
                ├╌╌► Backend ──► API          ├╌╌► 🍃 Go       branches
                └╌╌► Frontend ─► 🍃 Web app    └╌╌► 🍃 No-go
```

A tree is a single JSON file, checked by a JSON Schema, so people and AI agents can both write one.

## Quick start

Needs [Bun](https://bun.sh).

```sh
bun install
bun run dev        # open http://localhost:5173
```

Your tree is saved in the browser as you edit. Export it to keep it, or link a file on disk (see
[Files](#files)).

## Using the editor

**Building the tree:** click a point, then use the buttons above it:

| Button | Does |
|---|---|
| **+ Next** | adds a point right after this one in its chain |
| **⎇ Branch** | starts a new branch beside this point |
| **🍃 Leaf** | adds a leaf as a new branch; a point can have any number |

The panel next to a selected point edits its title, content (plain text) and color, and can delete it.

**Arranging:**

| Do | How |
|---|---|
| Move and pin a point | drag it; pinned points stay where you put them (📌, click to unpin) |
| Move a point with everything after it | Ctrl+drag |
| Select several | drag on empty canvas to draw a box; Shift+click to add or remove |
| Hide or show a point's branches | the ▾ / ▸ +N button on the point; **Collapse all** in Arrange |
| Pan / zoom | right-drag, Space+drag or scroll / Ctrl+scroll or pinch |
| Delete / deselect | Delete / Escape |

Each point with branches shows **🍃 N**, the number of leaves inside its branches.

**The control panel** has three groups: **File**, **View** and **Arrange**. Put it on any side
(View → Panel position): on the left or right the groups are tabs, on the top or bottom they are
menus that open on hover.

**View settings:** direction (rotate in four directions), lines on fixed sides or by the shortest
path, layout *stacked* (each branch on its own rows) or *packed* (compact, for many leaves), and a
System / Light / Dark theme.

## Files

| In File | Does |
|---|---|
| **Open file (live sync)** / **Save to file (live sync)** | links a `.json` on disk: your edits are written to it as you work, and changes made to it elsewhere (git, an AI agent) load into the editor. Chrome and Edge. |
| **Import JSON** / **Export JSON** | open or save a tree file |
| **Export README (view only)** | a Markdown page with a Mermaid diagram, an outline and the pins, for reading on GitHub; panda can't open it again |
| **Export image** | PNG, JPG or SVG of the whole diagram exactly as drawn (hidden branches stay hidden, pins kept) |

## The tree file

```json
{
  "title": "Product launch",
  "direction": "TB",
  "root": [
    { "title": "Research", "content": "Goal: validate the audience", "color": "#fde68a" },
    { "title": "Build", "branches": [
      [{ "title": "Backend" }, { "title": "API" }],
      [{ "title": "Frontend" }, { "kind": "leaf", "title": "Web app" }]
    ] },
    { "kind": "leaf", "title": "Launch" }
  ]
}
```

`root` is the main chain; a point's `branches` is a list of chains; a leaf must be the last point
of its chain. Only `root` and each point's `title` are required. The full guide is
[docs/reference/json-format.md](docs/reference/json-format.md), and the contract is the schema
[src/core/panda-tree.schema.json](src/core/panda-tree.schema.json) (add
`"$schema": "<path to it>"` to a file for completion and errors in your editor).

Check a file like a compiler:

```sh
bun run check tree.json            # tree.json:6:15: error at root[1].kind: leaf "Done" must be …
bun run check tree.json --json     # machine-readable, for agents
```

If it passes, panda opens the file.

## Writing trees with AI agents

Give the agent the guide and the checker:

> Write a panda tree as JSON following docs/reference/json-format.md (schema:
> src/core/panda-tree.schema.json). Then run `bun run check <file>` and fix every reported error
> and warning until it says ok.

This was tested with Claude Haiku agents given only those files: they wrote and edited trees
correctly on their first check. Combined with live sync, an agent can edit the file while you
watch the diagram update. In Claude Code, the `write-tree` skill does the same loop.

## Development

```sh
bun run dev          # editor with hot reload
bun run test         # Vitest (tests/), including an architecture test of the import rules
bun run typecheck    # the app, then scripts/ with Bun types
bun run build        # production build into dist/
```

TypeScript, React 18, [React Flow](https://reactflow.dev) for the canvas, our own layout, Vite,
Vitest, Bun. No server: the app is static files.

```
src/core/        pure tree model, layout, JSON and README formats, the schema
src/features/    one folder per feature: editor, canvas, inspector, panel, file-sync, image-export
src/app/         puts the features together
scripts/         bun run check
tests/           all tests, mirroring src/
docs/            architecture, decisions, file formats, roadmap
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (checked by a
git hook). How it is built and why: [docs/](docs/README.md). Working on it with Claude Code:
[CLAUDE.md](CLAUDE.md).
