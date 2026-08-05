---
topic: identity
type: market-research
status: research-complete
last-validated: 2026-08-04
superseded-by:
related-docs: 2194, 1016, 1021
original-query: "overnight research on Reddit - topic 2: agent-native documentation adoption (llms.txt, llms-full.txt, .md-addressable pages, MCP servers) - follow-on to doc 2194 BaseHub"
tier: STANDARD
---

# 2196 - Agent-native docs, adoption reality: llms.txt is hygiene, MCP is the lever

> **Goal:** Doc 2194 recommended adopting basehub.org's agent-native pattern (llms.txt + .md + MCP) for ZAO. This checks what the developer community ACTUALLY found works - and it materially refines that recommendation.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **REFINE doc 2194: treat llms.txt/llms-full.txt as cheap set-and-forget HYGIENE, not a visibility lever.** Auto-generate it, then stop thinking about it. | Two large studies say it does not move AI citations: Ahrefs (137,210 domains, June 2026) found **97% of llms.txt files got zero requests in a month**; SE Ranking (300k domains) found no significant correlation - of the 50 most AI-cited domains, exactly **one** had an llms.txt. Google Search ignores them ("neither harm nor help"). |
| 2 | **Put ZAO's load-bearing facts in the HTML humans see + valid JSON-LD, NOT only in a side file.** | The live crawlers (the ones that fetch a page the moment someone asks an AI a question) read the HTML, not the `.md`/llms.txt. A fact that only lives in a companion file cannot reach the answer. This is the concrete GEO move ([[project_geo_zao_iconic]]). |
| 3 | **The real agent-utility lever is an MCP server over ZAO's canonical context, not the flat file.** ZAO already has the raw material: the ICM boxes + `useicm.com/api/objects/<id>/llm.txt`. Wrapping them in an MCP server (search + pull-relevant-section) is what agents actually use. | MCP hit **97M monthly SDK downloads** and **10,000+ servers** by late 2025, adopted by OpenAI/Google/Microsoft, and was donated to the Linux Foundation (Agentic AI Foundation) in Dec 2025. Docs-MCP servers beat flat files because the agent pulls only the relevant section (no context bloat). |

## Findings (grounded in real fetches)

### llms.txt: consumption is not influence

- **Proposed, not standardized.** Jeremy Howard (Answer.AI), Sept 2024 - a community idea, no involvement from Google/OpenAI/Anthropic. HN's recurring question ("does any provider actually use it?") has no confirmed yes.
- **The studies are unanimous it is not a citation lever.** Ahrefs 137,210 domains: 97% unread in a month; of bots that DID read them, 77% were not AI tools (mostly SEO audit crawlers). SE Ranking ~300k domains: removing llms.txt as a variable IMPROVED model accuracy - "noise, not signal."
- **Google's own tooling advanced then retreated inside two months:** Lighthouse v13.3 (2026-05-07) added an "agentic browsing" check for llms.txt into the default config; v13.4 (2026-06-09) disabled it in the PageSpeed Insights API. A missing llms.txt is "Not Applicable," never a failure.
- **Adoption numbers are inflated by platform defaults.** Shopify shipped `/llms.txt` + `/llms-full.txt` + `/agents.md` across all merchant sites on 2026-05-28 - a huge overnight count nobody individually chose.
- **The narrow REAL use is exactly ZAO's case:** developer/API docs and agent-facing reference material - and the training/indexing layer DOES consume the files. Notably, **Anthropic's Claude Code out-fetched every AI retrieval bot** on the files that were read. So the file is not useless for an agent-facing reference site (which is what basehub.org is) - it is just not an SEO/citation trick.

### MCP: the part that actually gets used

