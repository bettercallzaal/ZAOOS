# 299 - LLM Knowledge Bases & Personal Wiki Systems

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Evaluate the Karpathy LLM Knowledge Base pattern and tools for ZAO OS's 338 research docs + codebase knowledge

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Should we use Obsidian?** | YES for browsing, NO as primary tool. Use Obsidian to VIEW the wiki Graphify/wiki-skills generate. Don't move the workflow into Obsidian - keep it in Claude Code where we already work |
| **Wiki-skills plugin** | INSTALL - gives /wiki-init, /wiki-ingest, /wiki-query, /wiki-lint. MIT-licensed. Pure markdown, no server. Perfect complement to Graphify (graph = navigation, wiki = prose) |
| **Knowledge base for research/** | USE wiki-skills to build a structured wiki from the 338 research docs. The wiki becomes the queryable "second brain" for ZAO OS |
| **Karpathy's 3-folder pattern** | ADOPT the raw/ + wiki/ + CLAUDE.md schema pattern for new research topics. Don't restructure existing research/ folder - it works |
| **brain-ingest for media** | INSTALL LATER - useful for transcribing YouTube/podcasts into structured notes. Lower priority than wiki-skills and Graphify |
| **QMD local search** | SKIP for now - Graphify + wiki-skills covers our needs. QMD adds value at 1000+ articles, we have 338 |
| **Smart Connections MCP** | SKIP - only needed if we go heavy on Obsidian as primary interface. We work in Claude Code |
| **Nyk's 3-layer stack** | ADAPT Layer 1 (session memory) - we already have this via CLAUDE.md + auto-memory. Layer 2 (knowledge graph) = Graphify. Layer 3 (ingestion) = wiki-skills + brain-ingest |
| **Chronological tracking** | ADD a `research/changelog.md` file - append-only log of every research doc added, with date and one-line summary. Solves "when did I research X?" |

---

## Comparison of Options

| Tool | What It Does | Install | License | ZAO OS Fit | Priority |
|------|-------------|---------|---------|------------|----------|
| **wiki-skills** (kfchou) | Karpathy wiki pattern as Claude Code plugin. /wiki-init, /wiki-ingest, /wiki-query, /wiki-lint | `/plugin marketplace add kfchou/wiki-skills` | MIT | HIGH - builds queryable wiki from research docs | Install today |
| **Graphify** (Doc 297) | Knowledge graph + Obsidian vault + interactive HTML | `pip install graphifyy && graphify install` | MIT | HIGH - visual navigation + 71.5x token reduction | Install today |
| **Obsidian** | Note-taking app with graph view, wikilinks, plugins | Download from obsidian.md (free) | Proprietary (free for personal) | MEDIUM - viewer only, not primary workflow | Install as viewer |
| **brain-ingest** | NOT FOUND on GitHub. May be private or renamed. Closest: `eugeniughelbur/obsidian-second-brain` with `/obsidian-ingest` for YouTube | N/A | Unknown | SKIP - does not exist as described |
| **QMD** (tobi/qmd) | Local markdown search: BM25 + semantic + LLM reranking. 19,893 stars. By Tobi Lutke (Shopify CEO). Karpathy recommends it. | `npm install -g @tobilu/qmd` | MIT | MEDIUM - revisit if wiki-skills + Graphify aren't enough | Install later |
| **sage-wiki** (xoai/sage-wiki) | Full CLI + MCP server + TUI. Compiles 12+ formats (PDF, Word, images). 223 stars. Go binary. | `go install github.com/xoai/sage-wiki/cmd/sage-wiki@latest` | Unspecified | LOW - wiki-skills is simpler and enough | Skip |
| **Smart Connections MCP** | Semantic search over Obsidian vault | `pip install smart-connections-mcp` | Unknown | LOW - only if Obsidian becomes primary | Skip |
| **CRATE** | Python CLI, 3-layer KB, OpenAI-compatible | pip install | Unknown | LOW - wiki-skills does this better for Claude Code | Skip |
| **sage-wiki** | Full CLI with MCP server | pip install | Unknown | LOW - overlaps with wiki-skills | Skip |

---

## The Karpathy Pattern (How It Works)

Andrej Karpathy posted on April 2, 2026 about using LLMs to build personal knowledge bases. 100K+ bookmarks, 5000+ stars on the GitHub gist, 1400+ forks in 2 days. The pattern:

### Three Folders, One Schema

```
my-knowledge-base/
+-- raw/           # Source material. AI reads but never modifies.
+-- wiki/          # AI-maintained wiki. You read. AI writes.
+-- outputs/       # Reports, analyses, answers from queries
+-- CLAUDE.md      # Schema file - tells AI how to organize everything
```

### Four Operational Cycles

1. **Ingest** - Add raw source, AI creates summary + concept pages + cross-links + index update. One source should touch 10-15 wiki pages.
2. **Query** - Ask question, AI reads wiki index, finds relevant pages, synthesizes cited answer, files answer back into wiki.
3. **Lint** - Monthly health check: contradictions, orphan pages, broken links, stale content, missing pages.
4. **Compile** - AI builds and updates wiki pages, maintains index, weaves new info into existing structure.

### Key Insight: The Filing Loop

Every query answer gets filed back into the wiki. This is the compounding mechanism. Each question enriches the base for future questions. "Knowledge compounds instead of resetting."

### Karpathy's Results

- ~100 articles, ~400,000 words on a single research topic
- He didn't write a word of it
- No database, no embeddings, no vector store
- Just folders and text files

---

## Wiki-Skills Plugin (Best Implementation)

The `kfchou/wiki-skills` Claude Code plugin implements the full Karpathy pattern:

**5 skills:**
- `/wiki-init` - scaffolds folder structure
- `/wiki-ingest` - processes raw source into wiki (asks what to emphasize first)
- `/wiki-query` - researches across wiki, offers to save answers as new pages
- `/wiki-lint` - severity-tiered reports (errors/warnings/info), offers fixes
- `/wiki-update` - shows diffs before writing, cites sources, sweeps for stale claims

**Architecture:** Pure markdown filesystem. `SCHEMA.md` anchors everything. Pages are flat, slug-named .md files in `wiki/pages/`. `index.md` catalogs all pages. Append-only `log.md` + evolving `overview.md`.

**Install:**
```bash
/plugin marketplace add kfchou/wiki-skills
/plugin install wiki-skills@kfchou/wiki-skills
```

---

## Should ZAO OS Use Obsidian?

**Yes, but as a VIEWER, not the primary workflow.**

ZAO OS development happens in Claude Code. The research library lives in `research/`. Moving to Obsidian would mean:
- Splitting the workflow between two tools
- Losing Claude Code's filesystem access advantage
- Adding complexity for no gain

Instead:
1. **Graphify generates an Obsidian vault** from `research/` - open it in Obsidian for visual browsing and graph view
2. **wiki-skills generates wiki pages** in markdown - viewable in Obsidian or any editor
3. **All actual work stays in Claude Code** - grep, read, write, commit

Obsidian is free for personal use. Install it, point it at `research/` or the Graphify output directory, and use the graph view to explore connections visually. But don't restructure the project around it.

---

## Nyk's 3-Layer Memory Architecture (What to Borrow)

Nyk (@nyk_builderz) described a 3-layer system that maps directly to what ZAO OS already has:

| Layer | Nyk's Version | ZAO OS Equivalent | Gap |
|-------|--------------|-------------------|-----|
| **Layer 1: Session Memory** | CLAUDE.md + auto-memory directory | CLAUDE.md + `~/.claude/projects/.../memory/` | None - already implemented |
| **Layer 2: Knowledge Graph** | Obsidian vault + MCP bridge | research/ library (338 docs) | Add Graphify for graph + wiki-skills for queryable wiki |
| **Layer 3: Ingestion Pipeline** | brain-ingest for video/audio | `/zao-research` skill for web research | Add brain-ingest for YouTube/podcast sources |

**Key insight from Nyk:** "The thing that killed every wiki is the exact thing agents are built for." Agents don't get bored with maintenance. They don't skip updates because they're late for a meeting.

---

## ZAO OS Integration

### What to Build Today

1. Install wiki-skills: `/plugin marketplace add kfchou/wiki-skills`
2. Install Graphify: `pip install graphifyy && graphify install`
3. Create `research/changelog.md` - append-only chronological log:

```markdown
# Research Changelog

| Date | Doc # | Title | Topic |
|------|-------|-------|-------|
| 2026-04-08 | 297 | Graphify Knowledge Graph | dev-workflows |
| 2026-04-08 | 298 | Claude Token Optimization | dev-workflows |
| 2026-04-08 | 299 | LLM Knowledge Bases | dev-workflows |
```

4. Run Graphify on research/: `/graphify ./research`
5. Run wiki-skills init: `/wiki-init` in a new `research-wiki/` directory
6. Ingest top 10 most-referenced research docs into the wiki

### Files to Touch

- `CLAUDE.md` - already updated with context budget (Doc 298)
- `research/changelog.md` - NEW, append-only research log
- `.claude/settings.json` - add wiki-skills plugin config
- `research/README.md` - add link to changelog

### What NOT to Do

- Don't restructure `research/` into Karpathy's raw/wiki/outputs pattern - existing structure works
- Don't install Obsidian MCP servers - overkill for our setup
- Don't replace `/zao-research` skill with wiki-skills - they complement each other
- Don't batch-ingest all 338 docs - start with 10, refine, expand

---

## Limitations & Honest Assessment

- **Context window ceiling** - even 128K tokens only holds ~96K words. At 338 docs (5.9MB), the wiki index approach is essential. Direct reading doesn't scale.
- **Error compounding** - AI writes a wiki page with subtle mistake, you query against it, mistake enters answer, filed back. Monthly lint checks are non-negotiable.
- **Cost** - each wiki-ingest touching 10-15 pages costs $2-5 in tokens. 338 docs = $670-1690 for full ingestion. Start with 10-20 most important docs.
- **Graph drift** - Graphify's graph can drift when merging new files. Full re-index every 2-3 weeks.
- **Single-model blind spots** - entire wiki is one model's interpretation. For critical decisions, cross-check.

---

## Sources

- [Karpathy's original post](https://x.com/karpathy) - April 2, 2026, the post that started it all
- [God of Prompt's full guide](https://x.com/godofprompt/status/2041265656893489419) - step-by-step with copy-paste prompts
- [Nyk's Claude + Obsidian 3-layer stack](https://x.com/nyk_builderz/status/2030904887186514336) - 1.2M views, 3-layer architecture
- [Hoeem's complete LLM knowledge base course](https://x.com/hooeem/status/2041196025906418094) - 886K views, beginner to advanced
- [kfchou/wiki-skills GitHub](https://github.com/kfchou/wiki-skills) - MIT, Claude Code plugin
- [Karpathy's GitHub Gist](https://gist.github.com/karpathy) - 5000+ stars, 1400+ forks
