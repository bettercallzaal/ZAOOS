---
name: zao-research
description: Research skill for ZAO OS — search existing research library (58 docs) + codebase, conduct new research, and save findings in the standardized format
user-invocable: true
---

# ZAO OS Research Skill

Use this skill when asked to research a topic for ZAO OS, find information in existing research, or add new research to the library.

## How to Use

When the user asks to research something:

1. **First check the codebase** — search `src/` to understand what's already built
2. **Then check existing research** — search the 58 docs in `research/` before doing new research
3. **Cross-reference** — compare what research docs say vs what the code actually does
4. **Conduct new research** if the topic isn't covered — use web search, fetch docs, analyze code
5. **Save findings** in the standardized format at `research/{number}-{topic}/README.md`
6. **Update the index** at `research/README.md` with the new document

## Research Library Location

All research lives in `/research/` with numbered folders. See [research-index.md](./research-index.md) for the full inventory.

## Existing Research by Topic

See [topics.md](./topics.md) for what's already been researched, organized by category.

## How to Search

See [search-patterns.md](./search-patterns.md) for grep/glob patterns to find information across research docs AND the codebase.

## How to Add New Research

See [new-research.md](./new-research.md) for the template and process for adding a new research document.

## Project Context

See [project-context.md](./project-context.md) for ZAO OS's tech stack, architecture, and what the research supports.

## Important: Research vs Reality

Research docs contain aspirational designs that may not match what's actually built. Always cross-reference with the codebase:

- **Doc 4 (Respect tokens)** describes tiers and decay — ZAO uses NO tiers and NO decay
- **Doc 50 (Complete Guide)** is the canonical reference but needs regular updates
- **Doc 58 (Respect Deep Dive)** has on-chain data but aspirational parameters — see memory `project_respect_system.md` for actual values
- **Sprint plans** in `docs/superpowers/plans/` may reference outdated research assumptions

When in doubt, check `community.config.ts` and the actual API routes for ground truth.
