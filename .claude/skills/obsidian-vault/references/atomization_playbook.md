# Atomization Playbook

How to break a software project spec into discrete, queryable Obsidian notes.

## The principle

A 1500-line spec is a write-once, read-never artifact. The same content split into ~50 atomic notes — one per risk, one per spec section, one per open question — becomes navigable, linkable, and AI-friendly. Bases over `type:` frontmatter give you live views (all open risks, all high-priority open questions, all specs by section).

But atomization isn't paraphrasing. The spec stays canonical at `10_Projects/<Project>/Specs/<original-filename>.md`. The atomized notes are *views* — they extract the section, add `type:` frontmatter, link back to the canonical, and crosslink to related notes. Don't write a parallel doc that drifts.

## The map: spec section → vault folder

For a typical software engineering spec, sections fall into these buckets:

| Spec section | Target folder | One note per | Frontmatter `type` |
|---|---|---|---|
| Executive context / pitch / why it works | `Brief/` | concept (Executive Summary, Why It Works, Phase I Scope, Phase I Non-Goals) | `brief` |
| System architecture, topology, design principles, service decomposition, tech stack | `Architecture/` | concept | `architecture` |
| Detailed system specs (Auth, Billing, API design, DB schema, Integration X) | `Specs/` | section | `spec` |
| Phase I, Phase II, future hooks | `Phases/` | phase | `phase` |
| Implementation sequence, milestones, roadmap | `Plans/` | plan | `plan` |
| Quick references, API quick refs, status mappings, package refs | `Reference/` | reference | `reference` |
| API contracts, request/response examples, payload schemas | `Contracts/` | contract | `contract` |
| Upstream APIs and providers (each external data source) | `Data Sources/` | provider | `data-source` |
| Open questions (spec usually has a list at the end) | `Open Questions/` | question | `open-question` |
| Risks / threat model / security considerations | `Risks/` | risk | `risk` |
| Stakeholders, team members, decision-makers | `People/` | person | `person` |
| Technologies in the stack (Postgres, Redis, Stripe, ...) | `30_Resources/Technologies/` | technology | `technology` |
| Sprint / week-by-week planning | `Sprints/` or `Week N/` | sprint | `sprint` |

The canonical spec itself becomes a single file in `Specs/` with `type: spec` and `section: canonical-spec`. Every atomized note links to it.

## Atomization rules of thumb

**One concept, one file.** A "Database Schema" note exists. A "Database Schema and Billing" note does not — split it.

**Filename prefixes for sortability and clarity.** Use:
- `Risk — <name>.md` for risks
- `Open Question — <name>.md` for open questions
- Plain title for everything else

The em-dash sorts well, makes intent obvious in the file tree, and avoids collisions across folders.

**Frontmatter is non-negotiable.** Every note gets a `type:` field. Bases stop working otherwise. See `frontmatter_schema.md` for the full set.

**Wikilinks for cross-references.** Use `[[Note Name]]` (or `[[Note Name|Display Text]]` for aliasing). Don't use Markdown links with relative paths — they break when notes move.

**Link back to the canonical spec.** Every atomized note's "See Also" section ends with a link like `[[gpu-var-platform-spec]] §5` so the reader can always trace back to the source.

**Don't duplicate, refer.** If an atomized note would just restate four paragraphs of the canonical spec, consider whether it should exist at all. The spec section may already be atomic enough — just link.

## Atomization workflow

### Step 1: Read the whole spec first
Don't atomize as you read — read end-to-end first to understand the structure. You'll discover that "Section 7: x402" depends on terminology defined in "Section 2: Architecture", and that "Open Questions" at the end reference half the rest. You need that mental model before you start splitting.

### Step 2: Move the canonical spec
Put it at `10_Projects/<Project>/Specs/<original-filename>.md`. Add frontmatter:

```yaml
---
type: spec
project: <Project>
section: canonical-spec
status: draft
version: <from spec>
phase: <from spec>
date: <from spec>
author: <from spec>
tags: [spec, canonical]
---
```

### Step 3: Pass through the spec, section by section
For each section, decide: is this big enough to deserve its own atomized note? Two heuristics:

- **More than ~30 lines of content** → atomize.
- **Contains discrete sub-items that could each be queried** (a list of risks, a list of open questions, a status-mapping table) → atomize the sub-items separately, not the section as a whole.

### Step 4: Atomize sub-lists into individual notes
This is the highest-leverage move. A spec's "Open Questions" section is usually a numbered list. Each question becomes its own file with rich frontmatter:

```yaml
---
type: open-question
project: <Project>
status: open
priority: high
needs_resolution_by: M2
owner: <if known>
tags: [open-question, ...]
---

# <The question>

## Why It Matters
...

## Options
| Option | Pros | Cons |

## Path Forward
...

## Decision Needed By
...

## See Also
- [[<canonical-spec>]] §16
- [[<related notes>]]
```

