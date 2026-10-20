# 0015. Feature folders on top of a pure core

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the architecture cleanup after the prototype; `src/core/`, `src/features/`, `src/app/`,
  `tests/`

## Context

The prototype grew one request at a time: panel, themes, image export, file sync. `App.tsx` had
reached 647 of 2,200 lines and held the tree state, selection, drag and pin logic, preferences,
file sync wiring, image export and every panel group. The choice was between folders by type
(`components/`, `hooks/`, `services/`) and folders by feature.

## Decision

- **`core/`**: the tree, layout and formats. Pure TypeScript, no packages, tested on its own. It
  is shared by every feature, so it is not a feature.
- **`features/<name>/`**: one folder per feature (editor, canvas, inspector, panel, file-sync,
  image-export) holding its components, hooks and logic together. A feature imports `core/`,
  `shared/` and itself, **never another feature**.
- **`shared/`**: small helpers with no feature knowledge (download, slug).
- **`app/`**: composition only. It is the one place features meet, through props and slots.
- Tests live in a top-level `tests/` folder that mirrors `src/`, so `src/` holds only app code.
- `tests/architecture.test.ts` reads every import in `src/` and fails on a violation.
- Not the full Feature-Sliced Design method: its six layers are too many for this size.

## Consequences

- A feature can be read, changed or removed in one folder; each request so far maps to one.
- Cross-feature needs go through `app/` (the File group gets sync controls and image buttons as
  slots), which costs some prop passing.
- `App.tsx` is 165 lines; the largest file is 170.

## Alternatives considered

- **Folders by type (components / hooks / services):** one feature spreads over three or four
  folders, and `components/` becomes a catch-all as the app grows.
- **Keep one `App.tsx`:** the file already mixed six concerns.
