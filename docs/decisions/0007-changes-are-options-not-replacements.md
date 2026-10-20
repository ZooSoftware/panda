# 0007. Changes are options, not replacements

- **Status:** accepted
- **Date:** 2026-10-20
- **Where:** user feedback after the packed layout replaced the original one ("we just cannot
  update layout when seeing a problem like that… keep one or make some options");
  `Tree.layout`, `Tree.edgeStyle`

## Context

The literature review exposed that the original layout grows very tall. The layout was rewritten
on the spot to fix it, which also changed how every existing tree looked. The user objected:
seeing a problem is not a reason to replace a behaviour they already rely on.

## Decision

- When a shipped behaviour shows a problem, **add an option** next to it instead of replacing it.
- The option is a tree setting, and **missing means the old behaviour**, so every saved tree opens
  exactly as before.
- If a change can't be an option (it changes what a saved tree means), ask the user first.

## Consequences

- Layout is `stacked` (original, default) or `packed`; lines are `sides` (original) or `shortest`.
- More settings to carry: each needs an import default, a toolbar control and a line in the
  README's Pins section.
- Old behaviour stays tested.

## Alternatives considered

- **Replace and tell the user:** what happened first; rejected by the user.
- **Global preferences outside the tree:** a tree would look different on another machine.
