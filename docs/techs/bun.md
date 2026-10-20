# Bun

Bun installs packages and runs scripts. **Never npm or pnpm** (the commit hook refuses their
lockfiles, and `settings.json` denies them).

| Use | How |
|---|---|
| Install | `bun install` (lockfile: `bun.lock`), `bun add <pkg>`, `bun add -d <pkg>` |
| Scripts | `bun run dev`, `bun run test`, `bun run typecheck`, `bun run build` |
| CLI | `bun run check <file>` runs `scripts/check.ts` (and `validate.ts`), which import `src/core/` directly; `scripts/tsconfig.json` adds Bun's types only there |
| One-off scripts | `bun some-script.ts` runs TypeScript directly, e.g. to print `toMarkdown(makeTree())` |

## Git hooks

`bun install` runs the `prepare` script (`husky`), which points git at `.husky/`.
`.husky/commit-msg` runs `bunx --no -- commitlint --edit "$1"`: messages must be
Conventional Commits (`commitlint.config.js` extends `@commitlint/config-conventional`).
There is no pre-commit hook; Claude's own commits are also gated by typecheck + tests
(`.claude/hooks/guard-commit.ts`).

## Conventions

- Tests run on **Vitest** through `bun run test`. Plain `bun test` starts Bun's own test
  runner instead, which is not what the project uses.
- Vite is the dev server and bundler, not `Bun.serve`: the React Fast Refresh plugin and
  React Flow's CSS work out of the box there.
