---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-04
superseded-by:
related-docs: "agents/2438-hermes-agent-concepts-zoe-runtime, agents/483-hermes-agent-local-llm-framework, agents/632-r-hermesagent-subreddit, agents/599c-hermes-agent-prior-art-reddit, agents/875-nousresearch-hermes-7day-setup-vs-zao-hermes, agents/2582-agent-context-improves"
original-query: "https://www.reddit.com/r/hermesagent/s/TyOeMRHS1M research this - [STANDARD] what this post is about, what Hermes Agent is, and what it means for The ZAO's agent setup (Claude Code lanes in Orca, one orchestrator seat, ZOE, Antigravity)"
tier: STANDARD
---

# 2587 - A Hermes user copied Meta Muse's memory layout and says results jumped: what is real, and what The ZAO already has

> **Goal:** Say what the r/hermesagent post claims, check the Muse memory design it copies against its source, say what Hermes Agent is, and decide what (if anything) changes for The ZAO's Claude Code lanes, orchestrator seat, ZOE and Antigravity.

## Source status, read this first

| Source | Status | Method |
|---|---|---|
| The Reddit post (`/s/TyOeMRHS1M` resolves to `r/hermesagent/comments/1wxu98g`) | **[FULL] post body, [FAILED] comments** | Body via `zao-fetch-reddit.sh` (Arctic Shift index). Comment tree: the Arctic Shift copy returned 0 comments and the live-thread `.json` read via the gstack browse daemon returned the page CSS, not JSON, so the live comment count is UNKNOWN. Every direct route (curl 403, old.reddit login wall, exa `CRAWL_LIVECRAWL_TIMEOUT`, Playwright bridge "Extension connection timeout", Wayback 404) failed; only the browse daemon resolved the share link. The post has score 1 in the index, so it is a fresh, unvalidated post. |
| mouse.dev Muse export blog (Sept 22, 2026) | [FULL] | curl + HTML strip, raw text read |
| HN thread 49802871 on that blog | [PARTIAL] top-level comments only, first 8 | Algolia items API |
| Hermes Agent README and `memory.md` docs | [FULL] | raw.githubusercontent.com via curl |
| NousResearch/hermes-agent repo stats and LICENSE | [FULL] | `zao-research-snapshot`, LICENSE read from the file (MIT, "Copyright (c) 2025 Nous Research") |

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **KEEP what we run. Do not adopt Hermes Agent, Muse, or the post's recipe wholesale.** | The post is one user's anecdote, score 1, no measurement, and his own use case is ADHD life coaching (calendar, todos, weekly reflections), not code lanes. He says the gain is "probably due to" Muse's memory design - he did not isolate it. |
| 2 | **ADOPT one idea as a small experiment: a nightly "dream" pass that synthesizes the day's logs into guidance, run for the vault, not for the lanes.** Owner Zaal to approve, one lane to build behind an off-by-default flag. | It is the only piece of the post's three that ZAO does not already have in some form (table below). Muse's version is documented: a nightly job reviews recent conversations and writes guidance for future sessions, and a separate synthesis file turns it into standing guidance. |
| 3 | **SKIP "daily memory md files" and "derived memory stores" as new work.** | ZAO already writes dated logs (`~/zao-vault/daily/`, per-lane `handoffs/status/*.md`) and derived stores (`BLACKBOARD.md`, `DECISIONS.md`, `SYSTEM_MAP.md`, `MISTAKES.md`). Re-building them under a Hermes-shaped name adds nothing. |
| 4 | **SKIP running Hermes Agent as a lane runtime or as the orchestrator seat.** | The seat is held through `zorca-lock` and `orca-board` (AGENTS.md registry), and lanes are Claude Code panes in Orca. Hermes Agent warns against two agents sharing one home: "Don't point two agent processes at the same Hermes home directory" because memory writes "compound each other's entries into state neither of them (nor you) authored". Our lanes share `~/zaal-dotfiles` and the vault by design. |
| 5 | **KEEP the naming-collision rule.** "Hermes" in ZAOOS means the in-repo autonomous PR runner (`bot/src/hermes/`), not Nous Research's Hermes Agent. Any doc or issue mentioning either must say which. | Already recorded in docs 632 and 599c; this post is the third time r/hermesagent content reached ZAO, so the collision will recur. |
| 6 | **Do NOT cite the post as evidence that dreaming improves output.** Cite it as a hypothesis with n=1. | Rules in the global CLAUDE.md: a prediction is written as a prediction, with the one thing it rests on. The one thing here is a single user's before/after impression of weekly reflection quality. |

