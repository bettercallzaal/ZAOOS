# Memory Entry Patterns

When the user has Claude memory available, save two entries after the vault is built. This makes future sessions immediately productive in the new vault without re-discovering its layout.

## Pattern 1: Project memory

Captures **what the project is**, not how the vault is organized. Stable facts that don't change between conversations.

```markdown
---
name: <Project> project
description: <One-line description of what the project is, current phase, and key open questions/risks to keep in mind.>
type: project
---

**<Project>** is <one-paragraph description of the thesis: what it is, who it's for, why it exists, who's building it>.

**Phase:** <current phase, e.g., "Phase I MVP, pre-implementation as of YYYY-MM">.

**Thesis:** <the core why-it-works claim — what makes this project win>.

**Phase I scope (N weeks, ...):**
- <bullet list of what's in scope for the current phase>

**Stack:** <one line summarizing the tech stack>.

**Active open questions:** <list the highest-priority open questions, terse>.

**Why:** <the strategic moat / regulatory advantage / unique angle>.

**How to apply:** When discussing <Project>, default to <current phase> context unless the user specifies otherwise. The canonical spec is at `<absolute path to canonical spec in vault>` — use that as the source of truth and update it alongside any atomized notes.
```

## Pattern 2: Vault structure memory

Captures **how the vault is organized**. Layout, frontmatter conventions, important paths.

```markdown
---
name: <Project> vault structure
description: How the <Project> project workspace is organized as a PARA-style Obsidian vault, what each folder contains, and the frontmatter conventions Bases query against.
type: project
---

The <Project> project workspace lives at `<absolute vault path>`. It is a PARA-style Obsidian vault.

**Layout:**
- `00_Index/` — `HOME.md`, `AGENTS.md`, `MOCs/<Project> MOC.md`. Read AGENTS.md first when operating in this vault.
- `10_Projects/<Project>/` — the active project, with subfolders Architecture, Brief, Contracts, Data Sources, Open Questions, People, Phases, Plans, Reference, Risks, Specs, Sprints, Week 1, Work Batches, plus `Project Charter.md` at root.
- `30_Resources/Technologies/` — one note per technology in the stack.
- `_Bases/` — Obsidian Bases (`.base` files): Open Questions, Project Tracker, Risks, Signals.
- `_Templates/` — frontmatter scaffolding for new notes.
- `40_Archive/` — empty for now; for completed/deprecated content.
- `docs/` — vault-meta documentation.

**Canonical spec:** `<path to canonical spec>` is the single source of truth. The other Specs/ files are atomized views — when the canonical spec changes, sync the atomized note.

**Frontmatter conventions:**
- Every note has `type:` (drives Bases filtering). Valid types: `project`, `phase`, `plan`, `spec`, `architecture`, `brief`, `contract`, `data-source`, `reference`, `risk`, `open-question`, `signal`, `person`, `sprint`, `technology`, `note`, `index`, `agents`, `moc`.
- Risks add `severity`, `likelihood`, `status`, `owner`.
- Open Questions add `priority`, `status`, `needs_resolution_by`, `owner`.
- Signals add `signal_type`, `direction`, `source`, `observed_at`, `confidence`.

**Don'ts:**
- Don't paraphrase the canonical spec into a parallel doc that drifts.
- Don't dump multiple concepts into one note — atomize.
- Don't create new top-level folders without checking with the user.

**Why:** <one sentence on why this layout was chosen — usually "modeled on user's existing vault structure" or "PARA recommended">.

**How to apply:** When the user asks <Project> questions, navigate via `00_Index/MOCs/<Project> MOC.md`. When updating the spec, edit the canonical spec file AND the relevant atomic note. When the user mentions a new risk/question/signal, create a note from the matching `_Templates/` file.
```

## Index entry

Add a one-line pointer to each entry in `MEMORY.md`:

```markdown
- [<Project> project](<project>_project.md) — <one-line hook>
- [<Project> vault structure](<project>_vault_structure.md) — <one-line hook>
```

## When NOT to save these

- **The user hasn't opted into memory.** Memory should never be silently created without consent.
- **The vault is throwaway / sketch.** A `/tmp/sketch_vault` doesn't deserve permanent memory.
- **The "project" is really a single document, not an ongoing initiative.** No memory needed.

## Where to write

The memory directory path varies by Claude environment. Look for it in your system prompt. Common patterns:

- Cowork desktop: `/Users/<user>/Library/Application Support/Claude/local-agent-mode-sessions/<id>/spaces/<id>/memory/`
- Claude Code: `~/.claude/` or per-project `CLAUDE.md`

Write the two memory `.md` files to that directory and add the index entries to `MEMORY.md`.
