# Claude Code setup for panda

| What | Where | Loaded |
|---|---|---|
| Project facts, invariants, commands | `../CLAUDE.md` | every session |
| Core rules | `rules/core.md` | when `src/core/**` is touched |
| UI rules | `rules/ui.md` | when `src/app/**`, `src/features/**` or `src/shared/**` is touched |
| `ship-feature` skill | the loop: check → implement → test → browser → docs → commit → report | on demand |
| `browser-test` skill | drive the editor in Chrome, backing up and restoring the user's tree | on demand |
| commit guard hook | `hooks/guard-commit.ts`: before `git commit`, typecheck + tests must pass and no `dist/` or npm/pnpm lockfile may be staged | every Bash call (fast exit unless it is a commit) |
| git `commit-msg` hook (husky) | `../.husky/commit-msg`: commitlint, Conventional Commits; applies to the user's commits too | every commit |
| permissions | `settings.json`: Bun and read-only git allowed; `git push`, npm and pnpm denied | every session |

Ideas not set up (yet):
- PostToolUse typecheck after every edit: skipped, too noisy while a change spans files.
- A `visual-check` skill that renders the examples to PNG for review: needs a headless render first.
- Agents: the project is small enough that one session holds all of it.
