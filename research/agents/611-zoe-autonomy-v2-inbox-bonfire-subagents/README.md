---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-05
related-docs: 234, 236, 245, 296, 547, 568, 569, 570, 599, 600, 601, 605, 606, 607, 610
tier: DEEP
---

# 611 - ZOE autonomy v2: ambient inbox + Bonfire organization + research subagent harness

> **Goal:** Step ZOE up from a "DM me and I respond" concierge to an ambient assistant that ingests forwarded email, helps organize the Zabal Bonfire, and dispatches research/audit subagents when answering. Build on what's shipped (docs 605/606/607/610). Lock in the autonomy ceiling Zaal is comfortable with by default. Five phases, three of them ship-able this week.

## Key Decisions

| Decision | Action |
|----------|--------|
| ZOE runs an ambient inbox poller every 30 min against `zoe-zao@agentmail.to` | YES - existing inbox skill (`/inbox` in Claude Code) becomes a ZOE agent + cron, not a manual command. Zaal forwards from phone, ZOE ingests/files/asks before he opens Claude Code. |
| Default autonomy ceiling = "ingest + DM-summarize" | YES - ZOE can write to Bonfire (with audit log), DM Zaal a summary, capture to `recent.json`, dispatch a research subagent. ZOE asks before posting publicly, sending team-broadcasts, or spending >$1 in subagent calls in one call. |
| Bonfire organization happens through a write-queue + weekly review pass | YES - ZOE never writes directly to Bonfire mid-conversation. It proposes adds in batched form. Daily evening digest shows "today's proposed Bonfire adds" with Now/Later/Shelve buttons (already wired in reflect.ts). |
| ZAO ontology gets 10 entity classes | YES - Person, Project, Decision, Event, Source, Idea, Tool, Place, Quote, Risk. Locked in `~/.zao/zoe/bonfire-ontology.md`. ZOE proposes classifications, Zaal corrects, ZOE updates. |
| Research subagent pattern: dispatch on `@research --deep`, audit pattern: optional fact-checker on every concierge turn | YES - subagents log to Langfuse (doc 605 Phase 1), have per-call token budget cap, return summary + sources. |
| Self-improvement loop: every Zaal correction appends to `feedback_*.md` automatically | YES - this already happens in Claude Code session. Extend to ZOE: when Zaal says "no, that's wrong" or `note: <correction>`, ZOE writes a `feedback_<topic>.md` memory entry and updates `brand.md` anti-patterns if applicable. |
| Kill switches: `/zoe pause` + `/zoe resume` + per-action audit log at `~/.zao/zoe/audit.log` | YES - everything autonomous goes through one log. Daily 9pm digest includes "autonomous actions today: N captures, N digests, N subagent calls, $X spend." |

## The shape ZOE moves toward

Today (post-doc-607):
- ZOE = pull-only. You DM it, it responds. Cron only fires for brief/reflect/tip.
- Bonfire = read-only via @recall. No ingestion path from ZOE.
- Subagents = none. Each agent is a single Claude CLI call.
- Inbox = manual `/inbox` in Claude Code session.

After doc 611 (5 phases, ~2 weeks):
- ZOE = ambient. Polls inbox every 30 min, ingests forwarded email, surfaces what matters in 9pm digest, asks before public action.
- Bonfire = read + queued-write. ZOE proposes adds in batches. Daily review gate before commit.
- Subagents = research + audit + fact-check. Dispatched by parent ZOE, budget-capped, observable.
- Inbox = autonomous. `/inbox` skill becomes a fallback for Claude Code; the cron does the work.

## Phase 1 - Inbox autonomy (ship this week)

**File: `bot/src/zoe/agents/inbox.ts` (new agent)**

Polls AgentMail API at `zoe-zao@agentmail.to`. Whitelist `zaalp99@gmail.com` (matches existing `/inbox` skill). For each unprocessed email:

1. Categorize using existing label rules:
   - Contains `x.com/` or `twitter.com/` URL: label `x-posts`
   - Contains `youtube.com/` or `youtu.be/`: label `videos`
   - Contains "?", "thoughts on", "what about": label `research`
   - Contains "today", "tomorrow", date pattern: label `events`
   - Contains "do", "todo", "remember to": label `action-items`
   - Else: label `ideas`

