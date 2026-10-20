# Panda docs

Panda is a web editor for **tree diagrams made of chains and branches**. These docs are the
source of truth for what panda is, how it is built and why. There is no user guide yet.

> **The most important rule: options, not replacements**
> ([0007](decisions/0007-changes-are-options-not-replacements.md)). When a behaviour the user
> already has shows a problem, add an option next to it; never swap it out silently.

| Folder | Answers | Start with |
|---|---|---|
| [architecture/](architecture/README.md) | How is the code structured, and how does data flow through it? | the module map |
| [reference/](reference/README.md) | What exactly is in a saved tree and in a README export? | [json-format](reference/json-format.md) |
| [techs/](techs/README.md) | What do we build with, and how do we use each piece? | the stack table |
| [decisions/](decisions/README.md) | Why is it this way? One record per decision, with the alternatives | the index |
| [roadmap.md](roadmap.md) | What is done, what is next, what is still open? | — |

## Where a new fact goes

- A **decision** that shapes the project (a rule, a trade-off, a format choice): a new record
  in `decisions/` (copy the [template](decisions/template.md)). Never edit an accepted record's
  decision; supersede it with a new one.
- How something **works** today: the matching page in `architecture/`.
- A **format** change (saved JSON, README export): `reference/`, in the same commit as the code.
- A new **dependency** or a change in how we use one: `techs/`.
- An **open question** or a "later" item: `roadmap.md`.
- A rule for whoever edits the code (human or AI): `CLAUDE.md` / `.claude/rules/`, linking to
  the decision behind it.

Docs describe the code as it is. If they disagree, the code wins and the doc is a bug.

---

## The idea

A tree diagram where **sequence** and **divergence** are different things:

- A **chain** is a sequence: A → B → C. Each point has a previous and a next.
- Any point can grow a **branch**: another chain that starts beside it. Points on a branch are
  sub-points, and they can grow branches of their own.
- A **leaf** ends a chain. A point can also grow leaves directly, as many as it needs.
- Every point and leaf has a **title**, plain-text **content** and a **color**.

Mind-map tools treat every child the same; panda keeps "what comes next" apart from "what
splits off", which fits roadmaps, decision paths, story plots and literature reviews (years on
the main chain, papers as leaves: see the example in `src/examples/`).

```
 Start ──► HTML & CSS ──► JavaScript ──► A framework ──► 🍃 Ship a project     main chain
               │               ├╌╌► DOM ──► Fetch API                          branch
               │               │     └╌╌► 🍃 Todo app                           branch of a branch
               │               └╌╌► TypeScript                                 second branch
               └╌╌► Flexbox ──► Grid ──► 🍃 Build a landing page                branch ending in a leaf
```

## What the editor does

- Build the tree with quick actions on a point: **+ Next**, **⎇ Branch**, **🍃 Leaf**.
- Automatic layout (stacked or packed), rotatable in four directions; lines on fixed sides or
  by the shortest path.
- Drag to **pin** a point; pins rotate with the tree. Box-select many points, or Ctrl+drag a
  point to move everything forward of it.
- **Collapse** a point's branches (or all at once); each point shows its **leaf count**.
- Import and export as JSON or as a README with a Mermaid diagram, an outline and a pins table.
