---
name: zao-research
description: Research skill for ZAO OS — search existing research library (44 docs), conduct new research, and save findings in the standardized format
user-invocable: true
---

# ZAO OS Research Skill

Use this skill when asked to research a topic for ZAO OS, find information in existing research, or add new research to the library.

## How to Use

When the user asks to research something:

1. **First check existing research** — search the 44 docs in `research/` before doing new research
2. **Conduct new research** if the topic isn't covered — use web search, fetch docs, analyze code
3. **Save findings** in the standardized format at `research/{number}-{topic}/README.md`
4. **Update the index** at `research/README.md` with the new document

## Research Library Location

All research lives in `/research/` with numbered folders. See [research-index.md](./research-index.md) for the full inventory.

## Existing Research by Topic

See [topics.md](./topics.md) for what's already been researched, organized by category.

## How to Search Existing Research

See [search-patterns.md](./search-patterns.md) for grep/glob patterns to find information across all 44 docs.

## How to Add New Research

See [new-research.md](./new-research.md) for the template and process for adding a new research document.

## Project Context

See [project-context.md](./project-context.md) for ZAO OS's tech stack, architecture, and what the research supports.
