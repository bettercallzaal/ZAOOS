# 45 — Research Organization Patterns: How Others Do It

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** How to optimally organize ZAO OS's 44+ research documents based on how top projects do it

---

## Recommended Actions for ZAO OS

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Add YAML frontmatter** to every research doc (title, status, category, tags, related, layer) | High | Medium |
| 2 | **Auto-generate README index** from frontmatter (eliminate manual maintenance) | High | Small |
| 3 | **Add Pagefind search** via Fumadocs/Nextra as research portal | High | Medium |
| 4 | **Generate llms.txt** for AI accessibility | Medium | Small |
| 5 | **CI validation** of frontmatter schema on PRs | Medium | Small |
| 6 | **Track status** (complete/draft/outdated) to manage freshness | Medium | Small |
| 7 | **Auto-generate backlinks** from `related` field | Low | Small |

---

## 1. How Top Projects Organize Research

### ethereum/research (Vitalik's Repo)
- 50+ folders, flat topic-based (zksnark/, verkle_trie/, casper4/)
- No frontmatter, no metadata, no index — "working notebook" style
- Works for a single prolific author, doesn't scale for teams

### ethereum/EIPs (Gold Standard)
- Mandatory YAML frontmatter: number, title, status, type, category, created, requires
- Strict CI validation against schema before merge
- Jekyll site renders them at eips.ethereum.org
- **Best model for structured research with metadata**

### rust-lang/rfcs
- Numbered markdown in `text/` directory
- PR-based lifecycle (Draft → FCP → Active/Postponed)
- Consistent template: Summary, Motivation, Guide-level explanation, Drawbacks, Alternatives

### airbnb/knowledge-repo (Closest to What ZAO Needs)
- Accepts Jupyter, R Markdown, Markdown, Google Docs
- Git is the storage backend, PRs for review
- Flask web app renders as internal blog (browsable by time, topic, content)
- Required metadata: author(s), tags, TLDR
- **Pattern: Git + metadata + web rendering**

### protocol/research (Protocol Labs)
- Hub-and-spoke: thin index pointing to separate repos per research lab
- Good for multi-team orgs, overkill for single-project

### DAOs (Nouns, Uniswap, Purple)
- Research happens on-chain and in forums, not in repos
- Governance docs in dedicated repos

---

## 2. Knowledge Base Patterns

