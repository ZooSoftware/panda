# 0011. UI preferences stay in the browser, not in the tree

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the movable control panel request; `App.tsx` (`UiPrefs`, `localStorage['panda-ui']`)

## Context

The control panel can now sit on any side, and it remembers the last tab. View state that
arranges the tree is saved with the tree ([0005](0005-view-state-saved-with-the-tree.md)); the
question was whether the panel position belongs there too.

## Decision

- Settings about **how the tree is drawn** (direction, lines, layout, pins, collapsed) belong to
  the tree and travel with exports.
- Settings about **the editor around it** (panel position, last tab) are per-browser
  preferences in `localStorage['panda-ui']`, read with defaults (`left`, `file`) when missing or
  broken. They are never exported.

## Consequences

- Opening someone's exported tree doesn't move your panel.
- A new editor-chrome setting goes into `UiPrefs`, not into `Tree` or the file format.

## Alternatives considered

- **Save the panel position in the tree:** every shared file would rearrange the reader's editor.