## What the post says (3 lines)

1. Title: "I copied Muse's memory setup for my own Hermes agent and experienced significant improvement in results" (u/normVectorsNotHate, r/hermesagent, 2026-10-04 per the snapshot's last-activity stamp).
2. He is a long-time Hermes user running it for life management; he exported Hermes' jobs and skills into Meta's Muse, saw better pattern-spotting, traced it to Muse's memory design, then rebuilt that in Hermes: daily markdown memory files, derived memory stores per important concept, nightly "dreaming".
3. His evidence: weekly reflections used to be a recap of todos and calendar events despite a trend-finding prompt; after the change they "step up the abstraction ladder". He links the mouse.dev breakdown. No numbers, no controls.

## Findings

### 1. What Hermes Agent is (measured 2026-10-04)

| Fact | Value | Source |
|---|---|---|
| Maker, licence | Nous Research, MIT | LICENSE file read, not the API field |
| Stars / forks / open issues | 251,259 / 53,931 / 48,016 | `zao-research-snapshot` 2026-10-04, first look |
| Latest release | v2026.9.24 (2026-09-24) | `gh api releases/latest` |
| Pitch | "self-improving AI agent ... only agent with a built-in learning loop": agent-curated memory with periodic nudges, autonomous skill creation, FTS5 session search with LLM summarization, Honcho user modeling, built-in cron, subagents, gateway to Telegram/Discord/Slack/WhatsApp/Signal | README, quoted |
| Memory design | Two bounded files: MEMORY.md 2,200 chars (~800 tokens), USER.md 1,375 chars (~500 tokens), frozen into the system prompt at session start, no auto-compaction | `memory.md` docs |

Caution on the star count: 48,016 open issues on a 251k-star repo is a triage backlog, not a quality signal either way; quote both numbers together.

### 2. What Muse's memory actually is (from the Muse export blog)

Pete James (mouse.dev) asked Muse to archive its visible filesystem and got about 6.8 GB. His memory section, paraphrased tightly:

- `~/MEMORY.md` short curated sheet; dated files under `~/memory/` for day-to-day detail.
- An hourly job checks new claims against the original messages and records a quote, message IDs and a claim ID, then decides curated sheet versus daily log.
- `memory/bank/` organizes circumstances, experiences and preferences with citations back to source lines; Postgres tables `memory.entries`, `memory.embeddings` (384-dimensional) and `memory.claims`, with `supersedes_claim_id` so a newer claim replaces an older one.
- A nightly "dream" under `~/dreams/` reviews recent conversations and writes guidance; the dream files carried `prompt_hoisted: false`, so the prose was not being injected into the prompt directly. A separate `ALIGNMENT_SYNTHESIS.md` turns observations into standing guidance.
- Forgetting is a staged retraction that rebuilds the index so later jobs do not reconstruct it.

Two points the post leaves out. First, the post's "three pieces" drop the part that probably matters most for trust: claim verification against the source message and supersession. Second, the Muse blog is a security write-up that Meta marked "Not Applicable"; HN comments dispute the framing (one: "Each user gets dedicated VM. They got contents of their own sandbox"). That dispute is about the vulnerability claim, not about the memory layout, so the layout description stands as one researcher's reading of the export. Contradiction noted, not resolved: nothing in the export proves the dream pass causes better output.

### 3. ZAO's setup against the post's three pieces

| Post's piece | ZAO equivalent today | Gap |
|---|---|---|
| Daily memory md files | `~/zao-vault/daily/`, lane status files via `zao-status-append`, handoff bundles | None |
| Derived memory stores | `BLACKBOARD.md` (live state), `DECISIONS.md`, `SYSTEM_MAP.md`, `MISTAKES.md`, the research library; ZOE's `memory.ts` (955 lines) and `thread-memory.ts` | None on storage. Gap on **claim-level evidence and supersession**: our records cite files, not a quote plus a supersedes pointer |
| Nightly dreaming | Partial. `bot/src/zoe/reflect.ts` asks Zaal 3 questions at 9pm EST; `learn.ts` runs weekly over dispatch telemetry and proposes worker learnings that need Zaal's approval; ZOE nightly processing already commits docs to the repo (e.g. #3710) | No pass that reads the day's lane logs and writes standing guidance for the **next session**. This is the one real gap |

Orchestrator seat and Antigravity: per the AGENTS.md registry, Antigravity is the idea-interrogation and isolated-branch agent with a `/grill-me` workflow and an inbox at `~/zao-vault/inbox/agents/antigravity/`; it is a natural reader of a dream output, since it already reads vault notes the seat leaves it. The seat does not need a runtime change to consume one more vault file.

### 4. Comparison of options for the one gap

| Option | Cost | Risk | Verdict |
|---|---|---|---|
| A. Adopt Hermes Agent for personal-assistant memory | New runtime, new home dir, new provider keys | Second writer on shared state; naming collision with in-repo Hermes | SKIP |
| B. Copy Muse's full stack (Postgres claims, embeddings, hourly verifier) | Large; 384-dim vectors and a claim table | Over-build for a 130-module-bot estate we cannot fully enumerate (doc 2438: 130 modules, 105 documented) | SKIP now |
| C. One nightly vault job: read the day's `daily/` and lane status files, write `dreams/YYYY-MM-DD.md` plus a short standing-guidance file, off by default, human-approved like `learn.ts` | One script reusing the `learn.ts` approval pattern | A synthesis can be wrong and then gets read as fact | ADOPT as an experiment, with the `prompt_hoisted: false` property copied: dream output is read on request, not auto-injected, so a bad dream cannot silently steer a lane |

## Also See

- [Doc 2438](../2438-hermes-agent-concepts-zoe-runtime/) - Hermes concepts explainer; 14 of 15 concepts already run at ZAO, profiles the one new idea
- [Doc 483](../483-hermes-agent-local-llm-framework/) - first r/hermesagent read
- [Doc 632](../632-r-hermesagent-subreddit/) and [599c](../599c-hermes-agent-prior-art-reddit/) - naming collision
- [Doc 875](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/) - Nous Hermes 7-day setup
- [Doc 2582](../2582-agent-context-improves/) - how agent context improves between terminals

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Zaal rules adopt or skip on decision 2 (dream pass experiment). Shipped when: a one-line verdict is in `~/zao-vault/DECISIONS.md` | Zaal | Decision | 2026-10-11 |
| If adopted: one lane writes `dream` script behind an off-by-default flag, reuses `learn.ts` approval flow, output to `~/zao-vault/dreams/`. Shipped when: PR merged and one dated dream file exists | Seat lane (assigned by the orchestrator seat) | PR | 2026-10-18 |
| Re-read the Reddit thread comments once a browser route works, record the real comment count and any dissent into this doc. Shipped when: the Sources table row flips from FAILED to FULL | Research lane that picks this up | Re-research | 2026-10-11 |
| Second look at NousResearch/hermes-agent with `zao-research-snapshot` to get the star and open-issue delta. Shipped when: delta line is added under Findings 1 | Research lane | Snapshot | 2026-10-18 |
| Add a "which Hermes?" one-liner to the ZAOOS agent glossary if one exists. Shipped when: PR merged | Zaal | PR | 2026-10-18 |

## Sources

- [FULL, post body via Arctic Shift; comments FAILED] r/hermesagent post "I copied Muse's memory setup for my own Hermes agent..." https://www.reddit.com/r/hermesagent/comments/1wxu98g/i_copied_muses_memory_setup_for_my_own_hermes/ (fetched 2026-10-04; shortlink https://www.reddit.com/r/hermesagent/s/TyOeMRHS1M)
- [FULL, curl + strip] Peter James, "I asked Meta's Muse for its filesystem and it sent me 6.8 GB", Sept 22, 2026 https://mouse.dev/blog/muse-runtime-export/
- [PARTIAL, first 8 top-level comments] HN discussion, 358 points / 172 comments at fetch https://news.ycombinator.com/item?id=49802871
- [FULL] Hermes Agent README https://github.com/NousResearch/hermes-agent
- [FULL] Hermes Agent persistent memory docs https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md
- [FULL, licence read from file] https://github.com/NousResearch/hermes-agent/blob/main/LICENSE
- ZAO files read: `bot/src/zoe/reflect.ts`, `bot/src/zoe/learn.ts`, `bot/src/zoe/memory.ts` (ZAOOS), `~/zao-vault/AGENTS.md` registry rows for Claude Code, Antigravity, zorca-audit-seat, zoe-bot
- URLs all verified live on 2026-10-04 except the Reddit comment tree (see Source status).
