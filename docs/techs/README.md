# Techs

**TypeScript in the browser, built with Vite, managed with Bun.** No server: the editor is a
static page and the tree lives in the browser until exported.
Why: [0010](../decisions/0010-bun-vite-react.md).

| Layer | Choice | Version (lockfile) | Used in | Page |
|---|---|---|---|---|
| Package manager, script runner | Bun | 1.4 | everywhere | [bun.md](bun.md) |
| Language | TypeScript, strict, ESM | 5.6.3 | everywhere | — |
| UI | React | 18.3.1 | `App.tsx`, `components/` | — |
| Canvas (pan, zoom, drag, selection, edges) | React Flow (`@xyflow/react`) | 12.12.0 | `App.tsx`, `components/` | [react-flow.md](react-flow.md) |
| Layout | our own grid layout (no library) | — | `model/layout.ts` | [layout](../architecture/layout.md) |
| Dev server, bundler | Vite + `@vitejs/plugin-react` | 5.4.21, 4.7.0 | `vite.config.ts` | — |
| Tests | Vitest | 2.1.9 | `model/model.test.ts` | — |
| Commit messages | husky + commitlint (`config-conventional`) | husky 9, commitlint 21 | `.husky/commit-msg`, `commitlint.config.js` | [bun.md](bun.md) |
| Diagram in the README | Mermaid (rendered by GitHub, not a dependency) | — | `model/exporters.ts` | [readme-export](../reference/readme-export.md) |

Runtime dependencies are only `react`, `react-dom` and `@xyflow/react`. Adding one needs a
reason on its page here.

## Considered, not used (yet)

| Tech | Status | Why |
|---|---|---|
| dagre / ELK.js for layout | not used | a chain-and-branch tree has a simple grid layout; our own keeps pins in grid units and lets us offer modes ([0008](../decisions/0008-react-flow-canvas-own-layout.md)) |
| A hand-written SVG canvas | not used | React Flow gives pan, zoom, drag, box selection and minimap for free |
