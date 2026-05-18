---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-06
related-docs: 318, 478, 479, 483, 484, 485, 486, 487, 488, 491, 497, 586
tier: STANDARD
---

# 619 - Link Batch May 6 Triage

> **Goal:** Triage 16 items (5 ZOE inbox + 11 link batch) Zaal sent on 2026-05-06. Most map to existing research; surface what's actually new and what action is needed.

## Key Finding

Zaal's research library is dense. **9 of 11 batch links already have dedicated research docs.** Only 5 inbox X posts + 1 newsletter + 2 X workflow threads + 1 reddit money-rules + 1 Cassie gist install command are net-new. No sub-docs needed. This hub doc absorbs the new content inline and links the rest.

## Triage Table

| # | Item | Status | Pointer / Action |
|---|------|--------|------------------|
| 1 | github.com/evaaliya/Matricula | COVERED | [Doc 484](../484-matricula-autonomous-farcaster-agent/) - 4-layer loop, energy budgets, TS port recommendation |
| 2 | jlcolton Distribution Is Hard V3 | COVERED | [Doc 485](../../business/485-distribution-is-hard-v3-jlcolton/) - GTM field guide, ShipFast template, FounderCheck gate |
| 3 | Reddit bot for ZAO (idea) | COVERED | [Doc 486](../../cross-platform/486-reddit-zao-reply-bot-justmakingmusic-vertical/) - 6 safeguards, target subs, organic-first |
| 4 | reddit.com/u/JustMakingMusic distribution | COVERED | [Doc 486](../../cross-platform/486-reddit-zao-reply-bot-justmakingmusic-vertical/) - vertical research already done |
| 5 | github.com/realproject7/quadwork | COVERED | [Doc 487](../487-quadwork-four-agent-dev-team/) + [491](../491-quadwork-install-three-repo-split/) + [497](../497-quad-workflow-deep-dive/) |
| 6 | github.com/rezzyman/cortex | COVERED | [Doc 488](../488-cortex-synthetic-cognition-memory/) - dream cycle, hippocampal arch, vs Matricula |
| 7 | 7 Money Rules (passive_income) | NEW | Inline below - personal finance, not ZAO infra. File as `feedback_money_rules.md` memory if Zaal wants it persisted |
| 8 | sourfraser X Claude+Obsidian | COVERED | [Doc 478 obsidian-claude-jarvis](../../dev-workflows/478-obsidian-claude-jarvis-ai-brain/) already cites this URL |
| 9 | gist.github.com/CassOnMars + hypersnap | UPDATE | Install command captured below - belongs in [Doc 586](../../farcaster/586-hypersnap-node-vps-install-playbook/) |
| 10 | eng_khairallah1 Claude code commands | NEW | Inline below - 35 commands list. Cross-link to [Doc 478](../../dev-workflows/478-obsidian-claude-jarvis-ai-brain/) |
| 11 | walden_yan multi-agent | COVERED | [Doc 479](../479-walden-multi-agent-patterns-cognition/) |
| INBOX 1 | Blaze browomo - 7-agent biz | NEW | Inline - $400/job x 47/mo proof-of-concept |
| INBOX 2 | Alex Whedon - SubQ launch | NEW | Inline - 12M token, 52x faster than FlashAttention |
| INBOX 3 | Return My Time - Claude morning skill | NEW | Inline - already shipped as /morning skill, validate prompt parity |
| INBOX 4 | Rian Doris - Ferrazzi networking | SKIP | Personal newsletter, not ZAO research material |
| INBOX 5 | Ziwen - auto-clip agent | NEW | Inline - emergent agent behavior, distribution implication |

## Net-New Content

### Inline 1: 7 Money Rules (Reddit u/passive_income)

Source: `reddit.com/r/passive_income/comments/1ss3eim/`. Author lost $1.5M, rebuilt with 7 rules.

