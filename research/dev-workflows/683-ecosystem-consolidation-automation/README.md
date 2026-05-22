---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 460, 467, 524, 527, 661, 663, 676, 677
tier: DISPATCH
---

# 683 - ZAO Ecosystem Consolidation + Automation Audit (DISPATCH)

> **Goal:** Doc 661 audited the ZAOOS codebase; doc 663 inventoried the 30+ repos + research library. This audit adds the lens neither covered: across 5+ bots, 2 VPSes, 5 websites, 30+ repos and ~150 skills - what should MERGE, and what manual step should AUTO-FLOW. 5 parallel sub-agents ran the four friction areas Zaal flagged; this hub ranks every opportunity and isolates the cheap wins buildable now.

## Headline

The ZAO operation is not short on tooling - it is short on SHARED tooling. Every Telegram bot re-implements the same grammy loop, the same Letta 4-block memory, the same Octokit SHA-dance. Every repo re-copies CLAUDE.md, rules, and hooks. Every deploy is a hand-typed SSH session. The fix is not more building - it is extracting what already works into shared modules, git hooks, and one connective knowledge graph.

**22 opportunities found. 11 are cheap wins (difficulty <=3, high value). 2 are buildable safely this session with zero live-bot/VPS risk.**

## The 3 convergence findings (cited by 3+ sub-docs)

1. **The git-hook safety net is missing** - cited by 683a, 683c, 683d, 683e (4 of 5). No pre-commit secret scan, no pre-push branch guard. A Telegram bot token leaked into a session transcript this week; a parallel session stomped this very audit's branch mid-run. ZAOOS `.husky/` has only a bare collision-guard hook. **This is the #1 build.**
2. **Everything is copy-pasted, nothing is shared** - 683a (bot-core / memory-blocks / bonfire-writer duplicated across 3 bot repos, ~40% duplication), 683c (CLAUDE.md + rules + hooks + navy/gold theme re-copied across 8 repos). The ecosystem needs shared modules + a template repo, not more forks.
3. **The Bonfire KG should be the one connective seam** - 683a (cross-bot KG writer), 683b (newsletter reads the graph), 683e (every skill writes episodes). Today bots, research, and content are scattered; docs 676/677 already mapped the Bonfire as the shared brain. Wire it as the default sink.

## Cheap-wins build queue (difficulty <=3, high value)

Ranked by value/effort/risk. "Build now" = self-contained, zero live-bot/VPS risk, safe this session.

| # | Cheap win | From | Effort | Build now? |
|---|-----------|------|--------|------------|
| 1 | Pre-commit secret-scan + pre-push branch-guard hooks (`.husky/`) | 683a,c,d,e | ~1h | **YES** |
| 2 | Prune + restructure `MEMORY.md` (31.2KB, over the 24.4KB limit) | 683e | ~1h | **YES** (not in PR - it lives in `~/.claude/`) |
| 3 | Letta memory-block builder -> `bot/_shared/memory-blocks.ts` | 683a | 2h | greenlight (touches ZOE) |
| 4 | Cross-bot `bonfire-writer.ts` (spool + retry + secret-scan) | 683a | 4h | greenlight |
| 5 | Voice-consistency rules -> `bot/src/zoe/voice/index.ts` | 683b | 1.5h | greenlight (touches ZOE) |
| 6 | Post-draft link-inclusion check | 683b | 2h | greenlight (touches ZOE) |
| 7 | `zao-template` repo (CLAUDE.md + rules + hooks + CI scaffold) | 683c | 3h | greenlight (new repo) |
| 8 | `@zaos/pre-commit-hooks` npm package | 683c | 2h | greenlight (new repo) |
| 9 | Systemd unit template (one `.service.template`) | 683d | 2h | greenlight (VPS) |
| 10 | Unified `deploy.sh <bot-name>` | 683d | 3h | greenlight (VPS) |
| 11 | Cost tracking + daily fleet budget alert | 683a | 2h | greenlight (Supabase) |

## The 5 sub-docs

