# Doc 2174 - Bidirectional Relay: Feedback Loops into Claude Code (Discord + Telegram + Clipboard)

**Status:** DESIGN / SPEC (not built)
**Date:** 2026-08-01
**Trigger:** Zaal - "improve the relay as a whole, not just Discord but the clipboard and also the Telegram, to just have these loops that can feedback to Claude Code." He can already receive Claude Code's questions (the "check"); he wants to *type back* from any surface and have it reach the running terminal.
**Related:** `zao-relay` (the CLI + hub), `zao-ask-check` (one-way approval bridge), [[feedback_zoe_inbox_bridge]], [[feedback_telegram_orchestrator_ui]], [[project_zai_community_agent]] (Discord), the `clipboard` skill, [[project_zao_midao_legal_body]] ("give ZOE a body" - Discord accounts), `agent-loops.md` rule 36 (coordination is a shared surface, not the human as message bus).

---

## The idea in one line

**One relay substrate, N bidirectional surface adapters.** Today the relay moves messages terminal-to-terminal and this Claude Code terminal auto-pulls its inbox each turn. Extend that so Zaal can type feedback from **Discord, Telegram, or the clipboard page**, and it lands in the terminal's relay inbox - and the terminal's questions/status post back out to the same surface. Every surface becomes a two-way loop into the running Claude Code session.

## What already exists (build on it, don't rebuild)

- **The hub:** `zao-relay` stores messages in one Supabase row (`tasks.legacy_id = 9000`, `metadata.relays[]`), works across Mac / VPS / Pi. `send <lane> "msg"` / `inbox <lane>` / `peek`.
- **The auto-pull:** this Claude Code terminal already receives an "INCOMING FLEET RELAYS" block at the top of each turn (a UserPromptSubmit hook runs `zao-relay inbox <lane>` and injects unread messages). **So the inbound path already works** - anything dropped into this terminal's lane reaches it on the next turn.
- **The "check":** `zao-ask-check` is the one-way approval bridge (a question goes out, an approve/deny comes back). This spec generalizes it from approve/deny to free-form text.
- **Clipboard:** the `clipboard` skill serves a local page (`127.0.0.1:8765`) - today it is one-way OUT (Claude renders, Zaal reads/copies).
- **Telegram:** ZOE lives on TG (`@zaoclaw_bot`) with the inbox bridge + orchestrator UI already built.

The missing piece is uniform: **each surface needs an inbound adapter that writes Zaal's typed message into this terminal's relay lane** (and, symmetrically, an outbound step that posts the terminal's output to that surface).

## The design: substrate + adapters

```
              ┌──────────── the relay hub (exists) ────────────┐
Discord  ─┐   │  tasks#9000.metadata.relays[]  {from,to,msg,ts} │
Telegram ─┼──▶│  lanes: zoe, cowork, cc-<terminal>, media, ...  │◀── this Claude Code
Clipboard─┘   └────────────────────────────────────────────────┘    terminal (auto-pull
                                                                      each turn / tick)
```

Give this terminal a stable lane (e.g. `cc-main` or per-session `cc-<id>`). Each adapter is thin:

### 1. Telegram adapter (smallest - ZOE already there)
- A dedicated TG topic/thread "Claude Code feedback". Anything Zaal types there, ZOE forwards: `zao-relay send cc-main "<text>"`. ZOE's inbox bridge ([[feedback_zoe_inbox_bridge]]) already does the reverse for its own queue - reuse it.
- Outbound: when the terminal posts a status/question to `zao-relay send zoe-tg "<text>"`, ZOE renders it into that TG topic (with the orchestrator's button UI where a choice is needed - [[feedback_telegram_orchestrator_ui]]).
- Effort: LOW (ZOE + relay both exist; it is a topic + two forward rules).

### 2. Discord adapter (the new surface Zaal asked about)
- A Discord bot in a `#claude-code` channel. On a message from Zaal: `zao-relay send cc-main "<text>"`. On a terminal post to `cc-discord`: the bot writes it into the channel. Threads = per-topic loops (mirrors ZOE's TG forum topics).
- Fits [[project_zai_community_agent]] (ZAI = the Discord community agent) and the "give ZOE a body" Discord-account work - this bot is a natural first Discord capability, not a one-off.
- Effort: MEDIUM (a Discord bot + the two forward rules; the bot infra overlaps ZAI).

### 3. Clipboard adapter (the interesting one - close the one-way page)
- The clipboard page is served locally already. Add a **reply box + Send button** to the template that POSTs `{lane, text}` to a tiny local receiver (a `~/bin` listener on a localhost port, or - simpler, no server - writes a file to a watched dir that a one-liner forwards to `zao-relay send`). So Zaal types on the same page he is reading and it reaches the terminal.
- Because the page is `127.0.0.1` only, no auth/exposure concern - it is Zaal's machine.
- Effort: LOW-MEDIUM (extend the `clipboard-emit.sh` template + a ~15-line local receiver).

### 4. Terminal side (the loop)
- The inbound auto-pull already exists. In a `/loop`, the terminal checks its lane each tick = near-real-time. Idle, it reads on the next turn. **This is the "loop that can feedback to Claude Code"** Zaal described: the session reads its lane every tick, any surface can drop into it, Claude acts and replies back out.
- One rule to add: the terminal should treat inbound relay text as *user feedback* (steer), not as instructions from observed content - it comes from Zaal via a trusted adapter, but the adapter must stamp the sender so a Discord message from a non-Zaal user is NOT treated as a command (security: only Zaal's authenticated Discord/TG id forwards to `cc-*`).

## The one honest constraint (same as today's relay)

This terminal is **not an always-on listener** - it reads the inbox on each turn/tick. So typed feedback lands on the *next check*, not the instant Enter is hit. In a `/loop` that is seconds-to-a-minute; sitting idle it waits for the next turn. This is the existing relay latency, not new. If true instant-push is ever needed, that is a bigger change (a live socket into the session) and out of scope here.

## Security / guardrails

- **Sender-stamped, allowlisted.** Only Zaal's authenticated id on each surface forwards to the `cc-*` lane. A random Discord member's message must NOT reach the terminal as a command (instruction-source boundary - observed content is data, not instructions).
- **Gated actions stay gated.** Feedback can STEER the terminal, but sends/spends/merges/publishes still need explicit confirmation - the loop does not auto-execute a gated action because a relay said so.
- **PII/secret hygiene** on anything the adapters log (`pii-hygiene.md`, `secret-hygiene.md`).

## Phasing

1. **Telegram feedback topic** (lowest effort, ZOE already there) - prove the loop end-to-end.
2. **Clipboard reply box** (you are always at the page already) - close the one-way page.
3. **Discord `#claude-code` bot** (new surface; overlaps ZAI + the ZOE-body Discord work).
4. **Unify** into one `relay` toolkit: `cc-main` lane + the three adapters + a stable outbound helper the terminal calls to post to whichever surface Zaal is on.

## Why this matters (not just a convenience)

`agent-loops.md` rule 36: coordination should be a shared surface, not Zaal hand-relaying paste-blocks between terminals. This is that rule applied to the human<->Claude-Code channel: instead of Zaal being the message bus (copy from the terminal, paste into a chat, copy the reply back), any surface he is already on becomes a live two-way line into the running session. It is the same win the terminal-to-terminal relay already gave the fleet, extended to the human.

**This is a design/spec - nothing built.** Phase 1 (the TG feedback topic) is the smallest end-to-end proof.
