# Reference

Exact formats. Each page must change in the same commit as the code it describes.

| Page | Source of truth in code |
|---|---|
| [json-format.md](json-format.md): **the** tree file: fields, rules, writing one by hand or with an AI agent, `bun run check` | `core/panda-tree.schema.json`, `core/tree.ts` (`parseTree`), `core/formats.ts` (`toJSON`), `scripts/validate.ts` |
| [readme-export.md](readme-export.md): the README export, a view for GitHub (one-way) | `core/formats.ts` (`toMarkdown`, `toMermaid`, `toOutline`, `toPins`) |

Format changes are **additive only**: a new field is optional on import and defaults to the old
behaviour, so every file saved before still opens the same. A field change updates the schema,
`parseTree`, `toJSON` and `json-format.md` together; a test checks that every saved tree passes
the schema.
