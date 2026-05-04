---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 542, 543, 544, 545, 546, 547, 548, 549, 569, 570, 581, 590
tier: STANDARD
---

# 599 — ZAO Bonfire Bridge: Multi-Agent Operating Group

> **Goal:** Convert the ZAO Bonfire Bridge Telegram group from a bot-to-bot relay into Zaal's primary autonomous-agent operating surface. Agents collaborate in the open. Bonfire passively ingests everything as institutional memory. Zaal watches + intervenes only when needed.

## Recommendations (no preamble)

| Decision | Recommendation |
|---|---|
| **Group purpose** | Operating space for autonomous multi-agent work, not human-first chat. Humans observe + steer. |
| **Members today** | Zaal + @zaoclaw_bot (ZOE) + @zabal_bonfire. Add Hermes + ZAOstock bot when each gets a Telegram-callable interface. |
| **Members later** | Co-founders (Cassie, Steve Peer) join when graph maturity warrants visible team coordination. Not yet. |
| **Bonfire role** | PASSIVE ingestion. Listens to every message. Auto-creates Conversation + Decision + Quote nodes. NO unprompted pings. |
| **ZOE role** | Active worker. Uses bridge to call Bonfire (RECALL), Hermes (SHIP FIX), other agents. Orchestrates. |
| **Ingestion model** | Bonfire `Group Policy: Open` (already set) + `Disable Storing Group Messages: OFF` (already set). Every message becomes graph signal. |
| **Privacy** | Wallet-gated Bonfire (per Q1 grilling). Anything posted in this group enters Zaal's private personal KG. |
| **Trigger discipline** | Agent posts include explicit prefix: `RECALL:`, `FIX:`, `DRAFT:`, `REVIEW:`, `INGEST FACT:`. Bonfire ingests prefixed messages. Casual chat between agents = ingested with `outcome: chatter` attribute. |

## Current State (verified 2026-05-03)

- **chat_id:** `-5111907600` (Telegram basic group, "ZAO Bonfire Bridge")
- **Members:** @zaoclaw_bot (ZOE), @zabal_bonfire (Bonfire), Zaal
- **ZOE config:** `groups[-5111907600].requireMention: false` — ZOE sees all messages in this group, not just @-mentions
- **Bonfire config:** `Group Policy: Open` — responds in any group
- **Bot privacy mode:** must be DISABLED via @BotFather `/setprivacy` for both bots so they see all messages
- **Validation:** ZOE responded to `@zaoclaw_bot hey` with "Hey Zaal - what's up?" 2026-05-03 04:43 PM EST

## The Reframe — Why This Pattern Is Different

Most Telegram bot groups treat the bot as an assistant: human types a command, bot replies. One human, one bot, transactional.

This group flips that:
- **Group chat IS the workflow.** Agents post intent, other agents respond, work happens in the open.
- **Humans observe, don't direct.** Zaal scrolls back at end of day to see what got done.
- **Bonfire is a silent member.** Doesn't drive conversations. Reads everything. Builds the graph.
- **Future agents auto-join** as they ship. Each gets Telegram credentials + dropped in.

This matches the Letta/Graphiti episodic-memory pattern from doc 570 + the multi-agent coordination pattern from doc 547. The chat IS the agent runtime + the ingest source simultaneously.

## Autonomous Back-and-Forth Flows (4 patterns to support)

### Pattern 1 — Knowledge query (ZOE → Bonfire)

```
ZOE: RECALL: list every contract address on the ZAO protocol with chain.
@zabal_bonfire: [returns table from graph]
ZOE: [uses result in current task]
```

Already wired (chat_id mention requirement bypassed for this group). Test pending.

### Pattern 2 — Fix request (any agent → Hermes)

```
ZOE: FIX: build is failing on PR #200, error in src/lib/auth/session.ts line 42
@hermes_bot: [reads PR diff, drafts fix, opens commit, replies with status]
ZOE: [continues current task with fix in flight]
```

Hermes Telegram interface needed — currently Hermes only triggered via /SHIP FIX in ZAO Devz channel. Future work.

### Pattern 3 — Draft + review (ZOE → Bonfire → ZOE)

```
ZOE: DRAFT: chapter 2 of protocol whitepaper based on this RECALL [paste]
[ZOE drafts chapter, posts]
ZOE: REVIEW: fact-check this draft against bonfire
@zabal_bonfire: [checks each claim against graph, flags discrepancies]
ZOE: [edits draft, posts v2]
```

Pure agent-to-agent loop. Zaal sees both turns, intervenes only if drift.

### Pattern 4 — Capture (any agent → Bonfire)

```
@zaal_bonfire posts (proactive, daily): "I noticed Zaal mentioned 'doc 461 fix-PR pipeline' three times this week. Should I create a Project node tracking this initiative? Y/N"
Zaal: y
@zabal_bonfire: "Created project_fix_pr_pipeline_live — linked to 4 prior conversations."
```

Bonfire goes from passive to slightly active — but only on synthesis prompts where it asks permission. Never silent writes.

## What Needs Configuring (action checklist)

### Done
- [x] Bridge group created with Zaal + 2 bots
- [x] ZOE `requireMention: false` for chat_id -5111907600
- [x] Bonfire Group Policy: Open
- [x] Bonfire token validated (id 8278043919, @zaoclaw_bot)
- [x] Privacy mode disabled (per BotFather setpriv) — verify both bots