### ADRs (Architecture Decision Records)
- Repo: [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record)
- Template: Context → Decision → Consequences
- Status lifecycle: Researching → Evaluating → Implementing → Maintaining
- Store in `/docs/adr/` directory
- **[adr-agent](https://github.com/macromania/adr-agent)** — MCP server for analyzing ADRs with AI

### RFCs (rust-lang/rfcs model)
- Numbered files, PR-based lifecycle
- Template: Summary, Motivation, Guide-level, Reference-level, Drawbacks, Alternatives, Prior art

### Design Documents (Google Pattern)
- Informal, no rigid template
- Sections: Context/Scope, Goals/Non-Goals, Design, Alternatives, Cross-cutting concerns
- **Key lesson from Uber:** Discoverability breaks down with unstructured storage across random folders

---

## 3. Recommended Frontmatter for ZAO Research Docs

```yaml
---
title: "Farcaster Protocol Deep Dive"
description: "Protocol architecture, Snapchain, identity, storage, channels"
number: 21
status: complete  # complete | draft | outdated | needs-review
category: protocol  # protocol | music | identity | ai | infrastructure | growth | security | cross-platform
tags: [farcaster, snapchain, neynar, protocol]
created: 2026-01-15
updated: 2026-03-10
related: [01, 02, 17, 34]
layer: 1  # maps to 9-layer roadmap
---
```

### Why Each Field
- **status** — tracks freshness (critical at 44+ docs)
- **category** — maps to README sections (single per doc)
- **tags** — freeform cross-referencing (multiple per doc)
- **related** — explicit links to related doc numbers
- **layer** — maps to 9-layer roadmap architecture

---

## 4. Search Solutions

| Tool | How It Works | Best For | Cost |
|------|-------------|----------|------|
| **Pagefind** | Static WASM-powered search, built at build time | Static research portal | Free |
| **Orama** | Full-text + vector in <2KB, in-memory | Fumadocs integration | Free |
| **Algolia DocSearch** | Server-side crawling, hosted | Large public docs | Free for OSS |
| **qmd** (Shopify founder) | Local SQLite + BM25 + vector hybrid | Developer local search | Free |
| **Supabase pgvector** | Embed chunks, semantic search | AI agent RAG | Already have |

### qmd (Local Research Search)
- [tobi/qmd](https://github.com/tobi/qmd) — CLI for searching local markdown knowledge bases
- Chunks docs into ~900 tokens with 15% overlap
- SQLite with BM25 + vector embeddings
- Hybrid search: BM25 + vector + LLM reranking, all local
- **Could make ZAO's 44 docs instantly searchable from terminal**

---

## 5. Documentation Site Options

| Tool | Built On | ZAO Fit | Search Built-In |
|------|----------|---------|----------------|
| **Fumadocs** | Next.js | Excellent (embed at `/docs`) | Orama |
| **Nextra** | Next.js | Excellent (separate site) | Pagefind |
| **Docusaurus** | React | Good (separate app) | Algolia |
| **Astro Starlight** | Astro | Good (fastest builds) | Pagefind |
| **MkDocs Material** | Python | Good (quick setup) | Built-in |

**Recommendation:** Fumadocs to embed research at `zaoos.com/research` — same Next.js app, Orama search, auto-generated from markdown.

---

## 6. llms.txt for AI Accessibility

Growing standard at [llmstxt.org](https://llmstxt.org/):
- Place `llms.txt` (navigation index, <10KB) and `llms-full.txt` (complete content) at docs root
- 2,000+ sites implement this, including Anthropic
- Reduces AI token consumption by 90%+
- Auto-generate from research frontmatter

---

## 7. Automation Patterns

### Auto-Generate Index from Frontmatter
Script walks `research/*/README.md`, parses YAML frontmatter, generates:
- `research/README.md` (human-readable index)
- `research-index.json` (programmatic access)
- `llms.txt` (AI navigation)

### CI Validation
GitHub Actions workflow that:
1. Validates all docs have required frontmatter fields
2. Checks for broken internal links
3. Validates markdown formatting (markdownlint)
4. Auto-generates index on merge to main

### Auto-Backlinks
Parse `related: [01, 02, 17]` from frontmatter → generate "See also" sections and "docs that cite this doc" backlinks.

---

## 8. Organization Approaches Compared

| Approach | Pros | Cons | Used By |
|----------|------|------|---------|
| **Topic-based** | Domain-focused, natural grouping | Hard to see timeline | ZAO README (current) |
| **Chronological** | Shows evolution of thinking | Hard to find by topic | ethereum/research |
| **Layered** | Maps to architecture | Forces single categorization | ZAO roadmap |
| **Numbered + tagged** | Stable URLs + flexible views | Requires tooling for views | ethereum/EIPs |

**Recommended for ZAO:** Hybrid — keep numbered prefixes (stable references), add frontmatter for tags/categories/layers, generate multiple views from same source.

---

## Notable Repos to Study

| Repo | Stars | Pattern |
|------|-------|---------|
| [ethereum/EIPs](https://github.com/ethereum/EIPs) | 12K+ | YAML frontmatter + CI validation + Jekyll site |
| [rust-lang/rfcs](https://github.com/rust-lang/rfcs) | 5K+ | Numbered files + PR lifecycle |
| [airbnb/knowledge-repo](https://github.com/airbnb/knowledge-repo) | 5K+ | Git + metadata + Flask web rendering |
| [tobi/qmd](https://github.com/tobi/qmd) | New | SQLite + BM25 + vector local search |
| [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) | 11K+ | ADR template collection |
| [web3privacy/web3privacy](https://github.com/web3privacy/web3privacy) | — | Markdown as database pattern |

---

## Sources

- [ethereum/research](https://github.com/ethereum/research)
- [ethereum/EIPs](https://github.com/ethereum/EIPs)
- [rust-lang/rfcs](https://github.com/rust-lang/rfcs)
- [airbnb/knowledge-repo](https://github.com/airbnb/knowledge-repo)
- [tobi/qmd](https://github.com/tobi/qmd)
- [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)
- [Fumadocs](https://fumadocs.dev/)
- [Pagefind](https://pagefind.app/)
- [llmstxt.org](https://llmstxt.org/)
- [Scaling Knowledge at Airbnb](https://medium.com/airbnb-engineering/scaling-knowledge-at-airbnb-875d73eff091)
