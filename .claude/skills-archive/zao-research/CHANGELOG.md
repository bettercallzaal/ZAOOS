# ZAO Research Skill Changelog

## v2.0.0 — 2026-04-24

### Major Changes

**Closed gap between v1 (grep-only) and Zaal's stated need for community-source coverage.** Zaal asked: "does /zao-research even query the internet we should be having research on reddit and x and other platforms where knowledge sharing is happening." v2 makes this mandatory for [STANDARD] and [DEEP] tiers.

### What Changed

#### 1. Three-Tier Structure (NEW)
- [QUICK] — 10 min, 1-2 sources, official docs only. Sanity checks.
- [STANDARD] — 30 min, 5-7 sources, community coverage required. Default tier.
- [DEEP] — 2 hours, 20+ sources, full community scan + contradiction checks. For critical decisions.
- [DISPATCH] — Sub-agent parallelization for hub topics (10+ dimensions).

**Why:** Zaal runs parallel sessions (QuadWork) with varying time budgets. Tier system lets him pick depth vs speed. Hub topics like _zaostock-hub (20 dimensions) need parallel sub-agents, not serial bottleneck.

#### 2. Mandatory Community-Source Coverage (NEW)
- [STANDARD] tier MUST include: 1 Reddit search + 1 HN search + 1 GitHub Discussions thread + 1 verified external URL
- [DEEP] tier MUST include: 3-5 Reddit threads + 3-5 HN threads + 2-3 GitHub Discussions + X/Twitter sentiment + 2-3 blog posts

**Tools recommended:** WebSearch filtered to reddit.com + news.ycombinator.com, exa semantic search for blogs/X, GitHub CLI for Discussions, firecrawl for paywalled content.

**Why:** v1 research was codebase + existing research + grep.app + generic web search. Missing: what actual humans are discussing on Reddit, HN, GitHub, Twitter. These are gold for real-world pain points + community adoption signals.

#### 3. Parallel-Session Safety (NEW)
- Before writing: `git fetch origin` + check for collisions across parallel sessions
- Claim doc number via `ws/research-{topic-slug}` branch to prevent two simultaneous `/zao-research` calls from overwriting
- Reserve folder before research begins

**Why:** Zaal uses QuadWork (4 parallel Claude Code sessions). v1 had no safeguard. Two sessions could reserve same doc number. v2 enforces git-based claiming pattern.

#### 4. Staleness Protocol (NEW)
- Every doc carries `last-validated: <date>` in metadata frontmatter
- SLA: docs valid for 30 days. After that: re-validate or mark superseded
- Distinguish hallucination (invented) from staleness (outdated retrieved info) from parsing error (malformed URL)

**Why:** Research failure #1 is stale information (60%+ of RAG failures in production, 3-13% hallucinated citations, 5-18% link rot per 2026 research). v1 had no staleness detection. v2 flags docs that need refreshing. When ZOE + future agents ingest research via MCP, staleness metadata lets them decide whether to trust or re-fetch.

#### 5. Retrieval-Friendly Metadata (NEW)
Mandatory frontmatter:
```yaml
topic: [category]
type: [guide|comparison|decision|audit|market-research]
status: [research-complete|draft|review-pending|superseded]
last-validated: [date]
superseded-by: [doc number if outdated]
related-docs: [comma-separated doc numbers]
tier: [QUICK|STANDARD|DEEP|DISPATCH]
```

**Why:** Future extraction to MCP server (agents querying research library) requires machine-readable structure. Enables "Also see" linking, RAG filtering, agent discovery.

#### 6. Action Bridge Table (NEW)
Every doc ends with "Next Actions" table:
```
| Action | Owner | Type | By When |
| Update config X | Zaal | PR | 2026-05-01 |
| Create ZOE task Y | Team | Bot task | Next sprint |
```

**Why:** v1 research docs stayed archived, rarely linked forward. v2 forces explicit connection: research → concrete action (PR, todo, bot task, meeting). Increases research impact.

#### 7. Failure Mode Classification (NEW)
Explicit handling for:
- Hallucinated URLs (3-13% rate) → Wayback Machine + manual verification
- Stale info (5-18% link rot, 60%+ RAG failures) → Timestamp every claim, re-validate >30 days
- Paywalled content → firecrawl with JS rendering fallback
- Rate limiting → graceful degradation, note "rate-limited" in doc
- Context collapse (late-stage hallucination on long research) → Flag contradictions explicitly
- Metadata fabrication (78.5% of phantom citations) → Extract from page headers, never infer

