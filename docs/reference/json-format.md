# Saved tree (JSON)

The Export JSON file and the copy in `localStorage['panda-tree']` are the same format.
Written by `toJSON`, read by `importText` → `parseTree`.

```json
{
  "format": "panda-tree",
  "version": 1,
  "title": "Learn web development",
  "direction": "LR",
  "edgeStyle": "sides",
  "layout": "stacked",
  "root": [
    { "id": "k3f9a1b2", "kind": "point", "title": "Start", "content": "Pick a goal.",
      "color": "#fde68a", "pin": { "col": 0.4, "row": -1.2 }, "branches": [] },
    { "id": "p0q8r7s6", "kind": "point", "title": "HTML & CSS", "content": "", "color": "#ffffff",
      "collapsed": true,
      "branches": [
        [ { "id": "z1y2x3w4", "kind": "leaf", "title": "Landing page", "content": "",
            "color": "#bbf7d0", "branches": [] } ]
      ] }
  ]
}
```

## Tree

| Field | Type | Default when missing | Notes |
|---|---|---|---|
| `format`, `version` | `"panda-tree"`, `1` | — | written on export, ignored on import |
| `title` | string | `"Untitled tree"` | |
| `direction` | `LR` `TB` `RL` `BT` | `LR` | flow of the main chain |
| `edgeStyle` | `sides` `shortest` | `sides` | lines on fixed sides, or straight between nearest borders |
| `layout` | `stacked` `packed` | `stacked` | see [layout](../architecture/layout.md) |
| `root` | `Point[]` | — (required, non-empty) | the main chain |

## Point

| Field | Type | Default when missing | Notes |
|---|---|---|---|
| `id` | string | a fresh id | duplicates get a fresh id |
| `kind` | `point` `leaf` | `point` | a leaf must be last in its chain and have no branches |
| `title`, `content` | string | `""` | content is plain text, newlines kept |
| `color` | CSS color string | `#ffffff` | |
| `pin` | `{ col, row }` numbers | not pinned | grid units: `col` along the chain, `row` across ([0004](../decisions/0004-pins-in-grid-units.md)) |
| `collapsed` | `true` | not collapsed | only kept when the point has branches |
| `branches` | `Point[][]` | `[]` | each branch is a non-empty chain |

## Errors

`parseTree` throws a `TreeFormatError` naming the path, e.g.
`root[1].branches[0][0] is a leaf but is not last in its chain`. The editor shows it as
"Import failed: …" and keeps the current tree.