2. Per category, take action:

| Label | Autonomous action | Asks Zaal? |
|-------|-------------------|------------|
| `x-posts` | Fetch tweet via existing `~/bin/zao-fetch-x.sh`, propose Bonfire entity (Source kind, type=tweet), queue for evening review | No - silent capture |
| `videos` | Fetch oEmbed metadata, queue for evening review | No - silent |
| `research` | Dispatch `@research <subject> --deep` subagent in background, DM result when done (≤5 min) | No - notifies on completion |
| `ideas` | Append to `~/.zao/zoe/ideas/<date>.md`, count in daily digest | No - silent capture |
| `events` | Parse date with `chrono-node`, propose `events` Bonfire entity, DM Zaal a 1-line preview | YES on calendar add |
| `action-items` | Add to `tasks.json` priority=P2, DM 1-line preview | No - silent capture, surfaces in 9pm reflect |

3. Mark email read in AgentMail, label it, log to `~/.zao/zoe/audit.log`.

**Cron schedule**: `*/30 * * * *` UTC, in `bot/src/zoe/scheduler.ts` next to brief/reflect.

**Manual override**: `/inbox` and `/inbox-pull` commands in ZOE Telegram trigger immediate poll.

**New env required**: `AGENTMAIL_API_KEY` (Zaal already has the AgentMail account).

**Effort**: 4-6 hours. Files touched: `bot/src/zoe/agents/inbox.ts` (new), `bot/src/zoe/scheduler.ts` (add cron), `bot/src/zoe/index.ts` (add `/inbox` command), `bot/src/zoe/agents/index.ts` (register).

## Phase 2 - Bonfire organization (next week)

**File: `~/.zao/zoe/bonfire-ontology.md` (new, hand-authored, ~50 lines)**

10 entity classes with field schemas. Example:

```
Person
  name (required)
  role (current relationship to Zaal/ZAO)
  last_contact_date
  channels (tg, fc, x, email, ens)
  context (1-3 sentences why they matter)
  related_projects[]

Project
  name (required)
  status (active, paused, shipped, killed)
  next_milestone
  owner (Person ref)
  related_decisions[]
```

**File: `bot/src/zoe/bonfire-pipeline.ts` (new)**

Batched write path:
1. ZOE proposes adds throughout day (from inbox, captures, conversation) into `~/.zao/zoe/bonfire-queue/<date>.jsonl`
2. Daily 9pm reflect surfaces top 5 proposed adds with Now/Later/Shelve inline keyboard
3. On Now: ZOE calls Bonfire `/agents/{agent_id}/stack/add` (per OpenAPI doc 605b)
4. On Shelve: drop. On Later: queue for tomorrow.

**Why batched**: prevents Zaal's KG from getting noisy with half-baked claims. Forces a daily curate-or-drop decision.

**Auto-classification**: ZOE proposes entity class via Sonnet call when adding. Confidence threshold 0.7+ skips the ask, 0.4-0.7 asks "is this a Person or a Project?", <0.4 dumps to `unclassified` and Zaal triages weekly.

**Effort**: 6-8 hours. Files: `bot/src/zoe/bonfire-pipeline.ts` (new), modify `reflect.ts` for proposal surface, modify `inbox.ts` to use queue.

## Phase 3 - Research + audit subagent harness (week 3)

**Three new subagent shapes** in `bot/src/zoe/agents/subagents/`:

### `research-deep.ts` - `@research <q> --deep`

Different from current `@research` (sub-300-word answer). Spawns Claude Code via the Hermes pattern but with the `/zao-research` skill loaded. Runs in background. DMs Zaal when done (typical: 3-8 min).

Trigger: `@research --deep <question>` or `/research --deep <question>`. Or auto-trigger from inbox `research` label.

Returns: full research doc draft + saved to `research/<topic>/<num>-<slug>/DRAFT.md`. Zaal reviews + ships via existing /zao-research workflow.

Budget cap: $0.50 per call (Sonnet primary, Opus on escalate). Hard fail at $1.