**Why:** v1 had no failure handling. Production deep research agents (OpenAI, Perplexity) hallucinate at detectable rates. v2 acknowledges real failure modes and provides recovery strategies.

#### 8. MCP Tool Integration (CLARIFIED)
Recommended tool order:
1. context7 (library docs)
2. exa (semantic web)
3. firecrawl (JS rendering, paywalls)
4. WebSearch (fallback)
5. grep.app (code search)

v1 only mentioned grep.app + GitHub CLI + WebFetch. v2 integrates modern MCP landscape.

#### 9. Hub Dispatch Pattern (NEW)
For topics with 10+ dimensions (strategy, architecture, market analysis):
- Spawn 5-10 sub-agents in parallel
- Each sub-agent researches their dimension (cost, latency, security, team, integration, etc.)
- Parent agent synthesizes into hub README with cross-linked sub-docs
- Example: _zaostock-hub pattern (already in use last night) now formalized

**Why:** Zaal already using this pattern. Formalizing it removes serial bottleneck for large research efforts.

### What Stayed the Same

- Core workflow: understand → search existing → search code → research → save → commit → PR
- Research library location: `/Users/zaalpanthaki/Documents/ZAO OS V1/research/`
- Topic folder structure (agents/, music/, dev-workflows/, etc.)
- Banned phrases (no "consider using", no "it depends", etc.)
- Requirement for numbered docs with README.md template
- Single-source-of-truth principle

### What You Need to Do

- **No backfill required.** v1 docs stay valid. v2 applies to new research only.
- **Pick a tier** when invoking `/zao-research`. Default: [STANDARD].
- **Community sources** are now mandatory for [STANDARD]/[DEEP] tiers. You'll see WebSearch filtered to reddit.com, HN Algolia, GitHub Discussions in step output.
- **Metadata frontmatter** on all new docs. Copy-paste from template, fill in topic/type/status/tier.
- **Action bridge table** on all new docs. Link research to next concrete action.
- **Parallel-session discipline:** Always `git fetch` before researching. Use `ws/research-{topic}` branch name to claim your doc number.

### Migration Example

**Old (v1):** `/zao-research "farcaster protocol updates"`
- Output: Research doc with Key Decisions + comparison table + GitHub links + grep.app results
- Action: Search results archived, maybe linked from community.config.ts later

**New (v2):** `/zao-research "farcaster protocol updates" --tier STANDARD`
- Output: Research doc with same Key Decisions + comparison table, PLUS:
  - 1 Reddit r/Farcaster or r/ClaudeAI thread synthesized
  - 1 HN thread with discussion context
  - 1-2 GitHub Discussions from official Farcaster repos
  - Metadata: topic=farcaster, type=guide, status=research-complete, last-validated=2026-04-24, related-docs=123,456
  - Action bridge: "Recommend X to team -> PR to community.config.ts due 2026-05-01"
- Action: Doc is discoverable, linked forward, auto-refreshed after 30 days

### Why v2 Matters for ZAO OS

1. **Community signal.** ZAO OS is a gated Farcaster community. Understanding where the community is talking (Reddit, HN, GitHub, X) informs product decisions.
2. **Staleness safeguard.** As research library grows to 500+ docs, stale info is a risk. v2 flags it.
3. **Parallel-session safety.** Zaal uses QuadWork. v2 prevents collisions.
4. **Bot integration ready.** When ZOE + future agents query research via MCP, metadata + action bridge = structured input for agents.
5. **Zaal's explicit ask answered.** He asked for community-source coverage. v2 delivers it.

### Known Limitations

- [DEEP] tier takes 2+ hours. For very large topics, use [DISPATCH] sub-agent pattern.
- Staleness detection is manual (every 30 days). Future: automated staleness checker MCP.
- Community-source coverage still relies on WebSearch + exa. If Reddit/HN API access improves, performance improves.
- Action bridge requires discipline — skill won't auto-create PRs, just document the intent.

### Next: v2.1 Roadmap

- Automated staleness checker MCP server
- Reddit MCP + HN Algolia API wrapper MCPs (if not available by then)
- Research library extraction to shared MCP resource server
- Automated "Also see" linking based on metadata.related-docs
- Hallucination detection helper tool (URL liveness check via Wayback Machine)
