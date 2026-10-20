# 0012. Image export captures the canvas as drawn

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** the export image request ("capture the whole one with current state… not capture
  the normalize"); `src/exportImage.ts`

## Context

An image should show the tree the way the user arranged it: collapsed branches hidden, pinned
points where they were dropped, the chosen line style and theme. Re-running the layout for the
export (a "normalized" picture) would lose that, and the user said so explicitly.

## Decision

- Export captures the rendered React Flow viewport (html-to-image), framed around every rendered
  node at scale 1, whatever the current zoom and scroll are.
- Formats: PNG and JPG (2× resolution, capped so no side passes 16000px) and SVG.
- Selection outlines and the node toolbar are left out; the theme background is included.

## Consequences

- What you see is what you export; no second renderer to keep in sync.
- The SVG wraps HTML in a `foreignObject`: browsers show it correctly, some editors
  (Inkscape, Illustrator) don't. A pure-SVG export would need its own renderer.
- Export depends on the DOM, so it is tested in the browser, not in `model.test.ts`.

## Alternatives considered

- **Draw our own SVG from the tree and layout:** clean vector output, but a second renderer for
  cards, badges and both line styles.
- **Capture only the visible viewport:** misses anything scrolled off screen.
