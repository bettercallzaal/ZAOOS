# 297 - Graphify: Knowledge Graph for Codebases & Research

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Evaluate Graphify as a knowledge graph tool for ZAO OS's 863 source files + 338 research docs

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install Graphify** | USE Graphify - MIT-licensed, free, 71.5x token reduction on large corpora. ZAO OS has 863 .ts/.tsx files + 338 research docs = ideal candidate |
| **Primary use case** | Index `research/` folder first (338 docs, 5.9MB) - this is the biggest context burden in every session |
| **Secondary use case** | Index `src/` for codebase navigation - "what calls this function" and "what connects auth to rate limiting" |
| **Integration method** | Install as Claude Code skill via `pip install graphifyy && graphify install` - no codebase changes needed |
| **Re-index cadence** | Run `/graphify . --update` after major feature merges, full re-index every 2-3 weeks to prevent graph drift |
| **Obsidian vault** | USE the generated Obsidian vault as a browsable research wiki - solves the "which of 240+ docs covers X" problem |
| **Existing work** | Doc 271 covers ZAO member knowledge graph (identity/social) - Graphify is complementary (codebase/research knowledge) |

---

## Comparison of Options

| Tool | Token Reduction | Setup | License | Code Support | Docs/Images | Persistent Graph | Price |
|------|----------------|-------|---------|-------------|-------------|-----------------|-------|
| **Graphify** | 71.5x | 2 commands, Claude Code skill | MIT | 19 languages via tree-sitter | PDF, MD, images (Claude Vision) | Yes (JSON + Obsidian) | Free |
| **GitNexus MCP** | ~5-10x (API-based) | Already installed in ZAO OS | Proprietary | Code-focused queries | No doc support | No (query-time) | Free tier |
| **Raw file reading** | 1x (baseline) | None | N/A | All | All | No | Free |
| **Vector DB (pgvector)** | ~10-20x | Supabase extension + embeddings pipeline | Apache-2.0 | Via embeddings | Via embeddings | Yes | Supabase included |
| **Cursor/Windsurf indexing** | ~5-15x | IDE-specific | Proprietary | IDE languages | Limited | IDE session only | $20-40/mo |

Graphify wins for ZAO OS: highest token reduction, MIT-licensed, works as Claude Code skill (our primary dev tool), supports both code AND research docs, generates persistent Obsidian vault.

---

## How Graphify Works

### Architecture (Pipeline)

```
detect() -> extract() -> build_graph() -> cluster() -> analyze() -> report() -> export()
```

**Two-pass extraction:**
1. **Deterministic AST pass** - tree-sitter extracts functions, classes, imports from 19 languages (including TypeScript). No LLM needed, free.
2. **Claude subagent pass** - parallel Claude calls extract concepts and relationships from docs, PDFs, and images via Claude Vision.

**Output artifacts:**
- `graph.html` - interactive vis.js visualization (click nodes, search, filter by community)
- `obsidian/` - Obsidian vault with backlinked articles, openable directly
- `wiki/` - Wikipedia-style markdown articles (with `--wiki` flag)
- `GRAPH_REPORT.md` - god nodes, surprising connections, suggested questions
- `graph.json` - persistent graph for querying without re-reading files
- `cache/` - SHA256 cache so re-runs only process changed files

### Key Modules

| Module | Purpose |
|--------|---------|
| `detect.py` | Collects and filters files from a directory |
| `extract.py` | Extracts nodes/edges per file (tree-sitter for code, Claude for docs) |
| `build.py` | Assembles into NetworkX graph |
| `cluster.py` | Leiden community detection via graspologic |
| `analyze.py` | God nodes, surprising connections, suggested questions |
| `export.py` | Obsidian vault, JSON, HTML, SVG, GraphML |
| `cache.py` | SHA256-based semantic caching |
| `serve.py` | MCP stdio server mode |
| `watch.py` | Filesystem watcher for auto-sync |

### Edge Types

Every edge is tagged: `EXTRACTED` (found in code/text), `INFERRED` (Claude reasoning), or `AMBIGUOUS`. This transparency is critical for trusting the graph.

---

## ZAO OS Integration

### What to Index

| Target | Files | Size | Why |
|--------|-------|------|-----|
| `research/` | 338 .md files | 5.9MB | Biggest context burden - "which doc covers X?" is asked every session |
| `src/` | 863 .ts/.tsx files | ~3MB | Codebase navigation - "what connects auth to player" |
| `community.config.ts` | 1 file | ~15KB | Fork-friendly config, central to understanding the app |

### Queries This Enables

- "What research exists about XMTP?" - graph navigates 240+ docs instantly
- "What calls `getSession()`?" - traces auth flow across API routes
- "What connects the music player to governance?" - finds non-obvious relationships
- "What are the god nodes in ZAO OS?" - identifies most-connected modules (likely `community.config.ts`, `src/lib/auth/session.ts`)

### Integration with Existing Tools

- **GitNexus MCP** (`mcp__gitnexus__*`) - already installed, handles code-level queries. Graphify adds research doc navigation + visual graph + Obsidian vault
- **`/zao-research` skill** - currently does grep-based search across research/. Graphify would provide semantic navigation as a complement
- **Doc 271 (ZAO Knowledge Graph)** - covers member identity/social graph. Graphify covers codebase/research knowledge. Different domains, complementary

### Installation Steps

```bash
# 1. Install Graphify
pip install graphifyy && graphify install

# 2. Index research library (run once, ~5 min for 338 files)
# In Claude Code: /graphify ./research

# 3. Index source code (run once, ~3 min for 863 files)
# In Claude Code: /graphify ./src

# 4. Incremental updates after major merges
# In Claude Code: /graphify ./research --update
```

### Limitations

- **Graph drift** - new files can introduce nodes that contradict existing relationships. Full re-index every 2-3 weeks recommended
- **PyPI naming** - package is `graphifyy` (double y) while name dispute resolves. CLI is still `graphify`
- **Version 0.1.15** - pre-1.0, expect breaking changes
- **Initial indexing cost** - first run uses Claude tokens to extract from docs/images. Subsequent runs use SHA256 cache (only changed files)

---

## Sources

- [Graphify GitHub repo](https://github.com/safishamsi/graphify) - MIT license, v0.1.15
- [Graphify on PyPI](https://pypi.org/project/graphifyy/) - install as `graphifyy`
- [How to Build an LLM Knowledge Base in Claude Code](https://www.roborhythms.com/how-to-build-llm-knowledge-base-claude-code-2026/) - walkthrough + benchmarks
- [Graphify on SkillsLLM](https://skillsllm.com/skill/graphify) - skill directory listing
- [Karpathy's original post](https://x.com/kaboringai/status/2041192946369007924) - the challenge that sparked Graphify
- [Doc 271 - ZAO Knowledge Graph](../../../research/identity/271-zao-knowledge-graph/) - existing member identity graph (complementary)