| # | Dimension | Top finding | File |
|---|-----------|-------------|------|
| 683a | Bot fleet consolidation | 6+ bots, ~40% duplicated code across 3 grammy repos; needs `bot/_shared/` core + one bonfire-writer | [683a/](./683a-bot-fleet-consolidation/) |
| 683b | Content + social automation | Clipboard copy-paste-to-Firefly is the manual bottleneck; Bonfire -> newsletter -> social chain can semi-automate up to the publish gate | [683b/](./683b-content-social-automation/) |
| 683c | Repo + site sprawl | 8 repos re-copy config; needs a `zao-template` + `@zaos/*` shared packages + a graduation script | [683c/](./683c-repo-site-sprawl/) |
| 683d | Infra + VPS ops | 2 VPSes, 0 automated deploys, env files hand-edited (a token leaked this way); needs deploy-on-push + systemd template | [683d/](./683d-infra-vps-ops/) |
| 683e | Skills + workflows + connective layer | MEMORY.md over its size limit; branch discipline keeps failing; Bonfire should be the connective seam every skill writes to | [683e/](./683e-skills-workflows-connective/) |

## Recommended sequence

| Wave | Ship | Why first |
|------|------|-----------|
| 0 (this session) | Git hooks (#1) + MEMORY.md prune (#2) | Zero risk, security-critical, both actively broken right now |
| 1 | `bot/_shared/` extraction (#3, #4) | Stops the 40% duplication bleed before any new bot is added |
| 1 | `zao-template` + `@zaos/pre-commit-hooks` (#7, #8) | New repos inherit the safety net automatically |
| 2 | Deploy-on-push + systemd template + `deploy.sh` (#9, #10) | Kills the hand-SSH deploy + the env-leak risk |
| 2 | Voice rules + link-check + cost tracking (#5, #6, #11) | Content polish + fleet observability |
| 3 | Bonfire as default sink for all bots + skills | The connective seam - depends on Wave 1 modules |

## Hard numbers

- 5 sub-agents, ~22 consolidation/automation opportunities, 11 cheap wins
- ~40% code duplication across 3 grammy bot repos (683a)
- 8 Next.js repos each independently re-replicate the navy `#0a1628` / gold `#f5a623` theme (683c)
- `MEMORY.md` is 31.2 KB against a 24.4 KB hard limit - 28% over, index truncates (683e)
- 2 VPSes, 0 automated deploys - 100% hand-typed SSH (683d)
- ~150 skills available; multiple overlapping (3 plan-review skills, several research skills) (683e)
- 1 leaked token + 1 stomped branch this week - both preventable by a single `.husky/` change

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build cheap win #1 - secret-scan + branch-guard git hooks | Claude (this session) | PR | This session |
| Prune + restructure `MEMORY.md` under the size limit | Claude (this session) | Memory edit | This session |
| Greenlight cheap wins #3-#11 for build | @Zaal | Decision | After reviewing this doc |
| Extract `bot/_shared/` (memory-blocks + bonfire-writer) | next session | PR | Wave 1 |
| Create `zao-template` repo + `@zaos/pre-commit-hooks` | @Zaal + next session | New repos | Wave 1 |
| Wire deploy-on-push GitHub Action (needs VPS SSH key as repo secret) | @Zaal + next session | PR + repo secret | Wave 2 |

## Also See

- [Doc 661](../661-zaoos-codebase-audit-may-2026/) - ZAOOS codebase audit (drift, dead code, graduation)
- [Doc 663](../663-zao-research-meta-audit-2026-05-17/) - ecosystem repo inventory + research-library hygiene
- [Doc 676](../../agents/676-bonfires-kg-utilization/) - Bonfire knowledge-graph utilization (the connective seam)
- [Doc 677](../../agents/677-bonfire-cowork-github-connection/) - GitHub-events-to-Bonfire pipe (deploy-automation model)

## Sources

- 5 sub-docs above, each STANDARD-tier with its own codebase + VPS + research investigation
- Docs 460, 467, 524, 527 - prior ZAO agentic-stack + bot-fleet + multi-bot-coordination research
- Docs 661, 663 - prior ZAOOS codebase + ecosystem audits this doc builds on
- Live investigation: ZAOOS `bot/src/` tree, `.husky/`, both VPSes via SSH, `~/.claude/skills/` + `~/.claude/projects/.../memory/`