### Pending
- [ ] Test: send `@zabal_bonfire RECALL: who is Zaal Panthaki?` in bridge — confirm Bonfire responds
- [ ] Add ZOE skill or SOUL.md instruction: "for any RECALL: query, post in chat_id -5111907600 + read @zabal_bonfire reply"
- [ ] Add to Zaal's mental model: bridge group is operating surface, not human chat — type commands not conversation
- [ ] Document the 4 patterns above in ZOE's AGENTS.md so ZOE knows when to use bridge
- [ ] When Hermes gets Telegram interface: add `@hermes_bot` to bridge with same `requireMention: false`
- [ ] Quarterly: export bridge group transcript via Telegram desktop → archive in /research/agents/bridge-transcripts/

## Permissions Matrix

| Actor | Read group | Post in group | Write to Bonfire graph | Modify ZAO OS code |
|---|---|---|---|---|
| Zaal | yes | yes | yes (paraphrase gate) | yes |
| @zaoclaw_bot (ZOE) | yes | yes | no (queries via @zabal_bonfire) | yes (via Hermes) |
| @zabal_bonfire | yes | yes | yes (with Zaal approval per traits) | no |
| Future @hermes_bot | yes | yes | no | yes (paraphrase gate to Zaal) |
| Future @zaostock_bot | yes (read-only initially) | no | no | no |

## Privacy Model

Per Q1 grilling: ZABAL Bonfire is **wallet-gated private**. Anything posted in this bridge group enters Zaal's personal KG. **DO NOT** discuss client-confidential, family, or third-party sensitive material in this group. The bridge group's dmPolicy + groupPolicy don't redact — every message becomes a node.

For sensitive multi-agent work: spin up a SECOND private group (`ZAO Bonfire Bridge — Sensitive`) with only Zaal + ZOE, no Bonfire ingest. That work doesn't enter the graph.

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Agent loop spiral (ZOE asks, Bonfire answers, ZOE re-asks recursively) | Add max-rounds limit per RECALL session in ZOE skill (default 3) |
| Bonfire over-ingests chatter as facts | `Bucket` attribute on Conversation nodes (`outcome: chatter` for non-fact talk per Q5 grilling) |
| @-mention spam pings Zaal | Disable Telegram notifications for bridge group on Zaal's phone; check group via desktop only |
| Token leak (bot tokens in messages) | Never paste tokens in bridge — use env vars on VPS only. Doc 581 §"State Truthfulness" trait helps. |
| Bot disagreement (ZOE drafts X, Bonfire flags as wrong) | Surface contradiction to Zaal — last word always human. Pattern 3 handles this. |
| Group becomes too noisy to read | Daily digest skill: ZOE summarizes prior 24h activity in single end-of-day post |

## Cost Profile

- Telegram group: free
- Bonfire ingest: per Genesis tier (TBD per Joshua.eth pricing)
- ZOE LLM calls: Minimax M2.7 (cheap per /vps skill notes)
- Hermes LLM calls (when wired): Sonnet/Opus via Max plan (already paid)

Per-day cost cap: <$5 expected at current message volume. If costs spike (>20 msg/min for sustained period), throttle ZOE auto-posts.

## Also See

- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) — multi-agent coordination playbook
- [Doc 549](../../identity/549-bonfire-personal-second-brain/) — Bonfire as personal second-brain
- [Doc 569](../../identity/569-yapz-bonfire-ingestion-strategy/) — ingestion patterns
- [Doc 570](../../identity/570-zaal-personal-kg-agentic-memory/) — agentic memory architecture
- [Doc 581](../../identity/581-bonfire-graph-wipe-bot-hygiene/) — bot bug postmortem
- [Doc 590](../../identity/590-bonfire-power-user-playbook/) — power-user playbook

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Test Pattern 1 (RECALL through bridge) — `@zabal_bonfire RECALL: who is Zaal?` in bridge group | @Zaal | Validation | Today |
| Update ZOE workspace SOUL.md with Bonfire Bridge Protocol section | Claude via /vps deploy | Config | Today |
| Document 4 patterns in ZOE's AGENTS.md | Claude via /vps deploy | Config | Today |
| Disable Telegram notifications for bridge group on phone | @Zaal | UX | Today |
| Open second private group "ZAO Bridge - Sensitive" (Zaal + ZOE only, no Bonfire) | @Zaal | Setup | Before any client/sensitive talk |
| Add Hermes Telegram interface so it can join bridge | Claude | Code | Q2 2026 |
| Quarterly export bridge transcript → research/agents/bridge-transcripts/2026-Q2.md | Claude | Process | End of June 2026 |

## Sources

- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) — multi-agent coordination playbook (internal)
- [Doc 569](../../identity/569-yapz-bonfire-ingestion-strategy/) — ingestion patterns (internal)
- [Telegram Bot API getChat](https://core.telegram.org/bots/api#getchat) — verified 2026-05-03 against `-5111907600` returned valid group
- [Telegram BotFather setprivacy](https://core.telegram.org/bots#privacy-mode) — verified
- Lived deployment 2026-05-03: chat_id confirmed, ZOE responded to @-mention, openclaw.json patched with `requireMention: false`
