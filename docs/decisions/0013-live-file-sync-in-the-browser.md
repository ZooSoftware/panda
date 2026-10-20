# 0013. Live file sync runs in the browser (File System Access API)

- **Status:** accepted; JSON files only since [0017](0017-json-is-the-only-file-format.md)
- **Date:** 2026-10-20
- **Where:** "open a md then sync real time with it when I edit"; `src/fileSync.ts`, `src/useFileSync.ts`

## Context

Working locally, the user wants a `.md` file on disk to follow the editor live, e.g. a README in
a repo. Panda has no server ([0010](0010-bun-vite-react.md)). A file watcher on a dev server would
work in every browser but adds a backend and only runs under `bun run dev`.

## Decision

- Use the browser's File System Access API: the user picks a file once (**Open file** or **Save to
  file**); the app keeps the handle.
- App → file: every edit is written 300ms after it stops, as a README (`.md`) or JSON (`.json`),
  by extension.
- File → app: the file's modification time is checked every second; a change made elsewhere is
  read through `importText` and replaces the tree. The tree loaded from the file is never written
  straight back, and our own writes are recognised by their modification time.
- The handle is kept in IndexedDB; after a reload the link resumes, or waits for a **Reconnect**
  click when the browser wants permission again.
- New tree, Import and Load example **stop the sync first**, so they never overwrite the file.

## Consequences

- No server; works on the static build too. Only in Chrome and Edge; other browsers don't show
  the buttons.
- Last write wins: an outside change arriving within 300ms of an edit drops that edit.
- Outside changes are read through the embedded data ([0006](0006-readme-export-is-lossless.md)):
  hand edits to the outline or the pins table are ignored and get regenerated on the next edit.
- Browser tests can't drive the system file picker; they link an origin-private file through the
  dev-only `window.__pandaSync.link`.

## Alternatives considered

- **Dev-server file watcher + WebSocket:** all browsers, but a backend and dev-only.
- **Download on every change:** no live link, files pile up in Downloads.
