# 356 - Karpathy's LLM Wiki Pattern: Persistent Compounding Knowledge Bases

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Evaluate LLM Wiki pattern for ZAO OS research library + potential community knowledge base feature

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **For research library** | ADOPT the wiki pattern formally - ZAO OS research/ already follows this pattern informally (319+ docs, indexed, cross-referenced). Formalize with proper lint, compaction, and schema in CLAUDE.md |
| **For CLAUDE.md management** | USE benjimixvidz's 3-layer pattern: CLAUDE.md (rules, stable, <30 lines ideal) + wiki/state.md (context, rewritten each session) + wiki/* (deep knowledge, on-demand). ZAO OS CLAUDE.md at 174 lines - could benefit from splitting |
| **For community knowledge** | DEFER - community wiki feature for ZAO members is interesting but premature. Focus on internal dev workflow first |
| **Compaction strategy** | ADOPT Actuel/Archive pattern for research docs - prevents unbounded growth. Set max line budgets per doc type |
| **Obsidian integration** | SKIP - stay with markdown + Claude Code. Obsidian adds tooling complexity without enough benefit for solo dev |
| **Search infrastructure** | USE existing grep + index approach for now. At 500+ docs, evaluate qmd (BM25 + vector hybrid search) or Graphify |

---

## The Pattern (Karpathy's Core Idea)

Three layers:
1. **Raw sources** - immutable documents (articles, papers, data). Source of truth. LLM reads, never modifies.
2. **Wiki** - LLM-generated markdown. Summaries, entity pages, concept pages, cross-references. LLM owns entirely.
3. **Schema** - CLAUDE.md/AGENTS.md telling LLM how wiki is structured, conventions, workflows.

Three operations:
1. **Ingest** - new source -> LLM reads, discusses, writes summary, updates index, updates related pages. Single source might touch 10-15 wiki pages.
2. **Query** - ask questions against wiki. Good answers filed back as new pages. Explorations compound.
3. **Lint** - health-check: contradictions, stale claims, orphan pages, missing cross-references, data gaps.

Key insight: **"LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass. The wiki stays maintained because the cost of maintenance is near zero."**

vs RAG: "The LLM is rediscovering knowledge from scratch on every question. There's no accumulation."

## Comparison: LLM Wiki Implementations

| Implementation | Architecture | Scale Tested | Key Innovation | License |
|---------------|-------------|-------------|----------------|---------|
| **Karpathy original** | Markdown + Obsidian + Claude Code | ~100 sources | The pattern itself | Public gist |
| **benjimixvidz** | 2-level (central + project) wikis | 6 projects, 1 month | Actuel/Archive compaction, 300-line budgets | Comment |
| **ΩmegaWiki** | 23 Claude Code skills, typed entities/edges | Research-focused | Bilingual (EN + Chinese), typed graph | GitHub |
| **Synthadoc** | Background service, async job queue | Enterprise | Multi-provider, Obsidian plugin, skill architecture | Open source |
| **Graphite Atlas** | Property graph database + UI | Team/enterprise | Graph DB backend, not just markdown | Hosted |
| **AIOS** | OS-level wiki primitive | Experimental | Wiki as system-level service, offline-first | GitHub |
| **ZAO OS research/** | 319+ indexed markdown docs | 12+ months | Topic folders, numbered docs, research skill | Internal |

## What ZAO OS Already Has (vs What's Missing)

### Already Done (informal LLM Wiki)
- `research/` = 319+ docs = the "wiki" layer
- `/zao-research` skill = the "ingest" operation
- `research/README.md` + topic READMEs = the "index"
- Numbered docs with cross-references = structured knowledge
- CLAUDE.md = the "schema"

### Missing
| Gap | Fix | Effort |
|-----|-----|--------|
| No formal lint operation | Create `/research-lint` skill: find contradictions, stale claims, orphan docs, missing cross-refs | Medium |
| No compaction strategy | Research docs grow unbounded. Add Actuel/Archive pattern or max line budgets | Low |
| No log of research activity | Add `research/log.md` - append-only record of ingests, queries, updates | Low |
| CLAUDE.md too heavy | 174 lines loaded every message. Split stable rules from volatile context | Medium |
| No query operation distinct from ingest | `/zao-research` always creates new docs. Add query-only mode that answers from existing wiki without creating | Low |
| Search at scale | grep works now. At 500+ docs, need BM25/vector search (qmd or Graphify) | Future |

---

## Compaction Strategy for research/

Adopt from benjimixvidz:

| Doc Type | Max Lines | Strategy |
|----------|-----------|----------|
| Research doc (numbered) | ~150 | Actuel section + Archive section |
| Topic README (index) | ~80 | Rewrite on each new doc |
| research/log.md | ~100 | Append + compact (>60 days = one-liner summaries) |
| CLAUDE.md | ~200 | Stable rules only, move volatile to skills |

---

## Community Thread Highlights (5000+ stars, 4135+ forks)

**Critical voices worth noting:**
- @gnusupport: "Markdown is not a database. No foreign keys = broken links. No schema = duplicate chaos." Valid concern at scale.
- @iBlinkQ: "Raw resources may be better than LLM Wiki for beginners." True - pattern is for synthesis, not initial learning.
- @joshwand: "The problem with voluminous LLM output is that eventually the data and your mental model drift and diverge." Key risk.
- @nishchay7pixels: "Knowledge stored could easily be corrupted and it will become impossible for user to figure that out." Need validation.

**Practical innovations from commenters:**
- @benjimixvidz: Actuel/Archive compaction, 300-line budget, 3-layer persistence (CLAUDE.md / state.md / wiki/*)
- @403-html: Zettelkasten-inspired - flattened topics, projects/synthesis/questions folders, inline citations
- @AfzalivE: "Dream mode" - nightly script that fixes broken refs, consolidates, archives stale content
- @mesaydin-bot: Seeds -> sprouts -> articles -> chapters -> books growth pipeline
- @mikhashev: Git object model as knowledge backend (blob=fact, tree=category, commit=provenance, branch=hypothesis, merge=synthesis)

---

## ZAO Ecosystem Integration

Files to modify:
- `CLAUDE.md` - already has Context Budget section. Could split further per benjimixvidz pattern
- `.claude/skills/zao-research/SKILL.md` - add query-only mode, lint operation
- `research/README.md` - formalize as wiki index
- Create `research/log.md` - activity log for research operations

The ZAO OS research library IS an LLM Wiki - just not formalized as one. Formalizing it (lint, compaction, query mode, activity log) would make the 319+ docs more maintainable and the skill more token-efficient.

---

## Sources

- [Karpathy LLM Wiki Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) - 5000+ stars, April 2026
- [ΩmegaWiki](https://github.com/skyllwt/OmegaWiki) - 23 Claude Code skills implementation
- [Synthadoc](https://github.com/axoviq-ai/synthadoc) - enterprise LLM wiki implementation
- [Graphite Atlas](https://graphiteatlas.com) - property graph knowledge base
- [qmd](https://github.com/search?q=qmd+markdown+search) - local BM25/vector search for markdown
- [Vannevar Bush - Memex (1945)](https://en.wikipedia.org/wiki/Memex) - original vision for personal knowledge stores
- benjimixvidz comment - 6-project production experience with compaction patterns
