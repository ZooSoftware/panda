# Architecture

One Vite + React app with a **pure core** underneath and **feature folders** on top
([0015](../decisions/0015-feature-folders-and-a-pure-core.md)). The core (`src/core/`) knows
nothing about React or the browser; each feature (`src/features/*`) owns one job; `src/app/`
puts them together.

| Page | Covers |
|---|---|
| [model.md](model.md) | the tree types, editing operations, queries, import validation (`core/tree.ts`) |
| [layout.md](layout.md) | grid layout (stacked, packed), directions, pins, collapsed branches (`core/layout.ts`) |
| [editor.md](editor.md) | the features: editing, canvas, panels, theme, image export, file sync |

Formats (saved JSON, README export) are in [reference/](../reference/README.md).

## Modules

```
src/
  core/                                    pure: no React, no DOM, no packages
    tree.ts        types · edits · capabilities · queries (visiblePoints, counts) · parseTree
    layout.ts      layoutGrid (stacked | packed) · toPixels / toPin · nextDirection
    formats.ts     toJSON · toMarkdown (Mermaid, outline, pins, embedded data) · importText
  shared/
    download.ts    saveUrl · download · slug
  features/
    editor/        useTreeEditor: tree + selection, edit actions, saving to the browser, keys
    canvas/        Canvas · PointNode · FloatingEdge · buildFlow (tree → nodes/edges) · useFit
    inspector/     Inspector (one point) · SelectionPanel (several)
    panel/         ControlPanel: groups as tabs on a side, hover menus on top/bottom
    file-sync/     fileSync (API, IndexedDB) · useFileSync · FileSyncControls / SyncChip
    image-export/  exportImage (html-to-image) · useImageExport · ImageExportButtons
  app/
    App.tsx        composition only: wires features together with props and slots
    usePreferences.ts · FileGroup / ViewGroup / ArrangeGroup · main.tsx · styles.css
tests/                                     outside src/, mirroring it
  core/            tree.test.ts · layout.test.ts · formats.test.ts
  fixtures.ts      trees shared by the tests
  architecture.test.ts
```

## Boundaries

| Layer | May import | Why |
|---|---|---|
| `core/` | `core/` only, no packages | pure and testable without a browser |
| `shared/` | `core/`, `shared/` | small helpers with no feature knowledge |
| `features/x/` | `core/`, `shared/`, `features/x/` | a feature can be read, changed or removed on its own |
| `app/` | anything | composition: the only place features meet |

Enforced by `tests/architecture.test.ts`, which reads every import in `src/`. When one feature needs
another (the File group shows sync controls and image buttons), `app/` passes a component in as a
prop ("slot") instead of the feature importing it.

## Data flow

```
             ┌──────────────── edits (add, delete, rename, collapse, pin) ────────────────┐
             ▼                                                                             │
  Tree (useTreeEditor) ──layoutGrid──► grid cells ──toPixels──► React Flow nodes ──► canvas │
     ▲      │                                ▲                          │                  │
     │      │                          pin ?? auto cell                 └── drag stop ─────┘
     │      ├──► localStorage['panda-tree']   (every change)                 (toPin → setPins)
     │      └──► toJSON / toMarkdown          (export buttons)
     └────────── importText                    (Import button, or storage on load)
```

- The **tree is the only state that matters**. React Flow's nodes are rebuilt from it after
  every change; a local copy only exists so a drag can move nodes before the tree is updated.
- Every edit is a pure function `tree → tree` from `src/core/tree.ts`.