- **Scale:** MCP (Anthropic, Nov 2024) reached ~97M monthly SDK downloads and 10,000+ servers by late 2025; OpenAI adopted it across the Agents SDK + ChatGPT desktop (Mar 2025); Google shipped managed MCP servers; Anthropic donated MCP to the Linux Foundation (Dec 2025).
- **The "more builders than users" meme is half-true:** most PUBLIC MCP servers have ~0 users, but the Pragmatic Engineer deep-dive (46 engineers + FastMCP's creator) found the real usage is INTERNAL - teams giving their own people agent-access to internal data/docs. "The median MCP user wants to access my company's own data warehouse through an MCP server."
- **For docs specifically, docs-MCP servers beat flat files:** crawl docs -> chunk at headings (~512 tokens) -> BM25 + vector index -> expose `search_docs` / `get_chapters`. The agent pulls only the relevant section instead of loading a 4,000-line file. Multiple engineers cited **Context7** (the same MCP ZAO already uses) as how they "give agents up-to-date documentation and see fewer hallucinated APIs."

### The refinement to doc 2194

basehub.org did the RIGHT things (llms.txt + .md-on-every-URL + an MCP server), but the WEIGHTING doc 2194 implied was off. Corrected priority for ZAO's GEO surfaces:

1. Facts in HTML + JSON-LD (what live crawlers + humans read) - highest leverage.
2. An MCP server over the ICM boxes (what agents actually call) - the real agentic-web bet.
3. llms.txt/llms-full.txt/.md - cheap auto-generated hygiene; Claude Code does read it, so keep it, but do not expect citations from it.

## ZAO grounding

- ZAO already uses Context7 MCP (`CLAUDE.md` MCP Tooling section) and has the ICM boxes as canonical AI-readable context (`.claude/rules/icm-grounding.md`, `useicm.com/api/objects/<id>/llm.txt`). The gap is an MCP server that exposes the boxes as searchable tools - which this doc argues is the higher-leverage move than the llms.txt in doc 2194's action table.
- Ties to the GEO priority ([[project_geo_zao_iconic]], docs 1016/1021).

## Also See

- Doc 2194 - BaseHub agent-native content (this doc refines its recommendation)
- [[project_geo_zao_iconic]] - GEO = own "what is The ZAO"
- [[project_icm_boxes]] - the canonical AI-readable context an MCP server should wrap

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add JSON-LD structured data (schema.org/Organization) + the load-bearing ZAO facts into thezao.com HTML (not only a side file) - shipped when the page's rendered HTML carries the facts + valid JSON-LD | @Zaal | PR | 2026-08-22 |
| Prototype an MCP server over the ICM boxes (search + get-section tools, wrapping `useicm.com/.../llm.txt`) so agents pull ZAO context the way they pull Context7 - shipped when Claude Code can `mcp add` it and query a box | @Zaal | PR | 2026-09-01 |
| Downgrade the llms.txt action from doc 2194 to "auto-generate + forget" (keep it, deprioritize it) - decided when doc 2194's action table is annotated with this finding | @Zaal | Decision | 2026-08-11 |

## Sources

- [Ask HN: What's the Point of llms.txt?](https://news.ycombinator.com/item?id=44584951) - [FULL] via exa; publisher skepticism thread
- [Ask HN: Anyone using llms.txt on blogs? Worth it for AI search?](https://news.ycombinator.com/item?id=44759462) - [FULL] via exa; "ChatGPT says they don't use it" + Mintlify counterpoint
- [r/TechSEO - Do llms.txt files actually help websites appear in AI?](https://www.reddit.com/r/TechSEO/comments/1rl7pz1/) - [FULL] via exa; practitioners report no measured results
- [Is llms.txt Worth It? What SEO/GEO Reddit Really Thinks (2026-07-21)](https://powerfulcombo.com/blog/is-llms-txt-worth-it/) - [FULL] via exa; cites Ahrefs 137,210-domain + SE Ranking 300k studies, Google/Lighthouse/Shopify timeline
- [Building MCP servers in the real world - Pragmatic Engineer (2025-12-09)](https://newsletter.pragmaticengineer.com/p/mcp-deepdive) - [FULL] via exa; 46 engineers + FastMCP creator; internal-vs-public usage; Context7 citations
- [Giving AI agents knowledge they were never trained on - dev.to](https://dev.to/jgauffin/giving-ai-agents-knowledge-they-were-never-trained-on-5fd7) - [FULL] via exa; docs-mcpserver architecture (chunk + search tools)
- [I Built an MCP Server in Go to Fix a Problem Every AI Developer Has - Hylaine](https://hylaine.com/i-built-an-mcp-server-in-go-to-fix-a-problem-every-ai-developer-has/) - [FULL] via exa; MCP 97M downloads / 10,000+ servers / Linux Foundation donation

_Fetch method: exa web_search (reddit.com blocked to WebSearch UA; VPS reddit helper absent). Reddit coverage is one r/TechSEO thread - HN + dev blogs carry the bulk of the real practitioner signal here, so this leans HN/dev more than Reddit. Marked honestly._