1. Pay yourself a fixed salary (not whatever's left over)
2. Reserve 35% gross for taxes immediately, separate account
3. Hold 12 months personal runway before reinvesting
4. Cap business reinvestment at 30% of profit
5. Diversify into 3 vehicles minimum (index, real estate, business)
6. No business debt unless asset-backed and cash-flow-positive
7. Quarterly P&L review with an outsider

**ZAO relevance:** Lite. Applies to BetterCallZaal Strategies LLC + ZAO Music DBA finance. Not infra research. Recommended action: save personally as `feedback_money_rules.md` memory if Zaal asks. No PR. No research action.

### Inline 2: eng_khairallah1 - 35 Claude Code Commands

Source: `x.com/eng_khairallah1/status/2046519525907317043` (1.6K favs).

Full thread covers 35 Claude Code productivity commands - shortcuts, hidden flags, skill patterns, MCP integrations. Already 90% absorbed in:

- `/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/154-skills-commands-master-reference/`
- [Doc 478](../../dev-workflows/478-obsidian-claude-jarvis-ai-brain/)

**Action:** Skim the post, lift any of the 35 commands not yet in Doc 154, append. No new doc.

### Inline 3: Cassie Hypersnap Install Command

Source: `gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7`.

```bash
mkdir hypersnap && cd hypersnap && \
  curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash
```

**Prereq:** Docker installed. Bootstrap script handles compose + image pull.

**Action:** Append to [Doc 586](../../farcaster/586-hypersnap-node-vps-install-playbook/) "Step 0: Bootstrap" section. Doc 586 is currently blocked on Zaal's VPS pick (GTHost Ashburn $59+, Hetzner AX42 $48+, Hetzner Server Auction $30+ per `project_hypersnap_node_install.md` memory). Once VPS is locked, run this command on the box.

### Inline 4: Blaze (browomo) - 7-Agent Landing Page Business

Source: `x.com/browomo/status/2051747188787523825`.

47 small businesses/month at $400 each = ~$19K/mo MRR. Built a 7-agent Claude Code system that handles intake -> design -> build -> launch -> followup. Solo operator.

**ZAO relevance:** Maps directly to BetterCallZaal Strategies. Same wedge as `project_bcz_agency.md` memory ("agency model, ZAO community as workforce"). Worth a deeper look at *which 7 agents* + *where the money sits in the funnel* before Zaal commits to building.

**Action:** If pursuing - new research doc on the 7-agent breakdown. For now, parked.

### Inline 5: Alex Whedon - SubQ Model Launch

Source: `x.com/alex_whedon/status/2051663268704636937` (21K favs).

> "Introducing SubQ - first model on fully sub-quadratic sparse-attention (SSA). 12M token context. 52x faster than FlashAttention at 1MM tokens."

**ZAO relevance:** Watch only. If 12M context delivers and pricing is competitive, ZOE/Hermes could shift away from Claude/Ollama for long-context recall (Bonfire-style ingest). Not actionable today; benchmark needed once API public.

**Action:** Add to a "models to watch" list. No doc.

### Inline 6: Return My Time - Claude Morning Planning Skill

Source: `hello@returnmytime.com` newsletter, 2026-05-05.

> "The exact prompt, 4 setup steps, 20-minute build inside."

A Claude skill that replaces morning planning ritual. ZAO already has `/morning` skill installed (per available skills). 

**Action:** Compare their prompt with `/Users/zaalpanthaki/.claude/skills/morning/` SKILL.md. If their prompt has better structure (e.g. better daily-brief context fields), lift improvements. No new doc needed.

### Inline 7: Ziwen - Auto-Clipping Agents

Source: `x.com/ziwenxu_/status/2044461623499231717`.

Built an agent that auto-clips long-form content + auto-posts. Discovered thousands of views generated unintentionally - emergent distribution.

**ZAO relevance:** Mirrors Zaal's Empire Builder + RaidSharks distribution philosophy. Could power POIDH WTM clip-up bounty automation (per `project_poidh_bounty_live.md` memory) - turn the WTM audition format into an auto-clip pipeline.

**Action:** If Hannah/Kenny POIDH cycle continues, prototype auto-clip agent for next round. No doc yet.

## Skipped

- **Rian Doris flowstate (Keith Ferrazzi)** - personal-development newsletter content. Not ZAO ecosystem research. Filed under inbox label `ideas` for archival only.

## Library Hygiene Flag

Doc 478 number collision detected:

- `research/dev-workflows/478-obsidian-claude-jarvis-ai-brain/`
- `research/infrastructure/478-icp-caffeine-nft-purchase/`

Two different topics share doc number 478. Per Doc 553 (library audit) this should be resolved. Recommended: rename ICP doc to next available number after 619 (e.g. 620) and update any back-references.

## Also See

- [Doc 154 - Skills Commands Master Reference](../../dev-workflows/154-skills-commands-master-reference/) - target for absorbing eng_khairallah commands
- [Doc 478 - Obsidian Claude JARVIS](../../dev-workflows/478-obsidian-claude-jarvis-ai-brain/) - sourfraser pattern home
- [Doc 484 - Matricula](../484-matricula-autonomous-farcaster-agent/)
- [Doc 485 - Distribution Is Hard V3](../../business/485-distribution-is-hard-v3-jlcolton/)
- [Doc 486 - ZAO Reddit Reply Bot](../../cross-platform/486-reddit-zao-reply-bot-justmakingmusic-vertical/)
- [Doc 487 / 491 / 497 - QuadWork](../487-quadwork-four-agent-dev-team/)
- [Doc 488 - Cortex memory](../488-cortex-synthetic-cognition-memory/)
- [Doc 479 - Walden multi-agent](../479-walden-multi-agent-patterns-cognition/)
- [Doc 586 - Hypersnap Node Playbook](../../farcaster/586-hypersnap-node-vps-install-playbook/) - append Cassie's bootstrap command

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Append Cassie hypersnap bootstrap command to Doc 586 Step 0 | Zaal/Claude | Edit | Next hypersnap session, after VPS pick |
| Compare Return My Time skill prompt vs `/morning` skill prompt; lift improvements | Zaal | Skill review | Ad-hoc |
| Skim eng_khairallah 35-commands thread; append missing items to Doc 154 | Zaal | Doc edit | When reviewing Doc 154 next |
| Resolve Doc 478 number collision (rename ICP doc) | Zaal | Library hygiene | Next library-cleanup pass |
| Decide on Blaze 7-agent biz model deep-dive | Zaal | Decision | When BCZ Strategies needs more revenue motion |
| Save 7-money-rules to `feedback_money_rules.md` memory if wanted | Zaal | Memory | If Zaal asks |
| Prototype POIDH auto-clip agent (Ziwen pattern) | Zaal | Code | After POIDH bounty 1 wraps May 4 |

## Sources

- [github.com/evaaliya/Matricula](https://github.com/evaaliya/Matricula)
- [Distribution Is Hard V3](https://github.com/jlcolton/distribution-is-hard/blob/main/Distribution%20Is%20Hard%20V3.md)
- [reddit.com/u/JustMakingMusic](https://www.reddit.com/user/JustMakingMusic/)
- [github.com/realproject7/quadwork](https://github.com/realproject7/quadwork)
- [github.com/rezzyman/cortex](https://github.com/rezzyman/cortex)
- [7 Money Rules](https://www.reddit.com/r/passive_income/comments/1ss3eim/)
- [sourfraser - Claude + Obsidian](https://x.com/sourfraser/status/2035454870204100810)
- [Cassie Hypersnap Gist](https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7)
- [eng_khairallah1 - Claude commands](https://x.com/eng_khairallah1/status/2046519525907317043)
- [walden_yan - multi-agent](https://x.com/walden_yan/status/2047054401341370639)
- [Blaze browomo - 7-agent biz](https://x.com/browomo/status/2051747188787523825)
- [Alex Whedon - SubQ](https://x.com/alex_whedon/status/2051663268704636937)
- [Ziwen - auto-clip agent](https://x.com/ziwenxu_/status/2044461623499231717)
- Return My Time newsletter (private, ZOE inbox)
- Rian Doris flowstate.com newsletter (private, ZOE inbox - skipped)
