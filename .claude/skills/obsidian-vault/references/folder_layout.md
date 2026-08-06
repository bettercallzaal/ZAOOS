# Folder Layout

The PARA-style layout this skill produces, with rationale per folder.

```
<vault>/
├── _Attachments/                    images, PDFs, screenshots
├── _Bases/                          Obsidian Bases (.base files) — DB views
│   ├── Open Questions.base
│   ├── Project Tracker.base
│   ├── Risks.base
│   └── Signals.base
├── _Templates/                      note templates with frontmatter scaffolding
│   ├── Project.md
│   ├── Open Question.md
│   ├── Risk.md
│   ├── Spec Section.md
│   ├── Person.md
│   ├── Sprint.md
│   ├── Signal.md
│   └── Note.md
├── 00_Index/                        landing & navigation
│   ├── HOME.md
│   ├── AGENTS.md
│   └── MOCs/
│       └── <Project> MOC.md
├── 10_Projects/                     active projects
│   └── <Project>/
│       ├── Architecture/
│       ├── Brief/
│       ├── Contracts/
│       ├── Data Sources/
│       ├── Open Questions/
│       ├── People/
│       ├── Phases/
│       ├── Plans/
│       ├── Reference/
│       ├── Risks/
│       ├── Specs/
│       ├── Sprints/
│       ├── Week 1/
│       ├── Work Batches/
│       └── Project Charter.md
├── 30_Resources/                    domain-agnostic reference material
│   ├── Reference/
│   ├── Sources/
│   ├── Technologies/                one note per tech in any project's stack
│   └── UI References/
├── 40_Archive/                      shipped or shelved content
└── docs/                            vault-meta documentation (rare)
```

## Per-folder rationale

### `_Attachments/`
Standard Obsidian convention. Underscore-prefixed so it sorts to the top.

### `_Bases/`
Obsidian Bases (database views over notes). Filters on `type:` frontmatter. Each `.base` file defines one or more views. See `bases_yaml.md`.

### `_Templates/`
Note templates that the user can clone when authoring new notes. The scaffolder writes them with the canonical frontmatter for each `type:`. Obsidian's "Templates" plugin can be pointed at this folder to make them one-click.

### `00_Index/`
Numbered `00` so it sorts to the top after underscored folders. Contains:

- **HOME.md** — vault landing page. Links to active projects, MOCs, and Bases.
- **AGENTS.md** — context briefing for AI agents (Claude included). One stop shop for "how do I operate in this vault".
- **MOCs/** — Maps of Content. One MOC per project, organizing every note in that project by category.

The MOC is the navigation surface that makes atomization productive instead of disorienting.

### `10_Projects/`
PARA's "P". One subfolder per active project. Each project's subfolders standardize how the project's content is organized:

- **Architecture/** — system topology, design principles, service decomp, tech stack
- **Brief/** — exec summary, why-it-works, scope, non-goals
- **Contracts/** — API contracts, payload schemas, request/response examples
- **Data Sources/** — upstream APIs and providers (operational notes per provider)
- **Open Questions/** — one note per open question (queryable via `_Bases/Open Questions.base`)
- **People/** — stakeholders, decision-makers
- **Phases/** — Phase I, Phase II, future-hooks
- **Plans/** — implementation sequence, milestone breakdowns
- **Reference/** — quick refs, status mappings, package refs
- **Risks/** — one note per risk (queryable via `_Bases/Risks.base`)
- **Specs/** — the canonical spec plus atomized spec sections
- **Sprints/** — sprint-level planning notes
- **Week 1/** — first-milestone day-by-day notes
- **Work Batches/** — opportunistic groupings of related work

If the project doesn't need a subfolder (no formal "People" yet), leave the folder empty — the structure being predictable matters more than the folder being populated.

### `30_Resources/`
PARA's "R". Domain-agnostic material — things that apply across projects:

- **Technologies/** — one note per tech in the stack (Postgres, Stripe, Express, etc.). Cross-referenced from project-specific notes.
- **Reference/** — general references not tied to one project
- **Sources/** — recurring sources (specific newsletters, RSS feeds, research repos)
- **UI References/** — design inspiration, component galleries, patterns

### `40_Archive/`
PARA's "A". Shipped or shelved content. When a project completes or is abandoned, move its `10_Projects/<Project>/` folder here.

### `docs/`
Vault-meta — documentation about how the vault itself is organized (if you write any). Empty by default. Most users never use this.

## Skipped: `20_Areas`

PARA's "A" (Areas) is for ongoing responsibilities that aren't bounded projects (e.g., "personal finance", "team management"). For a single-project vault, this is usually empty noise. The scaffolder doesn't create it by default; if a user wants it, they can pass `"include_top_folders": [..., "20_Areas"]` in the config.

## Naming conventions to keep stable

- **Numbered top folders sort predictably**: `00_`, `10_`, `30_`, `40_`. Don't renumber unless you understand the implications across vaults.
- **Underscore-prefixed special folders sort to the top**: `_Attachments`, `_Bases`, `_Templates`.
- **Filename prefixes for sortability**: `Risk — X`, `Open Question — X`. The em-dash (`—`, U+2014) is intentional — it sorts predictably and visually marks the type.
- **MOC files end with " MOC"**: `Forge MOC.md`. Easy to find via `MOC` search.

## What the scaffolder *won't* manage after creation

Once the scaffold is written, the skill is done. The scaffolder is intentionally not a sync tool — adding a new project means re-running it with a new project name, not having it watch and update. This keeps it predictable and idempotent.
