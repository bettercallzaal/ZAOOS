---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 647, 648, 669, 672, 676, 680, 682
tier: STANDARD
---

# 683 - ZOE Troubles Analysis + Ryan Kagy Followup

> **Goal:** Deep analysis of the ZOE agent troubles visible in the 2026-05-20 "ZAO Civilization" Telegram thread, with code evidence from `bot/src/zoe/`, plus the followup package Ryan Kagy needs to ship the compiled new ZOE without inheriting the same bugs.

## Key Findings

| # | Trouble | Root cause | Code evidence | Severity |
|---|---------|-----------|---------------|----------|
| 1 | **ZOE has a permanent archive it never reads** | `pushRecent()` writes every turn to `archive/<scope>/<month>.jsonl` AND a 8-turn ring buffer. `loadMemory()` only loads the ring buffer into `<working_memory>`. `readArchive()` exists but no caller wires it into context. | `memory.ts:388 pushRecent` writes both; `memory.ts:429 loadMemory` calls `readRecent` only, never `readArchive`; `readArchive` defined `memory.ts:361` with zero callers in the context path | **P0** |
| 2 | **Long replies 400 on non-concierge sends** | `chunkMessage()` + chunked `ctx.reply` exist for concierge replies. `scheduler.ts` sends the morning brief, prompts, and nudges via raw `bot.api.sendMessage` - no chunking. | `index.ts:61 chunkMessage` good; `scheduler.ts:67,86,115` raw `sendMessage`, no chunk | **P1** |
| 3 | **ZOE tells people it has no long-term memory** | Its persona/export text says "there is no archive of older conversations" - stale. The archive shipped (doc 648 item 4). | The 2026-05-14 soul export says "no archive"; `memory.ts:30,352` archive is live | **P1** |
| 4 | **Group-chat context loss** | 8-turn ring buffer is the whole window. A busy group (Zaal + Ryan + Iman + bot) blows past 8 turns in ~2 minutes. ZOE could not see Ryan's earlier questions ("answer Ryan's original questions" -> ZOE asked for them to be pasted). | `memory.ts:34 RECENT_MAX = 8`; same root as #1 | **P1** |
| 5 | Project-context gaps (Infanity, SongJam, Ansuz, Recoup) | `human.md` block lacked them. | ZOE export marked them `[not in context]` | Resolved - Zaal added them 2026-05-20 |
| 6 | "Got it. Working on this one - reply incoming." then a thin answer | Ack-then-reply pattern; the real reply sometimes lands weak when the question depends on context ZOE cannot see (#1/#4). | thread, multiple occurrences | P2 - downstream of #1 |

## The core problem - a write-only memory

ZOE's memory has three tiers and reads only the smallest one:

```
pushRecent(turn)                          memory.ts:388
  -> appendArchive(turn)                  memory.ts:352  PERMANENT, every turn, archive/<scope>/<month>.jsonl
  -> ring buffer, last 8 turns            memory.ts:400-403  recent/<scope>.json

loadMemory(scope)                         memory.ts:429
  -> readRecent(scope)   [8 turns]        LOADED into <working_memory>
  -> readArchive(scope)  [everything]     EXISTS (memory.ts:361) - NEVER CALLED
```

ZOE writes a perfect lifelong record and then operates as if it does not exist. Effective memory = 8 turns. Everything ZOE said in the thread about "[not in context]", "truncated in my working memory", "I have no prior session history in this window" traces to this one gap. The data is on disk; the agent never loads it.

This is the single highest-leverage fix and it is small: wire `readArchive` (a recency-bounded tail, or a rolling summary to control token cost) into `loadMemory` so a `<long_memory>` block sits alongside `<working_memory>`.

## Trouble detail + fix

### P0 - wire the archive into context

`loadMemory()` (`memory.ts:429`) builds the prompt blocks. Add a fourth read:

- Cheap v1: `readArchive(scope)` then take the last ~40-60 turns beyond the ring buffer, into a `<recent_history>` block. Bounded token cost.
- Better v2: a rolling summary - after each session, summarise the archive tail to `archive/<scope>/summary.md`, load that. Keeps cost flat as the archive grows.
- The 8-turn ring buffer stays as the verbatim short window. The archive read is the long memory.

Without this, every other ZOE fix is cosmetic - the agent is functionally amnesiac past 8 turns.

### P1 - chunk all sends, not just concierge replies

`index.ts` has `chunkMessage()` + a chunked send loop, used by `ctx.reply`. `scheduler.ts:67,86,115` bypass it with raw `bot.api.sendMessage`. Extract the chunked-send into a shared `sendChunked(api, chatId, text)` helper in `index.ts` or a small `send.ts`, and route the scheduler's three sends through it. Same 4096-char `TELEGRAM_MAX` constant.

### P1 - fix ZOE's self-description

ZOE's `human.md` / persona / export template still says it has no archive. It does (since 2026-05-14). Update the text so ZOE stops telling collaborators - including Ryan, mid-partnership - that it is more amnesiac than it is. Add the 4 closed-gap projects (SongJam/$SANG doc 079, Recoup learning path, Infanity external, Ansuz external) which Zaal already supplied.

## What this means for Ryan's compiled new ZOE

Ryan is building a "compiled new ZOE" on his agentic SDK with a "lifestream" memory format, and asked Zaal to send everything so his side handles compression + formatting. Two things matter:

1. **Do not inherit the write-only-archive design.** The new lifestream must be LOADED, not just appended. ZOE's current bug is precisely a lifestream that is written and never read. The compiled version's whole value is fixing that.
2. **The corpus to compress already exists in two places** - the `archive/*.jsonl` files (every turn ZOE ever logged) and the ZABAL Bonfire (Ryan's own product - 57 meeting episodes loaded via the `/meeting` skill + ~780 prior). Ryan does not need Zaal to hand-curate; he needs the raw archive + repo + bonfire read access.

## The Ryan followup package

What to send Ryan, and from where:

| Item | Where | How |
|------|-------|-----|
| ZOE soul files | `~/.zao/zoe/persona.md`, `human.md`, `bootloader-template.md`, `brand.md`, `groups.json`, `tasks.json` | zip the dir, send |
| The lifestream corpus | `~/.zao/zoe/archive/<scope>/*.jsonl` | zip + send - this is the actual conversation history |
| Agent source | `bot/src/zoe/` | public: github.com/bettercallzaal/ZAOOS |
| Research library | `research/` - 202 docs, 13 folders | public: same repo, clone it |
| Key docs to fold | 050, 051, 460, 483, 601, 647, 648, 669, 673, 676, 680, 682, 683 | in the repo |
| ZAO context, pre-extracted | ZABAL Bonfire knowledge graph | Ryan's own product - 57 meeting episodes + ~780 prior; run labeling to unlock vector read |
| Troubles to fix | this doc (683) | the design notes above |

The followup message text to drop in the thread is in the next section.

## Followup message for Ryan (copy-paste)

This goes in the "ZAO Civilization" Telegram thread, addressed to Ryan. It is also reproduced as a clipboard block by the session that generated this doc.

---

Ryan - did a deep pass on where ZOE actually struggles, so the compiled version fixes it rather than inherits it.

The core bug: ZOE writes a permanent archive of every turn (`~/.zao/zoe/archive/*.jsonl`) but never reads it back. Context assembly only loads an 8-turn ring buffer. So ZOE has a complete lifelong record and operates amnesiac past 8 turns - that is why she kept saying "[not in context]" and lost your earlier questions. The fix on our side is one wiring change; on your side, the compiled ZOE's lifestream must be LOADED, not just appended. That is the whole point of the rebuild.

Three other issues: long replies 400 on the scheduler's sends (the brief/nudges bypass the chunker), her persona text wrongly says she has no archive, and the 8-turn window means group chats lose context fast. All four are in the analysis doc.

For the compiled version, send everything - you said let your side handle compression, so here is the full manifest:

1. Soul files: zip of `~/.zao/zoe/` - persona.md, human.md, bootloader-template.md, brand.md, groups.json, tasks.json.
2. The lifestream corpus: `~/.zao/zoe/archive/<scope>/*.jsonl` - every turn ZOE ever logged. This is the raw history to compress.
3. Agent source + research library: public at github.com/bettercallzaal/ZAOOS - `bot/src/zoe/` is the runtime, `research/` is 202 docs. Clone it.
4. Key docs to fold: 050 (ZAO guide), 051 (whitepaper), 460 (agentic stack), 483 (Hermes), 601 (5 surfaces), 647 (agent quality), 648 (our call), 669 (Bonfires), 683 (this analysis).
5. You already have a pre-extracted corpus: the ZABAL Bonfire - your product. The `/meeting` skill has been auto-posting ZAO meetings into it; 57 episodes are in plus the ~780 prior. Run the labeling pass and the compiled ZOE can read ZAO context straight from the graph.

human.md now has the 4 gaps closed (SongJam/$SANG, Recoup, Infanity external, Ansuz external). Soul gets context, not blanks.

Full analysis: research/agents/683 in the repo.

---

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Wire `readArchive` tail into `loadMemory()` - the P0 fix | Zaal / Hermes | Code | This week |
| 2 | Extract `sendChunked` helper, route `scheduler.ts` sends through it | Zaal / Hermes | Code | This week |
| 3 | Update ZOE `human.md` + persona - drop the stale "no archive" text, keep the 4 closed-gap projects | Zaal | Code | This week |
| 4 | Send Ryan the followup message + the soul/archive zip | Zaal | Comms | Now |
| 5 | Ask Ryan / Joshua to run Bonfire labeling so vector read unlocks | Zaal | Partner | Next Ryan sync |

## Sources

- `bot/src/zoe/memory.ts` - `pushRecent` (388), `appendArchive` (352), `readArchive` (361), `loadMemory` (429), `RECENT_MAX = 8` (34)
- `bot/src/zoe/index.ts` - `chunkMessage` (61), chunked `ctx.reply` loop (88-95)
- `bot/src/zoe/scheduler.ts` - raw `bot.api.sendMessage` at 67, 86, 115
- `bot/src/zoe/concierge.ts` - ops-JSON parse + reply path
- 2026-05-20 "ZAO Civilization" Telegram thread - ZOE session export + the troubles in situ
- [Doc 648](../648-ryan-kagy-zao-civilization-sync/), [Doc 669](../669-bonfires-everything-we-know/), [Doc 682](../../events/682-ryan-kagy-limitless-call-may12/) - the Ryan partnership thread
- [Doc 672](../672-zaocoworking-bot-audit-postv213/) - same message-too-long bug class in the sibling bot
