# 0016. The outline is an input format; an edited outline wins

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** "make the project friendly to AI: other agents generate a md based on our rules";
  supersedes "hand edits are not imported" in [0006](0006-readme-export-is-lossless.md) and
  [0013](0013-live-file-sync-in-the-browser.md); `core/outline.ts`, `core/formats.ts`, `scripts/check.ts`

## Context

Only the embedded base64 data could be imported, which no person or agent can write by hand, and
outline edits in a live-synced file were silently ignored. To let other agents produce trees, there
had to be a text format they can write, rules they can follow, and a way to check their output.

## Decision

- The README's numbered-list **outline is an input format**, specified in
  [outline-format.md](../reference/outline-format.md). Export writes it; import reads it.
- Import order: JSON → outline. With embedded data present, an outline that matches it (same
  titles, kinds, content and nesting) loads the embedded tree unchanged; an outline that differs
  loads the outline and keeps ids, colors, pins and collapsed state for points at the same
  **title path**. A broken outline falls back to the embedded tree, and its errors are reported.
- Settings may be given in front matter (`direction`, `layout`, `lines`); colors as `{#hex}`.
  Pins and collapsed state can't be written by hand.
- `bun run check <file>` runs exactly the app's reading (`analyzeText`) and reports every problem
  as `file:line: severity: message`; `--json` for agents; exit 1 on errors.
- The parser follows GitHub's nesting rule (a nested list starts at or right of its parent's
  text), so what renders nested on GitHub is nested in panda.

## Consequences

- Agents (and people) can write or edit trees as plain Markdown and verify them before opening.
- Live sync now picks up outline edits made in a text editor or by an agent.
- Matching by title path is simple but loses pins and colors of renamed or moved points.
- Content lines that look like list items are escaped on export, a small change to the README.

## Alternatives considered

- **A separate DSL** (like Mermaid or spider's `.spd`): one more syntax to learn, and the README
  would still need the outline for readers.
- **Ids in the outline** (`1. **Title** {id=x}`): exact matching, but noisy for readers and easy
  for agents to get wrong.
- **JSON only for agents:** precise but verbose, and not readable on GitHub.
