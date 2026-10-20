# 0006. The README export is lossless and lists every pin

- **Status:** accepted; "hand edits are not imported" is superseded by [0016](0016-the-outline-is-an-input-format.md)
- **Date:** 2026-10-20
- **Where:** "input and export a diagram as readme"; "all pinning need to be written down in the
  markdown"; `model/exporters.ts`

## Context

The README is the format people read and share, so it should also be a format the editor can
open again. Parsing a human-readable outline back into a tree would be fragile (hand edits,
Markdown variations), and the outline can't carry everything (ids, pins, settings).

## Decision

- The README has a Mermaid diagram, a numbered outline and a **Pins** section listing the view
  settings and every pinned or collapsed point (path, grid position, hidden count). Pinned and
  collapsed points are also flagged in the outline.
- The full tree is embedded at the end as base64 JSON in an HTML comment. Import reads only
  that comment.

## Consequences

- Export → import gives the identical tree (tested).
- Hand edits to the readable parts are ignored on import; a README without the comment can't be
  imported.

## Alternatives considered

- **Parse the outline back:** fragile, and loses ids, pins and settings.
- **JSON in a fenced code block:** visible clutter on GitHub; base64 in a comment is invisible
  and can't break the comment with `-->`.
