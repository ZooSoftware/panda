---
paths:
  - "src/app/**"
  - "src/features/**"
  - "src/shared/**"
---

# UI (`src/app/`, `src/features/`)

- Each feature lives in `src/features/<name>/` and imports only `core/`, `shared/` and itself;
  `app/` composes features with props and slots (`tests/architecture.test.ts` enforces it,
  [0015](../../docs/decisions/0015-feature-folders-and-a-pure-core.md)). `app/App.tsx` only wires;
  logic goes into a feature, rules about the tree into `src/core/` with a test.
- Tree state and selection live in `useTreeEditor`; change the tree through its `actions`,
  `edit` or `replace`. The canvas mirrors `selectedIds` onto its nodes.
- React Flow nodes are rebuilt from the tree (`buildNodes`) and kept in a local copy in `Canvas`
  only so a drag can move them; the tree changes (as pins) on drag stop.
- Never call one state setter inside another's updater (StrictMode runs updaters twice).
- Buttons inside a node or a `NodeToolbar` must `stopPropagation` on click, or the click reaches
  the node and re-selects it (the toolbar is a portal, but React events still bubble to the node).
- Controls ([0009](../../docs/decisions/0009-mouse-and-key-controls.md)): left-drag on the pane
  draws a selection box, Shift+click toggles selection, Ctrl+drag moves a point with everything
  forward of it, pan is right/middle drag, Space+drag or scroll. Don't reassign these silently.
- Colors and sizes come from the `:root` tokens in `app/styles.css`; every new color needs a dark
  value too (both the `[data-theme='dark']` block and the `prefers-color-scheme` block). Inside
  point cards use the fixed `--node-*` tokens: cards keep the user's light colors in both themes.
  Node height is fixed (72px); the layout spacing in `layout.ts` assumes it.
- Editor-chrome settings (panel position, tabs) go into `UiPrefs` / `localStorage['panda-ui']`,
  never into the tree ([0011](../../docs/decisions/0011-ui-preferences-stay-in-the-browser.md)).
  New controls go into one of the three panel groups (File, View, Arrange), not a new group.
- Verify every UI change in Chrome with the `browser-test` skill.
