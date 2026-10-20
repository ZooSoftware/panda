# Editor (`App.tsx`, `src/components/`)

## State

| State | Where | Notes |
|---|---|---|
| `tree` | `useState` in `Editor` | the only state that is saved |
| `selectedIds` | `useState` | copied onto nodes when they are rebuilt; change with `select()` |
| `nodes` | local copy of `buildNodes(tree)` | exists so React Flow can move nodes during a drag |
| `follow` | ref | Ctrl+drag: start positions of the points that follow the dragged one |

`buildNodes` lays out the visible points and passes each node its point, direction, layout
mode, capabilities, descendant count and leaf count. `buildEdges` makes chain edges (solid) and
branch edges (dashed), as `smoothstep` or `floating` depending on the line style.

## Gestures

| Gesture | Result |
|---|---|
| click a point | select it; its quick actions show above it and the inspector opens |
| Shift+click | add/remove a point from the selection |
| left-drag on empty canvas | selection box (partial overlap counts) |
| drag a point | moves it (and the rest of the selection); pins every moved point |
| Ctrl+drag a point | also moves everything forward of it (`forwardIds`); pins them all |
| right/middle drag, Space+drag, scroll | pan; Ctrl+scroll or pinch zooms |
| ▾ / ▸ +N on a point | collapse / expand its branches |
| Delete | remove the selected point (one selected only); Escape clears the selection |

A drag shorter than 3px doesn't pin (a click can register as a zero-length drag).
Why these keys: [0009](../decisions/0009-mouse-and-key-controls.md).

## Node card

Title (cut with "…"), up to two lines of content (one when the badge row is shown), 📌 at the
top right when pinned (click to unpin), and on points with branches a bottom row with
`🍃 N` (leaf count) on the left and the collapse toggle on the right. Leaves are pill-shaped
with a dashed border.

## Control panel (`ControlPanel.tsx`)

The tree title plus three groups of controls:

| Group | Controls |
|---|---|
| File | New tree · Import JSON or README · Export JSON · Export README · Export image (PNG, JPG, SVG) |
| View | Rotate · Fit · Direction · Lines · Layout · Panel position · Theme |
| Arrange | Collapse all / Expand all · Unpin all · a one-line controls hint |

The panel can sit on any side (**default left**). On the left or right the groups are **tabs**;
on the top or bottom they are a **menu bar** whose menus open on hover (or keyboard focus) and
open upward at the bottom. Inside a menu, a button click or a select change drops focus so the
menu closes once the pointer leaves.

The point panel (inspector, or the multi-selection panel) sits **opposite** a side panel: right
when the panel is left, top or bottom; left when the panel is right. Under 720px wide, a side
panel becomes a block above the canvas.

The panel position, the last tab and the theme are per-browser preferences in
`localStorage['panda-ui']`, not part of the tree
([0011](../decisions/0011-ui-preferences-stay-in-the-browser.md)).

## Theme

**System** (default), **Light** or **Dark**. Colors are CSS tokens on `:root`; dark values apply
under `[data-theme='dark']`, or under `prefers-color-scheme: dark` when the theme is System (no
attribute). React Flow gets the same value as `colorMode`. Point cards keep the user's colors in
both themes, so their text and badges use fixed dark `--node-*` tokens.

## Image export (`src/exportImage.ts`)

PNG, JPG or SVG of the **whole diagram as drawn now**: the React Flow viewport is captured with a
transform that frames every rendered node at scale 1, with 40px padding and the theme's
background. Collapsed branches stay hidden, pins and line style stay as they are, selection
outlines are hidden during the capture (`.exporting`). PNG and JPG are rendered at 2× (less if a
side would pass 16000px). Why: [0012](../decisions/0012-image-export-captures-the-canvas.md).

## Live file sync (`src/fileSync.ts`, `src/useFileSync.ts`)

**Open file (live sync)** links an existing `.md`/`.json` and loads it; **Save to file (live
sync)** writes the current tree to a new file and links it. While linked, the File group shows
the file, its state (synced at …, saving, Reconnect, error) and **Stop sync**, and a 🔗 chip sits
next to the title.

| Direction | How |
|---|---|
| App → file | 300ms after the last edit, `serializeFor(name, tree)` (README for `.md`, JSON for `.json`) is written if it differs from what the file holds |
| File → app | every second, if the file's `lastModified` changed and its text isn't what the app would write, `importText` loads it |
| Reload | the handle is stored in IndexedDB (`panda` / `handles`); relinked at startup, or **Reconnect** if permission must be asked again |

New tree and Import call `stop()` before replacing the tree. Chrome and Edge only.
Why: [0013](../decisions/0013-live-file-sync-in-the-browser.md).

## Persistence

Every change is written to `localStorage['panda-tree']` as the export JSON. On load the app
reads it through `importText`, so stored trees get the same validation and defaults as imported
files; with nothing stored (or unreadable data) it starts a new tree with one point.
