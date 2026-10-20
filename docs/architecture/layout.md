# Layout (`src/core/layout.ts`)

Layout happens on a **grid**: `col` runs along a chain, `row` runs across it. A point at
`(c, r)` has its next point at `(c + 1, r)`, and each of its branches starts at `(c + 1, R)`
with `R > r`. Only `toPixels` and `toPin` know about pixels and directions.

Collapsed branches take no space in either mode (`visibleBranches`).

## Modes

The mode is a per-tree setting (`tree.layout`). Both stay; a new idea becomes a new mode
([0007](../decisions/0007-changes-are-options-not-replacements.md)).

| Mode | How rows are chosen | Good for | Cost |
|---|---|---|---|
| `stacked` (default) | every branch gets its own band of rows below its chain; later points take the nearer rows, so a connector from an earlier point never crosses another branch | small trees, reading order | grows tall: 60 single-leaf branches → ~70 rows |
| `packed` | a branch goes into the nearest rows where it hits no node and shares no **lane** with another point's connector | many short branches (the literature review: 60 papers in 6 rows) | a point's branches sit under the next point of its chain |

**Lanes** (packed only): a branch connector leaves the point's forward side near the corner and
runs down the gap between column `c` and `c + 1`. The packer tracks which point owns each lane
cell; two points may not share one, so their lines never merge. Chain edges also claim the lane
cell they cross. Branch shapes are packed recursively and treated as rigid.

The node handles follow the mode (`STACKED_SIDES` / `PACKED_SIDES` in `PointNode.tsx`):
stacked lines leave the side facing the branches, packed lines leave the forward side at 85%.

## Directions

`toPixels(cell, direction)` maps grid cells to pixels; `toPin` is its inverse.

| Direction | x | y | Spacing (main × cross) |
|---|---|---|---|
| `LR` | `col` | `row` | 260 × 140 |
| `RL` | `−col` | `row` | 260 × 140 |
| `TB` | `row` | `col` | 150 × 250 |
| `BT` | `row` | `−col` | 150 × 250 |

Spacing assumes the fixed node size (200 × 72). **Rotate** cycles LR → TB → RL → BT.

## Pins

A pin is a grid position (fractional), stored on the point
([0004](../decisions/0004-pins-in-grid-units.md)). A pinned point is drawn at its pin
instead of its auto cell; the auto layout doesn't make room for it. Because pins are grid units,
they rotate with the tree.