### `audit.ts` - fact-checker subagent

Dispatched optionally on any concierge turn. Reads the user question + Bonfire context + repo context, attempts to validate claims in Zaal's question or ZOE's drafted answer.

Trigger: `@audit <claim>` explicitly OR auto-fire on concierge turns where ZOE detects "did X really say Y" / "is Z true" patterns.

Returns: 3-bullet validation summary with confidence (HIGH/MEDIUM/LOW) and one source per claim. Posts to ZOE inline.

Budget: $0.10 per call.

### `summarize.ts` - long-context compressor

Takes a URL/transcript/doc and produces a 3-tier summary: 1-line, 50-word, 250-word.

Trigger: `@summarize <url>` or auto-fire on inbox `videos` items.

Budget: $0.05 per call.

**Shared infrastructure**:
- All subagents log to Langfuse (doc 605 Phase 1) with parent-child trace
- Token budget tracker at `~/.zao/zoe/spend.json` (per-day, per-subagent)
- Hard daily cap: $5. ZOE refuses subagent dispatch beyond that, DMs Zaal "subagent budget hit, drop to text-only or raise cap with /zoe budget +N."
- Failure mode: subagent times out at 8 min, parent ZOE DMs "subagent timeout, ran [partial result], retry?"

**Effort**: 10-14 hours total across the 3 subagents + harness.

## Phase 4 - Self-improvement loop (week 3-4)

**Pattern**: Zaal corrects ZOE in Telegram. ZOE writes that correction to a memory file automatically. Future sessions read it.

**Triggers**:
- Zaal sends a message starting with `note: <correction>` (already wired)
- Zaal sends a free-form message that contains "no", "wrong", "don't", "stop" + reference to recent ZOE output
- Zaal sends `feedback: <text>` (new prefix, explicit)

**Action**: ZOE classifies the correction and routes:

| Correction type | Goes where |
|-----------------|------------|
| Voice slip ("too preachy") | `bot/src/zoe/brand.md` anti-pattern section, plus `~/.claude/projects/.../memory/feedback_voice_*.md` |
| Wrong fact | `~/.zao/zoe/bonfire-queue/<date>.jsonl` as a Decision-class entity (note: wrong claim X, corrected to Y, source Zaal) |
| Process complaint ("too noisy") | `~/.claude/projects/.../memory/feedback_*.md` |
| Tool failure | `bot/src/zoe/audit.log` + future Langfuse error class |

**Daily 9pm digest** includes "today's corrections: N. Top theme: X." So Zaal sees ZOE actually learned.

**Weekly retro (Sunday 10am)**: ZOE digests the week's corrections, proposes 1-3 prompt/voice/process amendments. Zaal approves. ZOE auto-edits `brand.md` / `persona.md`.

**Effort**: 6-8 hours. New file `bot/src/zoe/agents/feedback.ts` + extend `index.ts` text handler + new Sunday cron in `scheduler.ts`.

## Phase 5 - Autonomy boundaries + observability (parallel to Phase 1-4)

**Audit log: `~/.zao/zoe/audit.log` (append-only, JSON lines)**

Every autonomous action gets one line:

```
{"ts":"2026-05-05T14:32:11Z","actor":"zoe","action":"inbox.ingest","label":"x-posts","summary":"@maceo's post about Italy","source":"agentmail:msg_abc123","wrote_to":["bonfire-queue/2026-05-05.jsonl","recent.json"]}
{"ts":"2026-05-05T14:33:00Z","actor":"zoe","action":"subagent.research-deep.dispatch","prompt":"What is Songchain","budget_usd":0.50,"trace_id":"langfuse:tr_xyz"}
```

**Daily DM at 9pm** (extends evening reflection per doc 606):

```
Today's autonomous actions:
- 3 inbox captures (1 x-post, 2 ideas)
- 1 research subagent ($0.32)
- 12 Bonfire-queue entries (review now)

Spend today: $0.32 / $5.00 cap

Press /pause-zoe if anything looked off.
```

**Kill switches**:

