# Model (`src/core/tree.ts`)

## Types

```ts
type Chain = Point[];                        // prev/next = array position (0001)
interface Point {
  id: string; kind: 'point' | 'leaf';
  title: string; content: string; color: string;
  pin?: { col: number; row: number };        // grid units (0004)
  collapsed?: boolean;                       // branches hidden in the view
  branches: Chain[];
}
interface Tree {
  title: string;
  direction: 'LR' | 'TB' | 'RL' | 'BT';
  edgeStyle: 'sides' | 'shortest';
  layout: 'stacked' | 'packed';
  root: Chain;
}
```

The root chain always has at least one point. A branch is never empty: removing its last point
removes the branch.

## Editing operations

All return a new tree; the input is never changed (tested). Operations that create a point
return `[tree, newId]` (`newId` is `null` when the operation isn't allowed).

| Operation | Does | Allowed when |
|---|---|---|
| `addNext` | insert a point right after this one in its chain | not a leaf |
| `addBranch` | new branch starting with a sub point | not a leaf |
| `addLeaf` | new branch that is a single leaf; any number per point | not a leaf |
| `reopen` | turn a leaf back into a point | a leaf |
| `removePoint` | remove the point and all its branches; neighbours re-link | not the only root point |
| `updatePoint` | title, content, color | always |
| `setPin`, `setPins`, `clearPins` | pin one, many, or clear all | always |
| `setCollapsed`, `setAllCollapsed` | hide/show branches of one point, or of all | point has branches |

`addBranch` and `addLeaf` also un-collapse the owner so the new point is visible.
`capabilities(tree, id)` answers "allowed when" for the UI, so buttons and operations share
one rule.

## Queries

| Function | Returns |
|---|---|
| `findPoint` | the point, its chain, its index and the point that owns the chain (or `null` for root) |
| `forwardIds` | the point, every later point in its chain, and all their branches (Ctrl+drag) |
| `visibleBranches` | the branches shown: none while collapsed |
| `countDescendants` | points inside a point's branches, any depth (the `▸ +N` badge) |
| `countLeaves` | leaves inside a point's branches, any depth; not its own chain (the `🍃 N` badge) |
| `hasExpanded` | whether any point still shows its branches (Collapse all / Expand all) |

## Import validation

`parseTree(data)` checks an imported object and fills defaults for anything missing, so files
from older versions load ([reference](../reference/json-format.md)). It throws a
`TreeFormatError` with a path (`root[2].branches[0][1]`) for: an empty chain, an unknown
`kind`/`direction`/`edgeStyle`/`layout`, a leaf that isn't last in its chain, or a leaf with
branches. Duplicate or missing ids get fresh ones.
