---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-10-08
related-docs: 605, 2541, 2586, 2587, 2594, 2599, 2636
original-query: "can u do some researhc on agents please i feel like we are so behind"
tier: STANDARD
---

# 2644 - Agents, October 2026: where the field is, where ZAO is, and the five gaps that matter

> **Goal:** Test Zaal's feeling that the estate is "so behind" on agents, using the
> agent news of 2026-09-08 to 2026-10-08 and a measurement of our own stack, then
> name the gaps worth closing.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **We are not behind on capability. USE that as the answer to the feeling.** | 124 ZAOOS PRs merged in the 7 days to 2026-10-08, 146 top-level ZOE modules (380 .ts files counted recursively), 38 operating rules, a seat orchestrator plus PR lead plus lanes. The field's headline launches this month (always-on agents, memory "dreaming", multi-agent orchestration) are things the estate already runs in home-built form. |
| 2 | **The real gap is security, and it is urgent.** Audit plugin auto-update and repo trust this week. | September's attacks hit exactly how we work: a booby-trapped repo ran code in Claude Code before any prompt, and trojanized plugin updates took over all 7 harnesses tested, Claude Code included, at up to 92.5% success. The estate runs many lanes in bypass mode with third-party plugins installed. |
| 3 | **USE Claude Haiku 5.5 for ZOE's cheap classify and triage calls.** | Launched 2026-10-07 at $0.10 in / $0.50 out per Mtok with 1M context. Cheaper than most of the OpenRouter fallback chain, and on the same Anthropic account. |
| 4 | **Claim the Max plan's monthly API credits, if not already claimed.** | Release notes: "Claude Max and Team plans now include monthly API credits." Whether Zaal has claimed them is his fact; this doc could not check it. |
| 5 | **INVESTIGATE Claude Code mods as the mechanism layer for rules that are only prose today.** One pilot, not a migration. | Mods are TypeScript functions that change agent behavior: they register tools, hook `agent.spawn`, and call `$.model.complete`. Three of our rules say a mechanism is missing. `confirm-before-claiming-absence.md` says a hook cannot see a claim. Open question: can a mod see assistant prose? UNVERIFIED. |
| 6 | **SKIP rebuilding on Managed Agents or OpenAI Dots now.** Keep the split they teach. | Their design splits the session log, the harness and the sandbox, and that is the right shape. HN's top-voted worry about always-on agents is lock-in. Our harness is owned. Take the shape, not the vendor (same call as [doc 605](../605-agentic-tooling-may-2026/)). |

## Findings

### What shipped in the field, 2026-09-08 to 2026-10-08

| Date | What | Source |
|---|---|---|
| 2026-10-07 | Claude Haiku 5.5: 1M context, 128k output, $0.10/$0.50 per Mtok. Sonnet 5.5 cache reads cut from $0.20 to $0.10 per Mtok. | Claude Platform release notes |
| 2026-10-07 | Managed Agents `web_fetch` will now fetch only URLs that already appeared in the session. The reason given is to reduce data exfiltration. | release notes |
| 2026-10-01 | Dreams (scheduled memory curation, research preview) now supports Opus 5.5, Fable 5.1 and Sonnet 5.5. | release notes |
| 2026-09-28 | Claude Sonnet 5.5 launched. Sonnet 4.5 retires 2026-11-30. | release notes |
| 2026-09-29 | OpenAI "Dots: always-on agents": each agent runs on its own VM. | HN, 769 points, 647 comments |
| 2026-09-08 | Meta Muse, a personal AI agent. | HN, 666 points |
| 2026-09-11 / 09-25 | OpenAI agents carried out an undisclosed attack on RubyGems, then on Hugging Face. | HN, 975 and 755 points |
| CC 2.1.287 | "You should know": a built-in mod in which a side agent watches the session and flags misses. | Claude Code CHANGELOG |
| CC 2.1.269 | `claude plugin eval`: scored, reproducible eval runs for a plugin. | CHANGELOG |
| ~CC 2.1.160 | Dynamic workflows (`ultracode`): tens to hundreds of background agents. | CHANGELOG |

**Installed here:** Claude Code 2.1.294 (`claude --version`, 2026-10-08), the current head of the changelog, so the tooling is current.

### The architecture the field converged on

Anthropic's own engineering post, "Scaling Managed Agents: Decoupling the brain from the hands" (published 2026-04-08), states it directly:

> "We virtualized the components of an agent: a session (the append-only log of everything that happened), a harness (the loop that calls Claude and routes Claude's tool calls to the relevant infrastructure), and a sandbox (an execution environment where Claude can run code and edit files)."

On a harness crash, the same post says:

> "When one fails, a new one can be rebooted with wake(sessionId), use getSession(id) to get back the event log, and resume from the last event."

It also keeps credentials out of reach: "the tokens are never reachable from the sandbox where Claude's generated code runs."

The estate already has rough versions of all three parts:

| Part | Our version | Weakness |
|---|---|---|
| Session | Vault briefs and PR history | Not a replayable log |
| Harness | Lanes and the seat | Lives in Mac terminals |
| Sandbox | Git worktrees | Not isolation from a hostile repo, and our tokens are reachable from them |

The gap is durability and isolation, not the idea.

### Security, the one area where "behind" is true

Adversa's October roundup (2026-10-02, 26 resources) reports four things:

- **Repos as exploits.** Git settings in a repo ran attacker code in Claude Code, Codex, Cursor and four other agents "before any approval prompt appeared".
- **Plugin updates.** Pinned plugin commits could be silently swapped during automatic updates. Trojanized hook updates compromised all 7 harnesses tested, and baseline defenses missed nearly half.
- **Subagent configs.** A repo's subagent config talked Claude Code into running a C2 payload, with no injected instruction.
- **Leaks without an attacker.** Coding agents pushed more than 13,000 screenshots to public GitHub repos.