- `/pause-zoe` - sets `~/.zao/zoe/paused.flag`. All cron crons + autonomous handlers check it before acting. Logs the reason if Zaal includes one.
- `/resume-zoe` - removes the flag.
- `/zoe-budget show` and `/zoe-budget set <usd>` - per-day cap.

**Per-bot escalation**: cross-bot dispatch (per doc 607) like `@zaostock <task>` always asks Zaal first via "ready to send to ZAOstock team? Yes / Edit / Cancel" inline keyboard. Doesn't fire silently.

**Effort**: 4-6 hours. New `bot/src/zoe/audit.ts` + flag check helpers + extend reflect.ts with action summary + new commands.

## Phase ordering (calendar)

| Week | Phase | Effort | Outcome |
|------|-------|--------|---------|
| Week 1 (this week) | Phase 1 inbox + Phase 5 audit log | 8-12 hours | ZOE polls inbox, every action logged, kill switches live |
| Week 2 | Phase 2 Bonfire pipeline | 6-8 hours | Daily curated adds to Bonfire, ontology authored |
| Week 3 | Phase 3 subagent harness + Phase 4 self-improvement | 16-22 hours | Research-deep, audit, summarize, weekly retro live |
| Week 4 | Hardening + Langfuse polish + tune autonomy ceiling | 4-8 hours | Production-grade, observability complete |

Total: 4 weeks of evening work, mostly TypeScript additions to `bot/src/zoe/`.

## What this needs from Zaal (input list)

| Input | Why | When |
|-------|-----|------|
| `AGENTMAIL_API_KEY` for `zoe-zao@agentmail.to` | Phase 1 inbox poll | Phase 1 kickoff |
| Confirm autonomy ceiling default = "ingest + DM-summarize" | All 5 phases | Today |
| Decide auto-fire `@audit` on every concierge turn? Or explicit only? | Phase 3 cost | Phase 3 kickoff |
| Pick daily subagent budget cap ($5 default proposed) | Phase 3 cost cap | Phase 3 kickoff |
| Bonfire ontology review (10 entity classes) | Phase 2 quality | Phase 2 kickoff |
| Sunday 10am weekly retro slot | Phase 4 cadence | Phase 4 kickoff |

## What ZOE does NOT do (out of scope, locked)

- Make on-chain transactions, sign anything with a wallet, send funds
- Post publicly to Farcaster, X, Bluesky, or any social platform without explicit Zaal approval inline
- Send team-broadcast messages to ZAOstock/Devz groups without confirm
- Delete files or memories (only append/queue)
- Modify `bot/src/zoe/` source code or `persona.md` mid-conversation (only via approved weekly retro)
- Interact with people other than Zaal in DMs (allowlist guard already there)

These are hard limits, not configurable. Anything in this list = manual gesture from Zaal.

## Risks + mitigations

| Risk | Mitigation |
|------|-----------|
| Inbox spam if forwarding becomes too easy | Whitelist already there. Add daily volume cap (50 emails/day) - over that, ZOE pauses inbox-poll and DMs "spike detected, investigate". |
| Subagent runaway cost | Daily $5 cap is the floor, per-call cap by type, hard fail at $10/day kills polling. |
| Bonfire-queue bloat | Daily review gate forces curate-or-drop. Weekly cleanup pass on `unclassified` items. |
| Privacy: ZOE reads emails | AgentMail account is yours, whitelist is yours, ZOE runs on your VPS. No third party sees content. Logs at `~/.zao/zoe/audit.log` are local. |
| Bonfire ingestion vs Bonfire bot conflict | ZOE only writes via `stack/add`. Bonfire bot's own ingestion (DMs, voice) stays unchanged. Two write-paths, one KG. |
| Self-improvement loop self-corrupts | Weekly retro requires Zaal approval before any prompt edit. ZOE proposes, never auto-applies. |

## Codebase touchpoints (where this lands)

