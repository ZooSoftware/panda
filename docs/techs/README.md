# Techs

**TypeScript in the browser, built with Vite, managed with Bun.** No server: the editor is a
static page and the tree lives in the browser until exported.
Why: [0010](../decisions/0010-bun-vite-react.md).

| Layer | Choice | Version (lockfile) | Used in | Page |
|---|---|---|---|---|
| Package manager, script runner | Bun | 1.4 | everywhere | [bun.md](bun.md) |
| Language | TypeScript, strict, ESM | 5.6.3 | everywhere | — |
| UI | React | 18.3.1 | `features/`, `app/` | — |
| Canvas (pan, zoom, drag, selection, edges) | React Flow (`@xyflow/react`) | 12.12.0 | `features/canvas/` | [react-flow.md](react-flow.md) |
| Image export (PNG, JPG, SVG) | html-to-image (pinned: React Flow's docs use this version) | 1.11.11 | `features/image-export/` | [0012](../decisions/0012-image-export-captures-the-canvas.md) |
| Live file sync | File System Access API + IndexedDB (browser built-ins, Chrome/Edge) | — | `features/file-sync/` | [0013](../decisions/0013-live-file-sync-in-the-browser.md) |
| Font | Helvetica, then Arial (draw.io's default diagram font), no web font | — | `app/styles.css` | — |
| Layout | our own grid layout (no library) | — | `core/layout.ts` | [layout](../architecture/layout.md) |
| Dev server, bundler | Vite + `@vitejs/plugin-react` | 5.4.21, 4.7.0 | `vite.config.ts` | — |
| Tests | Vitest | 2.1.9 | `tests/` | — |
| Commit messages | husky + commitlint (`config-conventional`) | husky 9, commitlint 21 | `.husky/commit-msg`, `commitlint.config.js` | [bun.md](bun.md) |
| Diagram in the README | Mermaid (rendered by GitHub, not a dependency) | — | `core/formats.ts` | [readme-export](../reference/readme-export.md) |

Runtime dependencies are only `react`, `react-dom`, `@xyflow/react` and `html-to-image`. Adding one needs a
reason on its page here.

## Considered, not used (yet)

| Tech | Status | Why |
|---|---|---|
| dagre / ELK.js for layout | not used | a chain-and-branch tree has a simple grid layout; our own keeps pins in grid units and lets us offer modes ([0008](../decisions/0008-react-flow-canvas-own-layout.md)) |
| A hand-written SVG canvas | not used | React Flow gives pan, zoom, drag, box selection and minimap for free |
