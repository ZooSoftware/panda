# 0017. JSON is the only file format, checked by a JSON Schema

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** user review of the outline format ("the readme is not good for the one has syntax
  like that… just use JSON and JSON Schema to check"); supersedes
  [0016](0016-the-outline-is-an-input-format.md) and the README import of
  [0006](0006-readme-export-is-lossless.md); `src/core/panda-tree.schema.json`, `scripts/validate.ts`

## Context

The Markdown outline worked for AI agents, but only by counting indentation columns, `- ⎇`
lines and escapes: a syntax that is easy to get subtly wrong and hard to explain. Panda read three
formats (JSON, README with embedded data, outline) and needed a title-path merge to reconcile
them. JSON already carried everything (ids, pins, colors, settings) and models write it reliably.

## Decision

- A tree file is **JSON only**. Import, live sync, browser storage and the checker read JSON;
  Markdown is refused with a clear message.
- **`src/core/panda-tree.schema.json`** (JSON Schema 2020-12) is the contract: required fields,
  allowed values, color format, no unknown fields, a leaf has no branches.
- **`bun run check`** works like a compiler: its own JSON parser for syntax errors with line and
  column (trailing commas, comments, quotes), then the schema (Ajv), then the rules a schema
  can't express (a leaf is last in its chain; duplicate ids), all reported in one pass with plain
  messages and the path in the tree. Passing it guarantees the app opens the file; the app's own
  import stays lenient (defaults for missing fields), so it never rejects a checked file.
- The **README export stays, as a one-way view** (Mermaid, outline, pins table), without the
  embedded data. Panda can't open it.
- The one existing README (`example/test.md`) was converted to JSON once; README import is gone.

## Consequences

- One format, one contract; the outline parser and the merge (about 400 lines) are removed.
- Editors validate and complete files through `$schema`; agents read the schema or the guide.
- Hand-editing nested JSON (`branches` is an array of arrays) is less pleasant than an outline;
  people edit in panda, agents write JSON.
- Ajv is a dev dependency used only by the checker, so the app bundle doesn't grow.
- The schema must change together with `parseTree` and `toJSON`; a test checks every saved tree
  passes it.

## Alternatives considered

- **Keep the outline as a second input format:** two syntaxes and the merge to maintain.
- **Validate in the app with Ajv too:** stricter import, but a bigger bundle and old files with
  extra fields would stop opening.