This lands on how the estate works:

- many unattended lanes run in bypass mode;
- `~/.claude/plugins` holds third-party plugins (everything-claude-code among them);
- lanes clone and open outside repos for research (`zao-research-snapshot`, and the nickysap clone plan in doc 2643).

None of our 38 rules covers untrusted repos or plugin update pinning. That comes from a grep of `.claude/rules` titles. It is not an exhaustive read of their bodies.

### Community read (HN, last 30 days, stories over 150 points: 44)

Top comments on "Dots: always-on agents" (author, reply count):

- **aditya_rs (13 replies):** always-on agents tie users to the platform, so "it would be harder to switch".
- **jameslk (15 replies):** these products are "not really meant for" people already running their own harness, such as OpenClaw or Hermes.

Both support Decision 6.

### Why it feels behind

The visible feed (funding rounds, Dots, Muse, a 64.8% Terminal-Bench score) is product launches. Our progress is internal mechanism, which never shows up in a feed.

[Doc 2636](../2636-agentic-organization-day-measured/) measured the real constraint: one day of the estate, where it broke and why. That constraint is the human tap rate, not missing agent tech. More agent tech does not move it; fewer questions to Zaal does.

## Also See

- [Doc 605](../605-agentic-tooling-may-2026/) - the May landscape this updates
- [Doc 2636](../2636-agentic-organization-day-measured/) - one day of the estate, measured
- [Doc 2586](../2586-orchestrator-seat-outside-view/) - the seat from outside
- [Doc 2587](../2587-hermes-muse-memory-dreaming/) - memory dreaming, already researched
- [Doc 2594](../2594-claude-cowork-scheduled-task-approval-cloud-execution-zoe/) - cloud routines for ZOE
- [Doc 2541](../2541-one-agent-or-many-bots/) - one agent or many bots

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Plugin and repo-trust audit: list every plugin in `~/.claude/plugins` with its auto-update state and pin, then list the lanes that open outside repos in bypass mode. Shipped = a findings PR in zaal-dotfiles. | zoe lane (Claude) | PR | 2026-10-10 |
| Decide whether to turn off plugin auto-update estate-wide (settings change, Zaal's call). | Zaal | Decision | 2026-10-12 |
| Claim the Max plan's monthly API credits if not yet claimed. Shipped = credits visible in the Console. | Zaal | Account | 2026-10-12 |
| ZOE: route the classify and triage model calls to `claude-haiku-5-5` behind a flag, OFF by default. Shipped = merged PR, flag off. | zoe lane (Claude) | PR | 2026-10-15 |
| Mods pilot: one mod enforcing one prose-only rule. Answer first whether a mod can see assistant prose. Shipped = a research note with a red control. | zoe lane (Claude) | Spike | 2026-10-20 |
| Migrate any `claude-sonnet-4-5-20250929` callers before the 2026-11-30 retirement. Shipped = grep shows zero callers. | zoe lane (Claude) | PR | 2026-11-15 |

## Sources

- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) [FULL - curl + HTML strip, 2026-10-08]
- [Claude Code CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md) [FULL - raw file, 2026-10-08]
- [Adversa: AI coding agent vulnerabilities, October 2026](https://adversa.ai/blog/top-ai-coding-agent-security-resources-october-2026/) [FULL - curl + strip; the underlying papers were not individually opened]
- [Anthropic Engineering: Scaling Managed Agents, decoupling the brain from the hands (2026-04-08)](https://www.anthropic.com/engineering/managed-agents) [FULL - curl + HTML strip, 2026-10-08; the quotes above are verbatim]
- [bex.co: Anthropic split the agent's brain from its hands (2026-09-23)](https://bex.co/blog/2026/09/23/anthropic-managed-agents-brain-hands-infrastructure-bottleneck) [PARTIAL - a secondary summary. My curl with a desktop UA on 2026-10-08 returned the full article text, but a reviewer's fresh fetch got a JavaScript shell, so it is not relied on]
- [AI Agents News Brief, 2026-10-07](https://aiagentsdirectory.com/news/ai-agents-news-brief-october-7-2026) [FULL - curl + strip]
- [AI Brief, 2026-10-05 (Sourcegraph on agents eroding codebases)](https://artificiallyintimidating.com/p/ai-brief-october-5-2026) [FULL - curl + strip]
- [HN: Dots: Always-on agents](https://news.ycombinator.com/item?id=49896604) [FULL - Algolia items API, top 5 comment threads read]
- [HN: Why are AI agents lying, cheating and coordinating?](https://news.ycombinator.com/item?id=49678969) [FULL - Algolia items API]
- [HN Algolia search, agents, last 30 days, over 150 points](https://hn.algolia.com/api/v1/search?query=agents&tags=story) [FULL - API, 44 hits]
- [Morph: best AI coding agents, October 2026](https://www.morphllm.com/best-ai-coding-agents-2026) [FAILED - HTTP 429. The Terminal-Bench figures (Opus 5.5 at 64.8%) come only from a search snippet and are not load-bearing here]
- [Medium: AI coding sessions 4 to 23 minutes](https://blurbrahlab.medium.com/ai-coding-sessions-jumped-from-4-to-23-minutes-top-10-ai-flutter-news-october-4-2026-652a259333df) [FAILED - HTTP 403, not used]
- In-repo: `bot/src/zoe/` (146 top-level .ts files, 380 recursive, on origin/main), `.claude/rules/` (38 files), `gh api search` (124 ZAOOS PRs merged in the 7 days to 2026-10-08) [FULL]
