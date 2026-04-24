---
topic: dev-workflows
type: skill-redesign
status: shipped
last-validated: 2026-04-24
related-docs:
  - ~/.claude/skills/zao-research/SKILL.md (v2)
  - ~/.claude/skills/zao-research/CHANGELOG.md
  - ../../events/_zaostock-hub/README.md (dogfooding example of v1)
  - ../../events/492-zaostock-sixsigma-ops-and-telegram-bot/README.md (another v1 output)
---

# 493 - /zao-research Skill v2 Redesign (Audit + Community-Source Mandate)

> **Status:** Shipped. SKILL.md + CHANGELOG.md live under `~/.claude/skills/zao-research/`.
> **Date:** 2026-04-24
> **Goal:** Fix the v1 skill's blind spots around community sources, tier-ing, parallel-session safety, and retrieval-friendliness.

---

## Key Decisions

| Decision | v2 choice | Why |
|----------|-----------|-----|
| Single mode vs tiers | USE three tiers (QUICK / STANDARD / DEEP) + a DISPATCH meta-pattern | Zaal's usage ranges from 5-min sanity checks to multi-hour hubs. One mode wastes time or skimps coverage. |
| Community sources | MANDATE Reddit + HN + GitHub Discussions at STANDARD+; X + blogs + contradiction checks at DEEP | v1 only mentioned grep.app + GitHub + WebSearch. Zaal called this out explicitly 2026-04-24. |
| MCP tool order | context7 first (library docs) > exa (semantic web) > firecrawl (hard-render pages) > grep.app (code) > WebSearch/WebFetch (fallback) | context7 has typed docs for 10k+ libraries; exa is semantic; WebSearch is last resort. |
| Doc metadata | ADD yaml frontmatter (topic, type, status, last-validated, superseded-by, related-docs) | Future MCP server for ZOE/agent queries needs structured metadata. |
| Parallel-session safety | USE `ws/research-<slug>` branches + reserve-then-write doc numbers | QuadWork runs 4 sessions; two simultaneous "find next number" calls can collide. |
| Duplicate prevention | MANDATE grep across topic README indexes + include "Also see" section linking related existing docs | 490+ docs, easy to accidentally re-research. |
| Staleness | ADD `last-validated: YYYY-MM-DD` header + rules for update vs supersede | v1 had no way to mark rot. |
| Action bridge | ADD "Next Actions" table mapping research -> PR / todo / ZOE task | Research without an action is shelfware. |
| Hub dispatch | ADD explicit pattern for 10+ dimension topics: parent doc dispatches sub-agents, synthesizes | Dogfooded on `_zaostock-hub` (20 dimensions). Worked but wasn't documented. |

## Pareto 80/20

Three changes do 80% of the work:

1. **Community-source mandate at STANDARD+**: Reddit/HN/GitHub Discussions required on every non-QUICK run. Biggest quality jump.
2. **Three tiers**: stops wasting 2 hours on sanity checks AND stops shipping half-research for strategic decisions.
3. **Yaml frontmatter + related-docs**: preps everything for the inevitable ZOE / RAG consumer.

## Audit of v1 (Current State → v2 Fix)

| Point | v1 | Verdict | v2 |
|-------|----|---------|-----|
| Requires community sources | No, mentions grep.app + WebSearch only | GAP | STANDARD mandates 1 Reddit + 1 HN + 1 GitHub; DEEP adds X + blogs |
| Leverages MCP tools beyond grep.app | No — context7, exa, firecrawl not mentioned | GAP | Explicit tool order, each tier specifies which to use |
| Has tiers | No, single mode | GAP | QUICK / STANDARD / DEEP + DISPATCH |
| Scales for hub topics (10+ dims) | No | GAP | DISPATCH pattern documents how to spawn parallel sub-agents |
| Integrates with memory/CLAUDE.md | No | GAP | Adds "check memory first" step before web research |
| Handles failure modes (paywall, rate-limit, hallucinated URL) | No | GAP | "Failure Modes + Graceful Degradation" section |
| Retrieval-friendly output | Loose format | WEAK | Mandatory yaml frontmatter |
| Prevents duplicate work | Yes but minimal step | WEAK | Strengthened: must grep topic README + write "Also see" block |
| Parallel-session safe | No | GAP | `ws/research-<slug>` branch + reserve pattern |
| Research -> action bridge | No | GAP | Mandatory "Next Actions" table |
| Staleness detection | No | GAP | `last-validated` header + update/supersede rules |
| Bot/agent interaction | Mentioned as "future option B" | WEAK | Frontmatter preps for MCP resource server |

## Modern research-agent patterns (2026 community consensus)

**Anthropic Claude Research feature:** multi-source retrieval with explicit citation, sub-agent dispatch, staged plan-execute-summarize. Source: Claude docs + HN commentary 2025-2026.

**Perplexity Deep Research:** 20-30 source threshold for "deep" mode, mandatory primary sources, contradiction-surfacing.

**OpenAI Deep Research:** hour-long multi-step plans, explicit reasoning traces. Heavy on o3-mini reasoning chain.

**LangGraph/AutoGen patterns:** state-machine research loops, human-in-the-loop gates, plan-review-execute.

**ECC `deep-research` skill:** firecrawl + exa MCPs. Per-iteration source deduplication.

Common thread: tier the work, require community + primary sources, dispatch for big topics, structured output for downstream consumption.

## Community-source findings (real URLs)

From the research pass that informed this redesign:

