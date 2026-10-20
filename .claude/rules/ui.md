---
paths:
  - "src/App.tsx"
  - "src/components/**"
  - "src/styles.css"
---

# UI (`App.tsx`, `src/components/`)

- `App.tsx` holds state and wiring. Rules about the tree go in `src/model/` with a test.
- React Flow nodes are rebuilt from the tree (`buildNodes`) and kept in a local copy only so a
  drag can move them; the tree changes (as pins) on drag stop. Selection lives in `selectedIds`
  and is copied onto rebuilt nodes; change it with `select()`, not by editing nodes.
- Never call one state setter inside another's updater (StrictMode runs updaters twice).
- Buttons inside a node or a `NodeToolbar` must `stopPropagation` on click, or the click reaches
  the node and re-selects it (the toolbar is a portal, but React events still bubble to the node).
- Controls ([0009](../../docs/decisions/0009-mouse-and-key-controls.md)): left-drag on the pane
  draws a selection box, Shift+click toggles selection, Ctrl+drag moves a point with everything
  forward of it, pan is right/middle drag, Space+drag or scroll. Don't reassign these silently.
- Colors and sizes come from the `:root` tokens in `styles.css`. Node height is fixed (72px);
  the layout spacing in `layout.ts` assumes it.
- Verify every UI change in Chrome with the `browser-test` skill.
