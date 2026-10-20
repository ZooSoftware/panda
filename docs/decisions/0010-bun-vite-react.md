# 0010. Bun, Vite and React; no server

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** first build ("use bun for me"); `package.json`, `vite.config.ts`

## Context

The first target is a web editor for one person, where trees are files to import and export.

## Decision

- Bun is the package manager and script runner; never npm or pnpm.
- Vite serves and bundles the React app; Vitest runs the tests.
- No backend: the tree lives in `localStorage` until exported.

## Consequences

- Nothing to deploy beyond static files (`bun run build` → `dist/`).
- No sharing or sync between devices except through exported files.

## Alternatives considered

- **`Bun.serve` + Bun's bundler:** fine, but Vite's React plugin and ecosystem are smoother for a
  React Flow app.
- **A backend with accounts:** not needed yet; see the roadmap.