- `bot/src/zoe/agents/inbox.ts` (new) - inbox ingestion agent
- `bot/src/zoe/agents/subagents/research-deep.ts` (new)
- `bot/src/zoe/agents/subagents/audit.ts` (new)
- `bot/src/zoe/agents/subagents/summarize.ts` (new)
- `bot/src/zoe/agents/feedback.ts` (new) - correction-classification agent
- `bot/src/zoe/bonfire-pipeline.ts` (new) - batched ingest
- `bot/src/zoe/audit.ts` (new) - structured audit log writer
- `bot/src/zoe/scheduler.ts` (extend) - inbox cron, Sunday retro cron
- `bot/src/zoe/reflect.ts` (extend) - proposed-adds surface
- `bot/src/zoe/index.ts` (extend) - `/inbox`, `/pause-zoe`, `/resume-zoe`, `/zoe-budget`, feedback prefix
- `~/.zao/zoe/bonfire-ontology.md` (new, on VPS) - 10-class schema
- `~/.zao/zoe/audit.log` (new, on VPS) - append-only JSON lines
- `~/.zao/zoe/bonfire-queue/` (new dir, on VPS)
- `~/.zao/zoe/ideas/` (new dir, on VPS)
- `~/.zao/zoe/spend.json` (new, on VPS) - per-day budget tracker

## Also see

- [Doc 234 - OpenClaw comprehensive guide](../234-openclaw-comprehensive-guide/)
- [Doc 236 - Autonomous OpenClaw operator pattern](../236-autonomous-openclaw-operator-pattern/)
- [Doc 547 - Multi-agent coordination Bonfire+ZOE+Hermes](../547-multi-agent-coordination-bonfire-zoe-hermes/)
- [Doc 568 - Aware brain local memory KG](../568-aware-brain-local-memory-knowledge-graph/)
- [Doc 569 - YapZ Bonfire ingestion strategy](../../identity/569-yapz-bonfire-ingestion-strategy/)
- [Doc 570 - Zaal personal KG agentic memory](../../identity/570-zaal-personal-kg-agentic-memory/)
- [Doc 599 - Inbox digest pattern](../../events/599-inbox-digest-2026-05-03/)
- [Doc 605 - Agentic tooling May 2026](../605-agentic-tooling-may-2026/)
- [Doc 606 - Zaal second-brain operating system](../../identity/606-zaal-second-brain-system/)
- [Doc 607 - Three bots one substrate](../607-three-bots-one-substrate/)
- [Doc 610 - Newsletter prose toolkit ZABAL voice](../../dev-workflows/610-newsletter-prose-toolkit-zabal-voice/)
- Inbox skill: `.claude/skills/inbox/SKILL.md` (already in repo)

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Provide AGENTMAIL_API_KEY + confirm autonomy ceiling | @Zaal | Procurement + decision | Phase 1 kickoff (this week) |
| 2 | Ship Phase 1 inbox.ts + scheduler cron + audit log | Claude | PR | This week |
| 3 | Author bonfire-ontology.md (10 classes, ~50 lines) | @Zaal + Claude | Doc | Phase 2 kickoff |
| 4 | Ship Phase 2 bonfire-pipeline.ts + reflect.ts surface | Claude | PR | Next week |
| 5 | Ship Phase 3 subagent harness + Langfuse traces | Claude | PR | Week 3 |
| 6 | Ship Phase 4 feedback.ts + Sunday retro cron | Claude | PR | Week 3 |
| 7 | Ship Phase 5 audit log + kill switches + budget commands | Claude | PR | Parallel to Phase 1-4 |
| 8 | Re-validate this doc 30 days from now (2026-06-04) | Claude | Doc update | 2026-06-04 |

## Sources

- [AgentMail platform](https://agentmail.to/) - ZOE inbox provider
- Existing `.claude/skills/inbox/SKILL.md` - manual inbox flow we automate
- [Bonfire OpenAPI spec](https://tnt-v2.api.bonfires.ai/openapi.json) - confirmed `/agents/{agent_id}/stack/add` endpoint for ingestion
- [Langfuse self-host docs](https://langfuse.com/docs/deployment/self-host) - subagent observability target
- Direct read of `bot/src/zoe/` post doc-607 + doc-610 ship - architecture already partially in place
- Zaal's request 2026-05-05 - "ZOE more autonomous, more inbox, organize Bonfire, agent harness, audit research subagents"
