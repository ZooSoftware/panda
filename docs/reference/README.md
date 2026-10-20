# Reference

Exact formats. Each page must change in the same commit as the code it describes.

| Page | Source of truth in code |
|---|---|
| [json-format.md](json-format.md): a saved tree (export JSON, `localStorage`) | `model/tree.ts` (`Tree`, `parseTree`), `model/exporters.ts` (`toJSON`) |
| [readme-export.md](readme-export.md): the README export | `model/exporters.ts` (`toMarkdown`, `toMermaid`, `toOutline`, `toPins`, `importText`) |

Format changes are **additive only**: a new field is optional on import and defaults to the old
behaviour, so every file saved before still opens the same.
