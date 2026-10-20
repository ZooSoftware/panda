---
name: ship-feature
description: The working loop for a panda feature or fix - check it against the rules, implement, test, verify in the browser, update docs, commit, report. Use when the user asks for a new feature or a fix in the editor.
---

# Ship a feature

1. **Read** the request and the relevant docs (`docs/architecture/`, the decisions it touches).
   **Options check** ([0007](../../../docs/decisions/0007-changes-are-options-not-replacements.md)):
   does this replace a behaviour the user already has? Then make it an option that defaults to
   the old behaviour, or ask the user first. If the request is ambiguous in a way that changes
   what you build, ask.
2. **Implement**: tree rules in `src/model/` (pure, with a test), wiring in `App.tsx`, display in
   `src/components/`. New file fields are optional with the old default.
3. **Test**: `bun run typecheck && bun run test`. Check the exit status, not a piped `tail`.
4. **Verify for real** with the `browser-test` skill (back up and restore the user's tree).
   A bug found here gets fixed and a regression test.
5. **Docs**: update `docs/architecture/` if behaviour changed, `docs/reference/` if a format
   changed, a new `docs/decisions/` record for a lasting choice, `docs/roadmap.md` (move the item
   to Done, add follow-ups to Later).
6. **Commit** only when the user asks. Stage explicit paths; never `dist/`. The message is a
   Conventional Commit (`feat: …`, `fix: …`, `docs: …`); commitlint rejects anything else.
7. **Report**: what changed, how it was verified, anything not verified, and decisions that are
   the user's.
