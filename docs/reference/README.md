# Reference

Exact formats. Each page must change in the same commit as the code it describes.

| Page | Source of truth in code |
|---|---|
| [json-format.md](json-format.md): a saved tree (export JSON, `localStorage`) | `core/tree.ts` (`Tree`, `parseTree`), `core/formats.ts` (`toJSON`) |
| [outline-format.md](outline-format.md): writing a tree by hand or with an AI agent, and `bun run check` | `core/outline.ts` (`parseOutline`), `core/formats.ts` (`analyzeText`), `scripts/check.ts` |
| [readme-export.md](readme-export.md): the README export | `core/formats.ts` (`toMarkdown`, `toMermaid`, `toOutline`, `toPins`, `importText`) |

Format changes are **additive only**: a new field is optional on import and defaults to the old
behaviour, so every file saved before still opens the same.