- [Ask HN: How do you and your team manage secrets day to day?](https://news.ycombinator.com/item?id=47718037) - 2025 thread, informed secrets-management direction
- [Ask HN: Handling Security as a Solo Dev?](https://news.ycombinator.com/item?id=44742671) - 2025, solo-dev patterns
- [HN on systemd-creds for single machines](https://news.ycombinator.com/item?id=41659853)
- [Ask HN: tools to manage secrets from env files](https://news.ycombinator.com/item?id=41629168)
- [Show HN: better-env alternative to .env](https://news.ycombinator.com/item?id=46021536) - Nov 2025
- [Top Secrets Management Tools 2026 (GitGuardian)](https://blog.gitguardian.com/top-secrets-management-tools-for-2024/)
- [DCHost SOPS + age + systemd guide](https://www.dchost.com/blog/en/the-calm-way-to-secrets-on-a-vps-gitops-with-sops-age-systemd-magic-and-rotation-you-can-sleep-on/)
- [Infisical vs Doppler vs Vault 2026 (PkgPulse)](https://www.pkgpulse.com/blog/infisical-vs-doppler-vs-hashicorp-vault-secrets-management-2026)
- [Doppler alternatives 2026 (Keyway)](https://www.keyway.sh/articles/doppler-alternatives)
- [Self-hosted secrets management tools (selfhosting.sh)](https://selfhosting.sh/best/secrets-management/)
- [Secrets Management 2026 (Webcoderspeed)](https://webcoderspeed.com/blog/scaling/secrets-management-2026)
- [Is Your API Key Still Running Naked? 2026 Guide](https://bizarro.dev.to/linou518/is-your-api-key-still-running-naked-the-complete-2026-secrets-management-guide-4m7n)

These sources drove the decision to mandate community coverage - they surfaced real 2025-2026 consensus that single-mode WebSearch was missing.

## v2 workflow (summary)

```
[user invokes skill] --> [parse tier + project context]
     |
     v
[read: existing research for this topic] --> if hits, summarize + stop OR extend
     |
     v
[Step: codebase grep]  (always)
     |
     v
[Step: community sources]  (STANDARD+)
     |           Reddit (r/*), HN (Algolia), GitHub Discussions,
     |           X (via exa), Lobsters, dev.to (as relevant)
     v
[Step: primary docs + code] (context7 + grep.app + WebFetch)
     |
     v
[Step: synthesize + write]
     |   - yaml frontmatter
     |   - Key Decisions (up top)
     |   - Comparison table 3+ options
     |   - Pareto 80/20
     |   - Also see (cross-links)
     |   - Next Actions table
     |   - Sources (3+ or 10+)
     v
[Step: commit on ws/research-<slug>, open PR]
```

For DISPATCH (hub topics 10+ dimensions): parent writes index + spawns sub-agents per dimension, each sub-agent runs STANDARD tier on its dimension, parent synthesizes.

## Migration plan

Back-compat:

- v1 docs (no yaml frontmatter) stay as-is. Not rewritten.
- v2 docs start 2026-04-24. All new numbered docs use v2 format.
- v1 indexes still work (events/README.md etc). v2 adds yaml-readable metadata for future MCP consumption.
- Dispatch pattern first formal dogfooding was `_zaostock-hub` (retroactively a DISPATCH example).

Breaking changes: none at reader level. The skill itself is stricter (will refuse to run STANDARD without a community source), but readers of research docs see no difference.

## Known limitations (v2.1 backlog)

- No automated staleness scan yet (a cron could grep `last-validated` older than N days and flag)
- No MCP resource server yet (would let ZOE/agents query research docs directly)
- No auto-cross-link when a new doc mentions topics covered elsewhere (rely on author's "Also see")
- X/Twitter coverage relies on exa semantic search (X API is paywalled)

## Next Actions

| Action | Owner | When | Status |
|--------|-------|------|--------|
| Dogfood v2 on next ZAOstock research request | Zaal + me | This week | pending |
| Decide on rolling out DISPATCH pattern for `_zaostock-hub` retroactively (add frontmatter) | Zaal | Optional | pending |
| Build a staleness-scan script (`scripts/research-stale.sh`) | Zaal | v2.1 | pending |
| Explore MCP resource server for research docs (ZOE consumption) | Zaal | v2.1 | pending |
| Update `/bcz-research` + `/bandz-research` with same tier/community mandate | Zaal | Later | pending |

## Also See

- `~/.claude/skills/zao-research/SKILL.md` (the v2 skill itself, 355 lines)
- `~/.claude/skills/zao-research/CHANGELOG.md` (1-page migration summary)
- [doc 425 Dashboard UI Lean Kanban](../../events/425-zaostock-dashboard-ui-lean-kanban-patterns/) (earlier research that would have benefitted from v2)
- [doc 459 Parallel workspace isolation](../459-parallel-workspace-isolation-zao-os/) (the branch-isolation pattern v2 reuses)
- [_zaostock-hub](../../events/_zaostock-hub/) (the 20-dimension hub that motivated DISPATCH)

## Sources

Community:
- [Ask HN: Secrets management day to day (2025)](https://news.ycombinator.com/item?id=47718037)
- [HN: systemd-creds discussion](https://news.ycombinator.com/item?id=41659853)
- [Show HN: better-env](https://news.ycombinator.com/item?id=46021536)

Tool landscape:
- [Keyway: Doppler alternatives 2026](https://www.keyway.sh/articles/doppler-alternatives)
- [selfhosting.sh: secrets management](https://selfhosting.sh/best/secrets-management/)
- [PkgPulse: Infisical vs Doppler vs Vault 2026](https://www.pkgpulse.com/blog/infisical-vs-doppler-vs-hashicorp-vault-secrets-management-2026)

Research agent patterns:
- [Perplexity Deep Research](https://www.perplexity.ai/) (product page, 2026 behavior)
- [LangGraph docs](https://langchain-ai.github.io/langgraph/) (state-machine research loops)
- [ECC deep-research skill](https://github.com/everything-claude-code) (MCP-heavy pattern)
