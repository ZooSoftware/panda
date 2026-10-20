# Panda tree JSON

A panda tree is one JSON file. It is the only format panda opens: Import, live sync, the saved
copy in the browser and `bun run check` all read it. This page is everything needed to write
one by hand or with an AI agent.

- **Schema:** [`src/core/panda-tree.schema.json`](../../src/core/panda-tree.schema.json)
  (JSON Schema 2020-12). It describes every field; editors use it for completion and errors.
- **Checker:** `bun run check tree.json`: syntax, then the schema, then the rules a schema can't
  express. If it passes, panda opens the file.
- In code: `parseTree` (`src/core/tree.ts`) reads it, `toJSON` (`src/core/formats.ts`) writes it.

## The model in one minute

- A tree is a **main chain** of points: an array, in order. Each point follows the previous one.
- Any point can grow **branches**. A branch is another chain that starts beside the point (a
  line connects the point to the branch's first point); it is an array of points too, so
  `branches` is an **array of arrays**. A point with branches still continues its own chain with
  the next point of its array.
- A **leaf** (`"kind": "leaf"`) ends a chain: it is the last point of its chain and has no branches.
- Branches never rejoin the main chain, and have no names of their own: to label a branch, make
  the label its first point.

## A complete example

```json
{
  "title": "Product launch",
  "direction": "TB",
  "root": [
    { "title": "Research", "content": "Goal: validate the audience\nDeadline: Nov 15", "color": "#fde68a" },
    {
      "title": "Build",
      "branches": [
        [{ "title": "Backend" }, { "title": "API" }],
        [{ "title": "Frontend" }, { "kind": "leaf", "title": "Web app" }]
      ]
    },
    {
      "title": "Beta",
      "branches": [
        [{ "kind": "leaf", "title": "Go" }],
        [{ "kind": "leaf", "title": "No-go" }]
      ]
    },
    { "kind": "leaf", "title": "Launch" }
  ]
}
```

The main chain is Research → Build → Beta → Launch, and Launch ends it. Build has two branches
(Backend → API, and Frontend → Web app, which ends in a leaf). Beta has two side endings, one
branch per leaf.

## Fields

Only `root` and each point's `title` are required. Everything else has a default; leave it out
rather than writing the default.

### Tree

| Field | Type | Default | Meaning |
|---|---|---|---|
| `root` | array of points, at least one | — (required) | the main chain |
| `title` | string | `"Untitled tree"` | |
| `direction` | `"LR"` `"TB"` `"RL"` `"BT"` | `"LR"` | flow of the main chain: left → right, top → bottom, … |
| `layout` | `"stacked"` `"packed"` | `"stacked"` | `stacked`: each branch on its own rows; `packed`: compact, good for many leaves per point ([layout](../architecture/layout.md)) |
| `edgeStyle` | `"sides"` `"shortest"` | `"sides"` | lines on fixed sides, or straight between nearest borders |
| `$schema` | string | — | path to the schema, for editor support (see below) |
| `format`, `version` | `"panda-tree"`, `1` | — | written by panda; optional |

### Point

| Field | Type | Default | Meaning |
|---|---|---|---|
| `title` | string | — (required) | shown on the card |
| `kind` | `"point"` `"leaf"` | `"point"` | a leaf ends its chain |
| `content` | string | `""` | plain text under the title; `\n` for a new line |
| `color` | `"#rrggbb"` or `"#rgb"` | `"#ffffff"` | card color |
| `branches` | array of chains (array of arrays of points) | `[]` | each chain starts beside this point |
| `id` | string | generated | stable id; keep it when editing a saved tree, omit it for new points |
| `pin` | `{ "col": number, "row": number }` | — | position set by dragging in the editor, in layout grid units ([0004](../decisions/0004-pins-in-grid-units.md)); usually left out |
| `collapsed` | `true` | — | branches hidden in the editor; omit when false |

Any other field is an error (it is usually a typo: the checker suggests the closest name).

## Rules the schema can't express

1. **A leaf is the last point of its chain.** Nothing can follow it, so two leaves never sit in the
   same array.
2. **A leaf has no branches** (the schema checks this one too; `"branches": []` is allowed).
3. **Every chain has at least one point**: no empty `root`, no `[]` inside `branches`.
4. Ids, when given, are unique. A repeated id is a warning: that point gets a new id.

## Endings: pick by meaning

- **The chain ends here:** make the last point of the array a leaf
  (`{ "kind": "leaf", "title": "Launch" }` as the last item of `root`).
- **A side ending from a point** (one of several outcomes, a paper under a year): give the point a
  branch holding just the leaf, one branch per ending:
  `"branches": [[{ "kind": "leaf", "title": "Go" }], [{ "kind": "leaf", "title": "No-go" }]]`
- **A side path that ends:** a branch with several points, the last one a leaf:
  `[{ "title": "River" }, { "title": "Boat" }, { "kind": "leaf", "title": "Lost at sea" }]`
- Leaves are optional: a chain may also just end on a normal point.

## JSON mistakes the checker catches

Trailing commas, comments, single-quoted strings, line breaks inside a string (use `\n`), a key
repeated in one object, and anything after the closing `}`. Each is reported with its line and
column.

## Check your file

```sh
bun run check tree.json            # one line per problem, then a summary
bun run check tree.json --json     # the same, as JSON, for agents
```

Paths can point anywhere (relative or absolute), and several files can be checked at once.
Exit code 0: panda will open the file as written. 1: fix the reported errors. 2: wrong usage.
Warnings don't fail the check but mean something will be changed on load. Output looks like:

```
tree.json:6:15: error at root[1].kind: leaf "Done" must be the last point of its chain; nothing can follow a leaf (for a side ending, put it in its own branch)
tree.json:5:7: error at root[0].titel: unknown field "titel" (did you mean "title"?); allowed: id, kind, title, content, color, pin, collapsed, branches
tree.json: 2 errors, 0 warnings
```

```
tree.json: ok · "Product launch" · 10 points, 4 leaves, 4 branches
```

`--json` prints a JSON **array**, with one object per file checked (so one file gives an array
of one):

| Field | Meaning |
|---|---|
| `file` | the path as given |
| `ok` | true when there are no errors |
| `title` | the tree's title |
| `stats` | `points` (every point, leaves included), `leaves`, `branches` |
| `diagnostics` | `{ line, col, severity: "error" \| "warning", path, message }` per problem; `path` is like `root[1].branches[0][2].kind` |

## Editor support

Add `"$schema"` with a path to the schema, relative to the file, and VS Code (and other editors)
complete field names and underline mistakes as you type:

```json
{ "$schema": "../src/core/panda-tree.schema.json", "root": [{ "title": "Start" }] }
```

## Editing a saved tree

Files panda saves contain every field, including `id`, `pin` and `collapsed`. When editing one:
keep the `id`s of existing points (that keeps their pins and colors attached), give new points no
`id`, and leave `pin` and `collapsed` alone unless you mean to change them.

## Prompt for an agent

> Write a panda tree as JSON following docs/reference/json-format.md (schema:
> src/core/panda-tree.schema.json): `root` is the main chain, an array of points
> `{ "title": … }`; a point's `branches` is an array of chains (arrays of points); a leaf
> (`"kind": "leaf"`) must be the last point of its chain and has no branches; a side ending is a
> branch holding one leaf. Leave out fields that keep their default. Then run
> `bun run check <file>` and fix every reported error and warning until it says ok.
