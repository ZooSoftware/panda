# Architecture

One Vite + React app with a **pure model** underneath. The model (`src/model/`) knows nothing
about React or the browser; the UI (`App.tsx`, `src/components/`) turns it into React Flow
nodes and turns user gestures back into model operations.

| Page | Covers |
|---|---|
| [model.md](model.md) | the tree types, editing operations, counts, import validation |
| [layout.md](layout.md) | grid layout (stacked, packed), directions, pins, collapsed branches |
| [editor.md](editor.md) | state, selection, dragging and pinning, the toolbar, persistence |

Formats (saved JSON, README export) are in [reference/](../reference/README.md).

## Modules

```
src/
  model/                                   pure: no React, no DOM, no storage
    tree.ts        types · edits · capabilities · counts · parseTree
    layout.ts      layoutGrid (stacked | packed) · toPixels / toPin · nextDirection
    exporters.ts   toJSON · toMarkdown (Mermaid, outline, pins, embedded data) · importText
    model.test.ts
  components/
    ControlPanel.tsx the app's controls in groups: tabs on a side, hover menus on top/bottom
    PointNode.tsx    the node card: title, content, badges, quick-action toolbar, handles
    Inspector.tsx    side panel for one selected point
    FloatingEdge.tsx straight edge between nearest borders ("shortest path" lines)
  examples/ · sample.ts                    example trees
  exportImage.ts                           PNG/JPG/SVG capture of the canvas
  fileSync.ts · useFileSync.ts             live link to a file on disk (File System Access API)
  App.tsx                                  state + wiring
```

Dependencies point one way: `App.tsx` → `components/` → `model/`. Nothing in `model/` imports
from outside it.

## Data flow

```
             ┌──────────────── edits (add, delete, rename, collapse, pin) ────────────────┐
             ▼                                                                             │
  Tree (state in App) ──layoutGrid──► grid cells ──toPixels──► React Flow nodes ──► canvas │
     ▲      │                                ▲                          │                  │
     │      │                          pin ?? auto cell                 └── drag stop ─────┘
     │      ├──► localStorage['panda-tree']   (every change)                 (toPin → setPins)
     │      └──► toJSON / toMarkdown          (export buttons)
     └────────── importText                    (Import button, or storage on load)
```

- The **tree is the only state that matters**. React Flow's nodes are rebuilt from it after
  every change; a local copy only exists so a drag can move nodes before the tree is updated.
- Every edit is a pure function `tree → tree` from `src/model/tree.ts`.
