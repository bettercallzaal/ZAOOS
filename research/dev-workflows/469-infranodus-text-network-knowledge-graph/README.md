# 469 - InfraNodus: Text Network Analysis + Knowledge Graph for ZAO Discourse

> **Status:** Research complete
> **Date:** 2026-04-21
> **Goal:** Evaluate InfraNodus (https://infranodus.com) as a discourse/content gap analysis tool for ZAO — complementary to existing Graphify (Doc 297) and ZAO Knowledge Graph (Doc 271)
> **Related:** Doc 297 (Graphify codebase graph), Doc 271 (ZAO member graph), Doc 309 (Karpathy LLM wiki), Doc 299 (LLM knowledge bases)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Adopt InfraNodus for discourse analysis** | USE Advanced tier (€32/mo or €204/yr) — unique structural gap detection + MCP integration not available in Graphify |
| **Do NOT replace Graphify** | KEEP Graphify (free, MIT, already installed) for codebase + 240+ research doc indexing. InfraNodus covers different territory (discourse, ideation, content gaps) |
| **Primary use case** | Feed ZAO cast archive + fractal transcripts + newsletter corpus to find content gaps for `/socials` and `/newsletter` skills |
| **Integration method** | Wire `mcp.infranodus.com` MCP server into ZOE (VPS 1 + portal) — call `graphAndStatements` API on ZAO text corpora on demand |
| **Obsidian plugin** | INSTALL on Zaal's local vault if a vault exists — adds 3D graph + betweenness centrality to notes |
| **Enterprise tier** | SKIP — €9,900/yr + €2,900 setup not justified until 1,000+ member discourse scale |
| **Trial first** | 14-day free trial → test on `research/_graph/` corpus + last 90 fractal transcripts before committing |
| **Content workflow** | POST-trial: add `/content-gaps` skill that runs InfraNodus on newsletter backlog + ZAO cast stream weekly; feed gaps to `/socials` + `/newsletter` |

---

## Comparison of Options

| Tool | Strength | Cost | License | ZAO Fit | Gap Detection | MCP |
|------|---------|------|---------|---------|---------------|-----|
| **InfraNodus** | Structural gap detection, discourse analysis, built-in GPT-5 chat, Leiden clustering + betweenness centrality | €12-66/mo (Basic-Premium), €9900/yr Enterprise | Proprietary SaaS | HIGH — discourse/ideation/content | YES (unique) | YES (`mcp.infranodus.com`) |
| **Graphify** (Doc 297) | Codebase + research doc indexing, 71.5x token reduction, tree-sitter + Claude Vision | Free | MIT | HIGH — already installed, `/graphify` skill | NO | Via serve.py stdio |
| **GitNexus** | IDE-integrated code graph queries | Free tier | Proprietary | MEDIUM — code-focused | NO | No |
| **pgvector (Supabase)** | Embeddings similarity search | Included w/ Supabase | Apache-2.0 | MEDIUM — semantic search, no gap detection | NO | No |
| **Manual grep + Claude** | Baseline, zero setup | Free | N/A | LOW for 240+ docs | NO | N/A |
| **Obsidian graph view (stock)** | Basic backlink viz | Free | GPL | LOW — no AI, no gaps | NO | No |

**Conclusion:** InfraNodus is not a Graphify replacement. It fills the gap-detection + ideation slot Graphify does not cover. Run both in parallel for different corpora.

---

## What InfraNodus Actually Does

### Core Method

Text → words-as-nodes + co-occurrence-as-edges graph → Leiden community detection → betweenness centrality ranking → **structural hole (gap) detection** between clusters.

**Unique feature:** highlights *undiscovered connections between topical clusters* as innovation opportunities. Graphify tells you what's there. InfraNodus tells you what's missing.

### Data Ingestion (13+ sources)

PDF, markdown, TXT, CSV, Google Search, Google Scholar, YouTube transcripts, Amazon reviews, RSS, X/Twitter, arbitrary websites, Evernote, Obsidian vaults.

### AI Integration

- Built-in GPT-5 chatbot for summaries, research questions, insight generation
- MCP server at `mcp.infranodus.com` → any MCP client (Claude, Cursor, ChatGPT)
- n8n official node for workflow automation
- API access: `https://infranodus.com/api/v1/graphAndStatements` (Bearer token)
- Response format: Graphology JSON or DOT
- VSCode/Cursor extensions, Chrome/Firefox/Safari browser extension

### Pricing (exact, EUR, VAT excluded)

| Tier | Monthly | Annual | Upload | PDF | AI credits/hr | API |
|------|---------|--------|--------|-----|---------------|-----|
| Basic | €12 | €84 (35% off) | 300KB | - | 40 | NO |
| Advanced | €32 | €204 (35% off) | 2MB | 5MB | 80 | YES |
| Premium | €66 | €156 (16% off) | 10MB | 50MB | 200 | YES |
| Enterprise | - | €9,900/yr + €2,900 setup | Dedicated | Self-hosted | Unlimited | YES |

14-day trial all tiers. Student discount available.

---

## ZAO Ecosystem Integration

### Why ZAO specifically needs gap detection

ZAO has massive text corpora growing fast:
- **240+ research docs** in `research/` (indexed by Graphify, but no gap detection)
- **90+ weekly fractal meeting transcripts** (Fractal Bot archive, `data/history.json` on VPS)
- **100+ member bios + community profiles** (`Supabase community_profiles`)
- **ZAO cast archive** (Neynar) — thousands of casts across governance, music, Spaces
- **Newsletter backlog** (`docs/daily/*.md`)
- **Research aspirations** in `research/newfiles/` and ideation dumps

Right now nothing surfaces "what hasn't been discussed." InfraNodus does exactly that.

### Concrete ZAO use cases

| Use Case | Corpus | Output | Downstream |
|----------|--------|--------|------------|
| **Newsletter gap** | `docs/daily/*.md` + recent ZAO casts | Topics clustered + 3-5 structural gaps | Feed gaps to `/newsletter` skill as draft prompts |
| **Socials angle discovery** | Last 30d ZAO casts + trending Farcaster topics | Unclaimed intersection clusters | Feed to `/socials` skill for angle selection |
| **Fractal theme evolution** | 90+ weeks fractal transcripts | Theme drift + emergent topics over time | Doc 273 (fractal vision) updates, OREC seed |
| **ZAO Stock positioning** | Competitor festival content (Burning Man, SXSW, AFROPUNK) vs ZAO messaging | Positioning gaps | Doc 448 (ZAO Stock pitch) angles |
| **Artist discovery** | `community_profiles` bios + onboarding surveys | Underrepresented genre/style clusters | Magnetiq connection suggestions |
| **Research roadmap** | `research/_graph/KNOWLEDGE.json` + `research/newfiles/` | Missing research areas | Seed `/zao-research` + `/autoresearch` queries |
| **Governance surface** | ORDAO proposals + Snapshot discussions | Topics lacking consensus | Surface to Fractal Bot agenda |

### Integration path (concrete)

1. **Portal**: `infra/portal/bin/bots/` — add `content-gaps` bot that pulls last 30d casts + newsletter backlog, calls InfraNodus API, posts gaps to `zoe.zaoos.com` dashboard
2. **ZOE MCP config**: add `mcp.infranodus.com` to VPS 1 ZOE MCP server list (see `/vps` skill)
3. **New skill**: `.claude/skills/content-gaps/SKILL.md` — wraps API call + gap report into `/content-gaps <corpus>` invocation
4. **Weekly cron**: `cron` trigger runs gap analysis Monday 6am ET, posts to Telegram for Zaal's morning brief
5. **Obsidian plugin**: install on Zaal's local vault (if any) for personal ideation

### Parallel with existing work

| ZAO Asset | Tool | Why |
|-----------|------|-----|
| Codebase (863 .ts/.tsx) | Graphify | Tree-sitter AST, free, already running |
| 240+ research docs | Graphify (primary) + InfraNodus (gap check monthly) | Graphify for retrieval, InfraNodus for "what's missing" |
| Member identity graph | ZAO KG (Doc 271) | Custom schema, on-chain + off-chain joins |
| Discourse (casts, transcripts, newsletter) | **InfraNodus** | Gap detection + ideation — no other tool does this |
| External market research (competitors, Farcaster trends) | **InfraNodus** | Imports Google Search + X directly |

### Karpathy LLM wiki connection

YouTube "Fix Karpathy's LLM Wiki with Knowledge Graph" demos exactly this stack: Claude Code + Obsidian + InfraNodus. This aligns with Doc 309 (Karpathy LLM wiki codebase compiler). If Zaal pursues Doc 309's vision for a ZAO LLM wiki, InfraNodus is the viz/gap layer.

---

## Risks + Gotchas

- **Proprietary SaaS**. Not MIT. Data uploaded to their servers (unless Enterprise self-host). Do NOT upload private member PII, private fractal transcripts with real names, or `community.config.ts` admin data.
- **EU VAT** adds ~20% in some jurisdictions. Zaal in US — not applicable.
- **API pricing unclear** beyond "higher limits for Advanced+". Confirm actual token/call limits via trial before committing to annual.
- **Token usage** — GPT-5 calls burn credits fast; 80/hr on Advanced could be a bottleneck for weekly full-corpus runs. Premium (200/hr) safer for production cron.
- **Gap detection is heuristic**. It surfaces candidates, not truth. Always human-review before shipping to newsletter/socials.
- **Data residency** — EU servers. If ZAO ever needs SOC2/HIPAA-equivalent, only Enterprise tier works.

---

## Decision Matrix

| If Zaal wants... | Action |
|-----------------|--------|
| Quick win (content ideation) | Start 14-day Advanced trial, feed 30d casts + newsletter backlog, see if gaps produce usable angles |
| Deep integration (ZOE MCP, cron) | Advanced annual €204/yr + build `content-gaps` skill + portal bot |
| Enterprise scale (1000+ members, private transcripts) | Enterprise €9,900/yr self-host — NOT NOW, revisit Q4 2026 |
| Skip entirely | Relies on Graphify-only — loses gap detection, keeps codebase/research coverage |

**Recommended first move:** 14-day trial on Advanced. Test corpus: `docs/daily/*.md` + last 500 ZAO casts (Neynar export). Output: gap report. Ship decision: subscribe annually if gaps produce 2+ newsletter/social angles Zaal actually uses.

---

## Sources

- [InfraNodus homepage](https://infranodus.com/)
- [InfraNodus API page](https://infranodus.com/api)
- [InfraNodus Obsidian plugin](https://infranodus.com/obsidian-plugin)
- [InfraNodus MCP server docs](https://infranodus.com/docs/knowledge-graphs-llm-reasoning)
- [noduslabs/infranodus-obsidian-plugin (GitHub)](https://github.com/noduslabs/infranodus-obsidian-plugin)
- [Nodus Labs: Ecological Thinking](https://noduslabs.com/infranodus/)
- [ACM paper: InfraNodus — Generating Insight Using Text Network Analysis](https://dl.acm.org/doi/pdf/10.1145/3308558.3314123)
- [Fix Karpathy's LLM Wiki with Knowledge Graph (YouTube)](https://www.youtube.com/watch?v=yYSTsKo8moU)
- [G2 reviews 2026](https://www.g2.com/products/infranodus/reviews)
- [SaaSworthy April 2026](https://www.saasworthy.com/product/infranodus)
- [Related: Doc 297 — Graphify](../297-graphify-knowledge-graph-codebase/)
- [Related: Doc 271 — ZAO Knowledge Graph](../../identity/271-zao-knowledge-graph/)
- [Related: Doc 309 — Karpathy LLM Wiki](../../309-karpathy-llm-wiki-codebase-compiler/)