Same approach for risks (one per `Risk — X.md`), each with `severity`, `likelihood`, `status`, `owner`.

### Step 5: Build the architecture/specs notes
For sections like "System Architecture" → split into:
- `System Topology.md` — the diagram and high-level layout
- `Design Principles.md` — the non-negotiable principles
- `Service Decomposition.md` — service-by-service breakdown
- `Technology Stack.md` — concrete tech choices

Each gets `type: architecture` frontmatter and links to the canonical spec.

For "Detailed Specs" → one note per section:
- `Shadeform Integration.md` (`type: spec`)
- `Template System.md` (`type: spec`)
- `x402 Payment Middleware.md` (`type: spec`)
- ...

### Step 6: Author the MOC
Update `00_Index/MOCs/<Project> MOC.md` to list every atomized note grouped by category. This is the navigation surface — without it, atomization makes things harder to find, not easier. The MOC should mirror the folder layout but with friendly group headings (Anchor, Brief, Architecture, Specs, Phases & Plans, Reference, Contracts, Open Questions, Risks, Sprints).

### Step 7: Verify
Run the verification block from SKILL.md Step 6. Catch missing frontmatter early.

## Atomizing informal sources (briefs, Slack posts, transcripts)

The map and rules above are calibrated for a formal spec with numbered sections. If the source is conversational — a multi-paragraph Slack post, a meeting transcript, a brain dump — the playbook still applies, with three adjustments:

**1. No section numbers in back-references.** A formal spec lets you link `[[gpu-var-platform-spec]] §16` to a specific section. Informal sources have no sections. Drop the `§N` suffix and just link `[[<brief-filename>]]` — the canonical source is short enough that the reader can find the relevant passage.

**2. Atomize the implicit lists.** Informal sources don't have a clean "## Open Questions" section, but they do contain open questions, usually flagged with phrases like "key open questions:", "still need to figure out:", "I'm not sure whether", "risks I can see:", or "stakeholders:". Scan for these and extract them. Each one becomes its own note.

**3. Be more aggressive about populating the Charter.** A formal spec usually has an explicit Executive Context section to lift into the Charter. A brief usually has the pitch and the why scattered across the first paragraph or two. Synthesize them. The Charter should not stay empty just because the source isn't structured.

Typical mappings for an informal source:

| What the brief says | Where it lands |
|---|---|
| The opening "what is this?" paragraph | Project Charter — One-Line Pitch + Why It Works |
| "Phase 1 is X, Phase 2 is Y" | `Phases/Phase 1.md`, `Phases/Phase 2.md` |
| "Tech stack: Python, Postgres, React..." | `Architecture/Technology Stack.md` + `30_Resources/Technologies/<each>.md` |
| "Data sources: X, Y, Z" | `Data Sources/<each>.md` |
| "Key open questions: ..." | `Open Questions/Open Question — <each>.md` |
| "Risks I can see: ..." | `Risks/Risk — <each>.md` |
| "Stakeholders: A, B, C" | `People/<each>.md` |
| Timeline ("6 weeks to v0.1, GA by Q3") | `Plans/Implementation Sequence.md` |

The atomization is shallower than for a formal spec — you'll typically get 15-25 notes from a brief vs. 40-60 from a spec — but the structure is the same.

## Anti-patterns

**The "Misc Notes" file.** Resist. Either it's a real concept that deserves a name, or it's many small concepts that should each become their own note.

**Massive frontmatter ambitions.** Don't add 15 frontmatter fields to every note "just in case". Stick to the schema in `frontmatter_schema.md` and add fields only when a Base or query needs them.

**Atomizing into single sentences.** A note that says only "We use Stripe for billing." is not useful. Atomize down to the level where each note has at least a paragraph of substance, ideally with sub-headings.

**Re-summarizing the spec at the top of every note.** If the reader landed here, they have the link back to the canonical spec. Open with the *content*, not preamble.

## Worked example

Spec section 16 reads:

> 1. **Product name / domain**: "Forge" is a working title. Need to check availability and align with brand.
> 2. **Shadeform partnership terms**: Are we using their standard API access, or negotiating a reseller agreement with volume pricing? ...

Atomization produces two files in `10_Projects/Forge/Open Questions/`:

```
Open Question — Product Name and Domain.md
Open Question — Shadeform Partnership Terms.md
```

Each has its own frontmatter (`type: open-question`, `priority`, `status`, `needs_resolution_by`, `owner`), a "Why It Matters" section, an "Options" table when there's more than one path, and a "See Also" linking to the canonical spec section. They're now queryable via `_Bases/Open Questions.base` and visible in the MOC.

That same atomization-then-link pattern is what you apply to every list, table, and sectioned chunk in the spec.
